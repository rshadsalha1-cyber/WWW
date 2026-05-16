// app.js
// Application state
const state = {
    studentName: '',
    lessons: [],
    currentLessonId: null,
    globalScore: 0,
    readingStrictness: 'medium', // easy, medium, hard
    readingPhilosophy: 'standard', // standard, patient
    ttsRate: 1.0, // 0.8, 1.0, 1.2

    // Reading Session Data
    sessionStats: null,
    lastWordMatchTime: 0,
    isListening: false,
    speechManager: null,
    isOfflineMode: !navigator.onLine,
    forceOfflineRecognition: false, // تم استبدال Vosk بـ Whisper - لا حاجة لهذا الخيار

    // Tracking
    words: [],
    currentWordIndex: 0,
    lastPartialTokenCount: 0,

    // Timer for inactivity/error
    inactivityTimer: null,

    // بنك المفردات الشامل لجميع الدروس (لتحسين دقة المحرك الأوفلاين)
    globalVocabulary: new Set(['[unk]', 'نعم', 'لا', 'بطل', 'ممتاز', 'احسنت'])
};

// --- DOM Elements ---
// Screens
const splashScreen = document.getElementById('splash-screen');
const galleryScreen = document.getElementById('gallery-screen');
const readingScreen = document.getElementById('reading-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const profileScreen = document.getElementById('profile-screen');
const futureScreen = document.getElementById('future-screen');
const bottomNav = document.getElementById('bottom-nav');

const screens = [splashScreen, galleryScreen, readingScreen, leaderboardScreen, profileScreen, futureScreen];

// Splash
const nameInput = document.getElementById('student-name-input');
const nameInputWrapper = document.getElementById('name-input-wrapper');
const nameDisplayView = document.getElementById('name-display-view');
const displayName = document.getElementById('display-name');
const startAppBtn = document.getElementById('start-app-btn');

// Gallery
// Gallery Header Profile Card
const hpStudentName = document.getElementById('hp-student-name');
const hpGlobalScore = document.getElementById('hp-global-score');
const lessonsGrid = document.getElementById('lessons-grid');

// Leaderboard (Now a full screen)
const leaderboardList = document.getElementById('leaderboard-list');

// Profile (Now a full screen)
const editNameInput = document.getElementById('edit-name-input');
const strictnessSelect = document.getElementById('strictness-select');
const philosophySelect = document.getElementById('philosophy-select');
const ttsRateSelect = document.getElementById('tts-rate-select');
const saveProfileBtn = document.getElementById('save-profile-btn');

window.changePhilosophy = function (val) {
    state.readingPhilosophy = val;
    if (window.DataManager && DataManager.saveReadingPhilosophy) {
        DataManager.saveReadingPhilosophy(val);
    }
};

// Result Overlay
const resultOverlay = document.getElementById('lesson-result-overlay');
const resultCorrect = document.getElementById('result-correct');
const resultScore = document.getElementById('result-score');
const closeResultBtn = document.getElementById('close-result-btn');
const sendStatus = document.getElementById('send-status');

function updateScoreUI(animate = false) {
    const scores = ['global-score', 'reading-global-score', 'hp-global-score', 'profile-global-score'];
    scores.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = state.globalScore;

            if (animate) {
                const badge = el.closest('.reading-global-score-badge, .hp-score-badge, .user-score-badge');
                if (badge) {
                    badge.classList.add('score-bump');
                    el.classList.add('score-text-bump');
                    const icon = badge.querySelector('i');
                    if (icon) icon.classList.add('star-animate');

                    setTimeout(() => {
                        badge.classList.remove('score-bump');
                        el.classList.remove('score-text-bump');
                        if (icon) icon.classList.remove('star-animate');
                    }, 600);
                }
            }
        }
    });
    DataManager.saveGlobalScore(state.globalScore);
}

function updateProgressBar() {
    if (!state.words || state.words.length === 0) return;
    const total = state.words.length;
    let correct = 0;
    if (state.sessionStats) correct = state.sessionStats.correctWords || 0;
    const percentage = Math.min(100, Math.round((correct / total) * 100));

    const bar = document.getElementById('reading-progress-bar');
    const text = document.getElementById('reading-progress-text');
    if (bar) bar.style.width = percentage + '%';
    if (text) text.textContent = `${correct} / ${total}`;
}

// Reading
const canvas = document.getElementById('text-canvas');
const readingTitle = document.getElementById('reading-title');
const micBtn = document.getElementById('mic-btn');
const retryBtn = document.getElementById('retry-btn');
const ttsBtn = document.getElementById('tts-btn');
const endSessionBtn = document.getElementById('end-session-btn');
const backToGalleryBtn = document.getElementById('back-to-gallery-btn');

// Audio Elements
const successSound = document.getElementById('success-sound');
const errorSound = document.getElementById('error-sound');
const cheerSound = document.getElementById('cheer-sound');
const bgMusic = document.getElementById('bg-music');



// ============================================================
// ===  نظام تطبيع وتحليل الكلمات العربية المتقدم  ===
// ============================================================

/**
 * تطبيع الكلمة العربية: إزالة التشكيل وتوحيد أشكال الحروف
 */
function normalizeArabic(text, keepDiacritics = false) {
    if (!text) return '';
    let normalized = text.trim();
    if (!keepDiacritics) {
        normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');
    }
    normalized = normalized.replace(/[.,،؛:?!؟()«»]/g, '').trim();
    // 2. توحيد الألفات والهمزات الشاملة
    normalized = normalized.replace(/[أإآٱ]/g, 'ا');
    normalized = normalized.replace(/[ؤ]/g, 'و');
    normalized = normalized.replace(/[ئ]/g, 'ي');
    normalized = normalized.replace(/[ء]/g, '');

    // 4. توحيد الياء والألف المقصورة والتاء المربوطة
    normalized = normalized.replace(/[ىي]$/, 'ي');
    normalized = normalized.replace(/[ةه]$/, 'ه');

    // 6. إزالة الحروف المكررة (الشدة تجعل الحرف مضاعفاً في بعض محركات ASR)
    normalized = normalized.replace(/(.)\1+/g, '$1');

    return normalized;
}

/**
 * تحويل الكلمة إلى كود صوتي للمقارنة الصوتية العميقة
 */
function getArabicPhoneticCode(word) {
    if (!word) return "";
    let code = normalizeArabic(word);

    // 1. تبسيط الألفات
    code = code.replace(/[اأإآٱءؤئ]/g, 'A');

    // 2. المجموعات الصوتية المتشابهة
    code = code.replace(/[بپ]/g, 'B');
    code = code.replace(/[تط]/g, 'T');
    code = code.replace(/[ثسص]/g, 'S');
    code = code.replace(/[ج]/g, 'J');
    code = code.replace(/[حخ]/g, 'H');
    code = code.replace(/[غع]/g, 'G');
    code = code.replace(/[هـ]/g, 'X');
    code = code.replace(/[دض]/g, 'D');
    code = code.replace(/[ذظ]/g, 'Z');
    code = code.replace(/[ر]/g, 'R');
    code = code.replace(/[ز]/g, 'Z');
    code = code.replace(/[ف]/g, 'F');
    code = code.replace(/[قك]/g, 'K');
    code = code.replace(/[لم]/g, 'L');
    code = code.replace(/[ن]/g, 'N');
    code = code.replace(/[وي]/g, 'W');
    code = code.replace(/[ش]/g, 'SH');

    // إزالة الحروف المتكررة المتتالية
    return code.replace(/(.)\1+/g, '$1');
}

/**
 * توليد جميع المتغيرات الصوتية الممكنة لكلمة (لمقابلة ما تنطقه محركات ASR)
 */
function generateVariants(word) {
    if (!word) return new Set();
    const variants = new Set();

    // الكلمة الأصلية بدون تشكيل
    const stripped = word.replace(/[\u064B-\u065F\u0670]/g, '');
    variants.add(stripped);

    // الكلمة المطبّعة بالكامل
    const base = normalizeArabic(word);
    variants.add(base);

    // بدائل الألف في أول الكلمة
    if (/^[أإآا]/.test(stripped)) {
        const tail = stripped.slice(1);
        variants.add('أ' + tail);
        variants.add('إ' + tail);
        variants.add('ا' + tail);
        variants.add('آ' + tail);
    }

    // معالجة التنوين - تحويله لنطق واضح
    const tanwinFath = word.replace(/\u064B/g, ''); // ً
    const tanwinDamm = word.replace(/\u064C/g, ''); // ٌ
    const tanwinKasr = word.replace(/\u064D/g, ''); // ٍ
    [tanwinFath, tanwinDamm, tanwinKasr].forEach(v => variants.add(normalizeArabic(v)));

    // تنوين الفتح يُنطق أحيانًا كـ "ن" أو "ا"
    if (word.includes('\u064B')) {
        variants.add(base + 'ن');
        variants.add(base + 'ا');
    }
    if (word.includes('\u064C')) {
        variants.add(base + 'ن');
        variants.add(base + 'و');
    }
    if (word.includes('\u064D')) {
        variants.add(base + 'ن');
        variants.add(base + 'ي');
    }

    // اللام الشمسية - الكلمات التي تبدأ بـ "ال"
    if (stripped.startsWith('ال')) {
        const sunLetters = 'تثدذرزسشصضطظلن';
        const thirdChar = normalizeArabic(stripped).charAt(2);
        if (sunLetters.includes(thirdChar)) {
            // الشمس -> شمس (اللام لا تُنطق)
            variants.add(normalizeArabic(stripped.slice(2)));
        }
        // دائمًا أضف النسخة بدون ال
        variants.add(normalizeArabic(stripped.slice(2)));
    }

    // الكلمات الوظيفية القصيرة - بدائل شائعة في ASR (Vosk)
    const functionalWords = {
        'ان': ['أن', 'إن', 'انه', 'انها', 'اننا', 'انا', 'انما', 'عن'],
        'أن': ['ان', 'إن', 'انه', 'انها', 'انا'],
        'إن': ['ان', 'أن', 'انه', 'انها', 'انا'],
        'في': ['في', 'فه', 'ف', 'فيي', 'فيه', 'فيها', 'فى'],
        'على': ['على', 'علا', 'الي', 'علي', 'عليه', 'عله'],
        'من': ['من', 'مِن', 'منه', 'منها'],
        'عن': ['عن', 'عَن', 'عنه', 'عنها', 'ان'],
        'لا': ['لا', 'لاء', 'له', 'لو'],
        'ما': ['ما', 'ماء', 'مه'],
        'او': ['او', 'أو', 'وا', 'و'],
        'ثم': ['ثم', 'ثما', 'فم', 'سم'],
        'هذا': ['هذا', 'هاذا', 'هدا', 'هده'],
        'هذه': ['هذه', 'هاذه', 'هده'],
        'الذي': ['الذي', 'اللذي', 'الدي'],
        'التي': ['التي', 'اللتي'],
        'مع': ['مع', 'ما', 'معه'],
        'كي': ['كي', 'كه', 'ك'],
        'لم': ['لم', 'لما', 'لن']
    };

    const baseKey = normalizeArabic(base);
    if (functionalWords[stripped]) {
        functionalWords[stripped].forEach(v => variants.add(normalizeArabic(v)));
    }
    if (functionalWords[base]) {
        functionalWords[base].forEach(v => variants.add(normalizeArabic(v)));
    }

    // مرونة في نهايات الكلمات (قواعد النطق العربية)
    // 1. التبادل بين الألف المقصورة والياء والفتحة الطويلة (يبق -> يبقى)
    if (base.length > 2) {
        variants.add(base + 'ى');
        variants.add(base + 'ي');
        variants.add(base + 'ا');
        variants.add(base + 'ه');
    }
    // 2. إذا كانت تنتهي بألف مقصورة أو ياء، أضف النسخة بدونها (يبقى -> يبق)
    if (base.endsWith('ى') || base.endsWith('ي') || base.endsWith('ا')) {
        variants.add(base.slice(0, -1));
    }

    // 3. معالجة التاء المربوطة: المحرك قد يسمعها كتاء عند الوصل (خمست) أو كهاء عند الوقف (خمسه)
    if (stripped.endsWith('ة')) {
        variants.add(base.slice(0, -1) + 'ت'); // base ينتهي بهاء مسبقاً، فنستبدلها بـ ت
    }

    // 🟢 ميزة "الشدة الفائقة": إذا كانت الكلمة تحتوي على شدة، أضف احتمالات التكرار
    if (word.includes('\u0651')) {
        const chars = word.split('');
        for (let i = 0; i < chars.length; i++) {
            if (chars[i] === '\u0651' && i > 0) {
                const letter = chars[i - 1];
                const before = normalizeArabic(word.slice(0, i - 1));
                const after = normalizeArabic(word.slice(i + 1));
                variants.add(before + letter + letter + after);
                variants.add(before + letter + 'نا' + after);
                variants.add(before + letter + 'ا' + after);
            }
        }
    }

    // 🟢 معالجة الهمزات الشاملة (أ، إ، آ، ء، ؤ، ئ)
    if (base.includes('ا') || base.includes('و') || base.includes('ي')) {
        const hamzaVariants = base
            .replace(/[اوِيى]/g, 'أ')
            .replace(/[اوِيى]/g, 'ؤ')
            .replace(/[اوِيى]/g, 'ئ');
        variants.add(hamzaVariants);
    }

    // 🟢 أخطاء الأطفال الشائعة في مخارج الحروف (Phonological replacements)
    // نطبقها على الكلمة المجردة لتقبل أخطاء الأطفال التلقائية في النطق
    if (stripped.length >= 3) {
        if (stripped.includes('ق')) variants.add(normalizeArabic(stripped.replace(/ق/g, 'ك'))); // ينقل -> ينكل
        if (stripped.includes('ظ')) variants.add(normalizeArabic(stripped.replace(/ظ/g, 'ز'))); // نظيفة -> نزيفة
        if (stripped.includes('ث')) {
            variants.add(normalizeArabic(stripped.replace(/ث/g, 'س'))); // ثروة -> سروة
            variants.add(normalizeArabic(stripped.replace(/ث/g, 'ت'))); // ثروة -> تروة
        }
        if (stripped.includes('ذ')) {
            variants.add(normalizeArabic(stripped.replace(/ذ/g, 'ز'))); // ذهب -> زهب
            variants.add(normalizeArabic(stripped.replace(/ذ/g, 'د'))); // ذهب -> دهب
        }
        if (stripped.includes('ض')) variants.add(normalizeArabic(stripped.replace(/ض/g, 'د'))); // أرض -> أرد
        if (stripped.includes('ص')) variants.add(normalizeArabic(stripped.replace(/ص/g, 'س'))); // صغير -> سغير
        if (stripped.includes('ط')) variants.add(normalizeArabic(stripped.replace(/ط/g, 'ت'))); // طالبات -> تالبات
    }

    return variants;
}

