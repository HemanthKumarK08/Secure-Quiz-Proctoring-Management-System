// const API = "http://localhost:3000/api";
// const token = localStorage.getItem("token");

// if (!token) window.location.href = "index.html";

// const quizId = localStorage.getItem("currentQuizId");
// const duration = parseInt(localStorage.getItem("currentQuizDuration") || "1");

// let attemptId = null;
// let questions = [];
// let current = 0;
// let answers = {};
// let timerInterval = null;

// // 🔒 Violation control
// let violationTriggered = false;

// const title = document.getElementById("quizTitle");
// const box = document.getElementById("questionBox");
// const timerEl = document.getElementById("timer");
// const msg = document.getElementById("violationMsg");

// // ============================
// // NAVIGATION
// // ============================
// document.getElementById("prevBtn").onclick = () => {
//   if (current > 0) current--;
//   render();
// };

// document.getElementById("nextBtn").onclick = () => {
//   if (current < questions.length - 1) current++;
//   render();
// };

// document.getElementById("submitBtn").onclick = () => submitQuiz(false);

// // ============================
// // RENDER QUESTION
// // ============================
// function render() {
//   const q = questions[current];
//   if (!q) return;

//   title.textContent = `Question ${current + 1} of ${questions.length}`;

//   box.innerHTML = `
//     <h5>${q.question_text}</h5>
//     ${["A", "B", "C", "D"]
//       .map(opt => {
//         const val = q[`option_${opt.toLowerCase()}`];
//         if (!val) return "";
//         return `
//           <div class="form-check">
//             <input class="form-check-input" type="radio"
//               name="opt"
//               value="${opt}"
//               ${answers[q.id] === opt ? "checked" : ""}>
//             <label class="form-check-label">${val}</label>
//           </div>
//         `;
//       })
//       .join("")}
//   `;

//   document.querySelectorAll("input[name='opt']").forEach(el => {
//     el.onchange = e => {
//       answers[q.id] = e.target.value;
//     };
//   });
// }

// // ============================
// // TIMER
// // ============================
// function startTimer() {
//   let sec = duration * 60;

//   timerInterval = setInterval(() => {
//     sec--;

//     const m = String(Math.floor(sec / 60)).padStart(2, "0");
//     const s = String(sec % 60).padStart(2, "0");
//     timerEl.textContent = `${m}:${s}`;

//     if (sec <= 0) {
//       clearInterval(timerInterval);
//       autoSubmit("Time up");
//     }
//   }, 1000);
// }

// // ============================
// // SUBMIT QUIZ
// // ============================
// async function submitQuiz(auto) {
//   clearInterval(timerInterval);

//   const payload = {
//     attempt_id: attemptId,
//     responses: questions.map(q => ({
//       question_id: q.id,
//       selected_option: answers[q.id] || null
//     }))
//   };

//   try {
//     const res = await fetch(`${API}/attempts/submit`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`
//       },
//       body: JSON.stringify(payload)
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       alert(data.message || "Submit failed");
//       return;
//     }

//     localStorage.setItem("lastResult", JSON.stringify(data));
//     window.location.href = "result.html";

//   } catch (err) {
//     console.error("Submit error:", err);
//   }
// }

// // ============================
// // AUTO SUBMIT (VIOLATION / TIMER)
// // ============================
// async function autoSubmit(reason) {
//   if (violationTriggered) return;
//   violationTriggered = true;

//   msg.textContent = "🚨 Violation detected. Exam auto-submitting...";
//   clearInterval(timerInterval);

//   try {
//     const res = await fetch(`${API}/attempts/violations`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`
//       },
//       body: JSON.stringify({
//         attempt_id: attemptId,
//         type: "PROCTOR",
//         details: reason
//       })
//     });

//     const data = await res.json();

//     localStorage.setItem(
//       "lastResult",
//       JSON.stringify({
//         score: 0,
//         total: questions.length,
//         status: "auto_submitted"
//       })
//     );

//     setTimeout(() => {
//       window.location.href = "result.html";
//     }, 800);

