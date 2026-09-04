const systemSettingsService = require("../services/systemSettingsService");

async function showSettings(req, res) {
    const settings = await systemSettingsService.getSettings();
    res.render("admin/settings", { settings });
}

async function updateInflation(req, res) {
    try {
        await systemSettingsService.updateInflationRate(req.body.inflationRate);

        res.setHeader("HX-Trigger", JSON.stringify({
            toast: "Indeksregulering opdateret"
        }));

        return res.send("Inflation opdateret");
    } catch (err) {
        return res.status(400).send(err.message);
    }
}

async function updateEnvironmentalFee(req, res) {
    try {
        await systemSettingsService.updateEnvironmentalFee(req.body.environmentalFee);

        res.setHeader("HX-Trigger", JSON.stringify({
            toast: "Drift- og miljøtillæg opdateret"
        }));

        return res.send("Drift- og miljøtillæg opdateret");
    } catch (err) {
        return res.status(400).send(err.message);
    }
}

async function updateHourlyRate(req, res) {
    try {
        await systemSettingsService.updateHourlyRate(req.body.hourlyRate);

        res.setHeader("HX-Trigger", JSON.stringify({
            toast: "Timepris opdateret"
        }));

        return res.send("Timepris opdateret");
    } catch (err) {
        return res.status(400).send(err.message);
    }
}


module.exports = {
    showSettings,
    updateInflation,
    updateEnvironmentalFee,
    updateHourlyRate
};