/**
 * حساب التشابه بين كلمتين (0 إلى 1)
 */
function levenshteinDistance(s1, s2) {
    const m = s1.length, n = s2.length;
    const d = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let j = 1; j <= n; j++) {
        for (let i = 1; i <= m; i++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        }
    }
    return d[m][n];
}

function calcSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;
    const dist = levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - dist / maxLen;
}

/**
 * دالة المقارنة الرئيسية - متعددة المستويات
 * ترجع نسبة تشابه من 0 إلى 1
 */
function compareWords(spoken, target, strictness = 'medium') {
    if (!spoken || !target) return 0;

    const spokenNorm = normalizeArabic(spoken);

    // Check if target is a word object or just a string
    const targetNorm = typeof target === 'object' ? target.normalizedText : normalizeArabic(target);
    const targetVariants = typeof target === 'object' ? target.variants : generateVariants(target);
    for (const variant of targetVariants) {
        if (normalizeArabic(variant) === spokenNorm) return 1.0;
    }

    // تحقق من أن الكلمة المنطوقة موجودة في متغيرات الهدف
    const spokenVariants = generateVariants(spoken);
    for (const sv of spokenVariants) {
        if (targetVariants.has(normalizeArabic(sv))) return 1.0;
        if (normalizeArabic(sv) === targetNorm) return 1.0;
    }

    // ── المستوى 3: المقارنة الصوتية العميقة ──
    const spokenPhonetic = getArabicPhoneticCode(spoken);
    const targetPhonetic = getArabicPhoneticCode(target);
    if (spokenPhonetic === targetPhonetic) return 0.95;

    // ── المستوى 4: مسافة ليفنشتاين على الشكل المطبّع ──
    let similarity = calcSimilarity(spokenNorm, targetNorm);

    // 🟢 ميزة خاصة للشدة: إذا كانت الكلمة الهدف تحتوي على شدة
    // (الشدة تُطيل الحرف، وغالباً ما يسمعها المحرك كحرف زائد أو تكرار)
    const originalTarget = typeof target === 'object' ? target.displayText : target;
    if (originalTarget && originalTarget.includes('\u0651')) { // 0651 هي الشدة
        // إذا كان المنطوق يشبه الهدف مع زيادة حرف مد أو تكرار
        if (spokenNorm.startsWith(targetNorm) || targetNorm.startsWith(spokenNorm)) {
            if (Math.abs(spokenNorm.length - targetNorm.length) <= 2) {
                similarity = Math.max(similarity, 0.85);
            }
        }
    }

    // مرونة في نهايات الكلمات (حروف العلة)
    if (levenshteinDistance(spokenNorm, targetNorm) === 1 && targetNorm.length >= 3) {
        similarity = Math.max(similarity, 0.75);
    }

    // مرونة للكلمات التي تختلف بحرف واحد فقط في النهاية (حروف علة)
    if (levenshteinDistance(spokenNorm, targetNorm) === 1) {
        const shorter = spokenNorm.length < targetNorm.length ? spokenNorm : targetNorm;
        const longer = spokenNorm.length < targetNorm.length ? targetNorm : spokenNorm;
        const diff = longer.slice(shorter.length);
        if ('اوي'.includes(diff) || 'ةه'.includes(diff)) {
            similarity = Math.max(similarity, 0.93);
        }
    }

    // تقليل درجة متطلبات المستوى الصارم
    if (strictness === 'easy') similarity = Math.min(similarity * 1.1, 1.0);

    return similarity;
}

// --- TTS Global Handlers ---
let ttsOriginalText = "";
let currentLocalAudio = null;

function removeHighlightClasses() {
    const activeHighlights = document.querySelectorAll('.word.tts-highlight');
    activeHighlights.forEach(el => el.classList.remove('tts-highlight'));
}

function clearTTSState() {
    removeHighlightClasses();
    if (typeof ttsBtn !== 'undefined' && ttsBtn) {
        const icon = ttsBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-volume-high';
        ttsBtn.classList.remove('active', 'paused');
    }
}

function stopTTS() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.pause(); // Extra safety
        window.speechSynthesis.cancel();
    }
    if (currentLocalAudio) {
        currentLocalAudio.pause();
        currentLocalAudio.currentTime = 0;
        currentLocalAudio.src = ""; // Force clear
        currentLocalAudio = null;
    }
    clearTTSState();
    console.log('[TTS] Stopped all narration');
}

// --- Navigation / Routing ---
function hideAllOverlays() {
    if (resultOverlay) resultOverlay.classList.add('hidden');
    const nameEditCloud = document.getElementById('name-edit-cloud');
    if (nameEditCloud) {
        nameEditCloud.classList.add('hidden');
        nameEditCloud.classList.remove('active');
    }
    const cloudAlert = document.getElementById('cloud-alert');
    if (cloudAlert) {
        cloudAlert.classList.add('hidden');
        cloudAlert.classList.remove('active');
    }
}

function showScreen(screenEl) {
    if (!screenEl) return;

    stopTTS();
    hideAllOverlays();

    console.log("Showing screen:", screenEl.id);

    // Explicitly hide all screens to be 100% sure
    screens.forEach(s => {
        if (s) {
            s.classList.remove('active');
            s.style.display = 'none';
        }
    });

    // Show target screen
    screenEl.classList.add('active');
    screenEl.style.display = (screenEl.id === 'reading-screen' || screenEl.id === 'splash-screen') ? 'flex' : 'flex';
    // Usually screens are flex, but let's be safe.

    // Special handling for reading screen background
    if (screenEl === readingScreen) {
        document.body.style.backgroundColor = '#FFFFFF';
    } else {
        document.body.style.backgroundColor = '#D6EAF8';
    }

    // Bottom Nav Visibility Logic
    const resultOverlayVisible = resultOverlay && !resultOverlay.classList.contains('hidden');
    if (screenEl === splashScreen || screenEl === readingScreen || resultOverlayVisible) {
        if (bottomNav) bottomNav.classList.add('hidden');
    } else {
        if (bottomNav) bottomNav.classList.remove('hidden');
    }

    // Auto-update active tab in bottom nav
    if (bottomNav && !bottomNav.classList.contains('hidden')) {
        bottomNav.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
            if (nav.dataset.target === screenEl.id) {
                nav.classList.add('active');
            }
        });
    }
}

// Bottom Nav Listeners
if (bottomNav) {
    bottomNav.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            const targetScreen = document.getElementById(targetId);

            if (targetScreen) {
                showScreen(targetScreen);

                // Specific updates for screens
                if (targetId === 'leaderboard-screen') updateLeaderboardUI();
                if (targetId === 'profile-screen') updateProfileUI();
                if (targetId === 'gallery-screen') loadGallery();
                if (targetId === 'future-screen') {
                    // أي تحديثات خاصة بشاشة المستقبل
                }
            }
        });
    });
}

function updateProfileUI() {
    const profileName = document.getElementById('profile-student-name');
    const profileScore = document.getElementById('profile-total-score');
    const historyList = document.getElementById('history-list');
    const fontSizeLabel = document.getElementById('current-font-size');

    if (profileName) profileName.textContent = state.studentName || "طالب";
    if (profileScore) profileScore.textContent = state.globalScore || 0;
    if (fontSizeLabel) fontSizeLabel.textContent = (state.fontSize || 28);

    const profileScoreBadge = document.getElementById('profile-global-score');
    if (profileScoreBadge) profileScoreBadge.textContent = state.globalScore || 0;

    // Show saved photo if available
    const savedPhoto = DataManager.getStudentPhoto();
    if (savedPhoto) applyProfileAvatar(savedPhoto);

    // تحديث اختيار المحرك (أونلاين/أوفلاين)
    updateEngineSelectionUI(DataManager.getSpeechEnginePreference());

    if (historyList) {
        const history = DataManager.getHistory();
        if (history.length > 0) {
            historyList.innerHTML = history.map((item, index) => {
                const wrongWordsHtml = (item.wrongWords && item.wrongWords.length > 0)
                    ? `<div class="history-mistakes">
                        <span class="history-mistakes-label"><i class="fa-solid fa-circle-xmark"></i> أخطاء القراءة:</span>
                        <div class="history-mistakes-tags">${item.wrongWords.map(w => `<span class="mistake-tag">${w}</span>`).join('')}</div>
                       </div>`
                    : `<div class="history-no-mistakes"><i class="fa-solid fa-check-circle"></i> لا أخطاء!</div>`;

                const accuracy = item.totalWords > 0
                    ? Math.round((item.correctWords / item.totalWords) * 100)
                    : 0;

                const accuracyColor = accuracy >= 90 ? 'var(--green)' : accuracy >= 70 ? 'var(--orange)' : '#EF4444';

                return `
                <div class="history-item" style="animation-delay: ${index * 0.07}s">
                    <div class="history-item-header">
                        <div class="history-item-title">
                            <i class="fa-solid fa-book-open"></i>
                            <span>${item.title}</span>
                        </div>
                        <div class="history-item-date">${item.date} ${item.time || ''}</div>
                    </div>
                    <div class="history-item-stats">
                        <div class="history-stat earned">
                            <i class="fa-solid fa-star"></i>
                            <div>
                                <div class="history-stat-value">+${item.pointsEarned}</div>
                                <div class="history-stat-label">نقاط مكتسبة</div>
                            </div>
                        </div>
                        <div class="history-stat lost">
                            <i class="fa-solid fa-heart-crack"></i>
                            <div>
                                <div class="history-stat-value">-${item.pointsLost}</div>
                                <div class="history-stat-label">نقاط مخسورة</div>
                            </div>
                        </div>
                        <div class="history-stat accuracy">
                            <i class="fa-solid fa-bullseye"></i>
                            <div>
                                <div class="history-stat-value" style="color:${accuracyColor}">${accuracy}%</div>
                                <div class="history-stat-label">${item.correctWords}/${item.totalWords} كلمة</div>
                            </div>
                        </div>
                    </div>
                    ${wrongWordsHtml}
                </div>`;
            }).join('');
        } else {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fa-solid fa-book-open-reader"></i>
                    <p>لا توجد قراءات مسجلة بعد.</p>
                    <p>ابدأ قراءتك الأولى الآن!</p>
                </div>`;
        }
    }
}

function toggleNameEditCloud(show) {
    const cloud = document.getElementById('name-edit-cloud');
    const input = document.getElementById('new-name-input');
    if (cloud) {
        if (show) {
            hideAllOverlays();
            cloud.classList.remove('hidden');
            cloud.classList.add('active');
            if (input) input.value = state.studentName;
        } else {
            cloud.classList.add('hidden');
            cloud.classList.remove('active');
        }
    }
}

// ============================================================
// ===          رفع الصورة الشخصية للطالب                  ===
// ============================================================

function initPhotoUpload() {
    const uploadBtn = document.getElementById('upload-photo-btn');
    const photoInput = document.getElementById('photo-upload-input');

    if (uploadBtn && photoInput) {
        console.log("initPhotoUpload: UI elements found.");
        const avatarPlaceholder = document.getElementById('profile-avatar-placeholder');

        uploadBtn.addEventListener('click', () => {
            console.log("Camera icon clicked");
            photoInput.click();
        });

        if (avatarPlaceholder) {
            avatarPlaceholder.style.cursor = 'pointer';
            avatarPlaceholder.addEventListener('click', () => {
                console.log("Avatar placeholder clicked");
                photoInput.click();
            });
        }

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                alert('حجم الصورة كبير جداً. اختر صورة أصغر من 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                DataManager.saveStudentPhoto(ev.target.result);
                applyProfileAvatar(ev.target.result);
                if (window.confetti) confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
            };
            reader.readAsDataURL(file);
            photoInput.value = '';
        });
    }

    // Apply saved photo on load
    const saved = DataManager.getStudentPhoto();
    if (saved) applyProfileAvatar(saved);
}

function applyProfileAvatar(photoBase64) {
    const icon = document.getElementById('profile-avatar-icon');
    const img = document.getElementById('profile-avatar-img');
    if (!img) return;
    img.src = photoBase64;
    img.classList.remove('hidden');
    if (icon) icon.classList.add('hidden');
}

// ============================================================
// ===     توليد بطاقة الإنجاز بـ Canvas API              ===
// ============================================================

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

async function generateAchievementCard() {
    const W = 540, H = 950; // Increased height slightly for more details
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    // Load fonts
    try { await document.fonts.load('bold 28px Cairo'); } catch (e) { }

    // --- Background gradient ---
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#4C1D95'); bg.addColorStop(0.6, '#5B21B6'); bg.addColorStop(1, '#7C3AED');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Decorative circles
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.arc(50, 80, 120, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W - 40, H - 80, 140, 0, Math.PI * 2); ctx.fill();

    // --- White card ---
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    drawRoundedRect(ctx, 20, 20, W - 40, H - 40, 26);
    ctx.fill();

    // Gold top bar
    const gold = ctx.createLinearGradient(20, 20, W - 20, 20);
    gold.addColorStop(0, '#F59E0B'); gold.addColorStop(1, '#FBBF24');
    ctx.fillStyle = gold;
    drawRoundedRect(ctx, 20, 20, W - 40, 12, 6);
    ctx.fill();

    // --- Title + Subtitle ---
    ctx.font = 'bold 30px Cairo';
    ctx.fillStyle = '#5B21B6';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.fillText('🏆 شهادة إنجاز القراءة', W / 2, 85);

    ctx.font = 'bold 16px Cairo';
    ctx.fillStyle = '#D97706';
    ctx.fillText('تطبيق هيا نقرأ التعليمي - أ. رشاد صالحة', W / 2, 115);

    // --- Student avatar ---
    const avatarCX = W / 2, avatarCY = 230, avatarR = 85; // Slightly larger avatar
    const photoData = DataManager.getStudentPhoto();

    if (photoData) {
        const img = new Image();
        img.src = photoData;
        await new Promise(r => { img.onload = r; img.onerror = r; });
        ctx.save();
        ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2); ctx.clip();
        // Drawing image with cover fit manually
        const aspect = img.width / img.height;
        let drawW, drawH, dx, dy;
        if (aspect > 1) {
            drawH = avatarR * 2;
            drawW = drawH * aspect;
            dx = avatarCX - drawW / 2;
            dy = avatarCY - avatarR;
        } else {
            drawW = avatarR * 2;
            drawH = drawW / aspect;
            dx = avatarCX - avatarR;
            dy = avatarCY - drawH / 2;
        }
        ctx.drawImage(img, dx, dy, drawW, drawH);
        ctx.restore();
    } else {
        const ag = ctx.createLinearGradient(avatarCX - avatarR, avatarCY - avatarR, avatarCX + avatarR, avatarCY + avatarR);
        ag.addColorStop(0, '#7C3AED'); ag.addColorStop(1, '#EC4899');
        ctx.fillStyle = ag;
        ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2); ctx.fill();
        ctx.font = `bold 64px Cairo`;
        ctx.fillStyle = 'white'; ctx.textAlign = 'center';
        const initial = (state.studentName || '؟').charAt(0);
        ctx.fillText(initial, avatarCX, avatarCY + 22);
    }
    // Avatar border
    ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR + 6, 0, Math.PI * 2); ctx.stroke();

    // --- Name with hearts and likes ---
    ctx.fillStyle = '#1E1B4B';
    ctx.font = 'bold 34px Cairo';
    ctx.textAlign = 'center';
    const nameText = `❤️ ${state.studentName || 'الطالب'} 👍`;
    ctx.fillText(nameText, W / 2, avatarCY + avatarR + 55);

    // --- Score badge ---
    const sY = avatarCY + avatarR + 80;
    const sbW = 240, sbH = 60;
    const sbX = W / 2 - sbW / 2;
    const sg = ctx.createLinearGradient(sbX, sY, sbX + sbW, sY);
    sg.addColorStop(0, '#F59E0B'); sg.addColorStop(1, '#FBBF24');
    ctx.fillStyle = sg;
    drawRoundedRect(ctx, sbX, sY, sbW, sbH, 30); ctx.fill();
    ctx.fillStyle = '#1E1B4B'; ctx.font = 'bold 24px Cairo'; ctx.textAlign = 'center';
    ctx.fillText(`⭐ ${state.globalScore} نقطة إجمالية`, W / 2, sY + 38);

    // --- Divider ---
    const dY = sY + 85;
    ctx.strokeStyle = 'rgba(124,58,237,0.2)'; ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(40, dY); ctx.lineTo(W - 40, dY); ctx.stroke();
    ctx.setLineDash([]);

    // Section label
    ctx.fillStyle = '#5B21B6'; ctx.font = 'bold 20px Cairo'; ctx.textAlign = 'center';
    ctx.fillText('آخر ٣ قراءات مميزة', W / 2, dY + 35);

    // --- Reading rows ---
    const history = DataManager.getHistory().slice(0, 3);
    let ry = dY + 60;
    const rowColors = ['#F8F7FF', '#FFFBF5', '#F5FAFF'];
    const barColors = ['#7C3AED', '#F97316', '#3B82F6'];

    if (history.length === 0) {
        ctx.fillStyle = '#94A3B8'; ctx.font = '18px Cairo'; ctx.textAlign = 'center';
        ctx.fillText('ابدأ رحلتك لتظهر إنجازاتك هنا!', W / 2, ry + 40);
    } else {
        history.forEach((item, i) => {
            const hasMistakes = item.wrongWords && item.wrongWords.length > 0;
            const rH = hasMistakes ? 105 : 75; // taller if has mistakes
            const rX = 35, rW = W - 70; // Wider box

            ctx.fillStyle = rowColors[i];
            drawRoundedRect(ctx, rX, ry, rW, rH, 16); ctx.fill();
            // Accent bar
            ctx.fillStyle = barColors[i];
            drawRoundedRect(ctx, rX, ry, 7, rH, 4); ctx.fill();

            // Title (Right)
            ctx.fillStyle = '#1E293B'; ctx.font = 'bold 16px Cairo';
            ctx.textAlign = 'right'; ctx.direction = 'rtl';
            let title = item.title || 'درس';
            if (title.length > 20) title = title.slice(0, 19) + '…';
            ctx.fillText(title, rX + rW - 18, ry + 32);

            // Date (Right)
            ctx.fillStyle = '#94A3B8'; ctx.font = '13px Cairo';
            ctx.fillText(item.date || '', rX + rW - 18, ry + 56);

            // Points (Left)
            ctx.fillStyle = '#D97706'; ctx.font = 'bold 18px Cairo';
            ctx.textAlign = 'left'; ctx.direction = 'ltr';
            ctx.fillText(`+${item.pointsEarned || 0} ⭐`, rX + 22, ry + 32);

            // Accuracy (Left)
            const acc = item.totalWords > 0 ? Math.round((item.correctWords / item.totalWords) * 100) : 0;
            ctx.fillStyle = acc >= 90 ? '#10B981' : acc >= 70 ? '#F97316' : '#EF4444';
            ctx.font = 'bold 15px Cairo';
            ctx.fillText(`دقة: ${acc}%`, rX + 22, ry + 56);

            // Wrong words (Bottom of row if exists)
            if (hasMistakes) {
                ctx.fillStyle = '#BE123C'; ctx.font = 'bold 12px Cairo';
                ctx.textAlign = 'right'; ctx.direction = 'rtl';
                const words = item.wrongWords.join(' ، ');
                ctx.fillText('الأخطاء: ' + words, rX + rW - 18, ry + 88);
            }

            ry += rH + 12;
        });
    }

    // --- Footer ---
    const fY = H - 45 - 25;
    ctx.fillStyle = 'rgba(124,58,237,0.08)';
    drawRoundedRect(ctx, 40, fY, W - 80, 40, 20); ctx.fill();
    ctx.fillStyle = '#7C3AED'; ctx.font = 'bold 14px Cairo';
    ctx.textAlign = 'center'; ctx.direction = 'rtl';
    ctx.fillText('تطبيق هيا نقرأ - أ. رشاد صالحة', W / 2, fY + 26);

    return cv.toDataURL('image/png');
}

// ============================================================
// ===          مشاركة الإنجاز على واتساب                  ===
// ============================================================

async function shareAchievement() {
    const btn = document.getElementById('share-achievement-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التجهيز...'; }

    try {
        // نص الإنجاز دائماً جاهز
        const shareText = `🏆 إنجاز الطالب: ${state.studentName || 'بطلنا'}\n⭐ النقاط الإجمالية: ${state.globalScore}\n📚 تطبيق هيا نقرأ التعليمي - أ. رشاد صالحة`;

        // محاولة مشاركة الصورة (تتطلب إنترنت لتوليد الكارد)
        if (navigator.onLine) {
            try {
                const dataUrl = await generateAchievementCard();
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], `انجاز-${state.studentName || 'الطالب'}.png`, { type: 'image/png' });

                // Web Share API مع الملف (يفتح قائمة التطبيقات الخارجية)
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `🏆 إنجاز ${state.studentName || 'الطالب'}`,
                        text: shareText
                    });
                    return; // نجحت المشاركة
                }

                // Fallback: تنزيل الصورة ثم فتح واتساب بالنص
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `انجاز-${state.studentName || 'الطالب'}.png`;
                a.click();
                setTimeout(() => {
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                }, 1000);
                return;
            } catch (imgErr) {
                console.warn('[Share] Image share failed, falling back to text:', imgErr);
            }
        }

        // Fallback أوفلاين أو إذا فشلت الصورة: مشاركة نص فقط
        if (navigator.share) {
            await navigator.share({
                title: `🏆 إنجاز ${state.studentName || 'الطالب'}`,
                text: shareText
            });
        } else {
            // آخر خيار: فتح واتساب مباشرة
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        }

    } catch (err) {
        if (err.name !== 'AbortError') {
            // المستخدم لم يلغِ - نفتح واتساب كبديل
            const txt = encodeURIComponent(`🏆 ${state.studentName || 'بطلنا'} | ⭐ ${state.globalScore} نقطة | تطبيق هيا نقرأ`);
            window.open(`https://wa.me/?text=${txt}`, '_blank');
        }
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-share-nodes"></i> مشاركة الإنجاز'; }
    }
}


