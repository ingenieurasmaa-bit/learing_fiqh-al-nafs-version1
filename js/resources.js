

// ================ ثوابت وعناصر DOM ================
const DOM_ELEMENTS = {
    modal: document.getElementById('addItemModal'),
    addItemBtns: document.querySelectorAll('.add-item-btn'),
    cancelBtn: document.getElementById('cancelBtn'),
    form: document.getElementById('addItemForm'),
    sectionTypeInput: document.getElementById('sectionType'),
    audioFileGroup: document.getElementById('audioFileGroup'),
    pdfFileGroup: document.getElementById('pdfFileGroup'),
    audioFileInput: document.getElementById('audioFile'),
    pdfFileInput: document.getElementById('pdfFile'),
    chooseFileBtn: document.getElementById('chooseFileBtn'),
    choosePdfBtn: document.getElementById('choosePdfBtn'),
    fileName: document.getElementById('fileName'),
    pdfFileName: document.getElementById('pdfFileName'),
    fileType: document.getElementById('fileType'),
    fileSize: document.getElementById('fileSize'),
    submitBtn: document.getElementById('submitBtn'),
    itemTitleInput: document.getElementById('itemTitle'),
    itemUrl: document.getElementById('itemUrl'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    clearConfirm: document.getElementById('clearConfirm'),
    confirmClearAll: document.getElementById('confirmClearAll'),
    cancelClearAll: document.getElementById('cancelClearAll')
};

// ================ تهيئة التطبيق ================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 بدء تحميل الصفحة...');
        
        await initIndexedDB();
        console.log('✅ IndexedDB جاهز');
        
        await loadSavedItems();
        console.log('✅ العناصر المحفوظة تم تحميلها');
        
        // تهيئة جميع المكونات
        initCollapsibleSections();
        initAddItemForm();
        initDeleteButtons();
        initClearAllButton();
        initIndividualDeleteButtons(); // إضافة تهيئة أزرار الحذف الفردي
        
        console.log('✅ تهيئة الصفحة اكتملت');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة الصفحة:', error);
        showNotification(`حدث خطأ: ${error.message}`, 'error');
    }
});

// ================ إدارة IndexedDB ================
const DB_CONFIG = {
    name: 'FikrAlNafsAudioDB',
    version: 2,
    stores: {
        audioFiles: 'audioFiles',
        metadata: 'audioMetadata'
    }
};
// أضف في بداية الملف
let dbInstance = null;

