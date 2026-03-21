import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// === Security hardening ===

// Disable right-click context menu
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Block DevTools & source view shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "F12") { e.preventDefault(); return; }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) { e.preventDefault(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key === "u") { e.preventDefault(); return; }
  // Block Ctrl+P (print — could leak key data)
  if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); return; }
  // Block Ctrl+S (save page)
  if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); return; }
});

// Prevent drag-and-drop of files
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());

// Prevent printing (CSS + JS)
const style = document.createElement("style");
style.textContent = "@media print { body { display: none !important; } }";
document.head.appendChild(style);

// Clear clipboard on app close
window.addEventListener("beforeunload", () => {
  try { navigator.clipboard.writeText(""); } catch { /* ignore */ }
});

// === Render ===

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
