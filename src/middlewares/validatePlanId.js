const { userError } = require("../utils/userError");

module.exports = function validatePlanId(req, res, next) {
    const { planId } = req.params;

    if (!planId || !planId.match(/^[0-9a-fA-F]{24}$/)) {
        throw userError("Ugyldigt plan ID.", 400);
    }

    next();
};
