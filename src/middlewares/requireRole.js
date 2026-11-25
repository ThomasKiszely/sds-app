function requireRole(...allowedRoles) {
    return (req, res, next) => {
        // Ikke logget ind → redirect til login
        if (!req.session.user) {
            return res.redirect('/login');
        }

        if (!allowedRoles.includes(req.session.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Adgang nægtet – du har ikke rettigheder til denne handling"
            });
        }

        next();
    };
}

module.exports = { requireRole };
