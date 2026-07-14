function requireLogin(req, res, next) {
    if (!req.session.user) {
        return next(new Error("Du skal være logget ind"));
    }
    next();
}

module.exports = { requireLogin };
