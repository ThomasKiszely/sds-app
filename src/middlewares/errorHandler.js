const path = require("path");

function errorHandler(error, req, res, next) {
    console.error(error);

    // ⭐ Sørg for at error ALTID er et Error-objekt
    if (!(error instanceof Error)) {
        const err = new Error(error?.message || String(error));

        // Bevar custom felter
        if (error.status) err.status = error.status;
        if (error.isUserError) err.isUserError = error.isUserError;

        error = err;
    }

    const status = error.status || 500;

    const safeMessage = error.isUserError
        ? error.message
        : "Noget gik galt – prøv igen";

    // HTMX → ren tekst
    if (req.headers['hx-request']) {
        return res.status(status).send(safeMessage);
    }

    // API → JSON
    if (req.originalUrl.startsWith("/api") || req.headers.accept?.includes("application/json")) {
        return res.status(status).json({ success: false, error: safeMessage });
    }

    // HTML fallback
    res.status(status).sendFile(
        path.join(__dirname, '..', '..', 'public', 'errors', '500.html')
    );
}


module.exports = { errorHandler };
