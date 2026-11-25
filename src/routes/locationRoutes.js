const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const { validateLocation } = require("../middlewares/validateLocation");
const { lookupLimiter } = require('../middlewares/lookupLimiter');
const { validateObjectId } = require("../middlewares/validateObjectId");
const { requireRole } = require("../middlewares/requireRole");
const { roleGroups } = require("../utils/userRoles");

// Planner må kun læse lokationer. Ændringer kræver salg.
const requireSales = requireRole(...roleGroups.sales);

// Liste over lokationer for en kunde
router.get(
    "/customers/:customerId/locations",
    validateObjectId("customerId"),
    locationController.listLocations
);

// Formular til at redigere lokation
router.get(
    "/:id/edit",
    requireSales,
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
    requireSales,
    validateObjectId("id"),
    validateLocation,
    locationController.updateLocation
);

// Slet lokation
router.delete(
    "/:id",
    requireSales,
    validateObjectId("id"),
    locationController.deleteLocation
);

module.exports = router;
