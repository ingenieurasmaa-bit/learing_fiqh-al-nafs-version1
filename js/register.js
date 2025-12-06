import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCaLpgJK1OThxsALWNDWh4krYYW5FZYi1s",
  authDomain: "fiqhnafs-learning.firebaseapp.com",
  projectId: "fiqhnafs-learning",
  storageBucket: "fiqhnafs-learning.firebasestorage.app",
  messagingSenderId: "1021050033673",
  appId: "1:1021050033673:web:803a50b09e683ea4028ad8",
  measurementId: "G-QMEJ2HVLR6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const name = document.getElementById("name");
  const lesson = document.getElementById("lessonTitle");
  const role = document.querySelector("select");
  const date = document.getElementById("regDate");
  const groupInput = document.getElementById("groupInput"); // الحقل المضاف في HTML
  const btn = document.querySelector(".btn-blue");
  const adminCodeContainer = document.getElementById("adminCodeContainer");
  const adminCode = document.getElementById("adminCode");

  role.addEventListener("change", () => {
    if (role.value === "admin") {
      adminCodeContainer.style.display = "block";
    } else {
      adminCodeContainer.style.display = "none";
      adminCode.value = "";
    }
  });

  date.value = new Date().toLocaleDateString("ar-EG");

  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!name.value.trim() || !lesson.value.trim() || !date.value.trim() || !groupInput.value.trim()) {
      alert("يرجى تعبئة جميع الحقول");
      return;
    }

    const SECRET_CODE = "12345";
    if (role.value === "admin" && adminCode.value !== SECRET_CODE) {
      alert("كود المشرفة غير صحيح");
      return;
    }

    try {
      // ✅ تحقق من الاسم قبل التسجيل
      const snapshot = await getDocs(collection(db, "users"));
      const exists = snapshot.docs.some(
        (doc) => doc.data().name.trim() === name.value.trim()
      );

      if (exists) {
        alert("هذا الاسم مسجّل من قبل. يرجى اختيار اسم آخر أو تسجيل الدخول.");
        return;
      }

      // إذا لم يوجد المستخدم من قبل ➜ أضف الجديد
      const docRef = await addDoc(collection(db, "users"), {
        name: name.value.trim(),
        group: groupInput.value.trim(), // إضافة المجموعة
        lesson: lesson.value.trim(),
        role: role.value,
        date: date.value.trim(),
        points: 0, // نقاط ابتدائية
        highestLesson: lesson.value.trim(), // مجلس ابتدائي
        currentLesson: 1, // درس حالي ابتدائي
        prepared: false, // لم يكمل التكاليف بعد
        createdAt: new Date().toISOString(),
      });

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: docRef.id,
          name: name.value.trim(),
          role: role.value,
          lesson: lesson.value.trim(),
          group: groupInput.value.trim(), // حفظ المجموعة في localStorage
        })
      );

      window.location.href = "home.html";
    } catch (err) {
      alert("حدث خطأ أثناء التسجيل: " + err.message);
      console.error(err);
    }
  });
});