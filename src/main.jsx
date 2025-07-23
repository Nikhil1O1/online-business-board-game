import React from "react";
// Polyfill process for browser so that libraries like readable-stream / simple-peer work
import process from "process";
// Make it globally accessible (some polyfilled modules expect global process object)
if (typeof window !== "undefined") {
  if (!window.process) {
    window.process = process;
  }
  // Ensure nextTick exists (simple-peer / readable-stream rely on it)
  if (typeof window.process.nextTick !== "function") {
    window.process.nextTick = function (cb, ...args) {
      Promise.resolve().then(() => cb(...args));
    };
  }
}
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 