// === TEMEL AYARLAR VE DURUM YÖNETİMİ ===
const API_URL = 'http://localhost:5000/api';
let currentToken = localStorage.getItem('token');
let isLoginMode = true;

// YENİ: Düzenlenen kodun ID'sini ve kullanıcının kodlarını hafızada tutacağız
let currentEditId = null; 
let userSnippetsCache = []; 

// === DOM ELEMANLARINI SEÇME ===
const navPublicFeed = document.getElementById('navPublicFeed');
const navLogin = document.getElementById('navLogin');
const authSection = document.getElementById('authSection');
const publicFeedSection = document.getElementById('publicFeedSection');
const dashboardSection = document.getElementById('dashboardSection');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthModeBtn = document.getElementById('toggleAuthMode');
const addSnippetForm = document.getElementById('addSnippetForm');
const publicSnippetsContainer = document.getElementById('publicSnippetsContainer');
const mySnippetsContainer = document.getElementById('mySnippetsContainer');


// === ARAYÜZ (UI) YÖNETİMİ ===
function showSection(sectionToShow) {
    authSection.classList.add('hidden');
    publicFeedSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
}

function updateNav() {
    if (currentToken) {
        navLogin.textContent = 'Çıkış Yap';
        navLogin.classList.replace('btn-primary', 'btn-danger');
        
        if (!document.getElementById('navDashboard')) {
            const dashBtn = document.createElement('button');
            dashBtn.id = 'navDashboard';
            dashBtn.className = 'nav-btn';
            dashBtn.textContent = 'Benim Panom';
            dashBtn.onclick = () => {
                showSection(dashboardSection);
                loadMySnippets();
                cancelEdit(); // Panoya geçerken formu sıfırla
            };
            navPublicFeed.after(dashBtn);
        }
    } else {
        navLogin.textContent = 'Giriş Yap';
        navLogin.classList.replace('btn-danger', 'btn-primary');
        const dashBtn = document.getElementById('navDashboard');
        if (dashBtn) dashBtn.remove();
    }
}


// === KİMLİK DOĞRULAMA (AUTH) İŞLEMLERİ ===
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
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
            currentToken = data.token;
            localStorage.setItem('token', currentToken);
            updateNav();
            showSection(dashboardSection);
            loadMySnippets();
            authForm.reset();
        } else {
            alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            toggleAuthMode();
        }
    } catch (error) {
        alert('Hata: ' + error.message);
    }
});

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? 'Sisteme Giriş' : 'Yeni Kayıt';
    authSubmitBtn.textContent = isLoginMode ? 'Giriş Yap' : 'Kayıt Ol';
    document.querySelector('.auth-switch').innerHTML = isLoginMode 
        ? 'Hesabın yok mu? <a href="#" id="toggleAuthMode">Kayıt Ol</a>' 
        : 'Zaten hesabın var mı? <a href="#" id="toggleAuthMode">Giriş Yap</a>';
    
    document.getElementById('toggleAuthMode').addEventListener('click', (e) => {
        e.preventDefault(); toggleAuthMode();
    });
}
document.getElementById('toggleAuthMode').addEventListener('click', (e) => {
    e.preventDefault(); toggleAuthMode();
});


// === KOD PARÇACIKLARI (SNIPPETS) İŞLEMLERİ ===

function createSnippetCard(snippet, isPublicFeed = false) {
    // YENİ: Panomuzdaysa (Public feed değilse) Sil ve Düzenle butonlarını ekle
    const actionButtons = isPublicFeed 
        ? `<button onclick="upvoteSnippet(${snippet.id})" class="nav-btn" style="color:var(--accent);">👍 Yabancıya Gitmesin (${snippet.vote_count})</button>`
        : `<div style="display:flex; gap:10px;">
                <button onclick="editSnippet(${snippet.id})" class="nav-btn" style="color:var(--accent);">✏️ Düzenle</button>
                <button onclick="deleteSnippet(${snippet.id})" class="nav-btn" style="color:var(--danger);">🗑️ Sil</button>
                <span style="color:var(--text-muted); font-size:0.8rem; margin-top:5px;">👁️ ${snippet.visibility === 'public' ? 'Herkese Açık' : 'Gizli'}</span>
           </div>`;

    return `
        <div class="snippet-card" style="background: var(--bg-card); padding: 1rem; border-radius: 8px; border: 1px solid #334155; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h3 style="color: var(--accent); margin:0;">${snippet.title}</h3>
                <span style="background: #334155; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${snippet.language}</span>
            </div>
            <pre style="background: #0f172a; padding: 1rem; border-radius: 4px; overflow-x: auto; color: #e2e8f0; font-family: monospace;"><code>${snippet.code_content}</code></pre>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; font-size: 0.8rem;">
                <span style="color: var(--text-muted);">Kategori: ${snippet.category || 'Belirtilmemiş'}</span>
                ${actionButtons}
            </div>
        </div>
    `;
}

