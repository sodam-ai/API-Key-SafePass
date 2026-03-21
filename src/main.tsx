import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// === Security hardening ===

// Disable right-click context menu (release only)
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// Block DevTools shortcuts in production
document.addEventListener("keydown", (e) => {
  // F12
  if (e.key === "F12") { e.preventDefault(); return; }
  // Ctrl+Shift+I (DevTools)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") { e.preventDefault(); return; }
  // Ctrl+Shift+J (Console)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") { e.preventDefault(); return; }
  // Ctrl+U (View Source)
  if ((e.ctrlKey || e.metaKey) && e.key === "u") { e.preventDefault(); return; }
});

// Prevent drag-and-drop of files into the app
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());

// === Render ===

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