// استبدل initIndexedDB بهذا:
async function initIndexedDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('المتصفح لا يدعم IndexedDB'));
            return;
        }

        // إذا كانت قاعدة البيانات مفتوحة بالفعل
        if (dbInstance) {
            console.log('✅ قاعدة البيانات مفتوحة بالفعل');
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            createObjectStores(db);
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            console.log(`📦 ${dbInstance.name} جاهزة`);
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// عدّل storeAudioFileInIndexedDB:
async function storeAudioFileInIndexedDB(audioId, audioFile, metadata) {
    return new Promise(async (resolve, reject) => {
        try {
            // تأكد أن DB مفتوحة
            const db = dbInstance || await initIndexedDB();
            
            const transaction = db.transaction([DB_CONFIG.stores.audioFiles, DB_CONFIG.stores.metadata], 'readwrite');
            
            const audioStore = transaction.objectStore(DB_CONFIG.stores.audioFiles);
            const audioData = {
                id: audioId,
                name: audioFile.name,
                type: audioFile.type,
                size: audioFile.size,
                timestamp: new Date().toISOString(),
                sectionType: metadata.sectionType,
                title: metadata.title,
                originalUrl: metadata.url,
                blob: audioFile
            };
            
            audioStore.add(audioData);
            
            const metadataStore = transaction.objectStore(DB_CONFIG.stores.metadata);
            metadataStore.add({
                itemId: audioId,
                title: metadata.title,
                sectionType: metadata.sectionType,
                timestamp: new Date().toISOString(),
                size: audioFile.size
            });
            
            transaction.oncomplete = () => {
                console.log('✅ تم تخزين الملف:', audioId);
                resolve(audioId);
            };
            
            transaction.onerror = (event) => {
                console.error('❌ خطأ في التخزين:', event.target.error);
                reject(event.target.error);
            };
            
        } catch (error) {
            reject(error);
        }
    });
}

// عدّل loadAudioFromIndexedDB:
async function loadAudioFromIndexedDB(audioId) {
    return new Promise(async (resolve, reject) => {
        try {
            // تأكد أن DB مفتوحة
            const db = dbInstance || await initIndexedDB();
            
            const transaction = db.transaction([DB_CONFIG.stores.audioFiles], 'readonly');
            const audioStore = transaction.objectStore(DB_CONFIG.stores.audioFiles);
            
            const getRequest = audioStore.get(audioId);
            
            getRequest.onsuccess = () => {
                const audioData = getRequest.result;
                if (audioData?.blob) {
                    resolve({
                        url: URL.createObjectURL(audioData.blob),
                        blob: audioData.blob,
                        type: audioData.type,
                        name: audioData.name,
                        size: audioData.size
                    });
                } else {
                    reject(new Error('الملف غير موجود'));
                }
            };
            
            getRequest.onerror = (event) => reject(event.target.error);
            
        } catch (error) {
            reject(error);
        }
    });
}

function createObjectStores(db) {
    // مخزن الملفات الصوتية
    if (!db.objectStoreNames.contains(DB_CONFIG.stores.audioFiles)) {
        const store = db.createObjectStore(DB_CONFIG.stores.audioFiles, {
            keyPath: 'id',
            autoIncrement: false
        });
        store.createIndex('sectionId', 'sectionId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('title', 'title', { unique: false });
    }
    
    // مخزن البيانات الوصفية
    if (!db.objectStoreNames.contains(DB_CONFIG.stores.metadata)) {
        db.createObjectStore(DB_CONFIG.stores.metadata, { keyPath: 'itemId' });
    }
}

// ================ دوال DOM الأساسية ================
function initCollapsibleSections() {
    document.querySelectorAll('.collapsible-section').forEach(section => {
        const header = section.querySelector('.section-header');
        const content = section.querySelector('.section-content');
        const toggleBtn = section.querySelector('.toggle-btn');
        
        if (!header || !content || !toggleBtn) return;
        
        content.classList.add('collapsed');
        toggleBtn.classList.add('collapsed');
        
        header.addEventListener('click', (e) => {
            // فقط إذا لم يكن النقر على زر الحذف
            if (!e.target.closest('.delete-section-btn') && 
                !e.target.closest('.delete-item-btn')) {
                toggleSection(content, toggleBtn);
            }
        });
        
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSection(content, toggleBtn);
        });
    });
}

function toggleSection(content, toggleBtn) {
    content.classList.toggle('collapsed');
    toggleBtn.classList.toggle('collapsed');
}

// ================ إدارة النموذج ================
function initAddItemForm() {
    if (!DOM_ELEMENTS.form) {
        console.warn('⚠️ نموذج الإضافة غير موجود');
        return;
    }
    
    setupFormEvents();
    setupFileInputEvents();
}

function setupFormEvents() {
    // فتح النموذج
    DOM_ELEMENTS.addItemBtns.forEach(btn => {
        btn.addEventListener('click', () => openAddItemModal(btn.dataset.section));
    });
    
    // إغلاق النموذج
    DOM_ELEMENTS.cancelBtn.addEventListener('click', closeAddItemModal);
    
    DOM_ELEMENTS.modal?.addEventListener('click', (e) => {
        if (e.target === DOM_ELEMENTS.modal) {
            closeAddItemModal();
        }
    });
    
    // إرسال النموذج
    DOM_ELEMENTS.form.addEventListener('submit', handleFormSubmit);
}

function openAddItemModal(sectionType) {
    DOM_ELEMENTS.sectionTypeInput.value = sectionType;
    
    if (sectionType === 'audio') {
        DOM_ELEMENTS.audioFileGroup.style.display = 'block';
        if (DOM_ELEMENTS.pdfFileGroup) DOM_ELEMENTS.pdfFileGroup.style.display = 'none';
        DOM_ELEMENTS.itemUrl.placeholder = "https://example.com/audio.mp3 (اختياري)";
    } else {
        DOM_ELEMENTS.audioFileGroup.style.display = 'none';
        if (DOM_ELEMENTS.pdfFileGroup) DOM_ELEMENTS.pdfFileGroup.style.display = 'block';
        DOM_ELEMENTS.itemUrl.placeholder = "https://example.com/file.pdf (اختياري)";
    }
    
    DOM_ELEMENTS.modal.style.display = 'flex';
}

