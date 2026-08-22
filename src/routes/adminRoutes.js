const express = require("express");
const router = express.Router();
const systemSettingsController = require("../controllers/systemSettingsController");

router.get("/settings", systemSettingsController.showSettings);
router.post("/settings/inflation", systemSettingsController.updateInflation);
router.post("/settings/environmentalFee", systemSettingsController.updateEnvironmentalFee);

module.exports = router;
