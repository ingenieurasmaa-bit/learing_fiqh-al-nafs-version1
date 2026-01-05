// ===== استيراد الإعدادات =====
import { FIREBASE_CONFIG } from '../config/config.js';

// استيراد دالة عرض تفاصيل الطالبة من الملف الخارجي
import { showStudentDetails as showUserDetails } from '../student-details/student-details.js';

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

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// ===== كود تبديل الوضع =====
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';

document.body.setAttribute('data-theme', currentTheme);
updateToggleButton(currentTheme);

themeToggle.addEventListener('click', function() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleButton(newTheme);
});

function updateToggleButton(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===== تحميل المستخدمين =====
async function loadUsers() {
    const tableBody = document.getElementById('tableBody');

    tableBody.innerHTML = `
        <tr>
            <td colspan="11" class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                جاري تحميل البيانات...
            </td>
        </tr>
    `;

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        tableBody.innerHTML = "";

        if (querySnapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="empty-message">
                        <i class="fas fa-users-slash"></i>
                        <h3>لا توجد بيانات بعد</h3>
                        <p>سيظهر الجدول هنا عند تسجيل الطالبات</p>
                    </td>
                </tr>
            `;
            updateStats(0, 0, 0, 0);
            return;
        }

        // ===== إحصائيات عامة =====
        let totalStudents = 0;
        let completedLessonsTotal = 0;
        let totalAssignments = 0;
        let totalPoints = 0;

        querySnapshot.forEach((docSnap, index) => {
            const user = docSnap.data();
            const id = docSnap.id;

            totalStudents++;

            // ===== الدروس المكتملة =====
            const completedLessonsCount = Array.isArray(user.completedLessons)
                ? user.completedLessons.length
                : 0;
            completedLessonsTotal += completedLessonsCount;

            // ===== التكاليف (من جميع المصادر) =====
            let preparedCount = 0;
            let allAssignments = [];
            
            // جمع التكاليف من جميع المصادر
            if (Array.isArray(user.preparedLessons)) {
                preparedCount += user.preparedLessons.length;
                allAssignments = [...allAssignments, ...user.preparedLessons];
            }
            if (Array.isArray(user.preparedLessonsHistory)) {
                preparedCount += user.preparedLessonsHistory.length;
                allAssignments = [...allAssignments, ...user.preparedLessonsHistory];
            }
            if (Array.isArray(user.preparedLessonsList)) {
                preparedCount += user.preparedLessonsList.length;
                allAssignments = [...allAssignments, ...user.preparedLessonsList];
            }
            if (Array.isArray(user.preparedAssignments)) {
                preparedCount += user.preparedAssignments.length;
                allAssignments = [...allAssignments, ...user.preparedAssignments];
            }
            
            totalAssignments += preparedCount;

            // ===== آخر تكليف =====
            let lastPrepared = null;
            if (allAssignments.length > 0) {
                // ترتيب التكاليف حسب التاريخ
                allAssignments.sort((a, b) => {
                    const dateA = new Date(a.preparedAt || a.date || a.createdAt || a.timestamp || new Date());
                    const dateB = new Date(b.preparedAt || b.date || b.createdAt || b.timestamp || new Date());
                    return dateB - dateA; // الأحدث أولاً
                });
                lastPrepared = allAssignments[0];
            }

            const isPrepared = preparedCount > 0;

            totalPoints += user.points || 0;

            const row = document.createElement("tr");
            row.className = "table-row";
            row.style.animationDelay = `${index * 0.05}s`;

            row.innerHTML = `
                <td class="student-name">${user.name || "—"}</td>
                <td class="center">${user.group || "—"}</td>

                <!-- آخر تكليف -->
                <td class="center">
                    ${lastPrepared ? `
                        <div class="lesson-info">
                            <span class="lesson-number">#${lastPrepared.lessonNumber || (allAssignments.indexOf(lastPrepared) + 1)}</span>
                            <div class="lesson-title">${lastPrepared.lessonTitle || lastPrepared.title || "بدون عنوان"}</div>
                            ${lastPrepared.preparedAt ? `<div class="lesson-date">${formatDate(lastPrepared.preparedAt)}</div>` : ""}
                        </div>
                    ` : "—"}
                </td>

                <!-- حالة التكليف -->
                <td class="center">
                    <span class="status-badge ${isPrepared ? 'status-success' : 'status-danger'}">
                        ${isPrepared ? "✅ مكلفة" : "❌ غير مكلفة"}
                    </span>
                </td>

                <!-- عدد التكاليف -->
                <td class="center">
                    <span class="status-badge status-warning">
                        ${preparedCount}
                    </span>
                </td>

                <!-- آخر درس مكتمل -->
                <td class="center">
                    ${user.lastCompletedLesson ? `
                        <div class="lesson-info">
                            <span class="lesson-number">#${user.lastCompletedLesson}</span>
                            <div class="lesson-title">${user.lastCompletedTitle || "بدون عنوان"}</div>
                            ${user.lastCompletedDate ? `<div class="lesson-date">${formatDate(user.lastCompletedDate)}</div>` : ""}
                        </div>
                    ` : "—"}
                </td>

                <!-- حالة الدراسة -->
                <td class="center">
                    <span class="status-badge ${completedLessonsCount > 0 ? 'status-success' : 'status-danger'}">
                        ${completedLessonsCount > 0 ? "✅ نشطة" : "❌ غير نشطة"}
                    </span>
                </td>

                <!-- عدد الدروس المكتملة -->
                <td class="center">${completedLessonsCount}</td>

                <!-- النقاط -->
                <td class="center">
                    <span class="points-badge">${user.points || 0}</span>
                </td>

                <!-- الدور -->
                <td class="center">
                    <span class="status-badge ${user.role === 'admin' ? 'status-success' : 'status-warning'}">
                        ${user.role === "admin" ? "مشرفة" : "طالبة"}
                    </span>
                </td>

                <!-- الإجراءات -->
                <td class="center">
                    <div class="actions-container">
                        <button class="action-btn details-btn" data-id="${id}" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" data-id="${id}" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${id}" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        updateStats(
            totalStudents,
            completedLessonsTotal,
            totalAssignments,
            totalPoints
        );

        attachEvents();

    } catch (error) {
        console.error("Firebase error:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3 style="color: var(--accent);">حدث خطأ أثناء تحميل البيانات</h3>
                    <p>يرجى المحاولة مرة أخرى</p>
                </td>
            </tr>
        `;
    }
}

// ===== تحديث الإحصائيات =====
function updateStats(totalStudents, completedTasks, totalTasks, totalPoints) {
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('totalPoints').textContent = totalPoints;
}

// ===== دالة تنسيق التاريخ =====
function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

// ===== إرفاق الأحداث =====
function attachEvents() {
    attachDetailsEvents();
    attachEditEvents();
    attachDeleteEvents();
    
    // تأثيرات تفاعلية للأزرار
    document.querySelectorAll('.action-btn, .nav-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// ===== عرض التفاصيل =====
function attachDetailsEvents() {
    document.querySelectorAll(".details-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const docRef = doc(db, "users", id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                // استدعاء الدالة من الملف الخارجي
                showUserDetails(id);
            }
        });
    });
}

// ===== الحذف =====
function attachDeleteEvents() {
    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            
            // تأكيد الحذف
            if (!confirm("هل أنت متأكدة أنك تريدين حذف هذا المستخدم؟")) return;
            
            try {
                await deleteDoc(doc(db, "users", id));
                showAlert("تم حذف الطالبة بنجاح", "success");
                loadUsers();
                localStorage.clear();
            } catch (error) {
                console.error("خطأ في الحذف:", error);
                showAlert("حدث خطأ أثناء الحذف", "error");
            }
        });
    });
}

// ===== التعديل =====
function attachEditEvents() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            
            try {
                const userDoc = await getDoc(doc(db, "users", id));
                if (!userDoc.exists()) {
                    showAlert("المستخدم غير موجود!", "error");
                    return;
                }
                
                const user = userDoc.data();
                
                // ملء النموذج
                document.getElementById('editName').value = user.name || "";
                document.getElementById('editGroup').value = user.group || "";
                document.getElementById('editRole').value = user.role || "student";
                document.getElementById('editPoints').value = user.points || 0;
                document.getElementById('editHighestLesson').value = user.highestLesson || "";
                document.getElementById('editPrepared').value = user.prepared ? "true" : "false";
                document.getElementById('editPreparedLessons').value = user.preparedLessons ? user.preparedLessons.length : 0;
                document.getElementById('editCompleteLesson').value = user.completeLesson ? "true" : "false";
                
                // فتح النافذة
                const modal = document.getElementById('editModal');
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // حفظ ID الحالي
                modal.dataset.currentId = id;
                
            } catch (error) {
                console.error("خطأ في تحميل البيانات:", error);
                showAlert("❌ تعذر تحميل بيانات المستخدم", "error");
            }
        });
    });
}

// ===== إغلاق نافذة التعديل =====
document.getElementById('cancelEdit').addEventListener('click', () => {
    const modal = document.getElementById('editModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
});

// ===== حفظ التعديلات =====
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const modal = document.getElementById('editModal');
    const id = modal.dataset.currentId;
    
    try {
        const updates = {
            name: document.getElementById('editName').value.trim(),
            group: document.getElementById('editGroup').value.trim(),
            role: document.getElementById('editRole').value,
            points: parseInt(document.getElementById('editPoints').value) || 0,
            highestLesson: document.getElementById('editHighestLesson').value.trim(),
            prepared: document.getElementById('editPrepared').value === "true",
            completeLesson: document.getElementById('editCompleteLesson').value === "true",
            lastVisit: new Date().toISOString()
        };
        
        await updateDoc(doc(db, "users", id), updates);
        
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        showAlert("تم تحديث بيانات الطالبة بنجاح", "success");
        loadUsers();
        
    } catch (error) {
        console.error("خطأ في التحديث:", error);
        showAlert("حدث خطأ أثناء الحفظ", "error");
    }
});

// ===== أدوات مساعدة =====
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
    `;
    
    if (type === 'success') {
        alertDiv.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
        alertDiv.style.color = 'white';
    } else if (type === 'error') {
        alertDiv.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        alertDiv.style.color = 'white';
    } else {
        alertDiv.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        alertDiv.style.color = 'white';
    }
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(100px)';
        setTimeout(() => {
            alertDiv.remove();
        }, 300);
    }, 3000);
}

// ===== تحميل الصفحة =====
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    
    // إغلاق نافذة التعديل عند النقر خارجها
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('editModal')) {
            document.getElementById('editModal').classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // إغلاق بالزر Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('editModal').classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});