function closeAddItemModal() {
    DOM_ELEMENTS.modal.style.display = 'none';
    DOM_ELEMENTS.form.reset();
    resetFileInfo();
}

function resetFileInfo() {
    if (DOM_ELEMENTS.fileName) DOM_ELEMENTS.fileName.textContent = '';
    if (DOM_ELEMENTS.pdfFileName) DOM_ELEMENTS.pdfFileName.textContent = '';
    if (DOM_ELEMENTS.fileType) DOM_ELEMENTS.fileType.textContent = '';
    if (DOM_ELEMENTS.fileSize) DOM_ELEMENTS.fileSize.textContent = '';
}

function setupFileInputEvents() {
    // اختيار الملف الصوتي
    DOM_ELEMENTS.chooseFileBtn?.addEventListener('click', () => {
        DOM_ELEMENTS.audioFileInput.click();
    });
    
    DOM_ELEMENTS.audioFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            updateFileInfo(e.target.files[0], 'audio');
        }
    });
    
    // اختيار ملف PDF
    DOM_ELEMENTS.choosePdfBtn?.addEventListener('click', () => {
        DOM_ELEMENTS.pdfFileInput.click();
    });
    
    DOM_ELEMENTS.pdfFileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            updateFileInfo(e.target.files[0], 'pdf');
        }
    });
}

function updateFileInfo(file, type) {
    if (type === 'audio') {
        DOM_ELEMENTS.fileName.textContent = file.name;
        DOM_ELEMENTS.fileType.textContent = file.type || 'غير معروف';
        DOM_ELEMENTS.fileSize.textContent = formatFileSize(file.size);
        
        if (file.size > 0) {
            DOM_ELEMENTS.itemUrl.value = '';
            DOM_ELEMENTS.itemUrl.placeholder = "سيتم استخدام الملف المرفوع";
        }
    } else if (type === 'pdf') {
        DOM_ELEMENTS.pdfFileName.textContent = file.name;
        
        if (file.size > 0) {
            DOM_ELEMENTS.itemUrl.value = '';
            DOM_ELEMENTS.itemUrl.placeholder = "سيتم استخدام الملف المرفوع";
        }
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const sectionType = DOM_ELEMENTS.sectionTypeInput.value;
    const itemTitle = DOM_ELEMENTS.itemTitleInput.value.trim();
    const url = DOM_ELEMENTS.itemUrl.value.trim();
    const audioFile = DOM_ELEMENTS.audioFileInput.files[0];
    const pdfFile = DOM_ELEMENTS.pdfFileInput?.files[0] || null;
    
    // التحقق من المدخلات
    const validation = validateInputs(sectionType, itemTitle, url, audioFile, pdfFile);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }
    
    // تعطيل زر الإرسال
    DOM_ELEMENTS.submitBtn.disabled = true;
    DOM_ELEMENTS.submitBtn.innerHTML = '⏳ جاري الإضافة...';
    
    try {
        await addNewItem(sectionType, itemTitle, url, audioFile, pdfFile);
        closeAddItemModal();
    } catch (error) {
        console.error('❌ خطأ في الإضافة:', error);
        alert(`حدث خطأ: ${error.message}`);
    } finally {
        DOM_ELEMENTS.submitBtn.disabled = false;
        DOM_ELEMENTS.submitBtn.innerHTML = 'إضافة';
    }
}

function validateInputs(sectionType, title, url, audioFile, pdfFile) {
    if (!title) {
        return { valid: false, message: 'يرجى إدخال اسم العنصر' };
    }
    
    if (sectionType === 'audio' && !url && !audioFile) {
        return { valid: false, message: 'يرجى إدخال رابط صوتي أو اختيار ملف صوتي' };
    }
    
    if ((sectionType === 'slides' || sectionType === 'transcripts') && !url && !pdfFile) {
        return { valid: false, message: 'يرجى إدخال رابط أو اختيار ملف PDF' };
    }
    
    return { valid: true, message: '' };
}

// ================ إدارة أزرار الحذف ================
function initDeleteButtons() {
    document.querySelectorAll('.delete-section-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const sectionType = btn.dataset.section;
            confirmDeleteSection(sectionType);
        });
    });
}

