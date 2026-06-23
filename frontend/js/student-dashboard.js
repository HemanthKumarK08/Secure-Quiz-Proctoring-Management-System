const API_URL = "http://localhost:3000/api";
const token = localStorage.getItem("token");

if (!token) window.location.href = "index.html";

/* =========================
   LOGOUT
========================= */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.clear();
    window.location.href = "index.html";
  };
}

/* =========================
   GLOBAL STORE (for search/filter)
========================= */
let allAttempts = [];

/* =========================
   LOAD AVAILABLE QUIZZES
========================= */
async function loadQuizzes() {
  try {
    const res = await fetch(`${API_URL}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const quizzes = await res.json();
    const tbody = document.querySelector("#quizTable tbody");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!Array.isArray(quizzes) || quizzes.length === 0) {
      tbody.innerHTML =
        `<tr><td colspan="3" class="text-center">No quizzes available</td></tr>`;
      return;
    }

    quizzes.forEach(q => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${q.title}</td>
        <td>${q.duration_minutes}</td>
        <td>
          <button class="btn btn-sm btn-start"
            onclick="startQuiz(${q.id}, ${q.duration_minutes})">
            Start
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Quiz load error:", err);
  }
}

/* =========================
   LOAD PREVIOUS ATTEMPTS
========================= */
async function loadAttempts() {
  try {
    const res = await fetch(`${API_URL}/attempts/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const attempts = await res.json();
    allAttempts = Array.isArray(attempts) ? attempts : [];

    updateSummaryCards(allAttempts);
    renderAttempts(allAttempts);

  } catch (err) {
    console.error("Attempts load error:", err);
  }
}

/* =========================
   SUMMARY CARDS
========================= */
function updateSummaryCards(attempts) {
  const totalEl = document.getElementById("totalAttempts");
  const completedEl = document.getElementById("completedAttempts");
  const autoEl = document.getElementById("autoSubmittedAttempts");

  if (!totalEl || !completedEl || !autoEl) return;

  totalEl.textContent = attempts.length;

  completedEl.textContent =
    attempts.filter(a => a.status === "submitted").length;

  autoEl.textContent =
    attempts.filter(a => a.status === "auto_submitted").length;
}

/* =========================
   RENDER ATTEMPTS TABLE
========================= */
function renderAttempts(attempts) {
  const tbody = document.querySelector("#attemptTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!attempts.length) {
    tbody.innerHTML =
      `<tr><td colspan="7" class="text-center">No attempts found</td></tr>`;
    return;
  }

  attempts.forEach(a => {
    /* ⏱ Time Taken */
    let timeTaken = "-";
    if (a.start_time && a.end_time) {
      const start = new Date(a.start_time);
      const end = new Date(a.end_time);
      const diffMs = end - start;

      if (!isNaN(diffMs) && diffMs > 0) {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        timeTaken = `${mins}m ${secs}s`;
      }
    }

    /* 🟢 Status Badge */
    let statusBadge = "secondary";
    if (a.status === "submitted") statusBadge = "success";
    if (a.status === "auto_submitted") statusBadge = "danger";

    /* 📊 Progress */
    const totalQ = a.total_questions || 10; // frontend fallback
    const score = Number(a.score ?? 0);
    const percent = totalQ > 0
      ? Math.min(Math.round((score / totalQ) * 100), 100)
      : 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.quiz || a.quiz_title || "Quiz"}</td>

      <td>${score}</td>

      <td>
        <span class="badge bg-${statusBadge}">
          ${a.status}
        </span>
      </td>

      <td>${timeTaken}</td>

      <td>
        <div class="progress mb-1">
          <div class="progress-bar"
            style="width:${percent}%">
          </div>
        </div>
        <small>${percent}%</small>
      </td>

      <td>${a.start_time ? new Date(a.start_time).toLocaleString() : "-"}</td>
      <td>${a.end_time ? new Date(a.end_time).toLocaleString() : "-"}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* =========================
   SEARCH & FILTER
========================= */
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

if (searchInput) searchInput.addEventListener("input", filterAttempts);
if (statusFilter) statusFilter.addEventListener("change", filterAttempts);

function filterAttempts() {
  const search = (searchInput?.value || "").toLowerCase();
  const status = statusFilter?.value || "all";

  const filtered = allAttempts.filter(a => {
    const quizName = (a.quiz || "").toLowerCase();
    const quizMatch = quizName.includes(search);
    const statusMatch = status === "all" || a.status === status;
    return quizMatch && statusMatch;
  });

  renderAttempts(filtered);
}

/* =========================
   START QUIZ
========================= */
window.startQuiz = (quizId, durationMinutes) => {
  localStorage.setItem("currentQuizId", quizId);
  localStorage.setItem("currentQuizDuration", durationMinutes);
  window.location.href = "quiz.html";
};

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");

  const enabled = document.body.classList.contains("dark-mode");
  localStorage.setItem("studentDarkMode", enabled ? "1" : "0");

  showToast(enabled ? "🌙 Dark Mode Enabled" : "☀ Light Mode Enabled");
}

/* =========================
   INIT
========================= */
loadQuizzes();
loadAttempts();