const saveNewNameBtn = document.getElementById('save-new-name-btn');
if (saveNewNameBtn) {
    saveNewNameBtn.addEventListener('click', () => {
        const input = document.getElementById('new-name-input');
        const newName = input.value.trim();
        if (newName.length < 2) {
            alert("يرجى كتابة اسم صحيح.");
            return;
        }

        DataManager.saveStudentName(newName);
        state.studentName = newName;

        // Update UI
        updateProfileUI();
        toggleNameEditCloud(false);

        // Update cloud
        registerStudentOnCloud(newName);

        alert("تم تحديث الاسم بنجاح!");
    });
}

function changeFontSize(delta) {
    const newSize = (state.fontSize || 28) + delta;
    if (newSize < 18 || newSize > 60) return;

    state.fontSize = newSize;
    document.documentElement.style.setProperty('--reading-font-size', `${newSize}px`);
    localStorage.setItem('reading_font_size', newSize);

    const fontSizeLabel = document.getElementById('current-font-size');
    if (fontSizeLabel) fontSizeLabel.textContent = newSize;
}

// Apply font size on load
(function () {
    const savedSize = parseInt(localStorage.getItem('reading_font_size')) || 28;
    state.fontSize = savedSize;
    document.documentElement.style.setProperty('--reading-font-size', `${savedSize}px`);

    window.addEventListener('DOMContentLoaded', () => {
        const fontSizeLabel = document.getElementById('current-font-size');
        if (fontSizeLabel) fontSizeLabel.textContent = savedSize;


    });
})();



/**
 * نظام تحميل الأصول المسبق (Asset Preloader)
 * يضمن تحميل كافة الصور والأصوات قبل بدء التطبيق
 */
const AssetPreloader = {
    assets: [
        "assets/lo.png", "assets/mascot.png", "assets/avatar.png",
        "assets/images/lessons/1.png", "assets/images/lessons/2.png",
        "assets/images/lessons/3.png", "assets/images/lessons/4.png",
        "assets/images/lessons/5.png", "assets/images/lessons/6.png",
        "assets/images/lessons/7.png", "assets/images/lessons/8.png",
        "assets/images/lessons/9.png", "assets/images/lessons/10.png",
        "assets/images/lessons/11.png", "assets/images/lessons/12.png",
        "assets/audio/success.mp3", "assets/audio/wrong.mp3", "assets/audio/correct.mp3", "assets/audio/s.mp3",
        "assets/cairo-400.ttf", "assets/cairo-700.ttf",
        "assets/webfonts/fa-solid-900.woff2", "assets/webfonts/fa-regular-400.woff2", "assets/webfonts/fa-brands-400.woff2"
    ],
    loadedCount: 0,

    preload: function (onProgress, onComplete) {
        console.log("AssetPreloader: Starting...");
        let finished = false;
        const total = this.assets.length;
        const timeout = setTimeout(() => {
            if (!finished) {
                console.warn("Preload timeout");
                onComplete();
            }
        }, 10000); // 10s max wait

        this.assets.forEach(src => {
            const isAudio = src.endsWith('.mp3');
            const el = isAudio ? new Audio() : new Image();

            const handleLoad = () => {
                this.loadedCount++;
                const progress = Math.round((this.loadedCount / total) * 100);
                onProgress(progress);
                if (this.loadedCount === total) {
                    finished = true;
                    clearTimeout(timeout);
                    onComplete();
                }
            };

            el.onload = el.oncanplaythrough = handleLoad;
            el.onerror = handleLoad;
            el.src = src;
        });
    }
};

// --- Initialization ---
async function initApp() {
    checkConnectivity();

    const preloaderDiv = document.getElementById('global-preloader');
    const progressFill = document.getElementById('global-progress-fill');
    const loaderText = document.getElementById('global-loader-text');

    AssetPreloader.preload(
        (progress) => {
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (loaderText) loaderText.textContent = `جاري تحميل العناصر... ${progress}%`;
        },
        async () => {
            if (preloaderDiv) preloaderDiv.classList.add('hidden');
            await startAppLogic();
        }
    );
}

async function startAppLogic() {
    console.log("[App] Starting...");

    // Secure Context Check
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn("[App] Not running in a secure context. ASR may not work.");
        updateASRStatusUI('error', 'يجب استخدام HTTPS أو localhost لتشغيل الميكروفون.');
    }

    try {
        state.lessons = await DataManager.fetchAndSyncLessons();
        state.globalScore = DataManager.getGlobalScore();
        state.readingStrictness = DataManager.getReadingStrictness();
        state.readingPhilosophy = typeof DataManager.getReadingPhilosophy === 'function' ? DataManager.getReadingPhilosophy() : 'standard';
        state.ttsRate = DataManager.getTTSRate();

        // Background pre-fetch of leaderboard to cache it
        DataManager.fetchLeaderboardData().then(() => console.log('Leaderboard pre-fetched')).catch(e => console.warn(e));

        // Initialize Professional Speech Manager
        state.speechManager = new ProfessionalSpeechManager({
            onFinalResult: (text) => handleFinalSpeechResult(text),
            onInterimResult: (text) => handleInterimSpeechResult(text),
            onStart: () => {
                state.isListening = true;
                if (micBtn) micBtn.classList.add('listening');
                resetInactivityTimer();
            },
            onEnd: () => {
                // إعادة التشغيل فوراً إذا انقطع المحرك لضمان "التدفق المستمر"
                if (state.isListening && state.currentWordIndex < state.words.length) {
                    state.speechManager.start();
                } else {
                    state.isListening = false;
                    if (micBtn) micBtn.classList.remove('listening');
                }
            },
            onError: (err) => {
                console.warn("[ASR] Error:", err);
                if (state.isListening && err !== 'aborted') {
                    setTimeout(() => {
                        if (state.isListening) state.speechManager.start();
                    }, 300);
                }
            }
        });

        // Preload engine to be ready
        const splashBtn = document.getElementById('start-app-btn');

        if (splashBtn) splashBtn.disabled = true; // نغلقه حتى يجهز المحرك

        state.speechManager.preload().then(() => {
            if (splashBtn) splashBtn.disabled = false;
        }).catch(err => {
            console.error("Preload error:", err);
            if (splashBtn) splashBtn.disabled = false;
        });

        updateConnectivityUI();
        window.addEventListener('online', updateConnectivityUI);
        window.addEventListener('offline', updateConnectivityUI);

        // Sync pending reports when online
        window.addEventListener('online', syncPendingReports);

        const savedNameFinal = DataManager.getStudentName();
        if (savedNameFinal && savedNameFinal.length >= 2) {
            state.studentName = savedNameFinal;

            // Show beautiful name display instead of input
            if (nameInputWrapper) nameInputWrapper.classList.add('hidden');
            if (nameDisplayView) {
                nameDisplayView.classList.remove('hidden');
                if (displayName) displayName.textContent = savedNameFinal;
            }
        } else {
            if (nameInputWrapper) nameInputWrapper.classList.remove('hidden');
            if (nameDisplayView) nameDisplayView.classList.add('hidden');
        }

        showScreen(splashScreen);
        playBackgroundMusic();
        initPhotoUpload();

        // Add interaction listener to start music if autoplay was blocked
        window.addEventListener('click', () => {
            if (bgMusic && bgMusic.paused && splashScreen.classList.contains('active')) {
                playBackgroundMusic();
            }
        }, { once: true });

        // Pre-load Whisper for offline readiness
        setTimeout(() => {
            const whisper = new WhisperEngine({});
            whisper._init();
        }, 1500);
    } catch (error) {
        console.error("App Init Error:", error);
        showScreen(splashScreen);
    }
}