function confirmDeleteSection(sectionType) {
    const sectionNames = {
        'slides': 'الشرائح',
        'transcripts': 'التفريغات',
        'audio': 'الصوتيات'
    };
    
    const sectionName = sectionNames[sectionType] || 'هذا القسم';
    
    if (confirm(`هل أنت متأكد من حذف جميع الإضافات من قسم "${sectionName}"؟`)) {
        deleteSectionItems(sectionType);
    }
}

// ================ زر حذف الكل ================
function initClearAllButton() {
    if (!DOM_ELEMENTS.clearAllBtn || !DOM_ELEMENTS.clearConfirm || 
        !DOM_ELEMENTS.confirmClearAll || !DOM_ELEMENTS.cancelClearAll) {
        console.warn('⚠️ عناصر التحكم بحذف الكل غير موجودة');
        return;
    }
    
    DOM_ELEMENTS.clearAllBtn.addEventListener('click', () => {
        DOM_ELEMENTS.clearConfirm.style.display = 'block';
        DOM_ELEMENTS.clearAllBtn.style.display = 'none';
    });
    
    DOM_ELEMENTS.confirmClearAll.addEventListener('click', () => {
        clearAllUserItems();
        DOM_ELEMENTS.clearConfirm.style.display = 'none';
        DOM_ELEMENTS.clearAllBtn.style.display = 'flex';
    });
    
    DOM_ELEMENTS.cancelClearAll.addEventListener('click', () => {
        DOM_ELEMENTS.clearConfirm.style.display = 'none';
        DOM_ELEMENTS.clearAllBtn.style.display = 'flex';
    });
}

// ================ إدارة العناصر ================
const SECTION_SELECTORS = {
    'slides': '.collapsible-section:nth-child(1) .section-content ul',
    'transcripts': '.collapsible-section:nth-child(2) .section-content ul',
    'audio': '.collapsible-section:nth-child(3) .section-content ul'
};

async function addNewItem(sectionType, title, url, audioFile, pdfFile) {
    const section = document.querySelector(SECTION_SELECTORS[sectionType]);
    if (!section) throw new Error(`القسم ${sectionType} غير موجود`);
    
    try {
        // معالجة الملفات
        const { audioId, fileInfo, pdfData } = await processFiles(sectionType, title, url, audioFile, pdfFile);
        
        // إنشاء العنصر
        const newItem = createItemElement(sectionType, title, url, audioId, fileInfo, pdfData);
        
        // إضافة العنصر إلى القسم
        section.prepend(newItem); // إضافة في البداية
        
        // تهيئة عناصر التحكم للصوتيات
        if (sectionType === 'audio') {
            setupAudioControls(newItem, { audioId, externalUrl: url, title });
        }

        // حفظ البيانات مع التأكد من عدم تكرارها
        await saveItemMetadata(sectionType, {
            id: newItem.dataset.itemId,
            title,
            url,
            audioId,
            fileInfo,
            pdfData
        });
        
        // إظهار الإشعار
        showNotification(`تم إضافة "${title}" بنجاح!`, 'success');
        
    } catch (error) {
        console.error('❌ خطأ في إضافة العنصر:', error);
        throw error;
    }
}

async function processFiles(sectionType, title, url, audioFile, pdfFile) {
    let audioId = null;
    let fileInfo = null;
    let pdfData = null;
    
    if (audioFile && sectionType === 'audio') {
        audioId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await storeAudioFileInIndexedDB(audioId, audioFile, {
            sectionType,
            title,
            url
        });
        
        fileInfo = {
            id: audioId,
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size,
            storedIn: 'indexeddb'
        };
    }
    
    if (pdfFile && (sectionType === 'slides' || sectionType === 'transcripts')) {
        pdfData = await convertFileToBase64(pdfFile);
    }
    
    return { audioId, fileInfo, pdfData };
}

