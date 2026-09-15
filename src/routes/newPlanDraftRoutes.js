// routes/newPlanDraftRoutes.js

const express = require("express");
const router = express.Router();

const draftController = require("../controllers/newPlanDraftController");
const { requireAdmin } = require("../middlewares/requireAdmin");

// STEP 1: Vælg kunde
router.get("/customer", requireAdmin, draftController.step1_customer);
router.get("/customerLocations", requireAdmin, draftController.customerLocations);

router.post("/saveLocation", requireAdmin, draftController.saveLocation);

// STEP 2: Vælg rum
router.get("/rooms", requireAdmin, draftController.step2_rooms);
router.post("/rooms", requireAdmin, draftController.saveRooms);

// STEP 3: Generér tasks (SDS bundles) i session
router.get("/tasks", requireAdmin, draftController.step3_tasks);


// STEP 4: Rediger SDS bundle
router.get("/tasks/dailyBundle/edit", requireAdmin, draftController.editDailyBundle);
router.post("/tasks/dailyBundle/save", requireAdmin, draftController.saveDailyBundle);

// STEP 4: Summary (den store editor)
router.get("/summary", requireAdmin, draftController.step4_summary);
router.post("/summary", requireAdmin, draftController.saveSummaryAdjustments);

// Generér tilbud (offer snapshot)
router.post("/generateOffer", requireAdmin, draftController.generateOffer);

router.get("/taskEditor", requireAdmin, draftController.taskEditor);
router.post("/taskSave", requireAdmin, draftController.taskSave);


// STEP 6: Tilbud
router.get("/offer", requireAdmin, draftController.step6_offer);


router.get("/taskSelectCategory", requireAdmin, draftController.taskSelectCategory);
router.get("/taskSelectTemplate", requireAdmin, draftController.taskSelectTemplate);


// STEP 8: Opret cleaningPlan i databasen
router.post("/finalize", requireAdmin, draftController.finalizePlan);


module.exports = router;
