function ensureTemplateExists(template) {
    if (!template) {
        const error = new Error("Opgave-skabelon blev ikke fundet.");
        error.status = 404;
        throw error;
    }
}

module.exports = {
    ensureTemplateExists
};
