// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
   getDoc,
      getDocs,
  doc, 
  deleteDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCaLpgJK1OThxsALWNDWh4krYYW5FZYi1s",
  authDomain: "fiqhnafs-learning.firebaseapp.com",
  projectId: "fiqhnafs-learning",
  storageBucket: "fiqhnafs-learning.firebasestorage.app",
  messagingSenderId: "1021050033673",
  appId: "1:1021050033673:web:803a50b09e683ea4028ad8",
  measurementId: "G-QMEJ2HVLR6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector("#adminTable tbody");

  async function loadUsers() {
    tableBody.innerHTML = "<tr><td colspan='11' style='text-align:center;color:#aaa'>جاري التحميل...</td></tr>";

    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      tableBody.innerHTML = "";

      if (querySnapshot.empty) {
        tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:#999">لا توجد بيانات بعد</td></tr>`;
        return;
      }

      querySnapshot.forEach((docSnap) => {
        const user = docSnap.data();
        const id = docSnap.id;
        const row = document.createElement("tr");

        // 🔥 عرض بيانات الدرس المكتمل والتكليف
        row.innerHTML = `
          <td>${user.name || "-"}</td>
          <td class="center">${user.group || "—"}</td>
          
          <!-- 🔥 معلومات التكليف -->
          <td class="center">
            ${user.lastPreparedLesson ? 
              `<div class="lesson-info">
                <span class="lesson-number">#${user.lastPreparedLesson}</span>
                <div class="lesson-title">${user.lastPreparedTitle || "بدون عنوان"}</div>
                ${user.lastPreparedDate ? `<div class="lesson-date">${formatDate(user.lastPreparedDate)}</div>` : ""}
              </div>` : 
              "—"}
          </td>
          <td class="center">${user.prepared ? "✅ نعم" : "❌ لا"}</td>
          <td class="center">${user.preparedLessons || 0}</td>
          
          <!-- 🔥 معلومات الدرس المكتمل -->
          <td class="center">
            ${user.lastWatchedLesson ? 
              `<div class="lesson-info">
                <span class="lesson-number">#${user.lastWatchedLesson}</span>
                <div class="lesson-title">${user.lastWatchedTitle || user.completedLessonTitle || "بدون عنوان"}</div>
                ${user.lastVisit ? `<div class="lesson-date">${formatDate(user.lastVisit)}</div>` : ""}
              </div>` : 
              "—"}
          </td>
          <td class="center">${user.completeLesson ? "✅ نعم" : "❌ لا"}</td>
          <td class="center">${user.highestLesson || user.currentLesson || "—"}</td>
          <td class="center">${user.points || 0}</td>
          <td class="center">${user.role === "admin" ? "مشرفة" : "طالبة"}</td>
          <td class="center actions">
            <button class="details-btn" data-id="${id}" title="عرض التفاصيل">🔍</button>
            <button class="edit-btn" data-id="${id}" title="تعديل">✏️</button>
            <button class="delete-btn" data-id="${id}" title="حذف">🗑️</button>
          </td>
        `;

        tableBody.appendChild(row);
      });

      attachDeleteEvents();
      attachEditEvents();
      attachDetailsEvents();
      
    } catch (err) {
      console.error("Firebase error:", err);
      tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:red">حدث خطأ أثناء تحميل البيانات</td></tr>`;
    }
  }

  // 🔥 دالة لعرض التفاصيل الكاملة
  function attachDetailsEvents() {
    document.querySelectorAll(".details-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const user = docSnap.data();
          showUserDetails(user);
        }
      });
    });
  }

  // 🔥 عرض تفاصيل المستخدم في نافذة منبثقة
  function showUserDetails(user) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content">
        <h2>تفاصيل الطالبة: ${user.name}</h2>
        
        <div class="details-grid">
          <!-- معلومات عامة -->
          <div class="details-section">
            <h3>📊 المعلومات العامة</h3>
            <p><strong>المجموعة:</strong> ${user.group || "—"}</p>
            <p><strong>الدور:</strong> ${user.role === "admin" ? "مشرفة" : "طالبة"}</p>
            <p><strong>النقاط:</strong> ${user.points || 0}</p>
            <p><strong>آخر زيارة:</strong> ${user.lastVisit ? formatDateTime(user.lastVisit) : "—"}</p>
          </div>
          
          <!-- معلومات الدرس المكتمل -->
          <div class="details-section">
            <h3>🎬 آخر درس مكتمل</h3>
            ${user.lastWatchedLesson ? `
              <p><strong>رقم الدرس:</strong> ${user.lastWatchedLesson}</p>
              <p><strong>عنوان الدرس:</strong> ${user.lastWatchedTitle || user.completedLessonTitle || "—"}</p>
              <p><strong>تاريخ الإكمال:</strong> ${user.lastVisit ? formatDateTime(user.lastVisit) : "—"}</p>
              <p><strong>تم الإكمال:</strong> ${user.completeLesson ? "✅ نعم" : "❌ لا"}</p>
              <p><strong>أعلى درس وصل إليه:</strong> ${user.highestLesson || "—"}</p>
            ` : `<p class="no-data">لم يكمل أي درس بعد</p>`}
          </div>
          
          <!-- معلومات التكليف -->
          <div class="details-section">
            <h3>📝 آخر تكليف</h3>
            ${user.lastPreparedLesson ? `
              <p><strong>رقم الدرس المكلف:</strong> ${user.lastPreparedLesson}</p>
              <p><strong>عنوان الدرس:</strong> ${user.lastPreparedTitle || "—"}</p>
              <p><strong>تاريخ التكليف:</strong> ${user.lastPreparedDate ? formatDateTime(user.lastPreparedDate) : "—"}</p>
              <p><strong>عدد التكاليف المنجزة:</strong> ${user.preparedLessons || 0}</p>
              <p><strong>الحالة:</strong> ${user.prepared ? "✅ مكلف" : "❌ غير مكلف"}</p>
            ` : `<p class="no-data">لم يسجل تكليف بعد</p>`}
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn close-btn">إغلاق</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    

    
    // إغلاق النافذة
    modal.querySelector(".close-btn").onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  // دالة تنسيق التاريخ
  function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
  }

  function formatDateTime(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  function attachDeleteEvents() {
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("هل أنت متأكدة أنك تريدين حذف هذا المستخدم؟")) return;
        await deleteDoc(doc(db, "users", id));
        alert("تم الحذف ✅");
        loadUsers();
      });
    });
  }

