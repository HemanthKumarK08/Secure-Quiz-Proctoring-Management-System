/* =========================
   LOAD ANALYTICS OVERVIEW
========================= */
async function loadOverview() {
  try {
    const res = await fetch(`${API}/admin/overview`, {
      headers: adminHeaders()
    });

    const data = await res.json();

    document.getElementById("totalStudents").textContent = data.total_students ?? 0;
    document.getElementById("totalQuizzes").textContent = data.total_quizzes ?? 0;
    document.getElementById("totalAttempts").textContent = data.total_attempts ?? 0;
    document.getElementById("activeAttempts").textContent = data.active_attempts ?? 0;
    document.getElementById("totalViolations").textContent = data.total_violations ?? 0;
    document.getElementById("passCount").textContent = data.pass_count ?? 0;
    document.getElementById("failCount").textContent = data.fail_count ?? 0;
    document.getElementById("mostAttemptedQuiz").textContent = data.most_attempted_quiz ?? "N/A";
    document.getElementById("mostAttemptedCount").textContent =
      `${data.most_attempted_count ?? 0} attempts`;

  } catch (err) {
    console.error("Overview error:", err);
  }
}

async function loadActiveAttempts() {
  try {
    const res = await fetch(`${API}/admin/attempts/active`, {
      headers: adminHeaders()
    });

    const data = await res.json();
    const tbody = document.getElementById("attemptTableBody");
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">No active attempts</td>
        </tr>`;
      return;
    }

    data.forEach(a => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.student}</td>
        <td>${a.quiz}</td>
        <td>
          <span class="badge bg-${a.status === "in_progress" ? "success" : "secondary"}">
            ${a.status}
          </span>
        </td>
        <td class="${a.violations > 0 ? "text-danger fw-bold" : ""}">
          ${a.violations}
        </td>
        <td>${formatDateTime(a.start_time)}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Active attempts error:", err);
  }
}

async function createQuiz() {
  const title = document.getElementById("quizTitleInput").value.trim();
  const description = document.getElementById("quizDescInput").value.trim();
  const duration = document.getElementById("quizDurationInput").value;

  if (!title || !duration) {
    alert("Title and duration are required");
    return;
  }

  try {
    const res = await fetch(`${API}/admin/quizzes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders()
      },
      body: JSON.stringify({
        title,
        description,
        duration_minutes: duration
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Quiz creation failed");
      return;
    }

    alert("Quiz created successfully! Now add questions.");
    window.location.href = `create-questions.html?quizId=${data.id}`;

  } catch (err) {
    console.error("Create quiz error:", err);
  }
}

async function loadQuizzesAdmin() {
  try {
    const res = await fetch(`${API}/admin/quizzes`, {
      headers: adminHeaders()
    });

    const quizzes = await res.json();
    const tbody = document.getElementById("quizTableBody");
    tbody.innerHTML = "";

    if (!quizzes.length) {
      tbody.innerHTML =
        `<tr><td colspan="5" class="text-center">No quizzes found</td></tr>`;
      return;
    }

    quizzes.forEach(q => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${q.title}</td>
        <td>${q.duration_minutes} min</td>
        <td>
          <span class="badge ${q.is_active ? "bg-success" : "bg-secondary"}">
            ${q.is_active ? "Active" : "Inactive"}
          </span>
        </td>
        <td>${formatDateTime(q.created_at)}</td>
        <td>
          <button class="btn btn-info btn-sm me-1"
            onclick="viewQuizResults(${q.id}, '${q.title.replace(/'/g, "\\'")}')">
            📊 Results
          </button>
          <button class="btn btn-danger btn-sm"
            onclick="deleteQuizAdmin(${q.id})">
            🗑 Soft Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Load quizzes error:", err);
  }
}

async function deleteQuizAdmin(id) {
  if (!confirm("Soft delete this quiz? (deleted_at will be set, data preserved)")) return;

  try {
    const res = await fetch(`${API}/admin/quizzes/${id}`, {
      method: "DELETE",
      headers: adminHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Delete failed");
      return;
    }

    alert("Quiz soft-deleted successfully");
    loadQuizzesAdmin();
    loadOverview();

  } catch (err) {
    console.error("Delete quiz error:", err);
  }
}

let quizResultsModal;

function viewQuizResults(quizId, quizTitle) {
  if (!quizResultsModal) {
    quizResultsModal = new bootstrap.Modal(
      document.getElementById("quizResultsModal")
    );
  }

  document.getElementById("quizResultsTitle").innerText =
    `📊 Results – ${quizTitle}`;

  loadQuizResults(quizId);
  quizResultsModal.show();
}

async function loadQuizResults(quizId) {
  try {
    const res = await fetch(`${API}/admin/quizzes/${quizId}/results`, {
      headers: adminHeaders()
    });

    const data = await res.json();
    const tbody = document.getElementById("quizResultsBody");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML =
        `<tr><td colspan="7" class="text-center">No attempts yet</td></tr>`;
      return;
    }

    data.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.student_name}</td>
        <td>${r.email}</td>
        <td>${r.score ?? 0}</td>
        <td>
          <span class="badge bg-${
            r.status === "auto_submitted" ? "danger" : "success"
          }">
            ${r.status}
          </span>
        </td>
        <td class="${r.violations > 0 ? "text-danger fw-bold" : ""}">
          ${r.violations}
        </td>
        <td>${r.start_time ? formatDateTime(r.start_time) : "-"}</td>
        <td>${r.end_time ? formatDateTime(r.end_time) : "-"}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Quiz results error:", err);
  }
}

let studentsModal;

function openStudentsModal() {
  if (!studentsModal) {
    studentsModal = new bootstrap.Modal(
      document.getElementById("studentsModal")
    );
  }
  loadStudents();
  studentsModal.show();
}

async function loadStudents() {
  try {
    const res = await fetch(`${API}/admin/students`, {
      headers: adminHeaders()
    });

    const data = await res.json();
    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML =
        `<tr><td colspan="4" class="text-center">No students found</td></tr>`;
      return;
    }

    data.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.name}</td>
        <td>${s.email}</td>
        <td>${s.total_attempts}</td>
        <td class="${s.total_violations > 0 ? "text-danger fw-bold" : ""}">
          ${s.total_violations}
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Load students error:", err);
  }
}

function downloadQuizResults() {
  const table = document.querySelector("#quizResultsBody");

  if (!table || table.innerText.includes("No attempts")) {
    alert("No results available to download");
    return;
  }

  const data = [];
  data.push([
    "Student", "Email", "Score", "Status", "Violations", "Start Time", "End Time"
  ]);

  const rows = table.querySelectorAll("tr");
  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    if (cols.length) {
      data.push([
        cols[0].innerText, cols[1].innerText, cols[2].innerText,
        cols[3].innerText, cols[4].innerText, cols[5].innerText, cols[6].innerText
      ]);
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
  XLSX.writeFile(workbook, "quiz_results.xlsx");
}

renderAdminNav("dashboard");
loadOverview();
loadActiveAttempts();
loadQuizzesAdmin();

setInterval(() => {
  loadOverview();
  loadActiveAttempts();
}, 5000);
