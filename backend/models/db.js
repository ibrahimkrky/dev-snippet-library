const { Pool } = require('pg');
require('dotenv').config();

// .env dosyasındaki bilgilerle bağlantı havuzunu oluşturuyoruz
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Bağlantı hatası olursa terminalde görmek için
pool.on('error', (err, client) => {
    console.error('Beklenmeyen bir veritabanı hatası:', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params)
};