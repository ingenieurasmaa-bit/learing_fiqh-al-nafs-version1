// ===== استيراد الإعدادات من ملف config.js =====
import { FIREBASE_CONFIG } from '../config/config.js';
import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ===== تهيئة Firebase =====
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// ===== تهيئة نظام الوضع الداكن =====
function initializeThemeSystem() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // تطبيق الوضع المحفوظ
    document.body.setAttribute('data-theme', currentTheme);
    updateToggleButton(currentTheme);
    
    // تبديل الوضع
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
}

// ===== دالة عرض رسالة تنبيه =====
function showAlert(message, type = 'success') {
    const alertEl = document.getElementById('alertMessage');
    if (!alertEl) {
        console.warn('عنصر التنبيه غير موجود في الصفحة');
        return;
    }
    
    alertEl.textContent = message;
    alertEl.className = `alert-message alert-${type}`;
    alertEl.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    alertEl.classList.add('show');
    
    setTimeout(() => {
        alertEl.classList.remove('show');
    }, 3000);
}

// ===== إضافة تأثيرات تفاعلية للحقول =====
function initializeInputEffects() {
    const loginNameInput = document.getElementById('loginName');
    if (!loginNameInput) return;
    
    loginNameInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    loginNameInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
}

// ===== إضافة تأثيرات للأزرار =====
function initializeButtonEffects() {
    const buttons = document.querySelectorAll('.login-btn, .theme-toggle, .login-link');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            if (!this.disabled && !this.classList.contains('loading')) {
                this.style.transform = 'translateY(-3px)';
            }
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// ===== البحث عن المستخدم في Firebase =====
async function findUserByName(name) {
    try {
        const snapshot = await getDocs(collection(db, "users"));
        let foundUser = null;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.name && data.name.trim().toLowerCase() === name.trim().toLowerCase()) {
                foundUser = { id: doc.id, ...data };
            }
        });
        
        return foundUser;
    } catch (error) {
        console.error('خطأ في البحث عن المستخدم:', error);
        showAlert('⚠️ حدث خطأ في الاتصال بقاعدة البيانات', 'error');
        return null;
    }
}

// ===== معالجة تسجيل الدخول =====
async function handleLogin(e) {
    e.preventDefault();
    
    const loginNameInput = document.getElementById('loginName');
    const loginBtn = document.getElementById('loginBtn');
    
    if (!loginNameInput || !loginBtn) {
        console.error('عناصر واجهة المستخدم غير موجودة');
        return;
    }
    
    const name = loginNameInput.value.trim();
    
    if (!name) {
        showAlert('⚠️ الرجاء إدخال اسمك', 'warning');
        loginNameInput.focus();
        return;
    }
    
    // إظهار حالة التحميل
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
    
    try {
        // البحث عن المستخدم في Firebase
        const foundUser = await findUserByName(name);
        
        if (!foundUser) {
            showAlert('❌ الاسم غير موجود في السجلات', 'error');
            
            // إعادة تعيين حالة الزر
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
            return;
        }
        
        // حفظ المستخدم الحالي في localStorage
        localStorage.setItem(
            "currentUser",
            JSON.stringify({
                id: foundUser.id,
                name: foundUser.name,
                role: foundUser.role,
                lesson: foundUser.lesson || null,
                lastLogin: new Date().toISOString()
            })
        );
        
        // عرض رسالة نجاح
        showAlert(`✅ مرحباً ${foundUser.name}! تم تسجيل الدخول بنجاح`, 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد تأخير قصير
        setTimeout(() => {
            window.location.href = "../home/home.html";
        }, 1500);
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showAlert('❌ حدث خطأ أثناء تسجيل الدخول', 'error');
        
        // إعادة تعيين حالة الزر
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
    }
}

// ===== تهيئة التطبيق عند تحميل الصفحة =====
document.addEventListener("DOMContentLoaded", () => {
    // تهيئة نظام الوضع الداكن
    initializeThemeSystem();
    
    // تهيئة التأثيرات
    initializeInputEffects();
    initializeButtonEffects();
    
    // الحصول على عناصر واجهة المستخدم
    const loginBtn = document.getElementById("loginBtn");
    const loginNameInput = document.getElementById("loginName");
    
    if (!loginBtn || !loginNameInput) {
        console.error('عناصر واجهة المستخدم غير موجودة');
        return;
    }
    
    // إضافة مستمع حدث للزر
    loginBtn.addEventListener("click", handleLogin);
    
    // الدخول عند الضغط على Enter
    loginNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleLogin(e);
        }
    });
    
    // التحقق إذا كان هناك مستخدم مسجل مسبقاً
    try {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user.name) {
                loginNameInput.value = user.name;
                loginNameInput.setAttribute('placeholder', `مرحباً بعودتك، ${user.name}`);
            }
        }
    } catch (error) {
        console.warn('خطأ في قراءة بيانات المستخدم السابقة:', error);
    }
    
    // تركيز على حقل الاسم عند التحميل
    setTimeout(() => {
        loginNameInput.focus();
    }, 100);
});