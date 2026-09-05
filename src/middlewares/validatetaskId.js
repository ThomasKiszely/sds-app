const { userError } = require("../utils/userError");

module.exports = function validateTaskId(req, res, next) {
    const { taskId } = req.params;

    if (!taskId || !taskId.match(/^[0-9a-fA-F]{24}$/)) {
        throw userError("Ugyldigt task ID.", 400);
    }

    next();
};
