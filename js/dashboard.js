/* ==========================================================
   GP BARH HOSTEL - Student Dashboard logic
   ========================================================== */

requireStudentAuth();

document.getElementById("logoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  Auth.logoutStudent();
});

function badgeFor(status) {
  if (!status) return `<span class="badge badge-info">Not Available</span>`;
  const map = {
    Successful: "badge-success",
    confirmed: "badge-success",
    Pending: "badge-pending",
    pending: "badge-pending",
    Failed: "badge-error",
    Rejected: "badge-error",
    cancelled: "badge-error",
  };
  return `<span class="badge ${map[status] || "badge-info"}">${status}</span>`;
}

function money(v) {
  if (v === undefined || v === null) return "-";
  return `₹ ${Number(v).toLocaleString("en-IN")}`;
}

(async () => {
  const user = Auth.getUser();
  if (user) {
    document.getElementById("chipName").textContent = user.name;
  }

  try {
    const data = await apiFetch("https://hostel-backend-npe4.onrender.com/auth/profile", { auth: true });
    console.log(data)
    const profile = data.profile;
    console.log(profile)
    document.getElementById("infoName").textContent = profile.name;
    document.getElementById("infoRegNo").textContent = profile.registrationNumber;
    document.getElementById("infoBranch").textContent = profile.branch;
    document.getElementById("infoEmail").textContent = profile.email;
    document.getElementById("infoMobile").textContent = profile.mobile;
    document.getElementById("chipName").textContent = profile.name;

    const bookingData = await apiFetch("https://hostel-backend-npe4.onrender.com/booking/my", { auth: true });
    const booking = bookingData.booking;

    const actionWrap = document.getElementById("bookingActionWrap");

    if (!booking) {
      document.getElementById("statBooking").textContent = "Not Booked";
      document.getElementById("statPayment").textContent = "-";
      document.getElementById("statTotalFee").textContent = "-";
      document.getElementById("infoBookingStatus").innerHTML = badgeFor(null);
      document.getElementById("infoPaymentStatus").innerHTML = badgeFor(null);
      document.getElementById("infoHostelFee").textContent = "-";
      document.getElementById("infoMessFee").textContent = "-";
      document.getElementById("infoTotalFee").textContent = "-";
      actionWrap.innerHTML = `<a href="roombook.html" class="btn btn-primary">Book Your Room</a>`;
    } else {
      document.getElementById("statBooking").textContent = booking.booking_status;
      document.getElementById("statPayment").textContent = booking.payment_status || "Not Paid";
      document.getElementById("statTotalFee").textContent = money(booking.total_fee);

      document.getElementById("infoBookingStatus").innerHTML = badgeFor(booking.booking_status);
      document.getElementById("infoPaymentStatus").innerHTML = badgeFor(booking.payment_status);
      document.getElementById("infoHostelFee").textContent = money(booking.hostel_fee);
      document.getElementById("infoMessFee").textContent = money(booking.mess_fee);
      document.getElementById("infoTotalFee").textContent = money(booking.total_fee);

      if (booking.payment_status === "Successful") {
        actionWrap.innerHTML = `<a href="payment.html" class="btn btn-success">View Receipt</a>`;
      } else if (booking.payment_status === "Pending") {
        actionWrap.innerHTML = `<a href="payment.html" class="btn btn-primary">Check Payment Status</a>`;
      } else {
        actionWrap.innerHTML = `<a href="payment.html" class="btn btn-primary">Proceed to Payment</a>`;
      }
    }
  } catch (err) {
    showToast(err.message, "error");
  }
})();