function updateConnectivityUI() {
    const badge = document.getElementById('connectivity-badge');
    if (!badge) return;

    const span = badge.querySelector('span');
    const icon = badge.querySelector('i');

    if (navigator.onLine) {
        badge.classList.remove('offline');
        if (span) span.textContent = 'متصل';
        if (icon) icon.className = 'fa-solid fa-wifi';
    } else {
        badge.classList.add('offline');
        if (span) span.textContent = 'أوفلاين';
        if (icon) icon.className = 'fa-solid fa-plane-slash';
    }
}

async function syncPendingReports() {
    const pendingReports = JSON.parse(localStorage.getItem('pendingReports') || '[]');
    if (pendingReports.length === 0) return;

    console.log('[Sync] Sending pending reports:', pendingReports.length);

    const webhookUrl = "https://script.google.com/macros/s/AKfycbwmw00l63FDwzdA8fM-06J2-7YSQ_V40yJ5c3XqOmC1c4Us5HjHCe0WXO_G_tFjqJUWBQ/exec";

    for (const report of pendingReports) {
        try {
            await fetch(webhookUrl, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(report)
            });
            console.log('[Sync] Report sent successfully');
        } catch (e) {
            console.error('[Sync] Failed to send report:', e);
            // Keep it in pending if failed
            return;
        }
    }

    localStorage.removeItem('pendingReports');
    console.log('[Sync] All pending reports synced.');
}

// --- Splash Logic ---
startAppBtn.addEventListener('click', () => {
    try {
        const name = (state.studentName && state.studentName.length >= 2) ? state.studentName : nameInput.value.trim();

        if (name.length < 2) {
            alert("يرجى كتابة اسمك بشكل صحيح.");
            return;
        }

        // Show loading state
        startAppBtn.disabled = true;
        startAppBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري البدء...';

        state.studentName = name;
        DataManager.saveStudentName(name);

        // Call cloud registration in background
        registerStudentOnCloud(name);

        // Proceed to welcome
        showWelcomeScreen();
    } catch (err) {
        console.error("Start App Click Error:", err);
        // Fallback: try to go to gallery anyway
        showWelcomeScreen();
    }
});

// ============================================================
// ===   مدير المزامنة التلقائية (SyncManager)             ===
// ============================================================
const SyncManager = {
    isSyncing: false,
    WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbxGxfJSwT7jpGI1hdPuRaBKsesTvJuRnWGNu7gKFPx357Av1VB9mUoWdFzba3rWnpJx/exec",

    async trySync() {
        if (this.isSyncing || !navigator.onLine) return;
        const queue = DataManager.getSyncQueue();
        if (queue.length === 0) return;

        console.log(`[SyncManager] مزامنة ${queue.length} عنصر...`);
        this.isSyncing = true;
        try {
            for (const item of queue) {
                await fetch(this.WEBHOOK_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(item)
                });
            }
            DataManager.clearSyncQueue();
            console.log('[SyncManager] تمت المزامنة بنجاح.');
        } catch (err) {
            console.error('[SyncManager] فشلت المزامنة:', err);
        } finally {
            this.isSyncing = false;
        }
    }
};

// مزامنة تلقائية عند عودة الإنترنت
window.addEventListener('online', () => SyncManager.trySync());
// مزامنة دورية كل دقيقة
setInterval(() => SyncManager.trySync(), 60000);

function registerStudentOnCloud(name) {
    // الآن يستخدم نظام الـ ID الدائم والمزامنة الذكية
    DataManager.addToSyncQueue({
        type: 'REGISTER',
        studentId: DataManager.getStudentId(),
        studentName: name,
        score: 0,
        lessonTitle: 'تسجيل جديد',
        timestamp: new Date().toISOString()
    });
    SyncManager.trySync();
}

function playBackgroundMusic() {
    if (bgMusic) {
        bgMusic.volume = 0.4;
        bgMusic.play().catch(e => console.log("Autoplay blocked, waiting for interaction."));
    }
}

function stopBackgroundMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

// --- Welcome Logic ---
const greetings = [
    "مرحباً بعودتك يا بطل",
    "أهلاً بالقارئ المتميز",
    "سعداء برؤيتك يا",
    "حان وقت الإبداع يا",
    "أنرت التطبيق يا",
    "جاهز للقراءة يا"
];

function showWelcomeScreen() {
    stopListening();
    stopTTS();

    // Simplified: Confetti and go directly to Gallery
    if (window.confetti) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    // Smooth transition to Gallery

    setTimeout(() => {
        loadGallery();
    }, 500);
}

// --- Gallery Logic ---
const lessonIcons = {
    1: "fa-gem", 2: "fa-broom", 3: "fa-crow", 4: "fa-bread-slice",
    5: "fa-ship", 6: "fa-award", 7: "fa-anchor", 8: "fa-hand-holding-heart",
    9: "fa-fish", 10: "fa-laptop-code", 11: "fa-wheat-awn", 12: "fa-leaf"
};

const lessonImages = {
    1: "assets/images/lessons/1.png", 2: "assets/images/lessons/2.png",
    3: "assets/images/lessons/3.png", 4: "assets/images/lessons/4.png",
    5: "assets/images/lessons/5.png", 6: "assets/images/lessons/6.png",
    7: "assets/images/lessons/7.png", 8: "assets/images/lessons/8.png",
    9: "assets/images/lessons/9.png", 10: "assets/images/lessons/10.png",
    11: "assets/images/lessons/11.png", 12: "assets/images/lessons/12.png"
};

function loadGallery() {
    try {
        stopListening();
        stopTTS();

        const displayNameStr = state.studentName || DataManager.getStudentName() || "بطلنا";
        if (hpStudentName) hpStudentName.textContent = displayNameStr;
        if (hpGlobalScore) hpGlobalScore.textContent = state.globalScore || 0;
        if (lessonsGrid) {
            lessonsGrid.innerHTML = '';
            state.lessons.forEach(lesson => {
                const card = document.createElement('div');
                card.className = 'lesson-card';

                // Get progress for this lesson
                const progress = DataManager.getLessonProgress(lesson.id);

                // Set background image via CSS variable for independent opacity
                const imageUrl = lessonImages[lesson.id] || '';
                if (imageUrl) {
                    card.style.setProperty('--card-bg', `url(${imageUrl})`);
                }

                card.innerHTML = `
                    <div class="lesson-number">${lesson.id}</div>
                    <div class="lesson-card-body">
                        <!-- Space for the image -->
                    </div>
                    <div class="lesson-title-bar">
                        <h3>${lesson.title}</h3>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                `;
                card.addEventListener('click', () => {
                    card.classList.add('clicked');
                    setTimeout(() => {
                        startReadingSession(lesson);
                        card.classList.remove('clicked');
                    }, 300);
                });
                lessonsGrid.appendChild(card);
            });
        }

        showScreen(galleryScreen);
        updateScoreUI();
    } catch (error) {
        console.error("Load Gallery Error:", error);
    }
}

// --- Profile Save Logic (now a full screen) ---
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        const newName = editNameInput ? editNameInput.value.trim() : state.studentName;
        const newStrictness = strictnessSelect ? strictnessSelect.value : 'medium';
        const newPhilosophy = philosophySelect ? philosophySelect.value : 'standard';
        const newTTSRate = ttsRateSelect ? parseFloat(ttsRateSelect.value) : 1.0;

        if (newName.length < 2) {
            // Mascot message removed
            if (editNameInput) {
                editNameInput.classList.add('shake');
                setTimeout(() => editNameInput.classList.remove('shake'), 400);
            }
            return;
        }

        DataManager.saveStudentName(newName);
        DataManager.saveReadingStrictness(newStrictness);
        if (DataManager.saveReadingPhilosophy) DataManager.saveReadingPhilosophy(newPhilosophy);
        DataManager.saveTTSRate(newTTSRate);
        state.studentName = newName;
        state.readingStrictness = newStrictness;
        state.readingPhilosophy = newPhilosophy;
        state.ttsRate = newTTSRate;
        if (window.confetti) confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        loadGallery();
    });
}

// --- Reading Logic ---
function startReadingSession(lesson) {
    stopBackgroundMusic();
    stopListening();
    state.currentLessonId = lesson.id;
    readingTitle.innerHTML = lesson.title;

    state.sessionStats = {
        correctWords: 0,
        mistakeCount: 0,
        lessonPoints: 0,
        mistakes: new Set(),
        startTime: Date.now(),
        endTime: null
    };

    state.globalScore = DataManager.getGlobalScore();
    updateScoreUI();

    state.lastWordMatchTime = performance.now();
    state.currentWordIndex = 0;
    state.lastPartialTokenCount = 0; // إعادة ضبط عداد الكلمات مع كل درس جديد
    resetInactivityTimer();

    const rawContentWords = lesson.content.trim().split(/\s+/);

    state.words = rawContentWords.map((word, index) => ({
        id: index,
        displayText: word,
        normalizedText: normalizeArabic(word),
        variants: generateVariants(word),
        status: 'normal',
        attempts: 0
    }));

    updateProgressBar(); // تهيئة الشريط عند بداية الدرس

    // تحميل مفردات الدرس مدمجة مع القاموس الشامل (لمنع التطابق الخاطئ في الأوفلاين كما في الأونلاين)
    if (state.speechManager) {
        const vocabSet = new Set(state.globalVocabulary); // نستخدم القاموس الشامل
        vocabSet.add('[unk]');
        rawContentWords.forEach(word => {
            // إضافة الكلمة المطبّعة (بدون تشكيل)
            const clean = normalizeArabic(word);
            if (clean) vocabSet.add(clean);

            // إضافة المتغيرات الصوتية الشائعة
            generateVariants(word).forEach(v => {
                const cv = normalizeArabic(v);
                if (cv) vocabSet.add(cv);
            });
        });
        state.speechManager.setVocabulary(Array.from(vocabSet));
        console.log("[ASR] Vocabulary loaded:", vocabSet.size, "words");
    }

    renderWords();
    showScreen(readingScreen);

}

/**
 * تحليل فهرس الدروس بالكامل لبناء قاعدة بيانات صوتية للمحرك
 */
function analyzeAllLessonsVocabulary() {
    console.log("[Curriculum] Analyzing all lessons for ASR optimization...");
    if (typeof ALL_LESSONS === 'undefined') return;

    ALL_LESSONS.forEach(lesson => {
        const words = lesson.content.trim().split(/\s+/);
        words.forEach(word => {
            const clean = normalizeArabic(word);
            if (clean) state.globalVocabulary.add(clean);

            // إضافة جميع المتغيرات الصوتية (الشدة، الهمزات، التنوين)
            generateVariants(word).forEach(v => {
                const cv = normalizeArabic(v);
                if (cv) state.globalVocabulary.add(cv);
            });
        });
    });
    console.log(`[Curriculum] Analysis complete. Global Vocab Size: ${state.globalVocabulary.size} unique phonetic paths.`);
}

function renderWords() {
    canvas.innerHTML = '';
    if (state.words.length === 0) return;

    state.words.forEach((w, i) => {
        const span = document.createElement('span');
        span.className = `word ${w.status}`;
        span.dataset.index = i;

        const isActive = i === state.currentWordIndex;
        if (isActive && w.status !== 'correct') {
            span.classList.add('active');
        }

        span.textContent = w.displayText;

        if (w.status === 'incorrect') {
            span.onclick = () => showHint(`حاول نطق: "${w.displayText}"`);
        }

        // ميزة "حركة الطفو" الجمالية عند النقر على الكلمة
        span.addEventListener('click', () => {
            span.classList.add('word-float-active');
            setTimeout(() => span.classList.remove('word-float-active'), 600);
        });

        canvas.appendChild(span);
        canvas.appendChild(document.createTextNode(' '));

        if (isActive) {
            setTimeout(() => {
                span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    });
}

function showHint(text) {
    _playErrorSound();
}

/**
 * تشغيل صوت تحذير خفيف (Web Audio API) بدلاً من الصوت القوي السابق
 * يهدف هذا الصوت ليكون تنبيهاً لطيفاً للطالب دون إزعاجه
 */
function _playErrorSound() {
    const now = Date.now();
    // تقييد تكرار الصوت لضمان عدم تداخله المزعج
    if (!state.lastErrorSoundTime || now - state.lastErrorSoundTime > 400) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const audioCtx = new AudioContext();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'sine'; // صوت ناعم جداً
                osc.frequency.setValueAtTime(450, audioCtx.currentTime); // تردد متوسط
                osc.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + 0.1);

                gain.gain.setValueAtTime(0, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.02); // صوت هادئ جداً
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + 0.2);
                
                // تنظيف السياق الصوتي بعد انتهاء النغمة
                setTimeout(() => {
                    if (audioCtx.state !== 'closed') audioCtx.close();
                }, 400);
            }
        } catch (e) {
            console.log("Audio API fallback");
            const sound = document.getElementById('error-sound');
            if (sound) {
                sound.currentTime = 0;
                sound.volume = 0.1; // صوت خفيف جداً كبديل
                sound.play().catch(() => { });
            }
        }
        state.lastErrorSoundTime = now;
    }
}


function completeStory() {
    stopListening();

    // تشغيل صوت التشجيع والموسيقى الاحتفالية
    if (cheerSound) {
        cheerSound.currentTime = 0;
        cheerSound.volume = 1.0;
        cheerSound.play().catch(() => { });
    }

    // فرقعة قصاصات ورقية مكثفة (Confetti)
    if (window.confetti) {
        const duration = 4 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 9999 };

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 100 * (timeLeft / duration);
            // إطلاق من اليمين
            confetti({ ...defaults, particleCount, origin: { x: 0, y: 0.6 } });
            // إطلاق من اليسار
            confetti({ ...defaults, particleCount, origin: { x: 1, y: 0.6 } });
            // إطلاق من المنتصف
            confetti({ ...defaults, particleCount, origin: { x: 0.5, y: 0.3 } });
        }, 300);
    }

    // الانتقال لصفحة النتائج بعد فترة قصيرة ليستمتع الطالب بالاحتفال
    setTimeout(() => {
        showSummary();
    }, 3500);
}

// ============================================================
// ===      محرك التعرف على الكلام الاحترافي               ===
// ============================================================

