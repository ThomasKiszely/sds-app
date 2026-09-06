module.exports = function validateDailyBundle(req, res, next) {
    const errors = [];
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
        errors.push("Daily bundle skal indeholde mindst én opgave.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};
