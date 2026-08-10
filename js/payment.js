/* ==========================================================
   GP BARH HOSTEL - Payment page logic
   Flow: no booking -> booking but unpaid (show QR+UTR form) ->
         pending verification -> failed/rejected -> successful (+ receipt)
   ========================================================== */

requireStudentAuth();

document.getElementById("logoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  Auth.logoutStudent();
});

function money(v) {
  if (v === undefined || v === null) return "-";
  return `₹ ${Number(v).toLocaleString("en-IN")}`;
}

function hideAllStates() {
  ["noBookingState", "paymentFormState", "pendingState", "failedState", "successState"].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });
}

let currentBooking = null;

async function loadBookingAndRender() {
  const user = Auth.getUser();
  if (user) document.getElementById("chipName").textContent = user.name;

  try {
    const data = await apiFetch("https://hostel-backend-npe4.onrender.com/booking/my", { auth: true });
    currentBooking = data.booking;
    hideAllStates();

    if (!currentBooking) {
      document.getElementById("noBookingState").style.display = "block";
      return;
    }

    const status = currentBooking.payment_status;

    if (status === "Successful") {
      renderSuccess(currentBooking);
    } else if (status === "Pending") {
      document.getElementById("pendingUtr").textContent = currentBooking.utr_number || "-";
      document.getElementById("pendingState").style.display = "block";
    } else if (status === "Failed" || status === "Rejected") {
      document.getElementById("failedUtr").textContent = currentBooking.utr_number || "-";
      document.getElementById("failedStatus").textContent = status;
      document.getElementById("failedState").style.display = "block";
    } else {
      renderPaymentForm(currentBooking);
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderPaymentForm(booking) {
  document.getElementById("sumName").textContent = booking.name;
  document.getElementById("sumRegNo").textContent = booking.registrationNumber;
  document.getElementById("sumHostelFee").textContent = money(booking.hostel_fee);
  document.getElementById("sumMessFee").textContent = money(booking.mess_fee);
  document.getElementById("sumTotalFee").textContent = money(booking.total_fee);
  document.getElementById("paymentFormState").style.display = "block";
}

function renderSuccess(booking) {
  document.getElementById("okName").textContent = booking.name;
  document.getElementById("okRegNo").textContent = booking.registrationNumber;
  document.getElementById("okBranch").textContent = booking.branch;
  document.getElementById("okHostelFee").textContent = money(booking.hostel_fee);
  document.getElementById("okMessFee").textContent = money(booking.mess_fee);
  document.getElementById("okTotalFee").textContent = money(booking.total_fee);
  document.getElementById("okUtr").textContent = booking.utr_number || "-";
  document.getElementById("okStatus").innerHTML = `<span class="badge badge-success">Successful</span>`;
  document.getElementById("okDate").textContent = booking.payment_date ? new Date(booking.payment_date).toLocaleString() : "-";
  document.getElementById("successState").style.display = "block";
}

loadBookingAndRender();

document.getElementById("refreshStatusBtn")?.addEventListener("click", () => {
  showToast("Checking latest status...", "info", 1500);
  loadBookingAndRender();
});

document.getElementById("retryPaymentBtn")?.addEventListener("click", () => {
  hideAllStates();
  renderPaymentForm(currentBooking);
});

document.getElementById("paymentForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert("paymentAlert");

  const utrNumber = document.getElementById("utrNumber").value.trim();
  if (!/^[A-Za-z0-9]{6,30}$/.test(utrNumber)) {
    showAlert("paymentAlert", "Please enter a valid UTR / transaction number (6-30 alphanumeric characters).", "error");
    return;
  }

  const btn = document.getElementById("paymentSubmitBtn");
  setButtonLoading(btn, true, "Verifying...");
  try {
    await apiFetch("https://hostel-backend-npe4.onrender.com/payment/submit", {
      method: "POST",
      auth: true,
      body: { bookingId: currentBooking.id, utrNumber },
    });
    showToast("Payment submitted for verification.", "success");
    await loadBookingAndRender();
  } catch (err) {
    showAlert("paymentAlert", err.message, "error");
    showToast(err.message, "error");
  } finally {
    setButtonLoading(btn, false);
  }
});

document.getElementById("receipt")?.addEventListener("click", async () => {
  const btn = document.getElementById("receipt");
  setButtonLoading(btn, true, "Preparing PDF...");
  try {
    await downloadProtectedFile(
      `/receipt/${currentBooking.id}`,
      `Receipt-${currentBooking.registrationNumber}.pdf`,
      { auth: true }
    );
    showToast("Receipt downloaded.", "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setButtonLoading(btn, false);
  }
});
