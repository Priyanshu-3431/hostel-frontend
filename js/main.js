/* ==========================================================
   GP BARH HOSTEL - Shared frontend utilities
   Loaded on every page before the page-specific script.
   ========================================================== */

// If the site is opened directly through the Node/Express server
// (http://localhost:5000), relative "/api" calls just work.
// If someone opens the HTML files with a different dev server (e.g. Live
// Server on port 5500), fall back to talking to the API on port 5000.
const API_BASE = "https://hostel-backend-npe4.onrender.com/api";

/* ---------- Toast notifications ---------- */
function ensureToastContainer() {
  let el = document.getElementById("toastContainer");
  if (!el) {
    el = document.createElement("div");
    el.id = "toastContainer";
    el.style.position = "fixed";
    el.style.top = "20px";
    el.style.right = "20px";
    el.style.zIndex = "9999";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.gap = "10px";
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = "info", duration = 4000) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity .3s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---------- Field / form alert helpers ---------- */
function setFieldError(inputId, msg) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add("invalid");
  let err = input.parentElement.querySelector(".field-error");
  if (!err) {
    err = document.createElement("div");
    err.className = "field-error";
    input.parentElement.appendChild(err);
  }
  err.textContent = msg;
  err.classList.add("show");
}

function clearFieldErrors(formEl) {
  formEl.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  formEl.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
    el.classList.remove("show");
  });
}

function showAlert(boxId, message, type = "error") {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = message;
  box.className = `alert-box show ${type}`;
}

function hideAlert(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.className = "alert-box";
}

/* ---------- Loading button state ---------- */
function setButtonLoading(btn, loading, loadingText = "Please wait...") {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
  }
}

/* ---------- Auth / token storage ---------- */
const Auth = {
  getToken: () => localStorage.getItem("gpbh_token"),
  setToken: (t) => localStorage.setItem("gpbh_token", t),
  getUser: () => {
    const raw = localStorage.getItem("gpbh_user");
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (u) => localStorage.setItem("gpbh_user", JSON.stringify(u)),
  getAdminToken: () => localStorage.getItem("gpbh_admin_token"),
  setAdminToken: (t) => localStorage.setItem("gpbh_admin_token", t),
  getAdmin: () => {
    const raw = localStorage.getItem("gpbh_admin");
    return raw ? JSON.parse(raw) : null;
  },
  setAdmin: (a) => localStorage.setItem("gpbh_admin", JSON.stringify(a)),
  logoutStudent: () => {
    localStorage.removeItem("gpbh_token");
    localStorage.removeItem("gpbh_user");
    window.location.href = "login.html";
  },
  logoutAdmin: () => {
    localStorage.removeItem("gpbh_admin_token");
    localStorage.removeItem("gpbh_admin");
    window.location.href = "admin-login.html";
  },
};

// Redirect to login if a protected student page is opened without a token
function requireStudentAuth() {
  if (!Auth.getToken()) {
    window.location.href = "login.html";
  }
}

// Redirect to admin login if a protected admin page is opened without a token
function requireAdminAuth() {
  if (!Auth.getAdminToken()) {
    window.location.href = "admin-login.html";
  }
}

/* ---------- Wrapper around fetch with JSON + auth header ---------- */
async function apiFetch(path, { method = "GET", body, auth = false, adminAuth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && Auth.getToken()) headers.Authorization = `Bearer ${Auth.getToken()}`;
  if (adminAuth && Auth.getAdminToken()) headers.Authorization = `Bearer ${Auth.getAdminToken()}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error("Could not reach the server. Make sure the backend is running.");
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { success: false, message: "Unexpected server response." };
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      Auth.logoutStudent();
    }
    if (response.status === 401 && adminAuth) {
      Auth.logoutAdmin();
    }
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

// Download a protected file (e.g. PDF receipt) that requires an auth header,
// which a plain <a href> link cannot send.
async function downloadProtectedFile(path, filename, { auth = false } = {}) {
  const headers = {};
  if (auth && Auth.getToken()) headers.Authorization = `Bearer ${Auth.getToken()}`;

  const response = await fetch(`${API_BASE}${path}`, { headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Could not download the file.");
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/* ---------- Navbar (mobile hamburger + active link + login state) ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Highlight current page in nav
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.getAttribute("href") === current) link.classList.add("active");
  });

  // If a student is already logged in, swap Login/Register for Dashboard/Logout
  const loginSlot = document.getElementById("navAuthSlot");
  if (loginSlot && Auth.getToken()) {
    const user = Auth.getUser();
    loginSlot.innerHTML = `
      <a href="dashboard.html">Dashboard</a>
      <a href="#" id="navLogoutBtn" class="nav-cta">Logout${user ? " (" + user.name.split(" ")[0] + ")" : ""}</a>
    `;
    document.getElementById("navLogoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      Auth.logoutStudent();
    });
  }
});
