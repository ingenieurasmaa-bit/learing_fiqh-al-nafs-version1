// home.js
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const title = document.getElementById("homeTitle");
  const subtitle = document.getElementById("homeSubtitle");
  const adminBtn = document.querySelector(".btn-white");
  

  if (!user) {
    // إذا لم يكن هناك مستخدم، العودة للتسجيل
    window.location.href = "register.html";
    return;
  }

  title.textContent = `مرحبًا ${user.name}`;
  subtitle.textContent = `الدور: ${user.role === "admin" ? "مشرفة" : "طالبة"} • الدرس: ${user.lesson}`;

  // إظهار زر "تقدم الطلاب" فقط للمشرفة
 /*  if (user.role === "admin") {
    adminBtn.style.display = "inline-block";
  } */
});





