function mustChangePassword(req, res, next) {
    if (req.session.user && req.session.user.mustChangePassword) {

        // Tillad GET til change-password siden
        if (req.path === '/change-password') {
            return next();
        }

        // Tillad POST til den rigtige password-rute
        if (req.method === 'POST' && req.path === '/users/me/password') {
            return next();
        }

        // Alt andet → redirect
        return res.redirect('/change-password');
    }

    next();
}


module.exports = {
    mustChangePassword
};