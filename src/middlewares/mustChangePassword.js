function mustChangePassword(req, res, next) {
    if (req.session.user && req.session.user.mustChangePassword) {
        return next(new Error("Du skal ændre dit password"));
    }
    next();
}

module.exports = { mustChangePassword };