function createItemElement(sectionType, title, url, audioId, fileInfo, pdfData) {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const li = document.createElement('li');
    li.className = 'user-added';
    
    if (sectionType === 'audio') {
        li.innerHTML = createAudioItemHTML(itemId, title, audioId, fileInfo, url);
    } else {
        li.innerHTML = createDocumentItemHTML(sectionType, itemId, title, url, pdfData);
    }
    
    li.dataset.itemId = itemId;
    if (audioId) li.dataset.audioId = audioId;
    
    // إضافة زر الحذف
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-item-btn';
    deleteBtn.innerHTML = '🗑️ حذف';
    deleteBtn.style.cssText = `
        background: #ff4757;
        width: 100%;
        color: white;
        border: none;
        padding: 10px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 5px;
        transition: background 0.3s;
    `;
    deleteBtn.onmouseover = () => deleteBtn.style.background = '#ff3838';
    deleteBtn.onmouseout = () => deleteBtn.style.background = '#ff4757';
    
    li.querySelector('.user-item').appendChild(deleteBtn);
    
    return li;
}

function createAudioItemHTML(itemId, title, audioId, fileInfo, url) {
    return `
        <div class="user-item" data-item-id="${itemId}" data-audio-id="${audioId || ''}">
            <p>${title}</p>
            <div class="audio-player-container">
                <audio controls preload="none" data-item-id="${itemId}">
                    <source src="" type="audio/mpeg">
                    المتصفح لا يدعم تشغيل الصوتيات.
                </audio>
                <div class="audio-controls">
                    <button class="play-btn">▶️ تشغيل</button>
                    <button class="pause-btn">⏸️ إيقاف</button>
                    <button class="download-btn" ${!audioId ? 'style="display:none;"' : ''}>⬇️ تحميل</button>
                    <span class="loading-indicator" style="display:none;">⏳ جاري التحميل...</span>
                </div>
            </div>
            <div class="audio-info">
                ${fileInfo ? `
                    <span class="file-name">📁 ${fileInfo.name}</span>
                    <span class="file-size">${formatFileSize(fileInfo.size)}</span>
                ` : url ? `
                    <span class="external-link">🔗 رابط خارجي</span>
                ` : ''}
            </div>
            <span class="item-badge">إضافة مستخدم</span>
        </div>
    `;
}

function createDocumentItemHTML(sectionType, itemId, title, url, pdfData) {
    const icon = sectionType === 'slides' ? '📘' : '📗';
    let linkHTML = '';
    
    if (pdfData) {
        const pdfUrl = createPdfUrlFromBase64(pdfData.base64);
        linkHTML = `
            <a href="${pdfUrl}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="pdf-link"
               title="انقر لفتح ${pdfData.name}"
               onclick="handlePdfClick(event, '${pdfUrl}')">
                ${icon} ${title}
            </a>
            <span class="file-info-small">
                📄 ${formatFileSize(pdfData.size)}
            </span>
        `;
    } else if (url) {
        linkHTML = `
            <a href="${url}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="external-link">
                ${icon} ${title}
            </a>
            <span class="file-info-small">
                🔗 رابط خارجي
            </span>
        `;
    } else {
        linkHTML = `
            <span class="no-link">
                ${icon} ${title}
                <span class="file-info-small">(بدون رابط)</span>
            </span>
        `;
    }
    
    return `
        <div class="user-item" data-item-id="${itemId}">
            ${linkHTML}
            <span class="item-badge">إضافة مستخدم</span>
        </div>
    `;
}

