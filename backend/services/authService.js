const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
require('dotenv').config();

const registerUser = async (email, password) => {
    // 1. Kullanıcı zaten var mı kontrol et
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
        throw new Error('Bu e-posta adresi zaten kullanımda.');
    }

    // 2. Şifreyi şifrele (Hash)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Kullanıcıyı veritabanına kaydet
    const result = await db.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING email, created_at',
        [email, passwordHash]
    );

    return result.rows[0];
};

const loginUser = async (email, password) => {
    // 1. Kullanıcıyı bul
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        throw new Error('Geçersiz e-posta veya şifre.');
    }

    const user = result.rows[0];

    // 2. Şifreyi doğrula
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Geçersiz e-posta veya şifre.');
    }

    // 3. JWT Üret
    const token = jwt.sign(
        { email: user.email }, // Token içine sadece gerekli ve gizli olmayan bilgiyi koyuyoruz
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Token 1 saat geçerli olacak
    );

    return { email: user.email, token };
};

module.exports = {
    registerUser,
    loginUser
};