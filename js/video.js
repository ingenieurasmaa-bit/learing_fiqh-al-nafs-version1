// ===== إعداد Firebase =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  arrayUnion 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// ===== إعداد YouTube =====
const API_KEY = "AIzaSyB9QAWNfNnzNoVbyVtMqnVZT9hGt17EhzQ";
const PLAYLIST_ID = "PLvGpI5t1gJ8RPD1JEMzntUvjyALlqaJo8";
const UNITS = [
  { id: "unit1", name: "الوحدة الأولى: تعريف فقه النفس", start: 0, end: 5 },
  { id: "unit2", name: "الوحدة الثانية: أقرأ", start: 6, end: 26 },
  { id: "unit3", name: "الوحدة الثالثة: ونفس", start: 27, end: 126 },
  { id: "unit4", name: "الوحدة الرابعة: لتعارفوا", start: 127, end: 140 },
  { id: "unit5", name: "الاختبار النهائي", type: "quiz" }
];

// ===== المتغيرات العامة =====
let lessons = [];
let currentIndex = 0;
let QUIZZES = {};
let isLoadingLessons = false;
let lessonsLoaded = false;

// ===== عناصر DOM =====
const sidebar = document.getElementById("sidebar");
const player = document.getElementById("player");
const lessonTitleEl = document.getElementById("lesson-title");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const completeBtn = document.getElementById("complete-btn");

// ===== التحقق من المستخدم =====
function checkUser() {
  const savedUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!savedUser || !savedUser.id) {
    alert("يرجى تسجيل الدخول أولاً.");
    window.location.href = "login.html";
    return false;
  }
  return savedUser;
}

// ===== التحقق من صلاحية المستخدم =====
function checkUserRole() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  
  if (!user) {
    window.location.href = "register.html";
    return;
  }

  // تحديث معلومات المستخدم في الشريط العلوي
  const welcomeName = document.getElementById("welcomeName");
  const welcomeDetail = document.getElementById("welcomeDetail");
  const adminBtn = document.querySelector('.btn-white');

  if (welcomeName) {
    welcomeName.textContent = user.name;
  }

  if (welcomeDetail) {
    welcomeDetail.textContent = `الدور: ${user.role === "admin" ? "مشرفة" : "طالبة"}`;
  }

  // إظهار زر "تقدم الطالبات" فقط للمشرفة
  if (adminBtn) {
    if (user.role === "admin") {
      adminBtn.style.display = "inline-block";
    } else if(user.role === 'student') {
      adminBtn.style.display = "none";
    }
  }
}

// ===== تحميل الأسئلة =====
async function loadQuizzes() {
  try {
    const res = await fetch("/html/quizzes.json");
    QUIZZES = await res.json();
    console.log("✅ تم تحميل الأسئلة");
  } catch (error) {
    console.error("❌ خطأ في تحميل الأسئلة:", error);
    QUIZZES = {};
  }
}

