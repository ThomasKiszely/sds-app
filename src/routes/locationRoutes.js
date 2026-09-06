const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const { validateLocation } = require("../middlewares/validateLocation");
const { lookupLimiter } = require('../middlewares/lookupLimiter');
const { validateObjectId } = require("../middlewares/validateObjectId");

// Liste over lokationer for en kunde
router.get(
    "/customers/:customerId/locations",
    validateObjectId("customerId"),
    locationController.listLocations
);

// Formular til at redigere lokation
router.get(
    "/:id/edit",
    validateObjectId("id"),
    locationController.editLocationForm
);

// Lokationsdetaljer
router.get(
    "/:id",
    validateObjectId("id"),
    lookupLimiter,
    locationController.locationDetails
);

// Opdater lokation
router.patch(
    "/:id",
    validateObjectId("id"),
    validateLocation,
    locationController.updateLocation
);

// Slet lokation
router.delete(
    "/:id",
    validateObjectId("id"),
    locationController.deleteLocation
);

module.exports = router;
