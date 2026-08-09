/* ==========================================================
   GP BARH HOSTEL - Admin Panel logic
   ========================================================== */

requireAdminAuth();

const admin = Auth.getAdmin();
if (admin) document.getElementById("adminChipName").textContent = admin.username;

document.getElementById("adminLogoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  Auth.logoutAdmin();
});

function money(v) {
  if (v === undefined || v === null) return "-";
  return `₹ ${Number(v).toLocaleString("en-IN")}`;
}

function badgeFor(status) {
  if (!status) return `<span class="badge badge-info">-</span>`;
  const map = {
    Successful: "badge-success", confirmed: "badge-success", Read: "badge-info",
    Pending: "badge-pending", pending: "badge-pending", Unread: "badge-pending",
    Failed: "badge-error", Rejected: "badge-error", cancelled: "badge-error",
    Resolved: "badge-success",
  };
  return `<span class="badge ${map[status] || "badge-info"}">${status}</span>`;
}

/* ---------- Tab navigation ---------- */
const tabTitles = {
  dashboard: "Dashboard",
  students: "Students",
  bookings: "Room Bookings",
  payments: "Payments",
  messages: "Contact Messages",
  gallery: "Gallery",
};

function switchTab(tab) {
  document.querySelectorAll(".admin-tab").forEach((s) => (s.style.display = "none"));
  const section = document.getElementById(`tab-${tab}`);
  if (section) section.style.display = "block";
  document.getElementById("tabTitle").textContent = tabTitles[tab] || "Dashboard";
  document.querySelectorAll(".admin-nav-link").forEach((a) => a.classList.remove("active"));
  document.querySelectorAll(`.admin-nav-link[data-tab="${tab}"]`).forEach((a) => a.classList.add("active"));

  if (tab === "dashboard") loadDashboardSummary();
  if (tab === "students") loadStudents();
  if (tab === "bookings") loadBookings();
  if (tab === "payments") loadPayments();
  if (tab === "messages") loadMessages();
  if (tab === "gallery") loadGalleryAdmin();
}

document.querySelectorAll(".admin-nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab(link.dataset.tab);
  });
});

function initialTabFromHash() {
  const hash = window.location.hash.replace("#", "");
  const validTab = ["dashboard", "students", "registrations", "bookings", "payments", "receipts", "messages", "gallery"].includes(hash);
  const tab = validTab ? (hash === "registrations" ? "students" : hash === "receipts" ? "payments" : hash) : "dashboard";
  switchTab(tab);
}
initialTabFromHash();

