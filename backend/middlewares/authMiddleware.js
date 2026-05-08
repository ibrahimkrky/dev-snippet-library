const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    // 1. İsteğin başlığından (Header) token'ı alıyoruz. 
    // Format genellikle "Bearer kargaşaBirDiziKarakter" şeklindedir.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer" kelimesini atıp sadece token'ı alıyoruz

    // 2. Token hiç gönderilmemişse 401 (Yetkisiz) hatası dön
    if (!token) {
        return res.status(401).json({ error: 'Erişim reddedildi. Token bulunamadı, lütfen giriş yapın.' });
    }

    // 3. Token'ın sahte olup olmadığını ve süresinin geçip geçmediğini kontrol et
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token.' });
        }

        // 4. Bilet geçerli! Token içinden çıkan kullanıcı bilgisini (biz email koymuştuk) 
        // req (request) nesnesine ekliyoruz ki Controller hangi kullanıcının işlem yaptığını bilsin.
        req.user = user; 
        
        // 5. Kapıyı aç, isteğin asıl gideceği yere gitmesine izin ver
        next();
    });
};

module.exports = authenticateToken;