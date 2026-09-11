// routes/newPlanDraftRoutes.js

const express = require("express");
const router = express.Router();

const draftController = require("../controllers/newPlanDraftController");
const { requireAdmin } = require("../middlewares/requireAdmin");


// ------------------------------------------------------------
// INIT: Start nyt draft-flow
// ------------------------------------------------------------
router.get("/start", requireAdmin, draftController.startDraft);


// ------------------------------------------------------------
// STEP 1: Vælg kunde
// ------------------------------------------------------------
router.get("/customer", requireAdmin, draftController.step1_customer);
router.post("/customer", requireAdmin, draftController.saveCustomer);


// ------------------------------------------------------------
// STEP 2: Vælg rum
// ------------------------------------------------------------
router.get("/rooms", requireAdmin, draftController.step2_rooms);
router.post("/rooms", requireAdmin, draftController.saveRooms);


// ------------------------------------------------------------
// STEP 3: Generér tasks (SDS bundles) i session
// ------------------------------------------------------------
router.get("/tasks", requireAdmin, draftController.step3_tasks);


// ------------------------------------------------------------
// STEP 4: Rediger SDS bundle
// ------------------------------------------------------------
router.get("/tasks/dailyBundle/edit", requireAdmin, draftController.editDailyBundle);
router.post("/tasks/dailyBundle/save", requireAdmin, draftController.saveDailyBundle);


// ------------------------------------------------------------
// STEP 5: Rabat / drift / miljø
// ------------------------------------------------------------
router.get("/adjustments", requireAdmin, draftController.step5_adjustments);
router.post("/adjustments", requireAdmin, draftController.saveAdjustments);


// ------------------------------------------------------------
// STEP 6: Tilbud
// ------------------------------------------------------------
router.get("/offer", requireAdmin, draftController.step6_offer);


// ------------------------------------------------------------
// STEP 7: Kontrakt
// ------------------------------------------------------------
router.get("/contract", requireAdmin, draftController.step7_contract);


// ------------------------------------------------------------
// STEP 8: Opret cleaningPlan i databasen
// ------------------------------------------------------------
router.post("/finalize", requireAdmin, draftController.finalizePlan);


module.exports = router;