// ===== جلب قائمة التشغيل =====
async function fetchPlaylist() {
  try {
    console.log("⏳ جاري تحميل قائمة الدروس...");
    isLoadingLessons = true;
    
    let nextPageToken = "";
    let allItems = [];

    do {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}&pageToken=${nextPageToken}`
      );
      const data = await res.json();
      if (!data.items) throw new Error("لم يتم جلب الفيديوهات من YouTube.");

      allItems = allItems.concat(data.items);
      nextPageToken = data.nextPageToken || "";
    } while (nextPageToken);

    lessons = allItems.map((it, i) => ({
      index: i,
      title: it.snippet.title || `درس ${i + 1}`,
      videoId: it.snippet.resourceId.videoId
    }));

    lessonsLoaded = true;
    console.log(`✅ تم تحميل ${lessons.length} درس`);
    
    // الآن بعد تحميل الدروس، بناء الشريط الجانبي
    buildSidebar();
    
    // تحميل بيانات المستخدم بعد تحميل الدروس
    await loadUserData();
    
  } catch (err) {
    console.error("❌ خطأ في تحميل الدروس:", err);
    sidebar.innerHTML = `<p style="color:red; padding:20px;">خطأ عند تحميل الفيديوهات: ${err.message}</p>`;
  } finally {
    isLoadingLessons = false;
  }
}

// ===== بناء الشريط الجانبي =====
function buildSidebar() {
  sidebar.innerHTML = "";
  
  // إضافة رسالة تحميل إذا لم يتم تحميل الدروس بعد
  if (!lessonsLoaded) {
    sidebar.innerHTML = `<p style="padding:20px; color:#666;">جاري تحميل الدروس...</p>`;
    return;
  }
  
  UNITS.forEach(unit => {
    const unitDiv = document.createElement("div");
    unitDiv.className = "unit";
    const header = document.createElement("div");
    header.className = "unit-header";
    const quizPassed = localStorage.getItem(`quiz_${unit.id}`) === "true";
    header.textContent = unit.name + (quizPassed ? " ✅" : "");

    const list = document.createElement("ul");
    list.className = "lesson-list";

    for (let i = unit.start; i <= unit.end && i < lessons.length; i++) {
      const li = document.createElement("li");
      li.className = "lesson-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = localStorage.getItem(`lesson_${i}`) === "true";
      checkbox.addEventListener("change", () => {
        localStorage.setItem(`lesson_${i}`, checkbox.checked ? "true" : "false");
      });
      const btn = document.createElement("button");
      btn.textContent = `${i + 1} - ${lessons[i].title}`;
      btn.onclick = () => loadLesson(i);
      li.append(checkbox, btn);
      list.appendChild(li);
    }

    const testBtn = document.createElement("button");
    testBtn.className = "test-btn";
    testBtn.textContent = "📘 اختبار الوحدة";
    testBtn.onclick = () => showQuiz(unit);
    list.appendChild(testBtn);

    header.onclick = () => {
      list.style.display = list.style.display === "block" ? "none" : "block";
    };
    unitDiv.append(header, list);
    sidebar.appendChild(unitDiv);
  });
}

// ===== تحميل بيانات المستخدم =====
async function loadUserData() {
  try {
    const user = checkUser();
    if (!user) return;

    // ⭐ 1) أخذ الدرس الحالي من localStorage
    const storedIndex = parseInt(localStorage.getItem("currentIndex")) || 0;
    currentIndex = Math.max(0, storedIndex);

    console.log("📝 الدرس المحفوظ:", currentIndex);

    // ⭐ 2) تحديث العنوان فقط إذا كانت الدروس محملة
    if (lessonsLoaded && lessons.length > 0) {
      const titleEl = document.getElementById("lesson-title");
      if (titleEl && lessons[currentIndex]) {
        titleEl.textContent = lessons[currentIndex].title;
      }
      
      // ⭐ 3) تحميل الفيديو
      loadLesson(currentIndex);
      
      // ⭐ 4) إظهار نافذة التكليف بعد تحميل الدروس
      showTaskModal(currentIndex);
    } else {
      console.log("⏳ في انتظار تحميل الدروس...");
    }

  } catch (err) {
    console.error("❌ خطأ في تحميل رقم المجلس:", err);
  }
}

// ===== تحميل الدرس =====
function loadLesson(i) {
  if (!lessonsLoaded || !lessons || !lessons[i]) {
    console.error("🚫 لا يمكن تحميل الدرس لأن قائمة الدروس غير جاهزة بعد.");
    return;
  }

  currentIndex = i;
  localStorage.setItem("currentIndex", i);
  player.src = `https://www.youtube.com/embed/${lessons[i].videoId}`;
  lessonTitleEl.textContent = lessons[i].title;
  updateNav();
}

function updateNav() {
  if (!lessonsLoaded) return;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === lessons.length - 1;
}

prevBtn.onclick = () => {
  if (currentIndex > 0) loadLesson(currentIndex - 1);
};

nextBtn.onclick = () => {
  if (lessonsLoaded && currentIndex < lessons.length - 1) {
    loadLesson(currentIndex + 1);
  }
};

// ===== إكمال الدرس =====
completeBtn.onclick = async () => {
  const user = checkUser();
  if (!user) return;

  if (!lessonsLoaded || !lessons[currentIndex]) {
    alert("⏳ يرجى الانتظار حتى يتم تحميل الدرس بشكل كامل.");
    return;
  }

  try {
    const userRef = doc(db, "users", user.id);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) return alert("لم يتم العثور على المستخدم.");

    const userData = snapshot.data();
    const newHighest = Math.max(userData.highestLesson || 0, currentIndex + 1);

    // حساب النقاط الجديدة
    const currentPoints = userData.points || 0;
    let newPoints = currentPoints + 1;

    // معلومات الدرس
    const lessonNumber = currentIndex + 1;
    const lessonTitle = lessons[currentIndex]?.title || `الدرس ${lessonNumber}`;
    
    // 🔥 إنشاء كائن الدرس المكتمل
    const completedLessonInfo = {
      lessonNumber: lessonNumber,
      lessonTitle: lessonTitle,
      completedAt: new Date().toISOString(),
      videoId: lessons[currentIndex]?.videoId || null,
      pointsEarned: 1
    };

    // 🔥 تحديث Firebase
    await updateDoc(userRef, {
      currentLesson: lessonNumber,
      highestLesson: newHighest,
      points: newPoints,
      completeLesson: true,
      lastVisit: new Date().toISOString(),
      watchedLessons: newHighest,
      lastWatchedLesson: lessonNumber,
      lastWatchedTitle: lessonTitle,
      lessonCompleted: true,
      completedLessonNumber: lessonNumber,
      completedLessonTitle: lessonTitle,
      completedLessonInfo: completedLessonInfo,
      completedLessons: arrayUnion(completedLessonInfo)
    });

    // تحديث محلي
    localStorage.setItem(`lesson_${currentIndex}`, "true");
    const currentCheckbox = document.querySelectorAll(".lesson-item input[type='checkbox']")[currentIndex];
    if (currentCheckbox) currentCheckbox.checked = true;

    alert(`✅ تم حفظ تقدمك!\n📊 النقاط: ${newPoints}\n🎬 الدرس: ${lessonNumber} - ${lessonTitle}`);
    
    // تحديث بيانات المستخدم محلياً
    const updatedUser = {
      ...user,
      lastWatchedLesson: lessonNumber,
      completedLessonTitle: lessonTitle,
      points: newPoints
    };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    
  } catch (err) {
    console.error(err);
    alert("حدث خطأ أثناء حفظ التقدم.");
  }
};


