const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offerController");
const { requireLogin } = require('../middlewares/requireLogin');
const validateAccept = require('../middlewares/validateAccept');
const { validateObjectId } = require("../middlewares/validateObjectId");

// VIEW OFFER
router.get("/:id/view",
    requireLogin,
    validateObjectId("id"),
    offerController.viewOffer
);

// PDF OFFER
router.get("/:id/pdf",
    requireLogin,
    validateObjectId("id"),
    offerController.pdfOffer
);

// SEND OFFER
router.post("/:id/send",
    requireLogin,
    validateObjectId("id"),
    offerController.sendOffer
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
