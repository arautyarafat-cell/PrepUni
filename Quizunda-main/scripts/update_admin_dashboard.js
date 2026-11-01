const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/pages/AdminDashboard.js');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = 'const API_BASE = "http://localhost:5000/api";';
const replacement = `const API_BASE = "http://localhost:5000/api";

// Helper autenticado para chamadas da API administrativa
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", "Bearer " + token);
  }
  return window.fetch(url, { ...options, headers });
};`;

if (!content.includes('const authFetch =')) {
  content = content.replace(targetStr, replacement);
  // Replace fetch( with authFetch( only after helper definition
  const idx = content.indexOf(replacement) + replacement.length;
  const before = content.substring(0, idx);
  const after = content.substring(idx).replace(/\bfetch\(/g, 'authFetch(');
  content = before + after;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('AdminDashboard.js updated with authFetch successfully!');
} else {
  console.log('authFetch already present in AdminDashboard.js');
}