function attachEditEvents() {
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      
      // الحصول على بيانات المستخدم الحالية من Firebase مباشرة
      try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (!userDoc.exists()) {
          alert("المستخدم غير موجود!");
          return;
        }
        
        const user = userDoc.data();
        
        // استخدام قيم افتراضية إذا كانت القيمة غير موجودة
        const currentName = user.name || "";
        const currentGroup = user.group || "";
        const currentPoints = user.points || 0;
        const currentRole = user.role || "student";
        const currentHighestLesson = user.highestLesson || "";
        const currentPrepared = user.prepared || false;
        const currentPreparedLessons = user.preparedLessons || 0;
        const currentCompleteLesson = user.completeLesson || false;
        
        // إنشاء واجهة تعديل أفضل (بدلاً من prompts متعددة)
        const editForm = `
          <div class="edit-modal">
            <h3>تعديل بيانات الطالبة</h3>
            <div class="form-group">
              <label>الاسم:</label>
              <input type="text" id="edit-name" value="${currentName}" />
            </div>
            <div class="form-group">
              <label>المجموعة:</label>
              <input type="text" id="edit-group" value="${currentGroup}" />
            </div>
            <div class="form-group">
              <label>الدور:</label>
              <select id="edit-role">
                <option value="student" ${currentRole === "student" ? "selected" : ""}>طالبة</option>
                <option value="admin" ${currentRole === "admin" ? "selected" : ""}>مشرفة</option>
              </select>
            </div>
            <div class="form-group">
              <label>النقاط:</label>
              <input type="number" id="edit-points" value="${currentPoints}" />
            </div>
            <div class="form-group">
              <label>أعلى مجلس:</label>
              <input type="text" id="edit-highest" value="${currentHighestLesson}" />
            </div>
            <div class="form-group">
              <label>التكليف:</label>
              <select id="edit-prepared">
                <option value="true" ${currentPrepared ? "selected" : ""}>مكلفة</option>
                <option value="false" ${!currentPrepared ? "selected" : ""}>غير مكلفة</option>
              </select>
            </div>
            <div class="form-group">
              <label>عدد التكاليف:</label>
              <input type="number" id="edit-prepared-count" value="${currentPreparedLessons}" />
            </div>
            <div class="form-group">
              <label>اكتمل الدرس:</label>
              <select id="edit-completed">
                <option value="true" ${currentCompleteLesson ? "selected" : ""}>نعم</option>
                <option value="false" ${!currentCompleteLesson ? "selected" : ""}>لا</option>
              </select>
            </div>
            <div class="modal-buttons">
              <button id="save-edit" class="btn btn-primary">حفظ</button>
              <button id="cancel-edit" class="btn btn-secondary">إلغاء</button>
            </div>
          </div>
        `;
        
        // عرض نموذج التعديل
        const modal = document.createElement("div");
        modal.className = "modal";
        modal.innerHTML = editForm;
        document.body.appendChild(modal);
        
        // أحداث الأزرار
        document.getElementById("cancel-edit").onclick = () => modal.remove();
        document.getElementById("save-edit").onclick = async () => {
          try {
            const updates = {
              name: document.getElementById("edit-name").value.trim(),
              group: document.getElementById("edit-group").value.trim(),
              role: document.getElementById("edit-role").value,
              points: parseInt(document.getElementById("edit-points").value) || 0,
              highestLesson: document.getElementById("edit-highest").value.trim(),
              prepared: document.getElementById("edit-prepared").value === "true",
              preparedLessons: parseInt(document.getElementById("edit-prepared-count").value) || 0,
              completeLesson: document.getElementById("edit-completed").value === "true",
              lastVisit: new Date().toISOString()
            };
            
            await updateDoc(doc(db, "users", id), updates);
            alert("✅ تم التحديث بنجاح");
            modal.remove();
            loadUsers(); // إعادة تحميل البيانات
          } catch (error) {
            console.error("خطأ في التحديث:", error);
            alert("❌ حدث خطأ أثناء الحفظ");
          }
        };
        
        // إغلاق النافذة عند النقر خارجها
        modal.onclick = (e) => {
          if (e.target === modal) modal.remove();
        };
        
      } catch (error) {
        console.error("خطأ في تحميل بيانات المستخدم:", error);
        alert("❌ تعذر تحميل بيانات المستخدم");
      }
    });
  });
}
  
  // تحميل المستخدمين عند الفتح
  loadUsers();
});






