// --- Sample Data ---
const teams = [
    { id: 'eng', name: 'Engineering', logo: '🛠️', desc: 'Software development and technical infrastructure.', email: 'engineering-leads@org.com', owners: ['Alice Johnson', 'Bob Smith'] },
    { id: 'ds', name: 'Data Science', logo: '📊', desc: 'Machine learning, analytics, and data insights.', email: 'ds-core@org.com', owners: ['Carol White'] },
    { id: 'prod', name: 'Product', logo: '📦', desc: 'Product management and strategy.', email: 'product-mgmt@org.com', owners: ['Dave Brown'] },
    { id: 'mktg', name: 'Marketing', logo: '📣', desc: 'Marketing campaigns and brand management.', email: 'mktg-ops@org.com', owners: ['Eve Davis'] },
    { id: 'sales', name: 'Sales', logo: '💼', desc: 'Customer acquisition and account management.', email: 'sales-global@org.com', owners: ['Frank Wilson'] }
];

const products = {
    'eng': [
        { name: 'Core API Logs', domain: 'Infrastructure', desc: 'Centralized logs for all microservices.', confluence: 'https://confluence.org/core-api-logs' },
        { name: 'User Service DB', domain: 'Account', desc: 'Primary user data and authentication records.', confluence: 'https://confluence.org/user-db' },
        { name: 'Service Mesh Metrics', domain: 'DevOps', desc: 'Real-time traffic and latency data.', confluence: 'https://confluence.org/mesh-metrics' },
        { name: 'Auth Audit Logs', domain: 'Security', desc: 'Detailed history of authentication attempts.', confluence: 'https://confluence.org/auth-audit' },
        { name: 'K8s Cluster Health', domain: 'Core', desc: 'Node and pod level resource utilization.', confluence: 'https://confluence.org/k8s-health' }
    ],
    'ds': [
        { name: 'Customer Analytics', domain: 'Analytics', desc: 'Aggregated metrics on user behavior and engagement.', confluence: 'https://confluence.org/cust-analytics' },
        { name: 'Sales Pipeline', domain: 'Sales', desc: 'Forecasting and pipeline health data.', confluence: 'https://confluence.org/sales-pipeline' },
        { name: 'User Activity Logs', domain: 'Monitoring', desc: 'Live interaction data from web and mobile apps.', confluence: 'https://confluence.org/user-activity' },
        { name: 'ML Model Inference', domain: 'AI', desc: 'Prediction results from production models.', confluence: 'https://confluence.org/ml-inference' },
        { name: 'Retention Cohorts', domain: 'Growth', desc: 'User retention data grouped by signup periods.', confluence: 'https://confluence.org/retention' },
        { name: 'Feature Store Alpha', domain: 'Platform', desc: 'Central repository for curated data features.', confluence: 'https://confluence.org/feature-store' }
    ]
};

const demoSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["eventId", "timestamp", "user"],
    "properties": {
        "eventId": { "type": "string", "format": "uuid", "description": "Unique identifier for the event." },
        "timestamp": { "type": "string", "format": "date-time", "description": "ISO 8601 timestamp of event occurrence." },
        "user": {
            "type": "object",
            "required": ["id"],
            "properties": {
                "id": { "type": "string", "description": "User's internal unique ID." },
                "email": { "type": "string", "description": "User's primary email address." },
                "account_details": {
                    "type": "object",
                    "properties": {
                        "tier": { "type": "string", "enum": ["free", "pro", "enterprise"] },
                        "is_verified": { "type": "boolean" }
                    }
                }
            }
        },
        "metadata": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "key": { "type": "string" },
                    "value": { "type": "string" }
                }
            }
        },
        "is_internal": { "type": "boolean" }
    }
};

// --- State ---
let currentStep = 1;
let selectedTeam = null;
let selectedProduct = null;
let eventTypes = [];
let generatedFiles = {}; // Stores content for preview
let currentPreviewFile = 'spec.json';
let permissions = {
    global: [], // Each item: { email: '...', type: 'user' | 'group' }
    test: [],
    live: [],
    drtest: [],
    drlive: []
};

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    renderTeams();
    updateNavigation();

    // Event Type handling
    const addTagInput = document.getElementById('add-tag-input');
    if (addTagInput) {
        addTagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(addTagInput.value.trim());
                addTagInput.value = '';
            }
        });
    }

    // Permission inputs handling
    const setupPermissionInput = (id, env) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addPermission(env);
                }
            });
        }
    };

    setupPermissionInput('add-permission-global', 'global');
    setupPermissionInput('add-permission-test', 'test');
    setupPermissionInput('add-permission-live', 'live');
    setupPermissionInput('add-permission-drtest', 'drtest');
    setupPermissionInput('add-permission-drlive', 'drlive');
});