// ===== نافذة التكليف =====
async function showTaskModal(lessonIndex) {
  console.log("📢 [1] showTaskModal called for lesson:", lessonIndex);
  
  // تأكد من تحميل الدروس أولاً
  if (!lessonsLoaded) {
    console.log("⏳ [2] Lessons not loaded yet, waiting...");
    setTimeout(() => {
      console.log("⏳ [3] Retrying showTaskModal...");
      showTaskModal(lessonIndex);
    }, 500);
    return;
  }

  console.log("✅ [4] Lessons are loaded, proceeding...");
  
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) {
    console.error("❌ [5] No user found!");
    return;
  }

  console.log("✅ [6] User found:", user.name);

  try {
    const userRef = doc(db, "users", user.id);
    const snap = await getDoc(userRef);
    
    if (!snap.exists()) {
      console.error("❌ [7] User not found in database");
      alert("لم يتم العثور على المستخدم.");
      window.location.href = "register.html";
      return;
    }

    console.log("✅ [8] User found in database");

    const taskKey = `task_shown_for_lesson_${lessonIndex}`;
    console.log("🔑 [9] Task key:", taskKey);

    // إذا ظهرت النافذة لهذا الدرس → لا نظهرها
    if (localStorage.getItem(taskKey) === "true") {
      console.log("🚫 [10] Modal already shown for this lesson, skipping...");
      return;
    }

    console.log("✅ [11] Showing modal for the first time");

    // تسجيل أنها ظهرت
    localStorage.setItem(taskKey, "true");
    console.log("✅ [12] Saved taskKey in localStorage");

    // إنشاء النافذة
    const modal = document.createElement("div");
    modal.className = "task-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <h2>📘 هل قمتِ بتكليف الدرس السابق؟</h2>
        <div class="actions">
          <button id="yesBtn" class="btn-green">نعم</button>
          <button id="newBtn" class="btn-gray">ليس بعد</button>
        </div>
      </div>`;
    
    document.body.appendChild(modal);
    console.log("✅ [13] Modal created and added to body");

    // تنسيقات النافذة
    const style = document.createElement("style");
    style.textContent = `
      .task-modal {
        position: fixed; 
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex; 
        justify-content: center; 
        align-items: center;
        z-index: 2000;
      }
      .task-modal .modal-content {
        background: #fff;
        padding: 30px 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 450px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }
      .task-modal h2 {
        color: #333;
        margin-bottom: 25px;
        font-size: 20px;
      }
      .task-modal .actions {
        display: flex;
        justify-content: center;
        gap: 20px;
      }
      .task-modal .actions button {
        padding: 12px 30px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s ease;
        min-width: 120px;
      }
      .btn-green { 
        background: #27ae60; 
        color: white; 
      }
      .btn-green:hover { 
        background: #219653; 
        transform: translateY(-2px); 
      }
      .btn-gray { 
        background: #95a5a6; 
        color: white; 
      }
      .btn-gray:hover { 
        background: #7f8c8d; 
        transform: translateY(-2px); 
      }
    `;
    
    document.head.appendChild(style);
    console.log("✅ [14] Styles added to head");

    // زر نعم
    modal.querySelector("#yesBtn").onclick = async () => {
      console.log("✅ [15] Yes button clicked");
 try {
        // تشغيل الفقاعات
        if (typeof confetti === "function") {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        }

        const userRef = doc(db, "users", user.id);
        const snap = await getDoc(userRef);
        const userData = snap.data();

        // 🔥 احصل على رقم الدرس للتكليف
        const lastWatched = userData.lastWatchedLesson || userData.highestLesson || 1;
        const lessonToPrepare = Math.max(1, lastWatched); // تأكد من أن الرقم موجب
        
        // 🔥 احصل على عنوان الدرس
        let lessonTitle = `الدرس ${lessonToPrepare}`;
        if (lessons && lessons.length > 0) {
          // التأكد من أن الفهرس ضمن النطاق
          const lessonIndex = lessonToPrepare - 1;
          if (lessonIndex >= 0 && lessonIndex < lessons.length) {
            lessonTitle = lessons[lessonIndex]?.title || lessonTitle;
          }
        }

        const oldPoints = userData.points || 0;
        const newPoints = oldPoints + 1;

        // 🔥 إنشاء كائن التكليف
        const preparedLessonInfo = {
          lessonNumber: lessonToPrepare,
          lessonTitle: lessonTitle,
          preparedAt: new Date().toISOString(),
          pointsEarned: 1
        };

        // 🔥 تحديث Firebase
        await updateDoc(userRef, {
          prepared: true,
          points: newPoints,
          lastPreparedLesson: lessonToPrepare,
          lastPreparedTitle: lessonTitle,
          lastPreparedDate: new Date().toISOString(),
          preparedLessons: (userData.preparedLessons || 0) + 1,
          preparedLessonsHistory: arrayUnion(preparedLessonInfo)
        });

        // تحديث بيانات المستخدم محلياً
        const updatedUser = {
          ...user,
          lastPreparedLesson: lessonToPrepare,
          lastPreparedTitle: lessonTitle,
          prepared: true,
          points: newPoints
        };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        // إخفاء النافذة مع رسالة تأكيد
        modal.remove();
        style.remove();
        
        setTimeout(() => {
          alert(`✅ تم تسجيل تكليفك!\n📝 الدرس المكلف: ${lessonToPrepare} - ${lessonTitle}\n⭐ النقاط الجديدة: ${newPoints}`);
        }, 500);

      } catch (error) {
        console.error("❌ خطأ في تسجيل التكليف:", error);
        modal.remove();
        style.remove();
        alert("حدث خطأ أثناء تسجيل التكاليف. يرجى المحاولة مرة أخرى.");
      }
    };


    // زر ليس بعد
    modal.querySelector("#newBtn").onclick = () => {
      console.log("✅ [16] Not yet button clicked");
      modal.remove();
      style.remove();
    };

    // إغلاق النافذة عند النقر خارجها
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        console.log("✅ [17] Clicked outside modal");
        modal.remove();
        style.remove();
      }
    });

    console.log("🎉 [18] Modal setup complete, should be visible now!");

  } catch (error) {
    console.error("❌ [ERROR] Error in showTaskModal:", error);
  }
}

// ===== عرض الاختبار =====
function showQuiz(unit) {
  const quiz = QUIZZES[unit.id];
  if (!quiz) return alert("لا يوجد اختبار لهذه الوحدة.");
  
  const modal = document.createElement("div");
  modal.className = "quiz-modal";
  modal.innerHTML = `
    <div class="modalBox">
      <h2>اختبار ${unit.name}</h2>
      <div id="quizContent"></div>
      <div class="modal-actions">
        <button class="btn" id="quizSubmitBtn">إنهاء الاختبار</button>
        <button class="btn secondary" id="quizCancelBtn">إلغاء</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const quizContent = modal.querySelector("#quizContent");
  quiz.forEach((q, qi) => {
    const div = document.createElement("div");
    div.className = "quiz-question";
    div.innerHTML = `<p><strong>${qi + 1}. ${q.q}</strong></p>`;
    q.options.forEach((opt, oi) => {
      div.innerHTML += `<label><input type="radio" name="q${qi}" value="${oi}"> ${opt}</label><br>`;
    });
    quizContent.appendChild(div);
  });

  modal.querySelector("#quizSubmitBtn").onclick = () => checkQuiz(unit, quiz, modal);
  modal.querySelector("#quizCancelBtn").onclick = () => modal.remove();
}

