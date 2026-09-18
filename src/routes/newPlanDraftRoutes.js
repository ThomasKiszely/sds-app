// routes/newPlanDraftRoutes.js

const express = require("express");
const router = express.Router();

const draftController = require("../controllers/newPlanDraftController");

// STEP 1: Vælg kunde
router.get("/customer", draftController.step1_customer);
router.get("/customerLocations", draftController.customerLocations);
router.get("/customerSearch", draftController.customerSearch);
router.get("/selectCustomer", draftController.selectCustomer);


router.post("/saveLocation", draftController.saveLocation);

// STEP 2: Vælg rum
router.get("/rooms", draftController.step2_rooms);
router.post("/rooms", draftController.saveRooms);

// STEP 3: Generér tasks (SDS bundles) i session
router.get("/tasks", draftController.step3_tasks);


// STEP 4: Rediger SDS bundle
router.get("/tasks/dailyBundle/edit", draftController.editDailyBundle);
router.post("/tasks/dailyBundle/save", draftController.saveDailyBundle);

// STEP 4: Summary (den store editor)
router.get("/summary", draftController.step4_summary);
router.post("/summary", draftController.saveSummaryAdjustments);
router.post("/adjustments", draftController.saveSummaryAdjustments)


// Generér tilbud (offer snapshot)
router.post("/generateOffer", draftController.generateOffer);

router.get("/taskEditor", draftController.taskEditor);
router.post("/taskSave", draftController.taskSave);


// STEP 6: Tilbud
router.get("/offer", draftController.step6_offer);
router.get("/taskLoadTemplate", draftController.taskLoadTemplate);

router.get("/taskSelectTemplate", draftController.taskSelectTemplate);

router.post("/saveAsDraftOffer", draftController.saveAsDraftOffer);

// STEP 8: Opret cleaningPlan i databasen
router.post("/finalize", draftController.finalizePlan);


module.exports = router;
