async function loadLeaderboard() {
  try {
    const res = await fetch(`${API}/admin/leaderboard`, {
      headers: adminHeaders()
    });
    const data = await res.json();

    const topBody = document.getElementById("topScorersBody");
    const activeBody = document.getElementById("mostActiveBody");
    topBody.innerHTML = "";
    activeBody.innerHTML = "";

    if (!data.top_scorers?.length) {
      topBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No data</td></tr>`;
    } else {
      data.top_scorers.forEach((row, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>#${i + 1}</td>
          <td>${row.name}</td>
          <td class="fw-bold">${row.total_score}</td>
          <td>${row.quizzes_taken}</td>
        `;
        topBody.appendChild(tr);
      });
    }

    if (!data.most_active?.length) {
      activeBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No data</td></tr>`;
    } else {
      data.most_active.forEach((row, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>#${i + 1}</td>
          <td>${row.name}</td>
          <td>${row.attempt_count}</td>
        `;
        activeBody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error("Leaderboard error:", err);
  }
}

renderAdminNav("leaderboard");
loadLeaderboard();
