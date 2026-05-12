const db = require('../config/db');
const Snippet = require('../models/Snippet');

// Yeni Kod Ekleme
const createSnippet = async (title, codeContent, language, category, userEmail, visibility) => {
    const query = `
        INSERT INTO snippets (title, code_content, language, category, user_email, visibility)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    // Eğer görünürlük belirtilmemişse varsayılan olarak 'private' (gizli) yapıyoruz
    const values = [title, codeContent, language, category, userEmail, visibility || 'private'];
    const result = await db.query(query, values);
    return result.rows[0];
    return new Snippet(row.id, row.title, row.code_content, row.language, row.category, row.user_email, row.visibility, row.created_at);
};

// Kullanıcının Kendi Kodlarını Getirme (Read - Özel Arşiv)
const getUserSnippets = async (userEmail) => {
    // Sadece bu kullanıcıya ait olan kodları, en yeniden eskiye doğru sıralayarak getirir
    const query = `SELECT * FROM snippets WHERE user_email = $1 ORDER BY created_at DESC;`;
    const result = await db.query(query, [userEmail]);
    return result.rows.map(row => 
        new Snippet(row.id, row.title, row.code_content, row.language, row.category, row.user_email, row.visibility, row.created_at)
    );
};

// 3. Herkese Açık Kodları Getirme (Read - Public Feed)
const getPublicSnippets = async () => {
    
    const query = `
        SELECT s.*, COUNT(v.snippet_id) as vote_count
        FROM snippets s
        LEFT JOIN snippet_votes v ON s.id = v.snippet_id
        WHERE s.visibility = 'public'
        GROUP BY s.id
        ORDER BY vote_count DESC, created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows.map(row => {
        const snippet = new Snippet(row.id, row.title, row.code_content, row.language, row.category, row.user_email, row.visibility, row.created_at);
        snippet.vote_count = row.vote_count; // SQL'den gelen ekstra alanı nesneye ekleyebiliriz
        return snippet;
    });
};

// Kod Güncelleme
const updateSnippet = async (id, userEmail, updates) => {
    const { title, codeContent, language, category, visibility } = updates;
    
    // COALESCE fonksiyonu, eğer yeni değer gelmemişse eski değeri korumamızı sağlar.
    // WHERE şartında 'user_email = $7' ekleyerek, kimsenin başkasının kodunu değiştirememesini garanti altına alıyoruz.
    const query = `
        UPDATE snippets 
        SET title = COALESCE($1, title), 
            code_content = COALESCE($2, code_content), 
            language = COALESCE($3, language), 
            category = COALESCE($4, category), 
            visibility = COALESCE($5, visibility)
        WHERE id = $6 AND user_email = $7
        RETURNING *;
    `;
    const values = [title, codeContent, language, category, visibility, id, userEmail];
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
        throw new Error('Kod bulunamadı veya bu işlemi yapmaya yetkiniz yok.');
    }
    const row = result.rows[0];
    return new Snippet(row.id, row.title, row.code_content, row.language, row.category, row.user_email, row.visibility, row.created_at);
};

// Kod Silme
const deleteSnippet = async (id, userEmail) => {
    // Yine güvenlik için, kodu silmeye çalışan kişi gerçekten kodun sahibi mi diye kontrol ediyoruz
    const query = `DELETE FROM snippets WHERE id = $1 AND user_email = $2 RETURNING id;`;
    const result = await db.query(query, [id, userEmail]);
    
    if (result.rows.length === 0) {
        throw new Error('Kod bulunamadı veya silmeye yetkiniz yok.');
    }
    return true;
};

// Koda Puan Verme
const upvoteSnippet = async (snippetId, userEmail) => {
    try {
        const query = `INSERT INTO snippet_votes (user_email, snippet_id) VALUES ($1, $2) RETURNING *;`;
        const result = await db.query(query, [userEmail, snippetId]);
        return result.rows[0];
    } catch (error) {
        // Hata kodu 23505, PostgreSQL'de "Unique Violation" (Tekrarlayan Veri) anlamına gelir.
        // Ara tablomuzu (user_email, snippet_id) şeklinde Composite Primary Key yaptığımız için 
        // veritabanı aynı kullanıcının ikinci kez oy vermesini otomatik olarak reddedecek.
        if (error.code === '23505') { 
            throw new Error('Bu koda zaten puan verdiniz.');
        }
        throw error;
    }
};

module.exports = {
    createSnippet,
    getUserSnippets,
    getPublicSnippets,
    updateSnippet,
    deleteSnippet,
    upvoteSnippet
};