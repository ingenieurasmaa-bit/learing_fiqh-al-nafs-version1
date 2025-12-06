
// كود تبديل الوضع لجميع الصفحات
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        
        // تطبيق الوضع المحفوظ
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateToggleButton(currentTheme);
        
        // تبديل الوضع
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleButton(newTheme);
        });
        
        function updateToggleButton(theme) {
            themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }
});