// دالة لفتح PDF مباشرة
function handlePdfClick(event, pdfUrl) {
    event.preventDefault();
    
    // فتح نافذة جديدة لعرض PDF
    const pdfWindow = window.open('', '_blank');
    
    const pdfViewerHTML = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>عرض PDF</title>
            <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
                .pdf-controls {
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    z-index: 1000;
                }
                .close-btn {
                    background: #ff4757;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="pdf-controls">
                <button class="close-btn" onclick="window.close()">إغلاق</button>
            </div>
            <iframe src="${pdfUrl}"></iframe>
        </body>
        </html>
    `;
    
    pdfWindow.document.open();
    pdfWindow.document.write(pdfViewerHTML);
    pdfWindow.document.close();
}

// دالة لتحويل Base64 إلى Blob URL
function createPdfUrlFromBase64(base64) {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
}

function createPdfUrlFromBase64(base64) {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
}

// ================ إدارة الصوتيات ================
function setupAudioControls(listItem, audioInfo) {
    const audioElement = listItem.querySelector('audio');
    const playBtn = listItem.querySelector('.play-btn');
    const pauseBtn = listItem.querySelector('.pause-btn');
    const downloadBtn = listItem.querySelector('.download-btn');
    const loadingIndicator = listItem.querySelector('.loading-indicator');
    
    if (!audioElement) return;
    
    playBtn.addEventListener('click', () => handleAudioPlay(audioElement, audioInfo, playBtn, loadingIndicator));
    pauseBtn.addEventListener('click', () => audioElement.pause());
    
    if (downloadBtn && audioInfo.audioId) {
        downloadBtn.addEventListener('click', () => handleAudioDownload(audioInfo));
    }
}

async function handleAudioPlay(audioElement, audioInfo, playBtn, loadingIndicator) {
    try {
        loadingIndicator.style.display = 'inline';
        playBtn.disabled = true;
        
        if (audioInfo.audioId) {
            const audioData = await loadAudioFromIndexedDB(audioInfo.audioId);
            audioElement.src = audioData.url;
            audioElement.load();
            
            audioElement.addEventListener('canplaythrough', () => {
                loadingIndicator.style.display = 'none';
                playBtn.disabled = false;
                audioElement.play();
            }, { once: true });
            
            audioElement.addEventListener('ended', () => {
                setTimeout(() => URL.revokeObjectURL(audioData.url), 1000);
            });
        } else if (audioInfo.externalUrl) {
            audioElement.src = audioInfo.externalUrl;
            audioElement.load();
            audioElement.play();
            loadingIndicator.style.display = 'none';
            playBtn.disabled = false;
        }
    } catch (error) {
        console.error('❌ خطأ في تشغيل الصوت:', error);
        loadingIndicator.style.display = 'none';
        playBtn.disabled = false;
        showNotification('حدث خطأ في تحميل الملف الصوتي', 'error');
    }
}

async function handleAudioDownload(audioInfo) {
    try {
        const audioData = await loadAudioFromIndexedDB(audioInfo.audioId);
        const downloadLink = document.createElement('a');
        downloadLink.href = audioData.url;
        downloadLink.download = `${audioInfo.title}.${getFileExtension(audioData.type)}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setTimeout(() => URL.revokeObjectURL(audioData.url), 100);
    } catch (error) {
        console.error('❌ خطأ في تحميل الملف:', error);
        showNotification('حدث خطأ في تحميل الملف', 'error');
    }
}

// ================ تحميل العناصر المحفوظة ================
async function loadSavedItems() {
    console.log('🔍 بدء تحميل العناصر المحفوظة...');
    
    try {
        const savedItemsStr = localStorage.getItem('userAddedItems');
        
        if (!savedItemsStr) {
            console.log('ℹ️ لا توجد عناصر محفوظة');
            return;
        }
        
        const savedItems = JSON.parse(savedItemsStr);
        
        if (!document.querySelector('.collapsible-section')) {
            setTimeout(() => loadSavedItems(), 100);
            return;
        }
        
        let totalLoaded = 0;
        
        for (const [sectionType, items] of Object.entries(savedItems)) {
            const selector = SECTION_SELECTORS[sectionType];
            if (!selector) continue;
            
            const section = document.querySelector(selector);
            if (!section) continue;
            
            // تحميل من الأحدث إلى الأقدم
            items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            for (const item of items) {
                try {
                    // التأكد من عدم تكرار العنصر
                    const existingItem = document.querySelector(`[data-item-id="${item.id}"]`);
                    if (existingItem) continue;
                    
                    const li = createItemElement(
                        sectionType, 
                        item.title, 
                        item.url, 
                        item.audioId, 
                        item.fileInfo, 
                        item.pdfData
                    );
                    
                    section.appendChild(li);
                    totalLoaded++;
                    
                } catch (itemError) {
                    console.error(`❌ خطأ في تحميل العنصر ${item.title}:`, itemError);
                }
            }
        }
        
        console.log(`✅ تم تحميل ${totalLoaded} عنصر بنجاح`);
        
    } catch (error) {
        console.error('❌ خطأ عام في تحميل العناصر:', error);
        showNotification('تم تحميل الصفحة مع بعض الأخطاء في العناصر القديمة', 'info');
    }
}
// ================ دوال مساعدة ================
async function saveItemMetadata(sectionType, metadata) {
    const savedItems = JSON.parse(localStorage.getItem('userAddedItems') || '{}');
    
    if (!savedItems[sectionType]) {
        savedItems[sectionType] = [];
    }
    
    savedItems[sectionType].push({
        ...metadata,
        timestamp: new Date().toISOString(),
        hasLocalFile: !!(metadata.audioId || metadata.pdfData)
    });
    
    localStorage.setItem('userAddedItems', JSON.stringify(savedItems));
}

