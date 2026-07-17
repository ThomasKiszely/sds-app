const { userRoles } = require("../utils/userRoles");

function requireAdmin(req, res, next) {

    // Ikke logget ind → redirect til login
    if (!req.session.user) {
        return res.redirect('/login');
    }

    // Logget ind, men ikke admin → JSON-fejl
    if (req.session.user.role !== userRoles.admin) {
        return res.status(403).json({
            success: false,
            message: "Adgang nægtet – kræver adminrettigheder"
        });
    }

    next();
}

module.exports = { requireAdmin };

