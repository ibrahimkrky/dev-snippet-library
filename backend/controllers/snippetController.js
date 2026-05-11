const snippetService = require('../services/snippetService');

// Yeni Kod Ekleme
const create = async (req, res) => {
    try {
        const { title, codeContent, language, category, visibility } = req.body;
        // req.user, authMiddleware'den geliyor. Giriş yapan kullanıcının e-postasını alıyoruz.
        const userEmail = req.user.email; 

        if (!title || !codeContent || !language) {
            return res.status(400).json({ error: 'Başlık, kod içeriği ve dil zorunludur.' });
        }

        const newSnippet = await snippetService.createSnippet(title, codeContent, language, category, userEmail, visibility);
        res.status(201).json({ message: 'Kod başarıyla eklendi!', snippet: newSnippet });
    } catch (error) {
        res.status(500).json({ error: 'Kod eklenirken bir hata oluştu.' });
    }
};

// Kullanıcının Kendi Kodlarını Getirme
const getMySnippets = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const snippets = await snippetService.getUserSnippets(userEmail);
        res.status(200).json(snippets);
    } catch (error) {
        res.status(500).json({ error: 'Kodlar getirilirken bir hata oluştu.' });
    }
};

// Herkese Açık Kodları Getirme
const getPublicFeed = async (req, res) => {
    try {
        const snippets = await snippetService.getPublicSnippets();
        res.status(200).json(snippets);
    } catch (error) {
        res.status(500).json({ error: 'Açık akış getirilirken bir hata oluştu.' });
    }
};

// Kod Güncelleme
const update = async (req, res) => {
    try {
        const snippetId = req.params.id; // URL'den gelen ID
        const userEmail = req.user.email;
        const updates = req.body;

        const updatedSnippet = await snippetService.updateSnippet(snippetId, userEmail, updates);
        res.status(200).json({ message: 'Kod başarıyla güncellendi.', snippet: updatedSnippet });
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

// Kod Silme
const remove = async (req, res) => {
    try {
        const snippetId = req.params.id;
        const userEmail = req.user.email;

        await snippetService.deleteSnippet(snippetId, userEmail);
        res.status(200).json({ message: 'Kod başarıyla silindi.' });
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

// Koda Puan Verme
const upvote = async (req, res) => {
    try {
        const snippetId = req.params.id;
        const userEmail = req.user.email;

        await snippetService.upvoteSnippet(snippetId, userEmail);
        res.status(200).json({ message: 'Oyunuz başarıyla kaydedildi!' });
    } catch (error) {
        res.status(400).json({ error: error.message }); // "Zaten oy verdiniz" hatası buraya düşecek
    }
};

module.exports = {
    create,
    getMySnippets,
    getPublicFeed,
    update,
    remove,
    upvote
};