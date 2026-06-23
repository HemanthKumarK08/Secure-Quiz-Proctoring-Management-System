const API = "http://localhost:3000/api";
const token = localStorage.getItem("token");

if (!token || localStorage.getItem("role") !== "admin") {
  window.location.href = "index.html";
}

function adminLogout() {
  localStorage.clear();
  window.location.href = "index.html";
}

function adminHeaders() {
  return { Authorization: `Bearer ${token}` };
}

function renderAdminNav(activePage) {
  const nav = document.getElementById("adminNav");
  if (!nav) return;

  const links = [
    { href: "admin-dashboard.html", label: "Dashboard", id: "dashboard" },
    { href: "admin-reports.html", label: "Performance Report", id: "reports" },
    { href: "admin-violations.html", label: "Malpractice Report", id: "violations" },
    { href: "admin-audit.html", label: "Audit Log", id: "audit" },
    { href: "admin-leaderboard.html", label: "Leaderboard", id: "leaderboard" }
  ];

  nav.innerHTML = links.map(link => `
    <a class="nav-link ${activePage === link.id ? "active" : ""}" href="${link.href}">
      ${link.label}
    </a>
  `).join("");
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function passFailBadge(status) {
  const pass = status === "Pass";
  return `<span class="badge bg-${pass ? "success" : "danger"}">${status}</span>`;
}
