// === TEMEL AYARLAR VE DURUM YÖNETİMİ ===
const API_URL = 'http://localhost:5000/api';
let currentToken = localStorage.getItem('token'); // Tarayıcı hafızasından bileti al
let isLoginMode = true; // Giriş mi yoksa Kayıt ekranında mıyız?

// === DOM ELEMANLARINI SEÇME ===
// Menü Butonları
const navPublicFeed = document.getElementById('navPublicFeed');
const navLogin = document.getElementById('navLogin');

// Ekranlar (Bölümler)
const authSection = document.getElementById('authSection');
const publicFeedSection = document.getElementById('publicFeedSection');
const dashboardSection = document.getElementById('dashboardSection');

// Formlar ve Alanlar
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthModeBtn = document.getElementById('toggleAuthMode');
const addSnippetForm = document.getElementById('addSnippetForm');

// İçerik Konteynerleri
const publicSnippetsContainer = document.getElementById('publicSnippetsContainer');
const mySnippetsContainer = document.getElementById('mySnippetsContainer');


// === ARAYÜZ (UI) YÖNETİMİ ===
// İstenilen ekranı gösterip diğerlerini gizler
function showSection(sectionToShow) {
    authSection.classList.add('hidden');
    publicFeedSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
}

// Menü butonlarını giriş durumuna göre günceller
function updateNav() {
    if (currentToken) {
        // Kullanıcı giriş yapmışsa
        navLogin.textContent = 'Çıkış Yap';
        navLogin.classList.replace('btn-primary', 'btn-danger'); // Kırmızı buton (CSS'e ekleyeceğiz)
        
        // Pano butonunu ekle (eğer yoksa)
        if (!document.getElementById('navDashboard')) {
            const dashBtn = document.createElement('button');
            dashBtn.id = 'navDashboard';
            dashBtn.className = 'nav-btn';
            dashBtn.textContent = 'Benim Panom';
            dashBtn.onclick = () => {
                showSection(dashboardSection);
                loadMySnippets();
            };
            navPublicFeed.after(dashBtn);
        }
    } else {
        // Kullanıcı giriş yapmamışsa
        navLogin.textContent = 'Giriş Yap';
        navLogin.classList.replace('btn-danger', 'btn-primary');
        const dashBtn = document.getElementById('navDashboard');
        if (dashBtn) dashBtn.remove();
    }
}


// === KİMLİK DOĞRULAMA (AUTH) İŞLEMLERİ ===
// Giriş/Kayıt formunu dinleme
authForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        if (isLoginMode) {
            // Giriş başarılıysa token'ı kaydet ve panoya yönlendir
            currentToken = data.token;
            localStorage.setItem('token', currentToken);
            updateNav();
            showSection(dashboardSection);
            loadMySnippets();
            authForm.reset();
        } else {
            // Kayıt başarılıysa giriş ekranına yönlendir
            alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            toggleAuthMode();
        }
    } catch (error) {
        alert('Hata: ' + error.message);
    }
});

// Giriş Yap / Kayıt Ol modları arasında geçiş
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? 'Sisteme Giriş' : 'Yeni Kayıt';
    authSubmitBtn.textContent = isLoginMode ? 'Giriş Yap' : 'Kayıt Ol';
    document.querySelector('.auth-switch').innerHTML = isLoginMode 
        ? 'Hesabın yok mu? <a href="#" id="toggleAuthMode">Kayıt Ol</a>' 
        : 'Zaten hesabın var mı? <a href="#" id="toggleAuthMode">Giriş Yap</a>';
    
    document.getElementById('toggleAuthMode').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}
document.getElementById('toggleAuthMode').addEventListener('click', (e) => {
    e.preventDefault(); toggleAuthMode();
});


// === KOD PARÇACIKLARI (SNIPPETS) İŞLEMLERİ ===

