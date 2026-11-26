const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offerController");
const { requireRole } = require("../middlewares/requireRole");
const { roleGroups } = require("../utils/userRoles");

// Interne ruter kræver salg. Accept-ruterne er offentlige (link til kunden).
const requireSales = requireRole(...roleGroups.sales);
const validateAccept = require('../middlewares/validateAccept');
const { validateObjectId } = require("../middlewares/validateObjectId");

// VIEW OFFER
router.get("/:id/view",
    requireSales,
    validateObjectId("id"),
    offerController.viewOffer
);

// PDF OFFER
router.get("/:id/pdf",
    requireSales,
    validateObjectId("id"),
    offerController.pdfOffer
);

// CREATE OFFER FROM EXISTING PLAN
router.post("/plans/:planId",
    requireSales,
    validateObjectId("planId"),
    offerController.createOfferForPlan
);

// ACCEPT VIEW (public link)
router.get("/:id/accept",
    validateObjectId("id"),
    offerController.acceptView
);

// ACCEPT OFFER (public link)
router.post("/:id/accept",
    validateObjectId("id"),
    validateAccept,
    offerController.acceptOffer
);

module.exports = router;
