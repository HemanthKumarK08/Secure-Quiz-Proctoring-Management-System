async function loadPerformanceReport() {
  const student = document.getElementById("filterStudent")?.value.trim() || "";
  const quiz = document.getElementById("filterQuiz")?.value.trim() || "";
  const date = document.getElementById("filterDate")?.value || "";

  const params = new URLSearchParams();
  if (student) params.set("student", student);
  if (quiz) params.set("quiz", quiz);
  if (date) params.set("date", date);

  try {
    const res = await fetch(`${API}/admin/reports/performance?${params}`, {
      headers: adminHeaders()
    });
    const data = await res.json();
    const tbody = document.getElementById("performanceBody");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No records found</td></tr>`;
      return;
    }

    data.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.student_name}</td>
        <td>${row.quiz_name}</td>
        <td>${row.score ?? 0}</td>
        <td>${formatDateTime(row.attempt_date)}</td>
        <td>${passFailBadge(row.pass_fail)}</td>
        <td>#${row.rank_in_quiz}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Performance report error:", err);
  }
}

async function runSearch() {
  const type = document.getElementById("searchType").value;
  const query = document.getElementById("searchQuery").value.trim();
  const date = document.getElementById("searchDate").value;
  const tbody = document.getElementById("searchBody");
  const thead = document.getElementById("searchHead");

  if (type === "attempts" && !date) {
    alert("Please select a date for attempt search");
    return;
  }

  const params = new URLSearchParams({ type });
  if (query) params.set("query", query);
  if (date) params.set("date", date);

  try {
    const res = await fetch(`${API}/admin/search?${params}`, {
      headers: adminHeaders()
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Search failed");
      return;
    }

    tbody.innerHTML = "";
    if (!data.length) {
      thead.innerHTML = "";
      tbody.innerHTML = `<tr><td class="text-center text-muted">No results</td></tr>`;
      return;
    }

    const keys = Object.keys(data[0]);
    thead.innerHTML = `<tr>${keys.map(k => `<th>${k.replace(/_/g, " ")}</th>`).join("")}</tr>`;

    data.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = keys.map(k => `<td>${row[k] ?? "-"}</td>`).join("");
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Search error:", err);
  }
}

renderAdminNav("reports");
loadPerformanceReport();

document.getElementById("searchDateWrap").style.display = "none";
document.getElementById("searchType").addEventListener("change", (e) => {
  document.getElementById("searchDateWrap").style.display =
    e.target.value === "attempts" ? "block" : "none";
});