// HTML Kartı Oluşturma Şablonu
function createSnippetCard(snippet, isPublicFeed = false) {
    return `
        <div class="snippet-card" style="background: var(--bg-card); padding: 1rem; border-radius: 8px; border: 1px solid #334155; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h3 style="color: var(--accent); margin:0;">${snippet.title}</h3>
                <span style="background: #334155; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${snippet.language}</span>
            </div>
            <pre style="background: #0f172a; padding: 1rem; border-radius: 4px; overflow-x: auto; color: #e2e8f0; font-family: monospace;"><code>${snippet.code_content}</code></pre>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
                <span>Kategori: ${snippet.category || 'Belirtilmemiş'}</span>
                ${isPublicFeed ? 
                    `<button onclick="upvoteSnippet(${snippet.id})" class="nav-btn" style="color:var(--accent);">
                        👍 Yabancıya Gitmesin (${snippet.vote_count})
                     </button>` 
                    : `<span>👁️ ${snippet.visibility === 'public' ? 'Herkese Açık' : 'Gizli'}</span>`
                }
            </div>
        </div>
    `;
}

// Herkese Açık Akışı Yükle
async function loadPublicFeed() {
    try {
        const response = await fetch(`${API_URL}/snippets/public`);
        const snippets = await response.json();
        
        publicSnippetsContainer.innerHTML = snippets.length > 0 
            ? snippets.map(s => createSnippetCard(s, true)).join('') 
            : '<p>Henüz buralar çok ıssız...</p>';
    } catch (error) {
        console.error("Akış yüklenemedi:", error);
    }
}

// Kullanıcının Kendi Kodlarını Yükle
async function loadMySnippets() {
    try {
        const response = await fetch(`${API_URL}/snippets/my-snippets`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const snippets = await response.json();
        
        mySnippetsContainer.innerHTML = snippets.length > 0 
            ? snippets.map(s => createSnippetCard(s, false)).join('') 
            : '<p>Kütüphanen henüz boş. Hadi ilk kodunu ekle!</p>';
    } catch (error) {
        console.error("Kodlarınız yüklenemedi:", error);
    }
}

// Yeni Kod Ekleme
addSnippetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newSnippet = {
        title: document.getElementById('title').value,
        codeContent: document.getElementById('codeContent').value,
        language: document.getElementById('language').value,
        category: document.getElementById('category').value,
        visibility: document.getElementById('visibility').value
    };

    try {
        const response = await fetch(`${API_URL}/snippets`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}` 
            },
            body: JSON.stringify(newSnippet)
        });

        if (!response.ok) throw new Error('Kod eklenemedi');
        
        addSnippetForm.reset();
        loadMySnippets(); // Listeyi yenile
        alert('Kod başarıyla kütüphaneye eklendi!');
    } catch (error) {
        alert(error.message);
    }
});

// Puan Verme İşlemi
async function upvoteSnippet(snippetId) {
    if (!currentToken) return alert('Oy vermek için önce giriş yapmalısınız!');
    
    try {
        const response = await fetch(`${API_URL}/snippets/${snippetId}/upvote`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        loadPublicFeed(); // Puanları güncellemek için akışı yenile
    } catch (error) {
        alert(error.message);
    }
}

// === ÜST MENÜ (NAVBAR) YÖNLENDİRMELERİ ===
navPublicFeed.addEventListener('click', () => {
    showSection(publicFeedSection);
    loadPublicFeed();
});

navLogin.addEventListener('click', () => {
    if (currentToken) {
        // Çıkış Yap İşlemi
        localStorage.removeItem('token');
        currentToken = null;
        updateNav();
        showSection(publicFeedSection);
        loadPublicFeed();
    } else {
        // Giriş Ekranını Aç
        showSection(authSection);
    }
});

// === UYGULAMA İLK AÇILDIĞINDA ÇALIŞACAKLAR ===
updateNav();
loadPublicFeed(); 
// Not: CSS için ufak bir eklenti (Çıkış yap butonu rengi için app.js içinde hallettik)