// --- Navigation Logic ---
function goToStep(step) {
    if (step === 2 && !selectedTeam) {
        alert('Please select a team first');
        return;
    }
    if (step === 3 && !selectedProduct) {
        alert('Please select a product first');
        return;
    }

    currentStep = step;

    // Update Indicators
    document.querySelectorAll('.step').forEach((s, idx) => {
        s.classList.remove('active', 'completed');
        if (idx + 1 < step) s.classList.add('completed');
        if (idx + 1 === step) s.classList.add('active');
    });

    // Update Sections
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');

    if (step === 2) {
        document.getElementById('selected-team-name-display').textContent = selectedTeam.name;
        renderProducts(selectedTeam.id);
    }

    if (step === 5) {
        generatePreviews();
        showFilePreview('spec.json');
    }

    if (step === 6) {
        // Automatically pre-fill the zip filename based on product
        const zipPkgInput = document.getElementById('zip-filename-input');
        if (zipPkgInput && selectedProduct) {
            zipPkgInput.value = selectedProduct.name.toLowerCase().replace(/\s+/g, '-');
        }
    }

    updateNavigation();
}

function handleBack() {
    if (currentStep === 4) {
        goToStep(3);
    } else if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

function handleNext() {
    if (currentStep < 6) {
        goToStep(currentStep + 1);
    }
}

function updateNavigation() {
    const nextBtn = document.getElementById('btn-next');
    const backBtn = document.getElementById('btn-back');

    backBtn.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';
    nextBtn.style.visibility = (currentStep === 6) ? 'hidden' : 'visible';

    if (currentStep === 1) {
        nextBtn.textContent = 'Next: Select Product';
        nextBtn.disabled = !selectedTeam;
    } else if (currentStep === 2) {
        nextBtn.textContent = 'Next: Data Schema';
        nextBtn.disabled = !selectedProduct;
    } else if (currentStep === 3) {
        nextBtn.textContent = 'Next: Access Permissions';
        nextBtn.disabled = false;
    } else if (currentStep === 4) {
        nextBtn.textContent = 'Next: Preview Config';
        nextBtn.disabled = false;
    } else if (currentStep === 5) {
        nextBtn.textContent = 'Next: Finalize & Generate';
        nextBtn.disabled = false;
    } else {
        nextBtn.textContent = 'Data Product Generated';
        nextBtn.disabled = true;
    }
}

// --- Team Rendering ---
function renderTeams() {
    const container = document.getElementById('teams-container');
    container.innerHTML = teams.map(team => `
        <div class="team-card ${selectedTeam?.id === team.id ? 'selected' : ''}" onclick="selectTeam('${team.id}')">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="team-logo-small">${team.logo}</div>
                <div>
                    <h3 style="font-size: 1.125rem; margin-bottom: 4px;">${team.name}</h3>
                    <p style="font-size: 0.875rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">${team.desc.substring(0, 50)}...</p>
                </div>
            </div>
        </div>
    `).join('');
}

function selectTeam(id) {
    selectedTeam = teams.find(t => t.id === id);
    renderTeams();
    updateNavigation();

    const details = document.getElementById('team-details');
    details.innerHTML = `
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px;">
            <div class="team-logo-large">${selectedTeam.logo}</div>
            <div>
                <h2 style="font-size: 1.5rem; font-weight: 700;">${selectedTeam.name}</h2>
                <p style="font-size: 0.875rem; color: var(--text-muted);">Team Overview & Resources</p>
            </div>
        </div>
        
        <p style="margin-bottom: 32px; color: var(--text-muted); line-height: 1.6; font-size: 0.95rem;">${selectedTeam.desc}</p>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Point of Contact</label>
            <p style="font-weight: 500;">${selectedTeam.email}</p>
        </div>

        <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Owners</label>
            <ul style="list-style: none;">
                ${selectedTeam.owners.map(o => `<li style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: #e2e8f0; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: 700;">${o.charAt(0)}</div>
                    ${o}
                </li>`).join('')}
            </ul>
        </div>
    `;
}

// --- Product Rendering ---
function renderProducts(teamId) {
    const container = document.getElementById('products-container');
    const teamProducts = products[teamId] || [];

    if (teamProducts.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin-top: 40px;">No products found for this team.</p>`;
        return;
    }

    container.innerHTML = teamProducts.map(prod => `
        <div class="product-tile ${selectedProduct?.name === prod.name ? 'selected' : ''}" onclick="selectProduct('${prod.name}')">
            <div style="width: 24px; height: 24px; background: var(--primary-light); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--primary);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5c0 1.66 4 3 9 3s9-1.34 9-3"></path><path d="M21 5v14c0 1.66-4 3-9 3s-9-1.34-9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34-9-3"></path></svg>
            </div>
            <div style="flex: 1; min-width: 0;">
                <h3 style="font-size: 0.875rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prod.name}</h3>
                <p style="font-size: 0.75rem; color: var(--text-muted);">${prod.domain}</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color: var(--border);"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
    `).join('');
}

function selectProduct(name) {
    const teamProducts = products[selectedTeam.id] || [];
    selectedProduct = teamProducts.find(p => p.name === name);

    renderProducts(selectedTeam.id);
    updateNavigation();

    const details = document.getElementById('product-details');
    details.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 48px; height: 48px; background: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5c0 1.66 4 3 9 3s9-1.34 9-3"></path><path d="M21 5v14c0 1.66-4 3-9 3s-9-1.34-9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34-9-3"></path></svg>
            </div>
            <div>
                <h2 style="font-size: 1.125rem;">${selectedProduct.name}</h2>
                <span class="pill pill-obj" style="font-size: 0.65rem;">${selectedProduct.domain}</span>
            </div>
        </div>
        
        <p style="margin-bottom: 24px; color: var(--text-muted); line-height: 1.6; font-size: 0.9rem;">${selectedProduct.desc}</p>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Documentation</label>
            <a href="${selectedProduct.confluence}" target="_blank" style="color: var(--primary); text-decoration: none; font-size: 0.875rem; display: flex; align-items: center; gap: 4px;">
                Confluence Wiki <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
        </div>

        <div style="margin-top: 40px; padding: 16px; background: white; border: 1px solid var(--border); border-radius: var(--radius-md);">
            <p style="font-size: 0.8125rem; font-weight: 500;">Ready to on-board a new event?</p>
            <button class="btn btn-primary" style="margin-top: 12px; width: 100%; font-size: 0.875rem;" onclick="goToStep(3)">Configure Mapping</button>
        </div>
    `;
}

// --- Schema Table Logic ---
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
        // Reset file input so same file can be uploaded again if needed
        e.target.value = '';
    });
}

if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const schema = JSON.parse(e.target.result);
            processSchema(schema);
        } catch (err) {
            alert('Invalid JSON file');
        }
    };
    reader.readAsText(file);
}

function resetSchema() {
    document.getElementById('schema-tbody').innerHTML = '';
    document.getElementById('file-input').value = '';
    document.getElementById('schema-paste-area').value = '';
    eventTypes = [];
    renderEventTypes();
    document.getElementById('schema-table-wrapper').style.display = 'none';
    document.getElementById('schema-input-card').style.display = 'block';
}

function setSchemaInputMode(mode) {
    const uploadBtn = document.getElementById('toggle-upload');
    const pasteBtn = document.getElementById('toggle-paste');
    const uploadMode = document.getElementById('upload-mode');
    const pasteMode = document.getElementById('paste-mode');

    if (mode === 'upload') {
        uploadBtn.classList.add('active');
        pasteBtn.classList.remove('active');
        uploadMode.style.display = 'block';
        pasteMode.style.display = 'none';
    } else {
        uploadBtn.classList.remove('active');
        pasteBtn.classList.add('active');
        uploadMode.style.display = 'none';
        pasteMode.style.display = 'block';
    }
}

function handlePasteSchema() {
    const pasteArea = document.getElementById('schema-paste-area');
    const content = pasteArea.value.trim();
    if (!content) {
        alert('Please paste JSON schema content first');
        return;
    }

    try {
        const schema = JSON.parse(content);
        processSchema(schema);
    } catch (err) {
        alert('Invalid JSON content. Please check your schema.');
    }
}

function toggleExclusive(checkbox, type) {
    if (!checkbox.checked) return;
    const selector = `.exclusive-${type}`;
    document.querySelectorAll(selector).forEach(cb => {
        if (cb !== checkbox) cb.checked = false;
    });
}

function updateEncryptionDefault() {
    const isPartner = document.getElementById('entity-partner').checked;
    const isCustomer = document.getElementById('entity-customer').checked;
    const section = document.getElementById('encryption-default-section');

    if (isPartner && isCustomer) {
        section.classList.add('visible');
    } else {
        section.classList.remove('visible');
    }
}

function addTag(value) {
    if (!value || eventTypes.includes(value)) return;
    eventTypes.push(value);
    renderEventTypes();
}

function removeTag(value) {
    eventTypes = eventTypes.filter(t => t !== value);
    renderEventTypes();
}

function renderEventTypes() {
    const container = document.getElementById('event-types-list');
    const input = document.getElementById('add-tag-input');
    if (!container) return;

    const tags = container.querySelectorAll('.tag');
    tags.forEach(t => t.remove());

    eventTypes.forEach(type => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${type}
            <span class="tag-remove" onclick="removeTag('${type}')">&times;</span>
        `;
        container.insertBefore(tag, input);
    });
}