async function loadPublicFeed() {
    try {
        const response = await fetch(`${API_URL}/snippets/public`);
        const snippets = await response.json();
        publicSnippetsContainer.innerHTML = snippets.length > 0 
            ? snippets.map(s => createSnippetCard(s, true)).join('') 
            : '<p>Henüz buralar çok ıssız...</p>';
    } catch (error) { console.error("Akış yüklenemedi:", error); }
}

async function loadMySnippets() {
    try {
        const response = await fetch(`${API_URL}/snippets/my-snippets`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const snippets = await response.json();
        userSnippetsCache = snippets; // Formu doldurmak için hafızaya aldık
        mySnippetsContainer.innerHTML = snippets.length > 0 
            ? snippets.map(s => createSnippetCard(s, false)).join('') 
            : '<p>Kütüphanen henüz boş. Hadi ilk kodunu ekle!</p>';
    } catch (error) { console.error("Kodlarınız yüklenemedi:", error); }
}

// YENİ: Formu Gönderme (Hem Yeni Kayıt, Hem Güncelleme İçin Ortak Kullanım)
addSnippetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const snippetData = {
        title: document.getElementById('title').value,
        codeContent: document.getElementById('codeContent').value,
        language: document.getElementById('language').value,
        category: document.getElementById('category').value,
        visibility: document.getElementById('visibility').value
    };

    // currentEditId doluysa Güncelleme (PUT), boşsa Yeni Kayıt (POST) işlemi yap
    const isUpdate = currentEditId !== null;
    const url = isUpdate ? `${API_URL}/snippets/${currentEditId}` : `${API_URL}/snippets`;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}` 
            },
            body: JSON.stringify(snippetData)
        });

        if (!response.ok) throw new Error(isUpdate ? 'Kod güncellenemedi' : 'Kod eklenemedi');
        
        cancelEdit(); // Formu sıfırla
        loadMySnippets(); // Panoyu yenile
        loadPublicFeed(); // Herkese açık kodları yenile
        alert(isUpdate ? 'Kod başarıyla güncellendi!' : 'Kod başarıyla kütüphaneye eklendi!');
    } catch (error) {
        alert(error.message);
    }
});

// YENİ: Düzenle Butonuna Tıklanınca Çalışacak Fonksiyon
window.editSnippet = (id) => {
    // Tıklanan kodu hafızadan bul
    const snippet = userSnippetsCache.find(s => s.id === id);
    if (!snippet) return;

    // Formu doldur
    document.getElementById('title').value = snippet.title;
    document.getElementById('codeContent').value = snippet.code_content;
    document.getElementById('language').value = snippet.language;
    document.getElementById('category').value = snippet.category;
    document.getElementById('visibility').value = snippet.visibility;

    currentEditId = id; // Sisteme artık düzenleme modunda olduğumuzu söylüyoruz
    
    // Buton metnini değiştir ve formu öne çıkar
    const submitBtn = addSnippetForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Kodu Güncelle';
    submitBtn.style.backgroundColor = 'var(--accent)';
    
    // Sayfayı yukarı, formun olduğu yere kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// YENİ: Düzenlemeyi İptal Etmek veya Formu Sıfırlamak İçin
function cancelEdit() {
    addSnippetForm.reset();
    currentEditId = null;
    const submitBtn = addSnippetForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Kütüphaneme Ekle';
}

// YENİ: Sil Butonuna Tıklanınca Çalışacak Fonksiyon
window.deleteSnippet = async (id) => {
    // Yanlışlıkla basmalara karşı emin misin diye sor
    if (!confirm('Bu kodu silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;

    try {
        const response = await fetch(`${API_URL}/snippets/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (!response.ok) throw new Error('Silme işlemi başarısız oldu.');
        
        loadMySnippets(); // Panoyu yenile
        loadPublicFeed(); // Herkese açık kodları yenile (silinenler çıksın)
    } catch (error) {
        alert(error.message);
    }
};

async function upvoteSnippet(snippetId) {
    if (!currentToken) return alert('Oy vermek için önce giriş yapmalısınız!');
    try {
        const response = await fetch(`${API_URL}/snippets/${snippetId}/upvote`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        loadPublicFeed();
    } catch (error) { alert(error.message); }
}

// === ÜST MENÜ (NAVBAR) YÖNLENDİRMELERİ ===
navPublicFeed.addEventListener('click', () => {
    showSection(publicFeedSection);
    loadPublicFeed();
});

navLogin.addEventListener('click', () => {
    if (currentToken) {
        localStorage.removeItem('token');
        currentToken = null;
        updateNav();
        showSection(publicFeedSection);
        loadPublicFeed();
    } else { showSection(authSection); }
});

updateNav();
loadPublicFeed();