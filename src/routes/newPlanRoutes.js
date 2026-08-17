const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middlewares/requireLogin");

const newPlanController = require("../controllers/newPlanController");

// Step 1: Vælg kunde
router.get("/", requireLogin, newPlanController.step1_customer);

// Step 1b: Kundeliste (HTMX partial)
router.get("/customerList", requireLogin, newPlanController.customerList);

// Step 2: Opret plan
router.get("/plan", requireLogin, newPlanController.step2_plan);
router.post("/plan", requireLogin, newPlanController.savePlan);

// Step 3: Tilføj opgaver
router.get("/tasks", requireLogin, newPlanController.step3_tasks);

// Step 4: Lav tilbud
router.get("/offer", requireLogin, newPlanController.step4_offer);
router.post("/offer", requireLogin, newPlanController.saveOffer);


module.exports = router;