function updateASRStatusUI(status, message, progress = null) {
    const indicator = document.getElementById('asr-cloud-popup');
    const text = document.getElementById('asr-cloud-text');
    const progressContainer = document.getElementById('asr-progress-container');
    const progressBar = document.getElementById('asr-progress-bar');

    if (!indicator || !text) return;

    // تعطيل ظهور النافذة المنبثقة بناءً على طلب المستخدم
    indicator.classList.add('hidden');

    if (status === 'hidden') {
        return;
    }

    text.textContent = message;

    if (progress !== null && progressContainer && progressBar) {
        progressContainer.classList.add('active');
        progressBar.style.width = `${progress}%`;
    } else if (progressContainer) {
        if (status === 'ready' || status === 'error') {
            progressContainer.classList.remove('active');
        }
    }
}

/**
 * ProfessionalSpeechManager
 */
class ProfessionalSpeechManager {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.currentEngineType = DataManager.getSpeechEnginePreference() || 'google';
        this.updateEngine();
    }

    updateEngine() {
        const pref = DataManager.getSpeechEnginePreference();
        if (pref === 'vosk') {
            this.engine = new OfflineEngine(this.callbacks);
            if (window.AndroidSpeech) window.AndroidSpeech.setEngine('vosk');
        } else {
            this.engine = new OnlineEngine(this.callbacks);
            if (window.AndroidSpeech) window.AndroidSpeech.setEngine('google');
        }
    }

    preload() {
        return Promise.resolve();
    }

    start() {
        if (this.engine) this.engine.start();
    }

    stop() {
        if (this.engine) this.engine.stop();
    }

    setVocabulary(words) {
        // Online engine handles vocabulary dynamically via context
    }

    destroy() {
        if (this.engine) this.engine.destroy();
    }
}

/**
 * محرك التعرف الصوتي غير المباشر (Offline) باستخدام Vosk عبر الجسر البرمجي
 */
class OfflineEngine {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.isActive = false;
        this.useAndroidBridge = !!window.AndroidSpeech;
    }

    start() {
        this.isActive = true;
        if (this.useAndroidBridge) {
            try {
                if (!window.AndroidSpeech.isVoskReady()) {
                    updateASRStatusUI('error', 'جاري تهيئة المحرك الأوفلاين...');
                    return;
                }
                window.AndroidSpeech.startSpeech();
                updateASRStatusUI('listening', 'استماع (أوفلاين)...');
                if (this.callbacks.onStart) this.callbacks.onStart();
            } catch (e) {
                console.error("OfflineEngine Start Error:", e);
                updateASRStatusUI('error', 'خطأ في تشغيل الأوفلاين');
            }
        } else {
            updateASRStatusUI('error', 'محرك الأوفلاين متاح فقط على تطبيق الأندرويد');
        }
    }

    stop() {
        this.isActive = false;
        if (this.useAndroidBridge) {
            try {
                window.AndroidSpeech.stopSpeech();
                updateASRStatusUI('ready', 'جاهز');
                if (this.callbacks.onEnd) this.callbacks.onEnd();
            } catch (e) { }
        }
    }

    destroy() {
        this.stop();
    }
}

// دالة عالمية للتبديل بين المحركات
window.changeSpeechEngine = function(engine) {
    DataManager.saveSpeechEnginePreference(engine);
    if (state.speechManager) {
        state.speechManager.updateEngine();
        showGlobalToast(`تم التبديل إلى المحرك: ${engine === 'vosk' ? 'أوفلاين (Vosk)' : 'أونلاين (Google)'}`, 'success');
    }
    updateEngineSelectionUI(engine);
};


// تهيئة الواجهة عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    const isAndroid = !!window.AndroidSpeech;
    const voskBtn = document.getElementById('engine-vosk-btn');
    
    if (!isAndroid && voskBtn) {
        voskBtn.disabled = true;
        voskBtn.classList.add('disabled-btn');
        voskBtn.title = 'متاح فقط في تطبيق الأندرويد';
        
        // إذا كان المتصفح ليس أندرويد وكان الإعداد محفوظاً كـ vosk، حوله لـ online
        if (DataManager.getSpeechEnginePreference() === 'vosk') {
            DataManager.saveSpeechEnginePreference('online');
        }
    }
    
    // تحديث شكل الأزرار بناءً على الخيار الحالي
    updateEngineSelectionUI(DataManager.getSpeechEnginePreference());
});

function updateEngineSelectionUI(engine) {
    const googleBtn = document.getElementById('engine-google-btn');
    const voskBtn = document.getElementById('engine-vosk-btn');
    
    if (googleBtn && voskBtn) {
        googleBtn.classList.toggle('active', engine === 'google' || engine === 'online');
        voskBtn.classList.toggle('active', engine === 'vosk');
    }
}

// يُستدعى من الأندرويد عند اكتمال تحميل موديل Vosk
window.onVoskReady = function() {
    console.log('[Vosk] Model ready!');
    const voskBtn = document.getElementById('engine-vosk-btn');
    if (voskBtn) {
        voskBtn.disabled = false;
        voskBtn.title = '';
    }
    const pref = DataManager.getSpeechEnginePreference();
    if (pref === 'vosk') {
        showGlobalToast('محرك الأوفلاين جاهز للاستخدام! ✅', 'success');
    }
};

// يُستدعى من الأندرويد إذا فشل تحميل الموديل
window.onVoskError = function(msg) {
    console.error('[Vosk] Model error:', msg);
    showGlobalToast('فشل تحميل محرك الأوفلاين. تحقق من الملفات.', 'error');
    const voskBtn = document.getElementById('engine-vosk-btn');
    if (voskBtn) {
        voskBtn.disabled = true;
        voskBtn.title = 'خطأ في تحميل الموديل';
    }
};



/**
 * محرك التعرف الصوتي المباشر (Online) باستخدام Web Speech API
 */
class OnlineEngine {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.recognition = null;
        this.isActive = false;

        // التحقق من وجود الجسر البرمجي للأندرويد (أكثر موثوقية في WebView)
        this.useAndroidBridge = !!window.AndroidSpeech;

        if (this.useAndroidBridge) {
            console.log("OnlineEngine: Using Android Native Bridge");
            updateASRStatusUI('ready', 'جاهز');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("متصفحك لا يدعم التعرف على الصوت.");
            updateASRStatusUI('error', 'متصفحك لا يدعم التعرف على الصوت.');
            return;
        }

        this.recognition = new SpeechRecognition();

        // إعدادات مخصصة للغة العربية للتميز العالي وتجاوز التشكيل
        this.recognition.lang = 'ar';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            console.log("OnlineEngine: Started");
            this.isActive = true;
            if (this.callbacks.onStart) this.callbacks.onStart();
            updateASRStatusUI('listening', 'جاري الاستماع...');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptSegment = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptSegment;
                } else {
                    interimTranscript += transcriptSegment;
                }
            }

            // في الأندرويد، النتائج المؤقتة غالباً ما تكون هي الجملة الحالية كاملة
            if (interimTranscript.trim()) {
                handleInterimSpeechResult(interimTranscript);
            }
            if (finalTranscript.trim()) {
                handleFinalSpeechResult(finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error("OnlineEngine Error:", event.error);
            if (event.error === 'not-allowed') {
                updateASRStatusUI('error', 'تم رفض صلاحية الميكروفون');
                this.stop();
            } else if (event.error === 'network') {
                updateASRStatusUI('error', 'مشكلة في الاتصال بالإنترنت');
                this.stop();
            }
            if (this.callbacks.onError) this.callbacks.onError(event.error);
        };

        this.recognition.onend = () => {
            console.log("OnlineEngine: Ended");
            if (this.isActive) {
                setTimeout(() => {
                    try {
                        if (this.isActive) this.recognition.start();
                    } catch (e) { }
                }, 100); // إعادة تشغيل سريعة جداً لضمان الاستمرارية
            } else {
                updateASRStatusUI('ready', 'جاهز');
                if (this.callbacks.onEnd) this.callbacks.onEnd();
            }
        };

        updateASRStatusUI('ready', 'جاهز');
    }

    start() {
        // إذا كان الجهاز غير متصل، وكان المحرك المختار هو جوجل، نبه المستخدم
        if (!navigator.onLine && DataManager.getSpeechEnginePreference() !== 'vosk') {
            showGlobalToast('لا يوجد اتصال.. جرب تشغيل المحرك الأوفلاين من الإعدادات', 'error');
            return;
        }

        this.isActive = true;

        if (this.useAndroidBridge) {
            try {
                window.AndroidSpeech.startSpeech();
                updateASRStatusUI('listening', 'جاري الاستماع...');
                if (this.callbacks.onStart) this.callbacks.onStart();
            } catch (e) {
                console.error("AndroidBridge Start Error:", e);
                updateASRStatusUI('error', 'خطأ في تشغيل المايك');
            }
            return;
        }

        if (this.recognition) {
            try {
                this.recognition.start();
            } catch (e) {
                console.warn(e);
            }
        }
    }

    stop() {
        this.isActive = false;
        if (this.useAndroidBridge) {
            try {
                window.AndroidSpeech.stopSpeech();
                updateASRStatusUI('ready', 'جاهز');
                if (this.callbacks.onEnd) this.callbacks.onEnd();
            } catch (e) { }
            return;
        }
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) { }
        }
    }
}

// bridge handlers removed

// done





// ============================================================
// ===       منطق المطابقة والتقدم في القراءة             ===
// ============================================================

// قائمة الكلمات الوظيفية القصيرة التي يُتجاوزها Vosk كثيراً
const FUNCTION_WORDS = new Set([
    // حروف الجر
    'في', 'من', 'إلى', 'على', 'عن', 'مع', 'حتى', 'خلا', 'حاشا', 'عدا',
    'ل', 'ب', 'ك', 'و', 'ف', 'ثم',
    // أدوات النفي والعطف
    'لا', 'لم', 'لن', 'ليس', 'ما', 'إلا',
    // أدوات الشرط والجواب
    'إن', 'أن', 'كي', 'لو', 'لولا',
    // ضمائر ومتعلقات
    'هو', 'هي', 'هم', 'هن', 'هما', 'أنت', 'أنتم',
    'الذي', 'التي', 'الذين', 'اللواتي', 'اللوات',
    // أسماء إشارة
    'هذا', 'هذه', 'ذلك', 'تلك',
    // أدوات الاستفهام
    'هل', 'كيف', 'متى', 'أين', 'لماذا',
    // عبارات شائعة
    'قد', 'كان', 'كانت', 'لكن', 'ولكن', 'حيث', 'عندما', 'أو', 'أي',
].map(w => normalizeArabic(w)));

function isFunctionWord(normalizedText) {
    if (!normalizedText) return false;
    // الكلمات ذات حرف واحد دائماً وظيفية
    if (normalizedText.length <= 1) return true;
    return FUNCTION_WORDS.has(normalizeArabic(normalizedText));
}

function isLikelySpeech(token) {
    if (!token) return false;
    const clean = normalizeArabic(token);
    // تجاهل الأصوات المفردة التي تشبه الضجيج (إلا إذا كانت حروف عطف حقيقية)
    if (clean.length <= 1 && !'وبف'.includes(clean)) return false;
    return true;
}

/**
 * محرك المطابقة الذكي
 * - يعمل على النتائج النهائية فقط للدقة
 * - يستخدم نافذة متحركة للبحث عن تسلسل صحيح
 * - يتحمل السقطات الصوتية والاضطرابات
 */
