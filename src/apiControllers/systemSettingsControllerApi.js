const systemSettingsService = require("../services/systemSettingsService");

async function showSettings(req, res, next) {
    try {
        const settings = await systemSettingsService.getSettings();

        return res.status(200).json({
            success: true,
            settings
        });

    } catch (error) {
        next(error);
    }
}

async function updateInflation(req, res, next) {
    try {
        const updated = await systemSettingsService.updateInflationRate(req.body.inflationRate);

        return res.status(200).json({
            success: true,
            message: "Inflation opdateret",
            settings: updated
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    showSettings,
    updateInflation
};
