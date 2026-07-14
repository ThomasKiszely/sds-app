const { userRoles } = require("../utils/userRoles");

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return next(new Error("Du skal være logget ind"));
    }

    if (req.session.user.role !== userRoles.admin) {
        return next(new Error("Adgang nægtet – kræver adminrettigheder"));
    }

    next();
}

module.exports = { requireAdmin };
