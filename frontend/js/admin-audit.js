async function loadAuditLogs() {
  try {
    const res = await fetch(`${API}/admin/audit-logs?limit=200`, {
      headers: adminHeaders()
    });
    const data = await res.json();
    const tbody = document.getElementById("auditBody");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No audit logs yet</td></tr>`;
      return;
    }

    data.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.user_name || "System"}</td>
        <td>${row.action}</td>
        <td><span class="badge bg-secondary">${row.module}</span></td>
        <td>${row.details || "-"}</td>
        <td>${formatDateTime(row.created_at)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

renderAdminNav("audit");
loadAuditLogs();
