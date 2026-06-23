async function loadViolationReport() {
  const student = document.getElementById("filterStudent")?.value.trim() || "";
  const quiz = document.getElementById("filterQuiz")?.value.trim() || "";
  const type = document.getElementById("filterType")?.value.trim() || "";

  const params = new URLSearchParams();
  if (student) params.set("student", student);
  if (quiz) params.set("quiz", quiz);
  if (type) params.set("type", type);

  try {
    const res = await fetch(`${API}/admin/reports/violations?${params}`, {
      headers: adminHeaders()
    });
    const data = await res.json();
    const tbody = document.getElementById("violationsBody");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No violations found</td></tr>`;
      return;
    }

    data.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.student_name}</td>
        <td>${row.quiz_name}</td>
        <td><span class="badge bg-danger">${row.violation_type}</span></td>
        <td>${formatDateTime(row.violation_time)}</td>
        <td>${row.details || "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Violation report error:", err);
  }
}

renderAdminNav("violations");
loadViolationReport();
