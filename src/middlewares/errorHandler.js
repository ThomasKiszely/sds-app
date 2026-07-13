const path = require("path");

function errorHandler(error, req, res, next) {
    console.error(error);

    const status = error.status || 500;

    // Kun vis brugerfejl til brugeren
    // bruges således: throw { isUserError: true, message: "Bruger findes allerede" };
    const safeMessage = error.isUserError
        ? error.message
        : "Noget gik galt – prøv igen";

    // HTMX
    if (req.headers['hx-request']) {
        return res.status(status).send(`<p class="error">${safeMessage}</p>`);
    }

    // API
    if (req.originalUrl.startsWith("/api") || req.headers.accept?.includes("application/json")) {
        return res.status(status).json({ success: false, error: safeMessage });
    }

    // HTML
    res.status(status).sendFile(
        path.join(__dirname, '..', '..', 'public', 'errors', '500.html')
    );
}

module.exports = { errorHandler };
