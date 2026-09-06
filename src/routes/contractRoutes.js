const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contractController");
const { validateObjectId } = require("../middlewares/validateObjectId");

// GENERATE CONTRACT
router.post(
    "/:planId/generate",
    validateObjectId("planId"),
    contractController.generateContract
);

// LIST CONTRACTS FOR PLAN
router.get(
    "/:planId/list",
    validateObjectId("planId"),
    contractController.listContractsForPlan
);

// LIST CONTRACTS FOR CUSTOMER
router.get(
    "/customer/:customerId/list",
    validateObjectId("customerId"),
    contractController.listContractsForCustomer
);

// DOWNLOAD PDF
router.get(
    "/:id/pdf",
    validateObjectId("id"),
    contractController.downloadContractPdf
);

// VIEW CONTRACT
router.get(
    "/:id/view",
    validateObjectId("id"),
    contractController.viewContract
);

module.exports = router;
