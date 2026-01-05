// home.js
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const title = document.getElementById("homeTitle");
  const subtitle = document.getElementById("homeSubtitle");
  const adminBtn = document.querySelector(".btn-white");
  

  if (!user) {
    // إذا لم يكن هناك مستخدم، العودة للتسجيل
    window.location.href = "../register/register.html";
    return;
  }
});

        // كود تبديل الوضع)
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

        // تأثيرات تفاعلية
        document.addEventListener('DOMContentLoaded', function() {
            // زر العودة
            document.getElementById('backBtn').addEventListener('click', function() {
                window.history.back();
            });

            // تأثيرات عند التمرير
            const etiquetteItems = document.querySelectorAll('.etiquette-item');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateX(0)';
                    }
                });
            }, { threshold: 0.1 });

            etiquetteItems.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(20px)';
                item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(item);
            });

            // تأثيرات الأزرار
            const buttons = document.querySelectorAll('.nav-btn, .theme-toggle');
            buttons.forEach(btn => {
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-3px)';
                });
                
                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            });

            // حفظ تقدم المستخدم
            const savedEtiquette = localStorage.getItem('etiquetteViewed');
            if (!savedEtiquette) {
                setTimeout(() => {
                    localStorage.setItem('etiquetteViewed', 'true');
                }, 3000);
            }
        });
    