//   } catch (err) {
//     console.error("Auto submit error:", err);
//   }
// }

// // ============================
// // PROCTORING EVENTS
// // ============================

// // Tab / App switch
// document.addEventListener("visibilitychange", () => {
//   if (document.hidden) {
//     autoSubmit("Tab or app switched");
//   }
// });

// // Window focus lost
// window.addEventListener("blur", () => {
//   autoSubmit("Window focus lost");
// });

// // ============================
// // INIT
// // ============================
// async function init() {
//   if (!quizId) {
//     alert("No quiz selected");
//     return window.location.href = "student-dashboard.html";
//   }

//   try {
//     const res = await fetch(`${API}/attempts/start`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`
//       },
//       body: JSON.stringify({ quiz_id: parseInt(quizId) })
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       alert(data.message);
//       return window.location.href = "student-dashboard.html";
//     }

//     attemptId = data.attempt_id;
//     questions = data.questions;

//     render();
//     startTimer();

//   } catch (err) {
//     console.error("Init error:", err);
//   }
// }

// init();

const API = "http://localhost:3000/api";
const token = localStorage.getItem("token");

if (!token) window.location.href = "index.html";

const quizId = localStorage.getItem("currentQuizId");
const duration = parseInt(localStorage.getItem("currentQuizDuration") || "1");

let attemptId = null;
let questions = [];
let current = 0;
let answers = {};
let timerInterval = null;

// 🔒 Violation control
let violationTriggered = false;

const title = document.getElementById("quizTitle");
const box = document.getElementById("questionBox");
const timerEl = document.getElementById("timer");
const msg = document.getElementById("violationMsg");
const dashboardBtn = document.getElementById("dashboardBtn");

// ============================
// BLOCK DASHBOARD & BACK NAVIGATION
// ============================
history.pushState(null, null, location.href);

window.addEventListener("popstate", () => {
  history.pushState(null, null, location.href);
  showBlockedMessage();
});

if (dashboardBtn) {
  dashboardBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showBlockedMessage();
  });
}

function showBlockedMessage() {
  msg.textContent =
    "⚠️ You cannot go back to the dashboard during an active quiz.";
  msg.classList.remove("d-none");

  setTimeout(() => {
    msg.textContent = "";
  }, 3000);
}

// ============================
// NAVIGATION
// ============================
document.getElementById("prevBtn").onclick = () => {
  if (current > 0) current--;
  render();
};

document.getElementById("nextBtn").onclick = () => {
  if (current < questions.length - 1) current++;
  render();
};

document.getElementById("submitBtn").onclick = () => submitQuiz(false);

// ============================
// RENDER QUESTION
// ============================
// function render() {
//   const q = questions[current];
//   if (!q) return;

//   title.textContent = `Question ${current + 1} of ${questions.length}`;

//   box.innerHTML = `
//     <h5>${q.question_text}</h5>
//     ${["A", "B", "C", "D"]
//       .map(opt => {
//         const val = q[`option_${opt.toLowerCase()}`];
//         if (!val) return "";
//         return `
//           <div class="form-check">
//             <input class="form-check-input" type="radio"
//               name="opt"
//               value="${opt}"
//               ${answers[q.id] === opt ? "checked" : ""}>
//             <label class="form-check-label">${val}</label>
//           </div>
//         `;
//       })
//       .join("")}
//   `;

//   document.querySelectorAll("input[name='opt']").forEach(el => {
//     el.onchange = e => {
//       answers[q.id] = e.target.value;
//     };
//   });
// }

