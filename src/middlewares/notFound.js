const path = require('path');

function notFound(req, res, next) {
    const message = "Siden blev ikke fundet";

    // HTMX så returnér HTML-fragment
    if (req.headers['hx-request']) {
        return res.status(404).send(`<p class="error">${message}</p>`);
    }

    // API så returnér JSON
    if (req.originalUrl.startsWith("/api") || req.headers.accept?.includes("application/json")) {
        return res.status(404).json({ success: false, error: message });
    }

    // Almindelig browser, så returnér HTML-side
    res.status(404).sendFile(
        path.join(__dirname, '..', '..', 'public', 'errors', '404.html')
    );
}

module.exports = { notFound };
