document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");

  // فحص إن كان المستخدم مسجل مسبقًا
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (user) {
    startBtn.style.display = "inline-block";
  }

  startBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // فتح صفحة الدخول بالاسم فقط
    window.location.href = "./html/login.html";
  });
});