async function deleteSectionItems(sectionType) {
    try {
        const savedItems = JSON.parse(localStorage.getItem('userAddedItems') || '{}');
        
        if (savedItems[sectionType]) {
            if (sectionType === 'audio') {
                for (const item of savedItems[sectionType]) {
                    if (item.audioId) {
                        await deleteAudioFromStorage(item.audioId);
                    }
                }
            }
            
            delete savedItems[sectionType];
            localStorage.setItem('userAddedItems', JSON.stringify(savedItems));
        }
        
        const section = document.querySelector(SECTION_SELECTORS[sectionType]);
        if (section) {
            section.querySelectorAll('.user-added').forEach(item => item.remove());
        }
        
        showNotification(`تم حذف جميع إضافات قسم ${sectionType}`, 'success');
        
    } catch (error) {
        console.error('❌ خطأ في حذف العناصر:', error);
        showNotification('حدث خطأ في حذف العناصر', 'error');
    }
}

function clearAllUserItems() {
    localStorage.removeItem('userAddedItems');
    
    Object.values(SECTION_SELECTORS).forEach(selector => {
        const section = document.querySelector(selector);
        if (section) {
            section.querySelectorAll('.user-added').forEach(item => item.remove());
        }
    });
    
    clearAllAudioFromStorage().catch(error => {
        console.error('❌ خطأ في حذف الملفات من IndexedDB:', error);
    });
    
    showNotification('تم حذف جميع الإضافات', 'success');
}

// ================ دوال IndexedDB ================
async function storeAudioFileInIndexedDB(audioId, audioFile, metadata) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([DB_CONFIG.stores.audioFiles, DB_CONFIG.stores.metadata], 'readwrite');
            
            const audioStore = transaction.objectStore(DB_CONFIG.stores.audioFiles);
            const audioData = {
                id: audioId,
                name: audioFile.name,
                type: audioFile.type,
                size: audioFile.size,
                timestamp: new Date().toISOString(),
                sectionType: metadata.sectionType,
                title: metadata.title,
                originalUrl: metadata.url,
                blob: audioFile
            };
            
            audioStore.add(audioData);
            
            const metadataStore = transaction.objectStore(DB_CONFIG.stores.metadata);
            metadataStore.add({
                itemId: audioId,
                title: metadata.title,
                sectionType: metadata.sectionType,
                timestamp: new Date().toISOString(),
                size: audioFile.size
            });
            
            transaction.oncomplete = () => resolve(audioId);
            transaction.onerror = (event) => reject(event.target.error);
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}

async function loadAudioFromIndexedDB(audioId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([DB_CONFIG.stores.audioFiles], 'readonly');
            const audioStore = transaction.objectStore(DB_CONFIG.stores.audioFiles);
            
            const getRequest = audioStore.get(audioId);
            
            getRequest.onsuccess = () => {
                const audioData = getRequest.result;
                if (audioData?.blob) {
                    resolve({
                        url: URL.createObjectURL(audioData.blob),
                        blob: audioData.blob,
                        type: audioData.type,
                        name: audioData.name,
                        size: audioData.size
                    });
                } else {
                    reject(new Error('الملف غير موجود'));
                }
            };
            
            getRequest.onerror = (event) => reject(event.target.error);
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}


// ================ حذف عنصر فردي ================
function initIndividualDeleteButtons() {
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-item-btn')) {
            e.stopPropagation();
            const itemElement = e.target.closest('.user-item');
            if (itemElement) {
                const itemId = itemElement.dataset.itemId;
                const audioId = itemElement.dataset.audioId;
                const sectionType = getSectionTypeFromElement(itemElement);
                
                if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
                    await deleteSingleItem(itemId, audioId, sectionType);
                }
            }
        }
    });
}

function getSectionTypeFromElement(element) {
    const section = element.closest('.collapsible-section');
    if (!section) return null;
    
    const header = section.querySelector('h3');
    if (!header) return null;
    
    const headerText = header.textContent.trim();
    if (headerText.includes('الشرائح')) return 'slides';
    if (headerText.includes('التفريغات')) return 'transcripts';
    if (headerText.includes('الصوتيات')) return 'audio';
    
    return null;
}

