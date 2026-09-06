const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contractController");

router.post("/:planId/generate", contractController.generateContract);
router.get("/:planId/list", contractController.listContractsForPlan);
router.get("/customer/:customerId/list", contractController.listContractsForCustomer);
router.get("/:id/pdf", contractController.downloadContractPdf);
router.get("/:id/view", contractController.viewContract);


module.exports = router;
