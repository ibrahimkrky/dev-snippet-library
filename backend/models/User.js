class User {
    constructor(email, password_hash, created_at) {
        this.email = email;
        this.password_hash = password_hash;
        this.created_at = created_at;
    }
}

module.exports = User;