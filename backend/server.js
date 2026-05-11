const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const authRoutes = require('./routes/authRoutes');
const snippetRoutes = require('./routes/snippetRoutes');

// Middleware'ler
app.use(cors()); // Frontend'den gelecek isteklere izin vermek için
app.use(express.json()); // Gelen JSON formatındaki verileri okuyabilmek için

app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);

// Test Route'u (Sistemin çalıştığını görmek için)
app.get('/', (req, res) => {
    res.status(200).json({ mesaj: 'Dev Snippet Library API başarıyla çalışıyor!' });
});

// Sunucuyu Başlatma
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda ayağa kalktı.`);
});