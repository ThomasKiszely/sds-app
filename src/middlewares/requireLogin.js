function requireLogin(req, res, next) {
    if (!req.session.user) {

        // Hvis klienten forventer JSON (fetch/axios)
        const wantsJson =
            req.xhr ||
            (req.headers.accept && req.headers.accept.includes('application/json'));

        if (wantsJson) {
            return res.status(401).json({
                success: false,
                message: 'Du skal være logget ind'
            });
        }

        // Ellers redirect til login (HTML)
        return res.redirect('/login');
    }

    next();
}

module.exports = { requireLogin };
