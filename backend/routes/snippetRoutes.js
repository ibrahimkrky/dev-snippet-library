const express = require('express');
const router = express.Router();
const snippetController = require('../controllers/snippetController');
const authenticateToken = require('../middlewares/authMiddleware');

// HERKESE AÇIK ROTALAR (Giriş yapmaya gerek yok)
router.get('/public', snippetController.getPublicFeed);

// KORUMALI ROTALAR (authenticateToken middleware'i kullanılıyor)

// Sadece kullanıcının kendi kodları
router.get('/my-snippets', authenticateToken, snippetController.getMySnippets);

// Yeni kod ekleme
router.post('/', authenticateToken, snippetController.create);

// Kod güncelleme
router.put('/:id', authenticateToken, snippetController.update);

// Kod silme
router.delete('/:id', authenticateToken, snippetController.remove);

// Koda oy verme
router.post('/:id/upvote', authenticateToken, snippetController.upvote);

module.exports = router;