function checkQuiz(unit, quiz, modalEl) {
  let correct = 0;
  const results = [];
  
  for (let i = 0; i < quiz.length; i++) {
    const sel = modalEl.querySelector(`input[name="q${i}"]:checked`);
    const userAnswer = sel ? Number(sel.value) : null;
    const isCorrect = userAnswer === quiz[i].a;
    
    if (isCorrect) correct++;
    
    results.push({
      question: quiz[i].q,
      userAnswer: userAnswer !== null ? quiz[i].options[userAnswer] : "لم يتم الإجابة",
      correctAnswer: quiz[i].options[quiz[i].a],
      isCorrect: isCorrect
    });
  }

  showQuizResults(unit, quiz, modalEl, correct, results);
}

function showQuizResults(unit, quiz, modalEl, correct, results) {
  const quizContent = modalEl.querySelector("#quizContent");
  const modalActions = modalEl.querySelector(".modal-actions");
  
  modalActions.style.display = "none";
  
  const resultDiv = document.createElement("div");
  resultDiv.className = "quiz-results";
  resultDiv.innerHTML = `<h3>نتيجتك: ${correct} / ${quiz.length}</h3>`;
  
  results.forEach((result, i) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = `question-result ${result.isCorrect ? 'correct' : 'incorrect'}`;
    
    questionDiv.innerHTML = `
      <p><strong>س ${i + 1}: ${result.question}</strong></p>
      <p class="user-answer">إجابتك: ${result.userAnswer} ${result.isCorrect ? '✅' : '❌'}</p>
    `;
    
    if (!result.isCorrect) {
      questionDiv.innerHTML += `<p class="correct-answer">الإجابة الصحيحة: ${result.correctAnswer} ✅</p>`;
    }
    
    questionDiv.innerHTML += `<hr>`;
    resultDiv.appendChild(questionDiv);
  });

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "results-actions";
  
  if (correct === quiz.length) {
    actionsDiv.innerHTML = `<button class="btn btn-success" id="quizPassBtn">🎉 احتفظ بالنتيجة</button>`;
    
    quizContent.appendChild(resultDiv);
    quizContent.appendChild(actionsDiv);
    
    modalEl.querySelector("#quizPassBtn").onclick = () => {
      localStorage.setItem(`quiz_${unit.id}`, "true");
      alert(`🎉 نجحت في اختبار ${unit.name}`);
      buildSidebar();
      modalEl.remove();
    };
    
  } else {
    actionsDiv.innerHTML = `
      <button class="btn" id="retryQuizBtn">إعادة المحاولة</button>
      <button class="btn secondary" id="closeQuizBtn">إغلاق</button>
    `;
    
    quizContent.appendChild(resultDiv);
    quizContent.appendChild(actionsDiv);
    
    modalEl.querySelector("#retryQuizBtn").onclick = () => {
      modalEl.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
      });
      resultDiv.remove();
      actionsDiv.remove();
      modalActions.style.display = "flex";
    };
    
    modalEl.querySelector("#closeQuizBtn").onclick = () => {
      modalEl.remove();
    };
  }
}

// ===== تشغيل التطبيق =====
(async () => {
  console.log("🚀 بدء تشغيل التطبيق...");
  
  // 1. التحقق من المستخدم
  const user = checkUser();
  if (!user) return;
  
  // 2. التحقق من الدور
  checkUserRole();
  
  // 3. تحميل الأسئلة
  await loadQuizzes();
  
  // 4. تحميل قائمة الدروس
  await fetchPlaylist();
  
  console.log("✅ تم تحميل التطبيق بنجاح");
})();