// --- Permissions Management ---
function togglePermissionSync() {
    const isSynced = document.getElementById('sync-permissions').checked;
    const globalArea = document.getElementById('global-permission-area');
    const envArea = document.getElementById('env-specific-permission-area');

    if (isSynced) {
        globalArea.style.display = 'block';
        envArea.classList.remove('visible');
    } else {
        globalArea.style.display = 'none';
        envArea.classList.add('visible');

        if (permissions.test.length === 0 && permissions.global.length > 0) {
            ['test', 'live', 'drtest', 'drlive'].forEach(env => {
                permissions[env] = [...permissions.global.map(p => ({ ...p }))];
                renderPermissions(env);
            });
        }
    }
}

function addPermission(env) {
    const input = document.getElementById(`add-permission-${env}`);
    const typeSelect = document.getElementById(`type-${env}`);
    const email = input.value.trim();
    const type = typeSelect ? typeSelect.value : 'user';

    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    if (permissions[env].some(p => p.email === email)) {
        input.value = '';
        return;
    }

    permissions[env].push({ email, type });
    input.value = '';
    renderPermissions(env);
}

function removePermission(env, email) {
    permissions[env] = permissions[env].filter(p => p.email !== email);
    renderPermissions(env);
}

function renderPermissions(env) {
    const container = document.getElementById(`permissions-${env}-list`);
    if (!container) return;

    container.innerHTML = '';
    permissions[env].forEach(p => {
        const tag = document.createElement('div');
        tag.className = `tag permission-tag type-${p.type}`;
        tag.innerHTML = `
            <span class="type-indicator">${p.type === 'group' ? 'G' : 'U'}</span>
            ${p.email}
            <span class="tag-remove" onclick="removePermission('${env}', '${p.email}')">&times;</span>
        `;
        container.appendChild(tag);
    });
}

