function requirePasswordChangeCompleted(req, res, next) {
    if (req.user.mustChangePassword) {
        return next(new Error("Du skal skifte dit kodeord før du kan fortsætte"));
    }
    next();
}
module.exports = { requirePasswordChangeCompleted };