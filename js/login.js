import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
  const loginBtn = document.getElementById("loginBtn");
  const loginName = document.getElementById("loginName");

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!loginName.value.trim()) {
      alert("يرجى إدخال الاسم");
      return;
    }

    // البحث عن المستخدم في Firebase حسب الاسم
    const snapshot = await getDocs(collection(db, "users"));
    let foundUser = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name.trim() === loginName.value.trim()) {
        foundUser = { id: doc.id, ...data };
      }
    });

    if (!foundUser) {
      alert("الاسم غير موجود في السجلات");
      return;
    }

    // حفظ المستخدم الحالي في localStorage
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: foundUser.id,
        name: foundUser.name,
        role: foundUser.role,
        lesson: foundUser.lesson,
      })
    );

    // الانتقال إلى الصفحة الرئيسية
    window.location.href = "home.html";
  });
});
