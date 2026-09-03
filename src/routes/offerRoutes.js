const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offerController");
const { requireLogin } = require('../middlewares/requireLogin');
const validateAccept = require('../middlewares/validateAccept');


router.get("/:id/view", requireLogin, offerController.viewOffer);
router.get("/:id/pdf", requireLogin, offerController.pdfOffer);
router.post("/:id/send", requireLogin, offerController.sendOffer);
router.get("/:id/accept", offerController.acceptView);
router.post("/:id/accept", validateAccept, offerController.acceptOffer);

module.exports = router;
