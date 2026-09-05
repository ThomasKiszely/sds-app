const { userError } = require("../utils/userError");

module.exports = function validateTemplateId(req, res, next) {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw userError("Ugyldigt template ID.", 400);
    }

    next();
};