// Process and Render Table
function processSchema(schema) {
    const tbody = document.getElementById('schema-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    document.getElementById('schema-table-wrapper').style.display = 'block';
    document.getElementById('schema-input-card').style.display = 'none';

    const eventNameInput = document.getElementById('event-name-input');
    eventNameInput.value = schema.title || schema.$id?.split('/').pop().replace('.json', '') || '';

    eventTypes = [];
    const eventTypeProp = schema.properties?.type || schema.properties?.eventType;
    if (eventTypeProp?.enum) {
        eventTypes = [...eventTypeProp.enum];
    }
    renderEventTypes();

    const rows = [];
    flattenSchema(schema, '', 0, schema.required || [], rows);

    // Internal System Fields
    const internalFields = [
        { name: '_receivedTimestamp', type: 'timestamp', desc: 'System time when event was received', required: true, depth: 0, isInternal: true },
        { name: 'internalOrderId', type: 'string', desc: 'Internal unique identifier for the order', required: true, depth: 0, isInternal: true },
        { name: '_eventId', type: 'string', desc: 'Unique system event ID', required: true, depth: 0, isInternal: true }
    ];

    tbody.innerHTML = rows.map(row => renderSchemaRow(row)).join('');

    // Add separator and internal fields
    if (internalFields.length > 0) {
        tbody.innerHTML += `
            <tr class="system-fields-header">
                <td colspan="9" style="background: var(--bg); font-weight: 700; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; padding: 12px 16px; letter-spacing: 0.05em;">
                    System Generated Fields (Read-Only)
                </td>
            </tr>
        `;
        tbody.innerHTML += internalFields.map(field => renderSchemaRow(field)).join('');
    }

    const stats = document.getElementById('schema-stats');
    if (stats) stats.textContent = `${rows.length} user fields + ${internalFields.length} system fields detected`;
}

function renderSchemaRow(row) {
    const disabled = row.isInternal ? 'disabled' : '';
    const readonly = row.isInternal ? 'readonly' : '';
    const internalClass = row.isInternal ? 'row-internal' : '';

    return `
        <tr class="${internalClass}">
            <td class="indent-${row.depth}">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${row.hasChildren ? '▼' : '<div style="width:12px"></div>'}
                    <span style="font-family: monospace; font-weight: 500; ${row.isInternal ? 'color: var(--primary);' : ''}">${row.name}</span>
                </div>
            </td>
            <td><span class="pill ${row.type === 'object' ? 'pill-obj' : 'pill-type'}">${row.type}</span></td>
            <td><input type="text" class="desc-input" value="${row.desc || ''}" placeholder="Add description..." ${readonly} style="${row.isInternal ? 'background:transparent; border-color:transparent' : ''}"></td>
            <td class="col-checkbox"><input type="checkbox" ${row.required ? 'checked' : ''} ${disabled}></td>
            <td class="col-checkbox"><input type="checkbox" ${disabled}></td>
            <td class="col-checkbox"><input type="checkbox" ${disabled}></td>
            <td class="col-checkbox"><input type="checkbox" class="exclusive-pk" onclick="toggleExclusive(this, 'pk')" ${disabled}></td>
            <td class="col-checkbox"><input type="checkbox" class="exclusive-partition" onclick="toggleExclusive(this, 'partition')" ${disabled}></td>
            <td class="col-checkbox"><input type="checkbox" class="exclusive-entity" onclick="toggleExclusive(this, 'entity')" ${disabled}></td>
        </tr>
    `;
}

function flattenSchema(schema, name, depth, requiredList, rows) {
    if (!schema.properties && schema.type !== 'object') return;

    const props = schema.properties || {};
    const keys = Object.keys(props);

    keys.forEach(key => {
        const field = props[key];
        const isRequired = requiredList.includes(key);
        const type = field.type || 'any';

        rows.push({
            name: key,
            type: type,
            desc: field.description,
            required: isRequired,
            depth: depth,
            hasChildren: (type === 'object' && field.properties),
            isInternal: false
        });
        if (type === 'object' && field.properties) {
            flattenSchema(field, key, depth + 1, field.required || [], rows);
        } else if (type === 'array' && field.items && field.items.type === 'object') {
            flattenSchema(field.items, key, depth + 1, field.items.required || [], rows);
        }
    });
}

function generatePreviews() {
    const eventName = document.getElementById('event-name-input').value || 'MY_EVENT';
    const arnInputs = document.querySelectorAll('.arn-input');
    const arns = {
        test: arnInputs[0]?.value || 'arn:aws:sns:us-east-1:123456:test-topic',
        live: arnInputs[1]?.value || 'arn:aws:sns:us-east-1:123456:live-topic',
        drtest: arnInputs[2]?.value || 'arn:aws:sns:us-east-1:123456:drtest-topic',
        drlive: arnInputs[3]?.value || 'arn:aws:sns:us-east-1:123456:drlive-topic'
    };

    const isPartner = document.getElementById('entity-partner').checked;
    const isCustomer = document.getElementById('entity-customer').checked;
    const defaultEnc = document.querySelector('input[name="default-enc"]:checked')?.value || 'PARTNER';

    generatedFiles['spec.json'] = JSON.stringify({
        version: "1.0",
        team: selectedTeam?.name,
        product: selectedProduct?.name,
        eventName: eventName,
        eventTypes: eventTypes,
        entities: {
            partner: isPartner,
            customer: isCustomer,
            default_encryption: defaultEnc
        },
        infrastructure: {
            platform: "AWS",
            regions: ["us-east-1", "us-west-2"]
        }
    }, null, 4);

    generatedFiles['aws-config.json'] = JSON.stringify({
        sns_topics: arns,
        encryption: {
            kms_key: "arn:aws:kms:us-east-1:123456:key/abc-123",
            algorithm: "AES_256"
        },
        storage: {
            bucket_pattern: `otto-pay-${selectedTeam?.id}-${selectedProduct?.name.toLowerCase().replace(/\s+/g, '-')}-data-{env}`,
            lifecycle: "90_DAYS"
        }
    }, null, 4);

    generatedFiles['permissions.json'] = JSON.stringify({
        permissions: permissions
    }, null, 4);

    generatedFiles['table.sql'] = `CREATE TABLE \`raw_${eventName.toLowerCase()}\` (\n` +
        `    id STRING PRIMARY KEY,\n` +
        `    event_type STRING,\n` +
        `    timestamp TIMESTAMP,\n` +
        `    payload JSONB\n` +
        `) WITH (\n` +
        `    partition_by = 'day(timestamp)',\n` +
        `    retention = '30 days'\n` +
        `);`;

    generatedFiles['view.sql'] = `CREATE VIEW \`v_${eventName.toLowerCase()}\` AS\n` +
        `SELECT\n` +
        `    id,\n` +
        `    event_type,\n` +
        `    timestamp,\n` +
        `    payload->>'user_id' as user_id\n` +
        `FROM \`raw_${eventName.toLowerCase()}\`\n` +
        `WHERE _is_deleted = false;`;

    generatedFiles['tvf.sql'] = `CREATE FUNCTION \`tvf_${eventName.toLowerCase()}\` (start_date DATE, end_date DATE)\n` +
        `RETURNS TABLE\n` +
        `AS\n` +
        `RETURN\n` +
        `SELECT * FROM \`v_${eventName.toLowerCase()}\`\n` +
        `WHERE timestamp BETWEEN start_date AND end_date;`;

    generatedFiles['table.json'] = JSON.stringify({
        table_name: `raw_${eventName.toLowerCase()}`,
        schema: [
            { name: "id", type: "STRING", mode: "REQUIRED", description: "Unique UUID" },
            { name: "event_type", type: "STRING", mode: "REQUIRED" },
            { name: "timestamp", type: "TIMESTAMP", mode: "REQUIRED" },
            { name: "payload", type: "JSON", mode: "NULLABLE" }
        ],
        partitions: ["timestamp"]
    }, null, 4);

    generatedFiles['view.json'] = JSON.stringify({
        view_name: `v_${eventName.toLowerCase()}`,
        base_tables: [`raw_${eventName.toLowerCase()}`],
        transformations: ["flatten_payload", "filter_deleted"]
    }, null, 4);

    generatedFiles['tvf.json'] = JSON.stringify({
        function_name: `tvf_${eventName.toLowerCase()}`,
        parameters: [
            { name: "start_date", type: "DATE" },
            { name: "end_date", type: "DATE" }
        ]
    }, null, 4);
}

function showFilePreview(filename) {
    currentPreviewFile = filename;
    const content = generatedFiles[filename] || "// File content not available.";
    const displayElement = document.getElementById('code-preview-content');
    const filenameElement = document.getElementById('preview-filename');

    // Update Sidebar Selection
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active');
        if (item.textContent.trim() === filename) {
            item.classList.add('active');
        }
    });

    filenameElement.textContent = filename;
    displayElement.textContent = content;
}

function copyToClipboard() {
    const content = generatedFiles[currentPreviewFile];
    navigator.clipboard.writeText(content).then(() => {
        const btn = document.querySelector('.preview-toolbar .btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('btn-primary');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('btn-primary');
        }, 2000);
    });
}

function handleDownload() {
    const input = document.getElementById('zip-filename-input');
    const filename = (input.value.trim() || 'data-product-config') + '.zip';
    const status = document.getElementById('generation-status');

    if (status) status.style.display = 'block';

    // Using JSZip to create the archive
    const zip = new JSZip();

    // Add all generated files to the zip
    Object.keys(generatedFiles).forEach(name => {
        zip.file(name, generatedFiles[name]);
    });

    // Generate zip blob and trigger download
    zip.generateAsync({ type: 'blob' }).then(function (content) {
        // Simple client-side download trigger
        const element = document.createElement('a');
        element.href = URL.createObjectURL(content);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        if (status) {
            status.innerHTML = `<p style="color: #059669; font-weight: 500;">✓ Successfully generated "${filename}"!</p>`;
            setTimeout(() => {
                alert(`Data Product Generation Complete!\nFile: ${filename} has been prepared for download.`);
            }, 500);
        }
    });
}
