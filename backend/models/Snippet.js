class Snippet {
    constructor(id, title, code_content, language, category, user_email, visibility, created_at) {
        this.id = id;
        this.title = title;
        this.code_content = code_content;
        this.language = language;
        this.category = category;
        this.user_email = user_email;
        this.visibility = visibility;
        this.created_at = created_at;
    }
}

module.exports = Snippet;