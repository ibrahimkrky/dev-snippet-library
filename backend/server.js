const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const authRoutes = require('./routes/authRoutes');
const snippetRoutes = require('./routes/snippetRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware'ler
app.use(cors()); // Frontend'den gelecek isteklere izin vermek için
app.use(express.json()); // Gelen JSON formatındaki verileri okuyabilmek için

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);

// Test Route'u (Sistemin çalıştığını görmek için)
app.get('/', (req, res) => {
    res.status(200).json({ mesaj: 'Dev Snippet Library API başarıyla çalışıyor!' });
});

// Sunucuyu Başlatma
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda ayağa kalktı.`);
    console.log(`API Dokümantasyonu için: http://localhost:${PORT}/api-docs`);
});