// ============================
// RENDER QUESTION (Updated for Premium UI)
// ============================
function render() {
  const q = questions[current];
  if (!q) return;

  // Update Question Counter
  title.textContent = `Question ${current + 1} of ${questions.length}`;

  // Update Progress Bar (optional visual bonus)
  const progressPercent = ((current + 1) / questions.length) * 100;
  const progressBar = document.querySelector(".progress-bar");
  if (progressBar) progressBar.style.width = `${progressPercent}%`;

  // Generate Options HTML matching the pill-style screenshot
  let optionsHtml = `<h4>${q.question_text}</h4>`;
  
  ["A", "B", "C", "D"].forEach(opt => {
    const val = q[`option_${opt.toLowerCase()}`];
    if (val) {
      // Check if this option was previously selected
      const isActive = answers[q.id] === opt ? "active" : "";
      
      optionsHtml += `
        <button class="option-item ${isActive}" data-opt="${opt}">
          ${val}
        </button>
      `;
    }
  });

  box.innerHTML = optionsHtml;

  // Handle Selection Logic
  document.querySelectorAll(".option-item").forEach(btn => {
    btn.onclick = () => {
      // Remove 'active' class from all buttons in this question
      document.querySelectorAll(".option-item").forEach(b => b.classList.remove("active"));
      
      // Add 'active' class to clicked button
      btn.classList.add("active");
      
      // Save the answer
      answers[q.id] = btn.getAttribute("data-opt");
    };
  });
}

// ============================
// TIMER
// ============================
function startTimer() {
  let sec = duration * 60;

  timerInterval = setInterval(() => {
    sec--;

    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;

    if (sec <= 0) {
      clearInterval(timerInterval);
      autoSubmit("Time up");
    }
  }, 1000);
}

// ============================
// SUBMIT QUIZ
// ============================
async function submitQuiz(auto) {
  clearInterval(timerInterval);

  const payload = {
    attempt_id: attemptId,
    responses: questions.map(q => ({
      question_id: q.id,
      selected_option: answers[q.id] || null
    }))
  };

  try {
    const res = await fetch(`${API}/attempts/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Submit failed");
      return;
    }

    localStorage.setItem("lastResult", JSON.stringify(data));
    window.location.href = "result.html";

  } catch (err) {
    console.error("Submit error:", err);
  }
}

// ============================
// AUTO SUBMIT
// ============================
async function autoSubmit(reason) {
  if (violationTriggered) return;
  violationTriggered = true;

  msg.textContent = "🚨 Violation detected. Exam auto-submitting...";
  clearInterval(timerInterval);

  try {
    await fetch(`${API}/attempts/violations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        attempt_id: attemptId,
        type: "PROCTOR",
        details: reason
      })
    });

    localStorage.setItem(
      "lastResult",
      JSON.stringify({
        score: 0,
        total: questions.length,
        status: "auto_submitted"
      })
    );

    setTimeout(() => {
      window.location.href = "result.html";
    }, 800);

  } catch (err) {
    console.error("Auto submit error:", err);
  }
}

// ============================
// PROCTORING EVENTS
// ============================
document.addEventListener("visibilitychange", () => {
  if (document.hidden) autoSubmit("Tab or app switched");
});

window.addEventListener("blur", () => {
  autoSubmit("Window focus lost");
});

// ============================
// INIT
// ============================
async function init() {
  if (!quizId) {
    alert("No quiz selected");
    return window.location.href = "student-dashboard.html";
  }

  try {
    const res = await fetch(`${API}/attempts/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ quiz_id: parseInt(quizId) })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return window.location.href = "student-dashboard.html";
    }

    attemptId = data.attempt_id;
    questions = data.questions;

    render();
    startTimer();

  } catch (err) {
    console.error("Init error:", err);
  }
}


// const video = document.getElementById("camera");

// navigator.mediaDevices.getUserMedia({ video: true })
//   .then(stream => {
//     video.srcObject = stream;
//   })
//   .catch(err => {
//     console.error("Camera error:", err);
//   });
// async function loadModels() {
//   await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
// }

// loadModels();
// setInterval(async () => {
//   const detections = await faceapi.detectAllFaces(
//     video,
//     new faceapi.TinyFaceDetectorOptions()
//   );

//   if (detections.length === 0) {
//     sendViolation("No Face Detected");
//   }

//   if (detections.length > 1) {
//     sendViolation("Multiple Faces Detected");
//   }

// }, 3000);
init();