const MatchingEngine = {

    /**
     * هل الكلمة المنطوقة تطابق كلمة هدف بعتبة معينة؟
     */
    isMatch(spoken, targetWord, strictness) {
        if (!spoken || !targetWord) return { matched: false, score: 0 };
        const threshold = strictness === 'hard' ? 0.85 : (strictness === 'medium' ? 0.75 : 0.65);
        const spokenClean = normalizeArabic(spoken);
        const targetClean = typeof targetWord === 'object' ? targetWord.normalizedText : normalizeArabic(targetWord);

        // شرط 2: عقوبة الكلمات المدموجة أو المجزأة (Length Penalty)
        // إذا كان الفارق في الطول أكبر من حرفين، نعتبرها غير متطابقة تربوياً
        if (Math.abs(spokenClean.length - targetClean.length) > 2 && !isFunctionWord(targetClean)) {
            return { matched: false, score: 0 };
        }

        // شرط 4: فحص اللواصق في المستوى الصعب (Hard Mode)
        if (strictness === 'hard' && !isFunctionWord(targetClean)) {
            const commonPrefixes = ['ال', 'ب', 'ف', 'و', 'ك', 'ل'];
            const hasTargetPrefix = commonPrefixes.some(p => targetClean.startsWith(p));
            const hasSpokenPrefix = commonPrefixes.some(p => spokenClean.startsWith(p));
            if (hasTargetPrefix && !hasSpokenPrefix && targetClean.length > 3) {
                return { matched: false, score: 0.3 }; // عقوبة نسيان الـ التعريف أو حروف الجر المتصلة
            }
        }

        let bestScore = 0;
        bestScore = Math.max(bestScore, compareWords(spokenClean, targetClean, strictness));
        if (targetWord.variants) {
            targetWord.variants.forEach(variant => {
                const variantClean = normalizeArabic(variant);
                bestScore = Math.max(bestScore, compareWords(spokenClean, variantClean, strictness));
            });
        }
        return { matched: bestScore >= threshold, score: bestScore };
    },

    /**
     * معالجة قائمة الكلمات المنطوقة وتحديث التقدم
     * خوارزمية التدفق المستمر: تدعم القراءة السريعة والمطابقة المتعددة في جملة واحدة
     */
    processWords(spokenTokens, strictness, isFinal = false) {
        let anyMatched = false;
        let lastMatchedSpokenIndex = -1;

        // في هذا النظام الجديد، نبدأ دائماً من الكلمة الحالية التي يقف عليها المؤشر
        let searchIndex = state.currentWordIndex;

        for (let i = 0; i < spokenTokens.length; i++) {
            if (searchIndex >= state.words.length) break;

            const spoken = spokenTokens[i];
            if (!isLikelySpeech(spoken)) continue; // تصفية الضجيج

            // 0. محاولة "التصحيح الذاتي" (Self-Correction)
            // إذا نطق الطالب الكلمة السابقة التي أخطأ فيها، نقبلها ونصحح لونها
            if (searchIndex > 0) {
                const prevIdx = searchIndex - 1;
                const prevWord = state.words[prevIdx];
                if (prevWord.status === 'incorrect' || prevWord.status === 'skipped-underline') {
                    if (this.isMatch(spoken, prevWord, strictness).matched) {
                        this._acceptWord(prevWord, 1.0, prevIdx, false, true); // نصححها دون تحريك المؤشر للأمام
                        continue; // ننتقل للكلمة المنطوقة التالية
                    }
                }
            }

            const targetWord = state.words[searchIndex];

            // 1. محاولة مطابقة الكلمة الحالية
            const { matched, score } = this.isMatch(spoken, targetWord, strictness);

            if (matched) {
                this._acceptWord(targetWord, score, searchIndex);
                anyMatched = true;
                lastMatchedSpokenIndex = i;
                searchIndex++; // ننتقل للكلمة التالية للبحث عنها بالكلمة المنطوقة القادمة
                continue;
            }

            // 🟢 ميزة التغذية الراجعة المستمرة: محاولة مطابقة الكلمة التالية مباشرة (اكتشاف التخطي)
            // تم تشديدها جداً: التخطي مسموح فقط في النتائج النهائية (isFinal) لضمان عدم "السبق"
            if (searchIndex + 1 < state.words.length) {
                const nextTarget = state.words[searchIndex + 1];
                const nextMatch = this.isMatch(spoken, nextTarget, 'hard');

                // التخطي مسموح فقط في النتيجة النهائية لضمان أن الطالب تجاوز الكلمة فعلياً
                if (isFinal && nextMatch.matched) {
                    // الطالب تخطى الكلمة الحالية
                    this._underlineSkippedWord(targetWord, searchIndex);
                    this._acceptWord(nextTarget, nextMatch.score, searchIndex + 1);
                    anyMatched = true;
                    lastMatchedSpokenIndex = i;
                    searchIndex += 2;
                    continue;
                }
            }

            // 2. محاولة مطابقة "الكلمات المدمجة" (مثلاً: "في المدرسة" ينطقها ككلمة واحدة)
            if (searchIndex + 1 < state.words.length) {
                const nextTarget = state.words[searchIndex + 1];
                const combinedTarget = targetWord.normalizedText + nextTarget.normalizedText;

                if (this.isMatch(spoken, { normalizedText: combinedTarget, variants: new Set([combinedTarget]) }, strictness).matched) {
                    this._acceptWord(targetWord, 0.9, searchIndex);
                    this._acceptWord(nextTarget, 0.9, searchIndex + 1);
                    anyMatched = true;
                    lastMatchedSpokenIndex = i;
                    searchIndex += 2;
                    continue;
                }
            }

            // 3. إذا لم يطابق الطالب الكلمة الحالية (خطأ أو تخطي)
            if (isFinal && spoken.length > 1) {
                // نعتبرها محاولة خاطئة للكلمة الحالية
                const isFinalRejection = this._rejectWord(targetWord, searchIndex);

                if (isFinalRejection) {
                    // إذا تم احتسابها كخطأ نهائي، ننتقل للكلمة التالية لنحاول مطابقتها مع نفس الكلمة المنطوقة الحالية
                    searchIndex++;
                    i--; // نعيد معالجة نفس الكلمة المنطوقة مع الكلمة الهدف الجديدة
                } else {
                    // إذا كانت مجرد فرصة ثانية (هزة/خط)، نتوقف عن المعالجة ليركز الطالب
                    break;
                }
            }
        }

        const consumedSpokenCount = lastMatchedSpokenIndex >= 0 ? lastMatchedSpokenIndex + 1 : 0;
        return { anyMatched, consumedSpokenCount };
    },

    _acceptWord(word, score, index, isSilent = false, doNotAdvanceIndex = false) {
        if (word.status === 'correct') return;

        word.status = 'correct';
        word.attempts = 0;
        if (state.sessionStats) state.sessionStats.correctWords++;
        state.lastWordMatchTime = performance.now();

        const wordSpan = document.querySelector(`.word[data-index="${index}"]`);
        if (wordSpan) {
            wordSpan.className = 'word correct';
            // نزيل خط التجاوز إن وجد
            wordSpan.style.textDecoration = 'none';
        }

        if (!doNotAdvanceIndex) {
            this._advanceCurrentIndex();
            this._activateNextWord();
        }

        updateProgressBar(); // تحديث شريط التقدم

        // النجمة تظهر فقط عند كسب نقطة جديدة (كل 4 كلمات صحيحة)
        if (state.sessionStats && state.sessionStats.correctWords % 4 === 0) {
            state.globalScore++;
            updateScoreUI(true);
            if (wordSpan) showStarFloatingFeedback(wordSpan);
        }

        // تم إزالة تشغيل الصوت هنا بناءً على طلب المستخدم ليكون الصمت هو الأساس عند تلوين الكلمة
    },

    _rejectWord(word, index) {
        if (word.status === 'correct' || word.status === 'incorrect' || word.status === 'missed') return false;

        if (state.readingPhilosophy === 'patient') {
            word.attempts = (word.attempts || 0) + 1;
            if (word.attempts < 2) {
                // تلميح بصري: خط متعرج برتقالي تحت الكلمة (كما طلب المستخدم) وهزة
                const wordSpan = document.querySelector(`.word[data-index="${index}"]`);
                if (wordSpan) {
                    wordSpan.style.textDecoration = 'underline';
                    wordSpan.style.textDecorationColor = '#f59e0b'; // orange
                    wordSpan.style.textDecorationStyle = 'wavy';
                    wordSpan.classList.add('shake');

                    if (word.attempts >= 1) {
                        speakText(word.displayText);
                    }

                    setTimeout(() => {
                        wordSpan.classList.remove('shake');
                    }, 500);
                }
                return false; // لم يتم الرفض النهائي بعد
            }
        }

        word.status = 'incorrect';
        if (state.sessionStats) {
            state.sessionStats.mistakeCount = (state.sessionStats.mistakeCount || 0) + 1;
            if (state.sessionStats.mistakes) state.sessionStats.mistakes.add(word.displayText);
        }

        if (index >= state.currentWordIndex) state.currentWordIndex = index + 1;

        const wordSpan = document.querySelector(`.word[data-index="${index}"]`);
        if (wordSpan) {
            wordSpan.className = 'word incorrect';
            wordSpan.style.textDecoration = 'none'; // نزيل الخط المتعرج عند الفشل النهائي
            _playErrorSound();
        }

        return true; // تم الرفض النهائي
    },

    _missWord(word, index) {
        if (word.status === 'correct' || word.status === 'incorrect' || word.status === 'missed') return;
        word.status = 'missed';
        if (state.sessionStats) {
            state.sessionStats.mistakeCount = (state.sessionStats.mistakeCount || 0) + 1;
            if (state.sessionStats.mistakes) state.sessionStats.mistakes.add(word.displayText);
        }

        if (index >= state.currentWordIndex) state.currentWordIndex = index + 1;

        const wordSpan = document.querySelector(`.word[data-index="${index}"]`);
        if (wordSpan) {
            wordSpan.className = 'word missed';
            wordSpan.style.textDecoration = 'none';
        }

        this._activateNextWord();
    },

    _underlineSkippedWord(word, index) {
        if (word.status === 'correct') return;
        word.status = 'skipped-underline';

        const wordSpan = document.querySelector(`.word[data-index="${index}"]`);
        if (wordSpan) {
            wordSpan.classList.add('skipped-underline');
            wordSpan.style.textDecoration = 'underline';
            wordSpan.style.textDecorationColor = '#f59e0b'; // orange
            wordSpan.style.textDecorationStyle = 'wavy';
        }
    },

    _advanceCurrentIndex() {
        while (state.currentWordIndex < state.words.length && state.words[state.currentWordIndex].status === 'correct') {
            state.currentWordIndex++;
        }
    },

    _activateNextWord() {
        const nextSpan = document.querySelector(`.word[data-index="${state.currentWordIndex}"]`);
        if (nextSpan) {
            document.querySelectorAll('.word.active, .active-word-indicator').forEach(el => {
                el.classList.remove('active', 'waiting-pulse', 'active-word-indicator');
            });
            nextSpan.classList.add('active', 'active-word-indicator');
            if (typeof resetHeartbeatTimer === 'function') resetHeartbeatTimer(nextSpan);
            if (!state.isScrolling) {
                state.isScrolling = true;
                setTimeout(() => {
                    try { nextSpan.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { }
                    state.isScrolling = false;
                }, 50);
            }
        }
    },

    _playErrorSound() {
        // نستخدم الوظيفة العالمية الآن لتوحيد التجربة
        _playErrorSound();
    }

};

function resetHeartbeatTimer(element) {
    if (state.heartbeatTimer) clearTimeout(state.heartbeatTimer);
    state.heartbeatTimer = setTimeout(() => {
        if (element && element.classList.contains('active')) {
            element.classList.add('waiting-pulse');
        }
    }, 2500);
}

function showFloatingFeedback(element, textToShow) {
    if (!element) return;

    const checkDiv = document.createElement('div');
    checkDiv.className = 'floating-checkmark-new';
    checkDiv.textContent = '✅';

    const rect = element.getBoundingClientRect();
    checkDiv.style.left = `${rect.left + rect.width / 2}px`;
    checkDiv.style.top = `${rect.top}px`;

    document.body.appendChild(checkDiv);

    setTimeout(() => checkDiv.remove(), 1500);
}

function showStarFloatingFeedback(element) {
    if (!element) return;

    const starDiv = document.createElement('div');
    starDiv.className = 'floating-star';
    starDiv.textContent = '⭐';

    const scoreBadge = document.querySelector('.reading-global-score-badge') ||
        document.querySelector('.hp-score-section') ||
        document.querySelector('.user-score-badge');

    const rect = element.getBoundingClientRect();
    const x = rect.left + (rect.width / 2);
    const y = rect.top - 10;

    starDiv.style.left = `${x}px`;
    starDiv.style.top = `${y}px`;

    if (scoreBadge) {
        const scoreRect = scoreBadge.getBoundingClientRect();
        const deltaX = (scoreRect.left + scoreRect.width / 2) - x;
        const deltaY = (scoreRect.top + scoreRect.height / 2) - y;
        starDiv.style.setProperty('--target-x', `${deltaX}px`);
        starDiv.style.setProperty('--target-y', `${deltaY}px`);
    } else {
        starDiv.style.setProperty('--target-x', `0px`);
        starDiv.style.setProperty('--target-y', `-300px`);
    }

    document.body.appendChild(starDiv);

    // تشغيل صوت "الذهب" أو زيادة النقاط عند خروج النجمة
    if (successSound) {
        successSound.currentTime = 0;
        successSound.volume = 0.6; // صوت أوضح قليلاً للنجمة
        successSound.play().catch(() => { });
    }

    // تنظيف العنصر بعد انتهاء الأنيماشن
    setTimeout(() => starDiv.remove(), 1000);
}

function handleFinalSpeechResult(transcript) {
    if (state.currentWordIndex >= state.words.length) return;
    const tokens = tokenizeTranscript(transcript);
    if (tokens.length === 0) return;

    // في النتيجة النهائية، نعالج جميع الكلمات المنطوقة
    MatchingEngine.processWords(tokens, state.readingStrictness, true);

    // تصفير العداد تحضيراً للجملة التالية
    state.lastPartialTokenCount = 0;
    resetInactivityTimer();

    if (state.currentWordIndex >= state.words.length) {
        clearInactivityTimer();
        setTimeout(completeStory, 600);
    }
}

function handleInterimSpeechResult(transcript) {
    if (state.currentWordIndex >= state.words.length) return;
    const tokens = tokenizeTranscript(transcript);
    if (tokens.length === 0) return;

    // في وضع التدفق المستمر، نحاول مطابقة ما وصلنا من الجملة الحالية
    MatchingEngine.processWords(tokens, state.readingStrictness, false);
    resetInactivityTimer();

    // التحقق من انتهاء القصة في النتائج المؤقتة لسرعة الاستجابة
    if (state.currentWordIndex >= state.words.length) {
        clearInactivityTimer();
        setTimeout(completeStory, 500);
    }
}

/**
 * تحويل نص القراءة إلى قائمة رموز نظيفة
 */
function tokenizeTranscript(transcript) {
    const tokens = transcript
        .trim()
        .replace(/[\u064B-\u065F\u0670]/g, '') // إزالة التشكيل من المدخل
        .replace(/[.,،؛:?!؟()«»]/g, ' ')       // تحويل الترقيم لمسافات
        .split(/\s+/)
        .filter(w => w.length > 0);

    // حذف الكلمات المكررة المتتالية كما طلب المستخدم
    const uniqueTokens = [];
    for (let i = 0; i < tokens.length; i++) {
        if (i === 0 || tokens[i] !== tokens[i - 1]) {
            uniqueTokens.push(tokens[i]);
        }
    }
    return uniqueTokens;
}

function updateDebugHUD(message, color = '#3498db') {
    const debugHud = document.getElementById('debug-asr-hud');
    if (!debugHud) return;

    // إخفاء لوحة التصحيح البرمجية تماماً بناءً على طلب المستخدم
    debugHud.classList.add('hidden');
    return;
}

function startListening() {
    stopTTS();
    if (state.speechManager) state.speechManager.start();
}

function stopListening() {
    state.isListening = false;
    clearInactivityTimer();
    if (state.speechManager) state.speechManager.stop();
    if (micBtn) micBtn.classList.remove('listening');
}

// --- Inactivity Timer Logic ---
function resetInactivityTimer() {
    clearInactivityTimer();
    if (state.isListening && state.currentWordIndex < state.words.length) {
        state.inactivityTimer = setTimeout(() => {
            handleReadingError();
        }, 6000); // 6 ثوانٍ قبل إعلان الخطأ
    }
}

function clearInactivityTimer() {
    if (state.inactivityTimer) {
        clearTimeout(state.inactivityTimer);
        state.inactivityTimer = null;
    }
}

function handleReadingError() {
    if (!state.isListening || state.currentWordIndex >= state.words.length) return;

    const targetWord = state.words[state.currentWordIndex];
    targetWord.attempts = (targetWord.attempts || 0) + 1;

    targetWord.status = 'incorrect';

    // تحديث سريع للـ DOM لدعم السرعة
    const wordSpan = document.querySelector(`.word[data-index="${state.currentWordIndex}"]`);
    if (wordSpan) {
        wordSpan.className = 'word incorrect active';
        wordSpan.onclick = () => showHint(`حاول نطق: "${targetWord.displayText}"`);
    }

    state.sessionStats.mistakes.add(targetWord.displayText);
    state.sessionStats.mistakeCount = (state.sessionStats.mistakeCount || 0) + 1;

    // خصم نقطة لكل خطئين
    if (state.sessionStats.mistakeCount % 2 === 0) {
        state.globalScore = Math.max(0, state.globalScore - 1);
        state.sessionStats.lessonPoints = Math.max(0, (state.sessionStats.lessonPoints || 0) - 1);
        updateScoreUI();
    }

    if (targetWord.attempts >= 2) {
        setTimeout(() => {
            if (state.currentWordIndex < state.words.length && state.words[state.currentWordIndex] === targetWord) {
                targetWord.status = 'skipped';
                if (wordSpan) wordSpan.className = 'word incorrect'; // إزالة active

                state.currentWordIndex++;

                if (state.currentWordIndex >= state.words.length) {
                    completeStory();
                    return;
                }

                const nextSpan = document.querySelector(`.word[data-index="${state.currentWordIndex}"]`);
                if (nextSpan) {
                    nextSpan.classList.add('active');
                    try { nextSpan.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { }
                }
                resetInactivityTimer();

                if (state.currentWordIndex >= state.words.length) {
                    clearInactivityTimer();
                    completeStory();
                } else {
                    resetInactivityTimer();
                }
            }
        }, 3000);
    } else {
        showHint(`حاول نطق: "${targetWord.displayText}"`);

        // نطق الكلمة الصحيحة باستخدام Text-to-Speech للمساعدة
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(targetWord.displayText);
            utterance.lang = 'ar-SA';
            utterance.rate = state.ttsRate || 1.0;
            window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => {
            if (state.words[state.currentWordIndex] === targetWord && targetWord.attempts < 2) {
                targetWord.status = 'normal';
                if (wordSpan) wordSpan.className = 'word normal active'; // إرجاع الكلمة لطبيعتها
                resetInactivityTimer();
            }
        }, 3000);
    }
}

// --- Text-to-Speech & Audio System ---
function applyTTSWordHighlight(charIndex) {
    // Clear existing highlights
    const canvasRef = document.getElementById('text-canvas');
    if (canvasRef) {
        canvasRef.querySelectorAll('.tts-highlight').forEach(el => el.classList.remove('tts-highlight'));
        canvasRef.querySelectorAll('.tts-highlight-sentence').forEach(el => el.classList.remove('tts-highlight-sentence'));
    }

    let accumulatedLengths = 0;
    let targetWordIndex = 0;
    for (let i = 0; i < state.words.length; i++) {
        const length = state.words[i].displayText.length;
        if (charIndex >= accumulatedLengths && charIndex <= accumulatedLengths + length) {
            targetWordIndex = i;
            break;
        }
        accumulatedLengths += length + 1;
    }

    if (targetWordIndex >= state.words.length) targetWordIndex = state.words.length - 1;

    const wordSpans = canvasRef ? canvasRef.querySelectorAll('.word') : [];
    if (wordSpans[targetWordIndex]) {
        // Highlight the parent sentence instead of just the word
        const parentSentence = wordSpans[targetWordIndex].closest('.sentence-wrap');
        if (parentSentence) {
            parentSentence.classList.add('tts-highlight-sentence');
            try { parentSentence.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { }
        } else {
            wordSpans[targetWordIndex].classList.add('tts-highlight');
        }
    }
}

function toggleTTS() {
    const icon = ttsBtn.querySelector('i');

    if (currentLocalAudio) {
        if (!currentLocalAudio.paused) {
            currentLocalAudio.pause();
            icon.className = 'fa-solid fa-play';
            ttsBtn.classList.add('paused');
        } else {
            currentLocalAudio.play().catch((error) => {
                console.warn("[Audio] Play failed:", error);
                alert("فشل في تشغيل الصوت. جرب مرة أخرى.");
            });
            icon.className = 'fa-solid fa-pause';
            ttsBtn.classList.remove('paused');
        }
        return;
    }

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        if (!window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            icon.className = 'fa-solid fa-play';
            ttsBtn.classList.add('paused');
        } else {
            window.speechSynthesis.resume();
            icon.className = 'fa-solid fa-pause';
            ttsBtn.classList.remove('paused');
        }
        return;
    }

    stopTTS();

    const currentLesson = state.lessons.find(l => l.id === state.currentLessonId);
    if (!currentLesson) return;

    icon.className = 'fa-solid fa-circle-notch fa-spin';

    const audioUrls = [
        `assets/d${currentLesson.id}.mp3`,
        `assets/audio/d${currentLesson.id}.mp3`,
        `assets/audio/lesson_${currentLesson.id}.mp3`
    ];

    console.log("[Audio] Attempting to load local audio for lesson:", currentLesson.id);

    const tryFetchAudio = (index) => {
        if (index >= audioUrls.length) {
            console.log("[Audio] No local files found, falling back to TTS.");
            playFallbackTTS(currentLesson);
            return;
        }

        const url = audioUrls[index];
        console.log("[Audio] Trying URL:", url);

        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audio.src = url;

        const handleLoadedAudio = () => {
            console.log("[Audio] Successfully loaded:", url);
            currentLocalAudio = audio;
            if (icon) icon.className = 'fa-solid fa-pause';
            if (ttsBtn) ttsBtn.classList.add('active');
            audio.play().then(() => {
                setupLocalAudioKaraoke(audio, currentLesson);
            }).catch((playError) => {
                console.warn("[Audio] Play failed:", playError);
                tryFetchAudio(index + 1);
            });
        };

        const handleErrorAudio = () => {
            console.warn("[Audio] Failed to load:", url);
            audio.removeEventListener('canplaythrough', handleLoadedAudio);
            audio.removeEventListener('loadeddata', handleLoadedAudio);
            audio.removeEventListener('error', handleErrorAudio);
            tryFetchAudio(index + 1);
        };

        audio.addEventListener('canplaythrough', handleLoadedAudio);
        audio.addEventListener('loadeddata', handleLoadedAudio);
        audio.addEventListener('error', handleErrorAudio);
        audio.load();
    };

    tryFetchAudio(0);
}

function setupLocalAudioKaraoke(audio, lesson) {
    const canvas = document.getElementById('text-canvas');
    const titleEl = document.getElementById('reading-title');
    const titleTimings = lesson.titleTimings || [];

    // Build sentence groups — support both explicit wordStart/wordEnd and auto-detection
    let sentenceGroups = [];

    if (lesson.sentences && lesson.sentences.length > 0) {
        const timings = lesson.timings || [];
        lesson.sentences.forEach(sent => {
            if (sent.wordStart !== undefined && sent.wordEnd !== undefined) {
                // Use pre-computed word indices directly
                sentenceGroups.push({ wordStart: sent.wordStart, wordEnd: sent.wordEnd, s: sent.s, e: sent.e });
            } else if (timings.length > 0) {
                // Map by timing overlap
                let wordStart = -1, wordEnd = -1;
                for (let i = 0; i < timings.length; i++) {
                    const ws = typeof timings[i] === 'object' ? timings[i].s : timings[i];
                    if (ws >= sent.s && ws < sent.e) {
                        if (wordStart === -1) wordStart = i;
                        wordEnd = i;
                    }
                }
                if (wordStart !== -1) sentenceGroups.push({ wordStart, wordEnd, s: sent.s, e: sent.e });
            }
        });
    } else {
        // Auto-detect from punctuation
        const timings = lesson.timings || [];
        const rawWords = lesson.content.trim().split(/\s+/);
        const PUNCT = /[،,؛:؟?!.。]/;
        let groupStart = 0;
        for (let i = 0; i < rawWords.length; i++) {
            if (PUNCT.test(rawWords[i]) || i === rawWords.length - 1) {
                if (timings[groupStart] && timings[i]) {
                    const s = typeof timings[groupStart] === 'object' ? timings[groupStart].s : timings[groupStart];
                    const e = typeof timings[i] === 'object' ? timings[i].e : timings[i];
                    sentenceGroups.push({ wordStart: groupStart, wordEnd: i, s, e });
                }
                groupStart = i + 1;
            }
        }
        for (let i = 0; i < sentenceGroups.length - 1; i++) sentenceGroups[i].e = sentenceGroups[i + 1].s;
        if (sentenceGroups.length > 0) sentenceGroups[sentenceGroups.length - 1].e = audio.duration || 9999;
    }

    let lastGroupIndex = -2, lastTitleActive = null;

    audio.onended = () => {
        stopTTS();
        if (canvas) canvas.querySelectorAll('.tts-highlight').forEach(el => el.classList.remove('tts-highlight'));
        if (titleEl) titleEl.classList.remove('tts-highlight-title');
    };

    audio.ontimeupdate = () => {
        const t = audio.currentTime;
        let isTitleActive = false, activeGroupIndex = -1;

        for (const seg of titleTimings) {
            if (t >= seg.s && t <= seg.e) { isTitleActive = true; break; }
        }

        if (!isTitleActive) {
            for (let i = 0; i < sentenceGroups.length; i++) {
                if (t >= sentenceGroups[i].s && t < sentenceGroups[i].e) { activeGroupIndex = i; break; }
            }
        }

        if (activeGroupIndex === lastGroupIndex && isTitleActive === lastTitleActive) return;
        lastGroupIndex = activeGroupIndex;
        lastTitleActive = isTitleActive;

        if (canvas) canvas.querySelectorAll('.tts-highlight').forEach(el => el.classList.remove('tts-highlight'));
        if (titleEl) titleEl.classList.remove('tts-highlight-title');

        if (isTitleActive) {
            if (titleEl) titleEl.classList.add('tts-highlight-title');
        } else if (activeGroupIndex !== -1) {
            const g = sentenceGroups[activeGroupIndex];
            const spans = canvas ? canvas.querySelectorAll('.word') : [];
            for (let i = g.wordStart; i <= g.wordEnd && i < spans.length; i++) spans[i].classList.add('tts-highlight');
            if (spans[g.wordStart]) try { spans[g.wordStart].scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { }
        }
    };
}

function playFallbackTTS(lesson) {
    showCloudAlert("قريباً...");
    stopTTS();
}

function showCloudAlert(text) {
    const overlay = document.getElementById('cloud-alert');
    const textEl = document.getElementById('cloud-alert-text');
    if (overlay && textEl) {
        textEl.textContent = text || "قريباً...";
        overlay.classList.remove('hidden');
        overlay.classList.add('active');

        // Auto hide after 3 seconds
        setTimeout(() => {
            overlay.classList.remove('active');
            overlay.classList.add('hidden');
        }, 3000);

        // Hide on click
        overlay.onclick = () => {
            overlay.classList.remove('active');
            overlay.classList.add('hidden');
        };
    }
}


// --- Summary & Result Overlay ---
function showSummary() {
    stopListening();
    state.sessionStats.endTime = Date.now();
    const currentLesson = state.lessons.find(l => l.id === state.currentLessonId);

    // حساب نقاط هذه الجلسة بناءً على الكلمات الصحيحة فقط
    const correctCount = state.sessionStats.correctWords || 0;
    const sessionTotal = correctCount;

    // تحديث الإجمالي العام (Global Score) بنقاط هذه القراءة
    state.globalScore += sessionTotal;
    updateScoreUI();

    const totalWords = state.words.length || 1;

    // إخفاء شريط التنقل لتركيز الانتباه على النتيجة
    if (bottomNav) bottomNav.classList.add('hidden');

    if (resultOverlay) {
        const totalWords = state.words.length || 1;
        const accuracy = (correctCount / totalWords) * 100;

        // تحديث المجموع الكلي مع أنيميشن عداد
        const totalEl = document.getElementById('result-session-total');
        if (totalEl) {
            animateValue(totalEl, 0, sessionTotal, 1000);
        }

        // ========== رسالة مخصصة وتشجيعية ==========
        const resultMsg = document.getElementById('result-message');
        if (resultMsg) {
            if (accuracy >= 90) {
                resultMsg.textContent = "مذهل يا بطل! قراءتك متقنة جداً كأنك مذيع محترف 🌟";
                resultMsg.style.color = "var(--green)";
            } else if (accuracy >= 70) {
                resultMsg.textContent = "أداء رائع! أنت تتقدم بسرعة كبيرة، استمر في التدريب 💪";
                resultMsg.style.color = "var(--purple)";
            } else {
                resultMsg.textContent = "بداية جيدة! كل بطل يحتاج للتدريب، حاول مرة أخرى لتجمع المزيد من النجوم 📚";
                resultMsg.style.color = "var(--orange)";
            }
        }

        // تشغيل الصوت التعزيزي (محلي ومتغير)
        _playRewardSound(accuracy);

        // احتفال خاص إذا كانت الدقة >= 90%
        if (accuracy >= 90) {
            setTimeout(() => {
                if (resultCard) resultCard.classList.add('celebration-active');
                triggerVictoryCelebration();
            }, 300);
        }

        // ========== عرض الكلمات الخاطئة بشكل بارز ==========
        const mistakesContainer = document.getElementById('mistakes-container');
        const resultMistakes = document.getElementById('result-mistakes');

        if (mistakesContainer && resultMistakes) {
            const mistakes = Array.from(state.sessionStats.mistakes || []);
            if (mistakes.length > 0) {
                // تجميع الكلمات المكررة وحساب عددها
                const mistakeCounts = mistakes.reduce((acc, word) => {
                    acc[word] = (acc[word] || 0) + 1;
                    return acc;
                }, {});

                resultMistakes.innerHTML = Object.entries(mistakeCounts).map(([word, count]) => {
                    const countBadge = count > 1 ? `<span style="background:#FEE2E2; color:#DC2626; padding:0 6px; border-radius:6px; font-size:11px; margin-right:4px;">${count}×</span>` : '';
                    return `<span class="mistake-tag" onclick="window.speechSynthesis.speak(new SpeechSynthesisUtterance('${word}'))">
                        <i class="fa-solid fa-volume-high"></i>
                        ${countBadge}${word}
                    </span>`;
                }).join('');

                mistakesContainer.classList.remove('hidden');
            } else {
                resultMistakes.innerHTML = '<p class="no-mistakes-msg"><i class="fa-solid fa-circle-check"></i> قراءة مثالية! لم تخطئ في أي كلمة 🎉</p>';
                mistakesContainer.classList.remove('hidden');
                const mistakesTitle = mistakesContainer.querySelector('h3');
                if (mistakesTitle) mistakesTitle.style.display = 'none';
            }
        }

        // --- ميزة الوقت المستغرق الجديدة ---
        const timeTakenSec = Math.round((state.sessionStats.endTime - state.sessionStats.startTime) / 1000);
        const minutes = Math.floor(timeTakenSec / 60);
        const seconds = timeTakenSec % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const timeEl = document.getElementById('result-time-taken');
        if (timeEl) {
            timeEl.textContent = timeStr;
        }

        hideAllOverlays();
        resultOverlay.classList.remove('hidden');

        // الحفظ في السجل
        if (currentLesson) {
            DataManager.addToHistory(
                currentLesson.title,
                sessionTotal,
                0, // حذفنا lostPoints لأنه لم يعد مطلوباً
                correctCount,
                totalWords,
                Array.from(state.sessionStats.mistakes || [])
            );
        }
    }

    if (closeResultBtn) {
        closeResultBtn.onclick = () => {
            console.log("[Result] Closing overlay and going to gallery");
            if (resultOverlay) resultOverlay.classList.add('hidden');
            if (bottomNav) bottomNav.classList.remove('hidden');
            loadGallery();
        };
    }

    // Save progress locally
    const correctRatio = Math.round((correctCount / totalWords) * 100);
    DataManager.saveLessonProgress(state.currentLessonId, correctRatio);

    sendReportToGoogleSheets();
}

function goToNextLesson() {
    const nextLesson = state.lessons.find(l => l.id === state.currentLessonId + 1);
    if (nextLesson) startReadingSession(nextLesson);
    else loadGallery();
}

async function sendReportToGoogleSheets() {
    const currentLesson = state.lessons.find(l => l.id === state.currentLessonId);
    const totalWords = state.words.length || 1;
    const correctRatio = Math.round((state.sessionStats.correctWords / totalWords) * 100);
    const timeTakenSec = Math.round((state.sessionStats.endTime - state.sessionStats.startTime) / 1000);
    const wrongWordsArr = Array.from(state.sessionStats.mistakes || []);

    // بناء الحمولة مع معرف الطالب الدائم
    const payload = {
        type: 'LESSON_REPORT',
        studentId: DataManager.getStudentId(),
        studentName: state.studentName || "طالب غير معروف",
        lessonTitle: currentLesson ? currentLesson.title : "درس غير معروف",
        score: state.globalScore || 0,
        lessonScore: state.sessionStats.lessonPoints || 0,
        correctWords: state.sessionStats.correctWords || 0,
        totalWords: totalWords,
        correctRatio: `${correctRatio}%`,
        wrongWordsList: wrongWordsArr.join('، '),
        timeTaken: `${timeTakenSec} ثانية`,
        date: new Date().toLocaleDateString('ar-EG'),
        aiFeedback: (correctRatio >= 90) ? "ممتاز! قراءة متقنة جداً 🌟" : (correctRatio >= 70 ? "جيد جداً، واصل التدريب 💪" : "تحتاج لمزيد من التدريب، أنت تستطيع! 📚"),
        timestamp: new Date().toISOString()
    };

    // إضافة التقرير لطابور المزامنة (يعمل أوفلاين وأونلاين)
    DataManager.addToSyncQueue(payload);

    if (!navigator.onLine) {
        if (sendStatus) {
            sendStatus.style.color = '#f39c12';
            sendStatus.textContent = '📥 تم حفظ التقرير - سيُرسل للمعلم عند الاتصال بالإنترنت.';
        }
        return;
    }

    if (sendStatus) {
        sendStatus.style.color = '#3498DB';
        sendStatus.textContent = 'جاري مزامنة النقاط مع المعلم...';
    }

    try {
        await SyncManager.trySync();
        if (sendStatus) {
            sendStatus.style.color = '#2ECC71';
            sendStatus.textContent = '✅ تم تحديث نقاطك عند المعلم بنجاح!';
        }
    } catch (e) {
        console.error('[Report] Send failed:', e);
        if (sendStatus) {
            sendStatus.style.color = '#E74C3C';
            sendStatus.textContent = '⚠️ سيُعاد إرسال التقرير عند الاتصال.';
        }
    }
}


// --- Event Listeners ---
if (micBtn) micBtn.addEventListener('click', () => {
    if (state.isListening) stopListening();
    else startListening();
});

if (retryBtn) retryBtn.addEventListener('click', () => {
    startReadingSession(state.lessons.find(l => l.id === state.currentLessonId));
});

if (ttsBtn) ttsBtn.addEventListener('click', toggleTTS);
if (endSessionBtn) endSessionBtn.addEventListener('click', showSummary);
if (backToGalleryBtn) backToGalleryBtn.addEventListener('click', loadGallery);

// --- Leaderboard Integration (Full Screen) ---
async function updateLeaderboardUI() {
    if (!leaderboardList) return;

    const cachedData = DataManager.getCachedLeaderboard();

    // If we have cache, show it immediately without spinner
    if (cachedData && cachedData.length > 0) {
        renderLeaderboardRows(cachedData);
    } else {
        // Only show spinner if we have nothing to show at all
        leaderboardList.innerHTML = '<div class="leaderboard-spinner"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><div>جاري تصنيف الأبطال...</div></div>';
    }

    // Always fetch latest in background and re-render
    try {
        const latestData = await DataManager.fetchLeaderboardData();
        renderLeaderboardRows(latestData);
    } catch (e) {
        console.warn('Failed to update leaderboard in foreground', e);
    }
}

function renderLeaderboardRows(studentsData) {
    if (!leaderboardList) return;

    if (state.studentName) {
        const existingIndex = studentsData.findIndex(s => s.name === state.studentName);
        if (existingIndex > -1) {
            studentsData[existingIndex].score = Math.max(state.globalScore, studentsData[existingIndex].score);
        } else if (state.globalScore > 0) {
            studentsData.push({ name: state.studentName, score: state.globalScore });
        }
    }

    studentsData.sort((a, b) => {
        const scoreA = Number(a.score) || 0;
        const scoreB = Number(b.score) || 0;
        return scoreB - scoreA;
    });

    const top10 = studentsData.slice(0, 10);

    leaderboardList.innerHTML = '';

    if (top10.length === 0) {
        leaderboardList.innerHTML = `
            <div class="leaderboard-empty">
                <div>كن</div>
                <div>أول</div>
                <div>بطل</div>
                <div style="font-size: 16px; margin-top: 15px; color: var(--text-soft); font-weight: 600;">ابدأ درساً الآن 🚀</div>
            </div>`;
        return;
    }

    const topSection = document.createElement('div');
    topSection.className = 'leaderboard-top-section';

    const getShortName = (fullName) => {
        if (!fullName) return "";
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return fullName;
        // Return First Name <br> Last Name
        return `${parts[0]}<br>${parts[parts.length - 1]}`;
    };

    // Podium Order: Rank 2 (Left), Rank 1 (Center), Rank 3 (Right)
    const podiumIndices = [1, 0, 2];
    podiumIndices.forEach((studentIdx, viewOrder) => {
        const player = top10[studentIdx];
        if (!player) return;

        const rank = studentIdx + 1;
        const isCurrentUser = player.name === state.studentName;
        const card = document.createElement('div');
        card.className = `leaderboard-top-card top-${rank}`;
        card.style.animationDelay = `${viewOrder * 0.15}s`;

        const displayName = getShortName(player.name);

        card.innerHTML = `
            <div class="top-rank">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</div>
            <div class="champion-name">${displayName}</div>
            ${isCurrentUser ? '<div class="current-tag">أنت بطلنا</div>' : ''}
            <div class="champion-score">⭐ ${player.score}</div>
        `;
        topSection.appendChild(card);
    });

    leaderboardList.appendChild(topSection);

    if (top10.length > 3) {
        const normalList = document.createElement('div');
        normalList.className = 'leaderboard-list-items';

        top10.slice(3).forEach((player, index) => {
            const rank = index + 4;
            const isCurrentUser = player.name === state.studentName;
            const item = document.createElement('div');
            item.className = `rank-item ${isCurrentUser ? 'current-user-item' : ''}`;
            item.style.animationDelay = `${(index + 3) * 0.1}s`;

            item.innerHTML = `
                <div class="rank-info">
                    <div class="rank-pos">${rank}</div>
                    <div class="rank-name">${player.name} ${isCurrentUser ? '<span class="current-tag">(أنت)</span>' : ''}</div>
                </div>
                <div class="rank-score">${player.score} ⭐</div>
            `;
            normalList.appendChild(item);
        });

        leaderboardList.appendChild(normalList);
    }

    if (state.studentName) {
        const userRankIndex = studentsData.findIndex(s => s.name === state.studentName);
        const userInTop10 = userRankIndex >= 0 && userRankIndex < 10;

        if (!userInTop10 && userRankIndex >= 0) {
            const separator = document.createElement('div');
            separator.style.cssText = 'text-align:center; padding: 10px; color: #BDC3C7; font-size: 14px;';
            separator.innerHTML = '<i class="fa-solid fa-ellipsis"></i>';
            leaderboardList.appendChild(separator);

            const userRank = userRankIndex + 1;
            const userData = studentsData[userRankIndex];
            const item = document.createElement('div');
            item.className = 'rank-item current-user-item my-rank-special';
            item.style.animationDelay = '0.8s';

            item.innerHTML = `
                <div class="rank-info">
                    <div class="rank-pos">${userRank}</div>
                    <div class="rank-name">${userData.name} (ترتيبك)</div>
                </div>
                <div class="rank-score">${userData.score} ⭐</div>
            `;
            leaderboardList.appendChild(item);
        }
    }
}

// Connectivity Check
function checkConnectivity() {
    const offlineScreen = document.getElementById('offline-screen');
    const internetNotice = document.getElementById('internet-notice');

    if (!navigator.onLine) {
        if (offlineScreen) offlineScreen.classList.remove('hidden');
        if (internetNotice) internetNotice.style.display = 'flex';
    } else {
        if (offlineScreen) offlineScreen.classList.add('hidden');
        if (internetNotice) internetNotice.style.display = 'none';
    }
}

window.addEventListener('online', checkConnectivity);
window.addEventListener('offline', checkConnectivity);

// Engine Selection Logic
function setSpeechEngine(mode) {
    if (mode === 'offline' || mode === 'small') {
        showToast('قريباً... هذا الوضع سيكون متاحاً في التحديث القادم!', 'fa-hourglass-half');
        return;
    }

    DataManager.saveSpeechEnginePreference(mode);
    updateEngineSelectionUI(mode);

    if (state.speechManager) state.speechManager.updateEngine();
}

function showToast(message, iconClass = 'fa-info-circle') {
    const toast = document.getElementById('global-toast');
    const toastText = toast.querySelector('.toast-text');
    const toastIcon = toast.querySelector('.toast-icon i');

    if (toast && toastText) {
        toastText.textContent = message;
        if (toastIcon) toastIcon.className = `fa-solid ${iconClass}`;

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
}

function updateEngineSelectionUI(mode) {
    const offBtn = document.getElementById('engine-offline-btn');
    const onBtn = document.getElementById('engine-online-btn');
    const smallBtn = document.getElementById('engine-small-btn');
    const hint = document.getElementById('engine-hint');

    if (offBtn && onBtn && smallBtn) {
        offBtn.classList.remove('active');
        onBtn.classList.remove('active');
        smallBtn.classList.remove('active');

        if (mode === 'offline') {
            offBtn.classList.add('active');
            if (hint) hint.textContent = 'الوضع القياسي يوفر توازناً بين الدقة والسرعة بدون إنترنت.';
        } else if (mode === 'small') {
            smallBtn.classList.add('active');
            if (hint) hint.textContent = 'الوضع السريع (Lite) خفيف جداً ومثالي للهواتف القديمة.';
        } else {
            onBtn.classList.add('active');
            if (hint) hint.textContent = 'نمط الأونلاين يستخدم أفضل محرك صوت سحابي للحصول على دقة عالية.';
        }
    }
}

function toggleSettings(show) {
    const overlay = document.getElementById('settings-overlay');
    if (!overlay) return;

    if (show) {
        overlay.classList.remove('hidden');
        // Force reflow for transition
        overlay.offsetHeight;
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (!overlay.classList.contains('show')) {
                overlay.classList.add('hidden');
            }
        }, 300);
    }
}

// Initial UI Update
document.addEventListener('DOMContentLoaded', () => {
    const pref = DataManager.getSpeechEnginePreference();
    updateEngineSelectionUI(pref);

    // تأكيد تعبئة الإعدادات الأخرى
    const phil = localStorage.getItem('reading_philosophy') || 'standard';
    const philSelect = document.getElementById('philosophy-select');
    if (philSelect) philSelect.value = phil;

    const fontSize = localStorage.getItem('reading_font_size') || '28';
    const sizeDisplay = document.getElementById('current-font-size');
    if (sizeDisplay) sizeDisplay.textContent = fontSize;
});



// Sound Management: Stop sounds when app is hidden/backgrounded
function stopAllSounds() {
    console.log("[App] Stopping all sounds...");
    if (bgMusic) {
        bgMusic.pause();
    }
    if (successSound) {
        successSound.pause();
        successSound.currentTime = 0;
    }
    if (errorSound) {
        errorSound.pause();
        errorSound.currentTime = 0;
    }
    if (cheerSound) {
        cheerSound.pause();
        cheerSound.currentTime = 0;
    }
    // Stop TTS
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAllSounds();
        if (state.speechManager) state.speechManager.stop();
    }
});

