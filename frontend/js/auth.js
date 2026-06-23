const API = "http://localhost:3000/api/auth";

/* =====================
   LOGIN
===================== */
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // ✅ SAVE DATA CORRECTLY
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ ROLE BASED REDIRECT
      if (data.user.role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "student-dashboard.html";
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}

/* =====================
   REGISTER
===================== */
const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("Registration successful! Please login.");
      window.location.href = "index.html";

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}