async function deleteSingleItem(itemId, audioId, sectionType) {
    try {
        // حذف من localStorage
        const savedItems = JSON.parse(localStorage.getItem('userAddedItems') || '{}');
        
        if (savedItems[sectionType]) {
            savedItems[sectionType] = savedItems[sectionType].filter(item => item.id !== itemId);
            
            if (savedItems[sectionType].length === 0) {
                delete savedItems[sectionType];
            }
            
            localStorage.setItem('userAddedItems', JSON.stringify(savedItems));
        }
        
        // حذف من IndexedDB إذا كان ملف صوتي
        if (audioId) {
            try {
                await deleteAudioFromStorage(audioId);
            } catch (error) {
                console.warn('❌ فشل حذف الملف من IndexedDB:', error);
            }
        }
        
        // حذف العنصر من DOM
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.closest('li').remove();
        }
        
        showNotification('تم حذف العنصر بنجاح', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في حذف العنصر:', error);
        showNotification('حدث خطأ في حذف العنصر', 'error');
    }
}

async function deleteAudioFromStorage(audioId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([DB_CONFIG.stores.audioFiles, DB_CONFIG.stores.metadata], 'readwrite');
            
            const audioStore = transaction.objectStore(DB_CONFIG.stores.audioFiles);
            const metadataStore = transaction.objectStore(DB_CONFIG.stores.metadata);
            
            audioStore.delete(audioId);
            metadataStore.delete(audioId);
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}

async function clearAllAudioFromStorage() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([DB_CONFIG.stores.audioFiles, DB_CONFIG.stores.metadata], 'readwrite');
            
            transaction.objectStore(DB_CONFIG.stores.audioFiles).clear();
            transaction.objectStore(DB_CONFIG.stores.metadata).clear();
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}

// ================ دوال عامة ================
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('لا يوجد ملف'));
            return;
        }
        
        const maxSize = file.type.includes('audio') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        
        if (file.size > maxSize) {
            reject(new Error(`حجم الملف كبير (${formatFileSize(file.size)}). الحد: ${formatFileSize(maxSize)}`));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => resolve({
            base64: e.target.result,
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(mimeType) {
    const extensions = {
        'audio/mpeg': 'mp3',
        'audio/ogg': 'ogg',
        'audio/wav': 'wav',
        'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a',
        'audio/webm': 'webm'
    };
    return extensions[mimeType] || 'audio';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-notification">✕</button>
    `;
    
    const colors = {
        'success': 'linear-gradient(135deg, #2ed573, #1dd1a1)',
        'error': 'linear-gradient(135deg, #ff6b6b, #ff4757)',
        'info': 'linear-gradient(135deg, #3742fa, #5352ed)'
    };
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '1000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: '300px',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideIn 0.3s ease',
        background: colors[type] || colors.info
    });
    
    document.body.appendChild(notification);
    
    // إضافة الأنيميشن
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .close-notification {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-right: 10px;
                padding: 0 5px;
            }
        `;
        document.head.appendChild(style);
    }
    
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// اختبر localStorage
console.log('localStorage userAddedItems:', localStorage.getItem('userAddedItems'));

// اختبر IndexedDB
function testIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FikrAlNafsAudioDB');
        request.onsuccess = (e) => {
            const db = e.target.result;
            console.log('✅ IndexedDB مفتوح');
            console.log('اسم DB:', db.name);
            console.log('الإصدار:', db.version);
            console.log('المخازن:', Array.from(db.objectStoreNames));
            
            // عدّ العناصر
            const tx = db.transaction('audioFiles', 'readonly');
            const store = tx.objectStore('audioFiles');
            const countReq = store.count();
            countReq.onsuccess = () => {
                console.log(`عدد الملفات في audioFiles: ${countReq.result}`);
                db.close();
                resolve();
            };
        };
        request.onerror = (e) => {
            console.error('❌ فشل فتح IndexedDB:', e.target.error);
            reject(e.target.error);
        };
    });
}

testIndexedDB();
// ================ التصدير للاستخدام العام ================
window.clearAllUserItems = clearAllUserItems;
window.deleteSectionItems = deleteSectionItems;
window.loadSavedItems = loadSavedItems;