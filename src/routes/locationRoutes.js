const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const { validateLocation } = require("../middlewares/validateLocation");

// -----------------------------
// VIEW ROUTES (HTMX + EJS)
// -----------------------------

// Liste over lokationer for en kunde
router.get(
    "/customers/:customerId/locations",
    locationController.listLocations
);


// Formular til at redigere lokation
router.get(
    "/:id/edit",
    locationController.editLocationForm
);

// Lokationsdetaljer
router.get(
    "/:id",
    locationController.locationDetails
);


// -----------------------------
// API ROUTES (JSON + HTMX)
// -----------------------------

// Opdater lokation
router.patch(
    "/:id",
    validateLocation,
    locationController.updateLocation
);

// Slet lokation
router.delete(
    "/:id",
    locationController.deleteLocation
);

module.exports = router;
