const db = require('./db');

const createTables = async () => {
    const queryText = `
        -- Kullanıcılar Tablosu (Primary Key: email)
        CREATE TABLE IF NOT EXISTS users (
            email VARCHAR(255) PRIMARY KEY,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Görünürlük Tipi için Özel Tür (Enum)
        DO $$ BEGIN
            CREATE TYPE visibility_type AS ENUM ('public', 'private');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        -- Kod Parçacıkları Tablosu
        CREATE TABLE IF NOT EXISTS snippets (
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            code_content TEXT NOT NULL,
            language VARCHAR(50) NOT NULL,
            category VARCHAR(100),
            user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
            visibility visibility_type DEFAULT 'private',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Puanlama (Upvote) Ara Tablosu (Composite Primary Key)
        CREATE TABLE IF NOT EXISTS snippet_votes (
            user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
            snippet_id INTEGER REFERENCES snippets(id) ON DELETE CASCADE,
            voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_email, snippet_id) -- Bir kullanıcı bir koda sadece 1 kez oy verebilir
        );
    `;

    try {
        await db.query(queryText);
        console.log("Veritabanı tabloları başarıyla oluşturuldu!");
    } catch (err) {
        console.error("Tablolar oluşturulurken hata:", err);
    } process.exit();
};

createTables();