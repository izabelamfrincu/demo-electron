import React from "react";

// Define a TypeScript type for the Electron API exposed in preload
//Global declaration for Electron API
// This tells TypeScript what window.api looks like.
// Now window.api.hello() is type-checked.
declare global {
  interface Window {
    api: {
      hello: () => string;
    };
  }
}

const App: React.FC = () => {
  const sayHello = () => {
    if (window.api && window.api.hello) {
      alert(window.api.hello());
    } else {
      alert("window.api.hello is undefined!");
    } 
  };

  return (
    <div>
      <h1>Hello React + Electron 🚀</h1>
      <button onClick={sayHello}>Test Electron</button>
    </div>
  );
};

export default App;