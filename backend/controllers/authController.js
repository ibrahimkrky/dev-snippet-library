const authService = require('../services/authService');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Basit bir doğrulama
        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
        }

        const newUser = await authService.registerUser(email, password);
        res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu.', user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
        }

        const authData = await authService.loginUser(email, password);
        res.status(200).json({ message: 'Giriş başarılı.', ...authData });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

module.exports = {
    register,
    login
};