// --- Future Screen Helpers ---
function sendSuggestion() {
    const text = document.getElementById('suggestion-text').value.trim();
    if (!text) {
        alert("يرجى كتابة اقتراحك أولاً يا بطل!");
        return;
    }
    const whatsappUrl = `https://wa.me/972595918328?text=${encodeURIComponent("اقتراح من تطبيق هيا نقرأ: " + text)}`;
    window.open(whatsappUrl, '_blank');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('global-toast');
        const toastText = toast.querySelector('.toast-text');
        if (toast) {
            toastText.textContent = "تم نسخ الرقم بنجاح!";
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        }
    }).catch(err => {
        alert("فشل النسخ، يمكنك نسخ الرقم يدوياً: " + text);
    });
}

// --- Helper Functions for Animation & Celebration ---
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function triggerVictoryCelebration() {
    // إنشاء جزيئات الكنفيتي
    const colors = ['#ffd700', '#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#3742fa'];
    const particleCount = 80; // زيادة عدد الجزيئات

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-particle';

        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const duration = 2 + Math.random() * 3;
        const size = 5 + Math.random() * 12;

        p.style.backgroundColor = color;
        p.style.left = left + 'vw';
        p.style.top = '-20px';
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.borderRadius = (Math.random() > 0.5 ? '50%' : '2px');
        p.style.animationDuration = duration + 's';
        p.style.animationDelay = (Math.random() * 1.5) + 's';
        p.style.opacity = '0.8';
        p.style.zIndex = '2000'; // التأكد من ظهورها فوق كل شيء

        document.body.appendChild(p);

        // حذف العنصر بعد انتهاء الأنيميشن
        setTimeout(() => p.remove(), (duration + 2) * 1000);
    }
}

/**
 * توليد صوت مكافأة برمجياً (Web Audio API)
 * يتم تغيير النغمات بناءً على دقة القراءة لضمان التنوع
 */
function _playRewardSound(accuracy) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const audioCtx = new AudioContext();
        
        // نغمات مختلفة بناءً على المستوى
        let notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (أصوات فرح)
        
        if (accuracy < 70) {
            notes = [392.00, 440.00, 493.88]; // G4, A4, B4 (أصوات هادئة)
        } else if (accuracy >= 90) {
            notes = [523.25, 659.25, 783.99, 880.00, 1046.50, 1318.51]; // نغمات أكثر حماساً
        }

        notes.forEach((freq, index) => {
            const startTime = audioCtx.currentTime + (index * 0.12);
            const duration = 0.2;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle'; // صوت مبهج يشبه ألعاب الفيديو
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    } catch (e) {
        console.warn("Reward sound error:", e);
    }
}

initApp();
