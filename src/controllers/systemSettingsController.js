const systemSettingsService = require("../services/systemSettingsService");

async function showSettings(req, res) {
    const settings = await systemSettingsService.getSettings();
    res.render("admin/settings", { settings });
}

async function updateInflation(req, res) {
    try {
        await systemSettingsService.updateInflationRate(req.body.inflationRate);
        return res.send("Inflation opdateret");
    } catch (err) {
        return res.status(400).send(err.message);
    }
}

async function updateEnvironmentalFee(req, res) {
    try {
        await systemSettingsService.updateEnvironmentalFee(req.body.environmentalFee);
        return res.send("Miljøafgift opdateret");
    } catch (err) {
        return res.status(400).send(err.message);
    }
}

module.exports = {
    showSettings,
    updateInflation,
    updateEnvironmentalFee
};
