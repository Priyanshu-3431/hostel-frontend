/* ==========================================================
   GP BARH HOSTEL - Room Booking logic
   ========================================================== */

requireStudentAuth();

document.getElementById("logoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  Auth.logoutStudent();
});

const hostelFeeInput = document.getElementById("hostelFee");
const messFeeInput = document.getElementById("messFee");
const totalFeeInput = document.getElementById("totalFee");

function recalcTotal() {
  const h = parseFloat(hostelFeeInput.value) || 0;
  const m = parseFloat(messFeeInput.value) || 0;
  totalFeeInput.value = `₹ ${(h + m).toLocaleString("en-IN")}`;
}
hostelFeeInput.addEventListener("input", recalcTotal);
messFeeInput.addEventListener("input", recalcTotal);
recalcTotal();

(async () => {
  const user = Auth.getUser();
  if (user) document.getElementById("chipName").textContent = user.name;

  try {
    const data = await apiFetch("/auth/profile", { auth: true });
    document.getElementById("studentName").value = data.profile.name;
    document.getElementById("registrationNumber").value = data.profile.registrationNumber;
    document.getElementById("branch").value = data.profile.branch;

    // Pre-fill fees from an existing booking, if any
    if (data.booking) {
      hostelFeeInput.value = data.booking.hostel_fee;
      messFeeInput.value = data.booking.mess_fee;
      recalcTotal();
    }
  } catch (err) {
    showToast(err.message, "error");
  }
})();

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert("bookingAlert");

  const hostelFee = parseFloat(hostelFeeInput.value);
  const messFee = parseFloat(messFeeInput.value);

  if (isNaN(hostelFee) || isNaN(messFee) || hostelFee < 0 || messFee < 0) {
    showAlert("bookingAlert", "Please enter valid fee amounts.", "error");
    return;
  }

  const btn = document.getElementById("bookingSubmitBtn");
  setButtonLoading(btn, true, "Saving booking...");
  try {
    const data = await apiFetch("/booking", { method: "POST", auth: true, body: { hostelFee, messFee } });
    showToast("Room booking saved. Redirecting to payment...", "success");
    setTimeout(() => (window.location.href = `payment.html?booking=${data.booking.id}`), 900);
  } catch (err) {
    showAlert("bookingAlert", err.message, "error");
    showToast(err.message, "error");
  } finally {
    setButtonLoading(btn, false);
  }
});
