// --- Sample Data ---
const teams = [
    { id: 'eng', name: 'Engineering', members: 45, desc: 'Software development and technical infrastructure.', email: 'engineering-leads@org.com', owners: ['Alice Johnson', 'Bob Smith'] },
    { id: 'ds', name: 'Data Science', members: 28, desc: 'Machine learning, analytics, and data insights.', email: 'ds-core@org.com', owners: ['Carol White'] },
    { id: 'prod', name: 'Product', members: 15, desc: 'Product management and strategy.', email: 'product-mgmt@org.com', owners: ['Dave Brown'] },
    { id: 'mktg', name: 'Marketing', members: 22, desc: 'Marketing campaigns and brand management.', email: 'mktg-ops@org.com', owners: ['Eve Davis'] },
    { id: 'sales', name: 'Sales', members: 35, desc: 'Customer acquisition and account management.', email: 'sales-global@org.com', owners: ['Frank Wilson'] }
];

const products = {
    'eng': [
        { name: 'Core API Logs', domain: 'Infrastructure', desc: 'Centralized logs for all microservices.', confluence: 'https://confluence.org/core-api-logs' },
        { name: 'User Service DB', domain: 'Account', desc: 'Primary user data and authentication records.', confluence: 'https://confluence.org/user-db' }
    ],
    'ds': [
        { name: 'Customer Analytics', domain: 'Analytics', desc: 'Aggregated metrics on user behavior and engagement.', confluence: 'https://confluence.org/cust-analytics' },
        { name: 'Sales Pipeline', domain: 'Sales', desc: 'Forecasting and pipeline health data.', confluence: 'https://confluence.org/sales-pipeline' },
        { name: 'User Activity Logs', domain: 'Monitoring', desc: 'Live interaction data from web and mobile apps.', confluence: 'https://confluence.org/user-activity' }
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

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    renderTeams();
    updateNavigation();
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

    updateNavigation();
}

function handleBack() {
    if (currentStep > 1) goToStep(currentStep - 1);
}

function handleNext() {
    if (currentStep < 3) goToStep(currentStep + 1);
}

function updateNavigation() {
    const nextBtn = document.getElementById('btn-next');
    const backBtn = document.getElementById('btn-back');

    backBtn.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';
    
    if (currentStep === 1) {
        nextBtn.textContent = 'Next: Select Product';
        nextBtn.disabled = !selectedTeam;
    } else if (currentStep === 2) {
        nextBtn.textContent = 'Next: Data Schema';
        nextBtn.disabled = !selectedProduct;
    } else {
        nextBtn.textContent = 'Finish Workflow';
        nextBtn.disabled = false;
    }
}

// --- Team Rendering ---
function renderTeams() {
    const container = document.getElementById('teams-container');
    container.innerHTML = teams.map(team => `
        <div class="team-card ${selectedTeam?.id === team.id ? 'selected' : ''}" onclick="selectTeam('${team.id}')">
            <h3>${team.name}</h3>
            <p>${team.members} members • ${team.desc.substring(0, 40)}...</p>
        </div>
    `).join('');
}

function selectTeam(id) {
    selectedTeam = teams.find(t => t.id === id);
    renderTeams();
    updateNavigation();

    const details = document.getElementById('team-details');
    details.innerHTML = `
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">${selectedTeam.name}</h2>
        <p style="margin-bottom: 24px; color: var(--text-muted); line-height: 1.6;">${selectedTeam.desc}</p>
        
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
        <div class="product-tile" onclick="selectProduct('${prod.name}')">
            <div style="width: 40px; height: 40px; background: var(--primary-light); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: var(--primary);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5c0 1.66 4 3 9 3s9-1.34 9-3"></path><path d="M21 5v14c0 1.66-4 3-9 3s-9-1.34-9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>
            </div>
            <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${prod.name}</h3>
            <p style="font-size: 0.875rem; color: var(--text-muted);">${prod.domain}</p>
            <hr style="margin: 16px 0; border: 0; border-top: 1px solid var(--border);">
            <p style="font-size: 0.8125rem; color: var(--text-main); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${prod.desc}</p>
            <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
                 <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">View Details →</span>
                 <a href="${prod.confluence}" target="_blank" style="font-size: 0.75rem; color: var(--text-muted);">Docs</a>
            </div>
        </div>
    `).join('');
}

function selectProduct(name) {
    selectedProduct = name;
    updateNavigation();
    goToStep(3); // Auto-advance as requested in workflow
}

// --- Schema Table Logic ---
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

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

// Process and Render Table
function processSchema(schema) {
    const tbody = document.getElementById('schema-tbody');
    tbody.innerHTML = '';
    
    document.getElementById('schema-table-wrapper').style.display = 'block';
    document.getElementById('drop-zone').style.display = 'none';

    const rows = [];
    flattenSchema(schema, '', 0, schema.required || [], rows);

    tbody.innerHTML = rows.map(row => `
        <tr>
            <td class="indent-${row.depth}">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${row.hasChildren ? '▼' : '<div style="width:12px"></div>'}
                    <span style="font-family: monospace; font-weight: 500;">${row.name}</span>
                </div>
            </td>
            <td><span class="pill ${row.type === 'object' ? 'pill-obj' : 'pill-type'}">${row.type}</span></td>
            <td style="color: var(--text-muted); max-width: 250px;">${row.desc || '-'}</td>
            <td style="text-align: center;"><input type="checkbox" ${row.required ? 'checked' : ''}></td>
            <td style="text-align: center;"><input type="checkbox"></td>
            <td style="text-align: center;"><input type="checkbox"></td>
            <td style="text-align: center;"><input type="checkbox"></td>
            <td style="text-align: center;"><input type="checkbox"></td>
            <td style="text-align: center;"><input type="checkbox"></td>
        </tr>
    `).join('');

    document.getElementById('schema-stats').textContent = `${rows.length} fields detected in ${selectedProduct}`;
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
            hasChildren: (type === 'object' && field.properties)
        });

        if (type === 'object' && field.properties) {
            flattenSchema(field, key, depth + 1, field.required || [], rows);
        } else if (type === 'array' && field.items && field.items.type === 'object') {
             flattenSchema(field.items, key, depth + 1, field.items.required || [], rows);
        }
    });
}

// Auto-populate demo schema if none uploaded
setTimeout(() => {
    if (currentStep === 3 && document.getElementById('drop-zone').style.display !== 'none') {
        // Just for demo purposes if they navigate there
        processSchema(demoSchema);
    }
}, 100);