/* ---------- Dashboard summary ---------- */
async function loadDashboardSummary() {
  try {
    const data = await apiFetch("/admin/dashboard-summary", { adminAuth: true });
    const s = data.summary;
    document.getElementById("statTotalStudents").textContent = s.totalStudents;
    document.getElementById("statTotalRegistrations").textContent = s.totalRegistrations;
    document.getElementById("statTotalBookings").textContent = s.totalBookings;
    document.getElementById("statSuccessfulPayments").textContent = s.successfulPayments;
    document.getElementById("statPendingPayments").textContent = s.pendingPayments;
    document.getElementById("statTotalMessages").textContent = s.totalMessages;
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------- Students table (search + pagination) ---------- */
let studentPage = 1;
const studentLimit = 8;
let studentSearchTerm = "";
let studentSearchDebounce = null;

async function loadStudents() {
  try {
    const params = new URLSearchParams({ search: studentSearchTerm, page: studentPage, limit: studentLimit });
    const data = await apiFetch(`/admin/students?${params.toString()}`, { adminAuth: true });
    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML = "";
    if (data.students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No students found.</td></tr>`;
    }
    data.students.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.id}</td><td>${s.name}</td><td>${s.email}</td><td>${s.mobile}</td>
        <td>${s.registration_number}</td><td>${s.branch}</td>
        <td>${new Date(s.created_at).toLocaleDateString()}</td>
        <td>${badgeFor(s.account_status === "active" ? "Successful" : "Rejected")}</td>`;
      tbody.appendChild(tr);
    });
    document.getElementById("studentCount").textContent = `${data.total} total student(s)`;

    const totalPages = Math.max(1, Math.ceil(data.total / studentLimit));
    const pag = document.getElementById("studentsPagination");
    pag.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === studentPage) btn.classList.add("active");
      btn.addEventListener("click", () => { studentPage = i; loadStudents(); });
      pag.appendChild(btn);
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("studentSearch").addEventListener("input", (e) => {
  clearTimeout(studentSearchDebounce);
  studentSearchDebounce = setTimeout(() => {
    studentSearchTerm = e.target.value.trim();
    studentPage = 1;
    loadStudents();
  }, 350);
});

/* ---------- Bookings table ---------- */
async function loadBookings() {
  try {
    const data = await apiFetch("/booking/admin/all", { adminAuth: true });
    const tbody = document.getElementById("bookingsTableBody");
    tbody.innerHTML = "";
    if (data.bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty-state">No room bookings yet.</td></tr>`;
    }
    data.bookings.forEach((b) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.id}</td><td>${b.student_name}</td><td>${b.registration_number}</td><td>${b.branch}</td>
        <td>${money(b.hostel_fee)}</td><td>${money(b.mess_fee)}</td><td>${money(b.total_fee)}</td>
        <td>${badgeFor(b.booking_status)}</td><td>${badgeFor(b.payment_status)}</td>
        <td>${new Date(b.created_at).toLocaleDateString()}</td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------- Payments table ---------- */
// async function loadPayments() {
//   try {
//     const data = await apiFetch("/payment/admin/all", { adminAuth: true });
//     const tbody = document.getElementById("paymentsTableBody");
//     tbody.innerHTML = "";
//     if (data.payments.length === 0) {
//       tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No payment submissions yet.</td></tr>`;
//     }
//     data.payments.forEach((p) => {
//       const tr = document.createElement("tr");
//       tr.innerHTML = `
//         <td>${p.id}</td><td>${p.student_name}</td><td>${p.registration_number}</td><td>${p.utr_number}</td>
//         <td>${money(p.amount)}</td><td>${new Date(p.payment_date).toLocaleString()}</td>
//         <td>${badgeFor(p.payment_status)}</td>
//         <td>
//           <select class="payment-status-select" data-id="${p.id}">
//             ${["Pending", "Successful", "Failed", "Rejected"].map((st) => `<option value="${st}" ${st === p.payment_status ? "selected" : ""}>${st}</option>`).join("")}
//           </select>
//         </td>`;
//       tbody.appendChild(tr);
//     });

//     document.querySelectorAll(".payment-status-select").forEach((sel) => {
//       sel.addEventListener("change", async () => {
//         try {
//           await apiFetch(`/payment/admin/${sel.dataset.id}/status`, {
//             method: "PUT",
//             adminAuth: true,
//             body: { status: sel.value },
//           });
//           showToast(`Payment #${sel.dataset.id} marked as ${sel.value}.`, "success");
//           loadPayments();
//         } catch (err) {
//           showToast(err.message, "error");
//         }
//       });
//     });
//   } catch (err) {
//     showToast(err.message, "error");
//   }
// }
/* ---------- Payments table ---------- */
async function loadPayments() {
  try {
    const data = await apiFetch('/payment/admin/all', { adminAuth: true });
    const tbody = document.getElementById('paymentsTableBody');
    tbody.innerHTML = '';

    if (!data.payments || data.payments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No payment submissions yet.</td></tr>`;
      return;
    }

    data.payments.forEach((p) => {
      const tr = document.createElement('tr');

      const statusMap = {
        pending_verification: 'Pending Verification',
        verified: 'Verified',
        rejected: 'Rejected'
      };

      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.studentName || '-'}</td>
        <td>${p.registrationNumber || '-'}</td>
        <td>${p.utrNumber || '-'}</td>
        <td>${money(p.totalFee)}</td>
        <td>${p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN') : '-'}</td>
        <td>${badgeFor(statusMap[p.paymentStatus] || p.paymentStatus)}</td>
        <td>
          <select class="payment-status-select" data-id="${p.id}">
            <option value="pending_verification" ${p.paymentStatus === 'pending_verification' ? 'selected' : ''}>Pending Verification</option>
            <option value="verified" ${p.paymentStatus === 'verified' ? 'selected' : ''}>Verified</option>
            <option value="rejected" ${p.paymentStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>`;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.payment-status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await apiFetch(`/payment/admin/${sel.dataset.id}/status`, {
            method: 'PUT',
            adminAuth: true,
            body: { status: sel.value }
          });
          showToast(`Payment #${sel.dataset.id} updated successfully.`, 'success');
          loadPayments();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ---------- Contact messages table ---------- */
async function loadMessages() {
  try {
    const data = await apiFetch("/contact/admin/all", { adminAuth: true });
    const tbody = document.getElementById("messagesTableBody");
    tbody.innerHTML = "";
    if (data.messages.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No contact messages yet.</td></tr>`;
    }
    data.messages.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.name}</td><td>${m.email}</td><td>${m.phone}</td>
        <td style="max-width:260px; white-space:normal;">${m.message}</td>
        <td>${new Date(m.created_at).toLocaleDateString()}</td>
        <td>${badgeFor(m.status)}</td>
        <td>
          <select class="message-status-select" data-id="${m.id}">
            ${["Unread", "Read", "Resolved"].map((st) => `<option value="${st}" ${st === m.status ? "selected" : ""}>${st}</option>`).join("")}
          </select>
        </td>`;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".message-status-select").forEach((sel) => {
      sel.addEventListener("change", async () => {
        try {
          await apiFetch(`/contact/admin/${sel.dataset.id}/status`, {
            method: "PUT",
            adminAuth: true,
            body: { status: sel.value },
          });
          showToast(`Message marked as ${sel.value}.`, "success");
          loadMessages();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------- Gallery management ---------- */
async function loadGalleryAdmin() {
  try {
    const data = await apiFetch("/gallery");
    const grid = document.getElementById("adminGalleryGrid");
    grid.innerHTML = "";
    if (data.images.length === 0) {
      grid.innerHTML = `<div class="empty-state">No images uploaded through the admin panel yet.</div>`;
    }
    data.images.forEach((img) => {
      const div = document.createElement("div");
      div.className = "gallery-item";
      div.innerHTML = `
        <img src="${img.image_url}" alt="${img.title || "Gallery image"}" />
        <button class="btn btn-danger btn-sm" style="position:absolute; top:8px; right:8px;" data-id="${img.id}">Delete</button>`;
      grid.appendChild(div);
    });

    grid.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await apiFetch(`/gallery/admin/${btn.dataset.id}`, { method: "DELETE", adminAuth: true });
          showToast("Image removed.", "success");
          loadGalleryAdmin();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("addGalleryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert("galleryAlert");
  const title = document.getElementById("galleryTitle").value.trim();
  const imageUrl = document.getElementById("galleryUrl").value.trim();
  if (!imageUrl) {
    showAlert("galleryAlert", "Image URL is required.", "error");
    return;
  }
  try {
    await apiFetch("/gallery/admin", { method: "POST", adminAuth: true, body: { title, imageUrl } });
    showToast("Image added to gallery.", "success");
    document.getElementById("addGalleryForm").reset();
    loadGalleryAdmin();
  } catch (err) {
    showAlert("galleryAlert", err.message, "error");
  }
});
