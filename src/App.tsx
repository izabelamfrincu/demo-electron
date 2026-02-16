import React, { useState } from "react";

// Define a TypeScript type for the Electron API exposed in preload
//Global declaration for Electron API
// This tells TypeScript what window.api looks like.
declare global {
  interface Window {
    api?: {
      sendInput: (text: string) => void;
    };
  }
}

const App: React.FC = () => {
  const [userText, setUserText] = useState<string>("");

  const alertUserText = () => {
    if (window.api && window.api.sendInput) {
      window.api.sendInput(userText);
    }
    alert(userText);
    setUserText("");
  };

  return (
    <div>
      <h1>Hello React + Electron 🚀</h1>

      <div className="card">
        <input
          type="text"
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder="Type something to alert"
        />
        <button onClick={alertUserText}>Alert Input</button>
      </div>
    </div>
  );
};

export default App;