const lastResult = JSON.parse(localStorage.getItem("lastResult") || "{}");

// 🔥 Detect auto-submit safely (from local flag OR backend)
const autoFlag = localStorage.getItem("quizAutoSubmitted") === "true";
const status = autoFlag ? "auto_submitted" : (lastResult.status || "submitted");

// Clear flag so it doesn’t affect next quiz
localStorage.removeItem("quizAutoSubmitted");

// =============================
// NUMBERS
// =============================
const score = Number(lastResult.score ?? 0);
const total = Number(lastResult.total ?? 0);

const correct = score;
const wrong = Math.max(total - score, 0);
const accuracy = total > 0 ? (correct / total) * 100 : 0;

// =============================
// DISPLAY NUMBERS
// =============================
document.getElementById("score").textContent = `${score}/${total}`;
document.getElementById("correct").textContent = correct;
document.getElementById("wrong").textContent = wrong;
document.getElementById("accuracy").textContent = accuracy.toFixed(2);

// =============================
// MESSAGE LOGIC (FINAL)
// =============================
const msgBox = document.getElementById("resultMessage");
msgBox.className = "message-box"; // reset styles

if (status === "auto_submitted") {
  msgBox.classList.add("msg-danger");
  msgBox.innerHTML = `
    🚨 <strong>Exam Auto-Submitted!</strong><br>
    Cheating is not encouraged. Please attend exams honestly next time.
  `;
} else {
  const avgScore = total / 2;

  if (score > avgScore) {
    msgBox.classList.add("msg-success");
    msgBox.innerHTML = `
      🎉 <strong>Excellent Performance!</strong><br>
      You scored above average. Keep it up!
    `;
  } else if (score === avgScore) {
    msgBox.classList.add("msg-warning");
    msgBox.innerHTML = `
      🙂 <strong>Good Effort!</strong><br>
      You scored exactly the average. A little more practice will help.
    `;
  } else {
    msgBox.classList.add("msg-warning");
    msgBox.innerHTML = `
      💪 <strong>Better Luck Next Time!</strong><br>
      Don’t give up — practice more and improve.
    `;
  }
}

// =============================
// CHART (FIXED & GUARANTEED)
// =============================
const canvas = document.getElementById("performanceChart");

if (canvas) {
  const ctx = canvas.getContext("2d");

  // 🔥 Force visible height
  canvas.height = 260;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [{
        data: [correct, wrong],
        backgroundColor: ["#28a745", "#dc3545"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          }
        }
      }
    }
  });
}
