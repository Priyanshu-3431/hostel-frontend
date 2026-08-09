/* ==========================================================
   GP BARH HOSTEL - Auth page logic
   Handles: register.html, login.html, admin-login.html
   ========================================================== */

/* ---------- Registration ---------- */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  const registerBtn = document.getElementById("registerBtn");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors(registerForm);
    hideAlert("registerAlert");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const registrationNumber = document.getElementById("registrationNumber").value.trim();
    const branch = document.getElementById("branch").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    console.log(branch)

    let hasError = false;
    if (!name) { setFieldError("name", "Full name is required."); hasError = true; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("email", "Enter a valid email."); hasError = true; }
    if (!/^[6-9]\d{9}$/.test(mobile)) { setFieldError("mobile", "Enter a valid 10-digit mobile number."); hasError = true; }
    if (!registrationNumber) { setFieldError("registrationNumber", "Registration number is required."); hasError = true; }
    if (!branch) { setFieldError("branch", "Please select your branch."); hasError = true; }
    if (password.length < 6) { setFieldError("password", "Password must be at least 6 characters."); hasError = true; }
    if (password !== confirmPassword) { setFieldError("confirmPassword", "Passwords do not match."); hasError = true; }
    if (hasError) return;

    setButtonLoading(registerBtn, true, "Creating account...");
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: { name, email, mobile, registrationNumber, branch, password, confirmPassword },
      });
      showAlert("registerAlert", data.message || "Registration successful!", "success");
      showToast("Registration successful! Redirecting to login...", "success");
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } catch (err) {
      showAlert("registerAlert", err.message, "error");
      showToast(err.message, "error");
    } finally {
      setButtonLoading(registerBtn, false);
    }
  });
}

/* ---------- Student Login ---------- */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const loginBtn = document.getElementById("loginBtn");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors(loginForm);
    hideAlert("loginAlert");

    const identifier = document.getElementById("identifier").value.trim();
    const password = document.getElementById("password").value;

    if (!identifier || !password) {
      showAlert("loginAlert", "Please enter both fields.", "error");
      return;
    }

    setButtonLoading(loginBtn, true, "Logging in...");
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: { identifier, password } });
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      showToast(`Welcome, ${data.user.name}!`, "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 700);
    } catch (err) {
      showAlert("loginAlert", err.message, "error");
      showToast(err.message, "error");
    } finally {
      setButtonLoading(loginBtn, false);
    }
  });
}

/* ---------- Admin Login ---------- */
const adminLoginForm = document.getElementById("adminLoginForm");
if (adminLoginForm) {
  const adminLoginBtn = document.getElementById("adminLoginBtn");

  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors(adminLoginForm);
    hideAlert("adminLoginAlert");

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      showAlert("adminLoginAlert", "Please enter both fields.", "error");
      return;
    }

    setButtonLoading(adminLoginBtn, true, "Logging in...");
    try {
      const data = await apiFetch("/auth/admin-login", { method: "POST", body: { username, password } });
      Auth.setAdminToken(data.token);
      Auth.setAdmin(data.admin);
      showToast("Welcome back, admin!", "success");
      setTimeout(() => (window.location.href = "admin-dashboard.html"), 700);
    } catch (err) {
      showAlert("adminLoginAlert", err.message, "error");
      showToast(err.message, "error");
    } finally {
      setButtonLoading(adminLoginBtn, false);
    }
  });
}
