const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middlewares/requireLogin");

const newPlanController = require("../controllers/newPlanController");

const { validateObjectId } = require("../middlewares/validateObjectId");
const validateCleaningPlan  = require("../middlewares/validateCleaningPlan");
const validateCleaningTask = require("../middlewares/validateCleaningTask");
const validateDailyBundle = require("../middlewares/validateDailyBundle");
const validateOffer = require("../middlewares/validateOffer");
const validateOfferPreview = require("../middlewares/validateOfferPreview");

// Step 1b: Kundeliste (HTMX partial)
router.get("/customerList", requireLogin, newPlanController.customerList);

// Step 1c: Vælg lokation (HTMX partial)
router.get("/locationList", requireLogin, newPlanController.locationList);

// Step 2: Opret plan
router.get("/plan", requireLogin, newPlanController.step2_plan);
router.post("/plan", requireLogin, validateCleaningPlan, newPlanController.savePlan);

// Step 3: Tilføj opgaver
router.get("/tasks", requireLogin, newPlanController.step3_tasks);
router.get("/tasks/daily", requireLogin, newPlanController.tasks_daily);
router.get("/tasks/extra", requireLogin, newPlanController.tasks_extra);
router.get("/tasks/consumables", requireLogin, newPlanController.tasks_consumables);
router.get("/tasks/windows", requireLogin, newPlanController.tasks_windows);
router.get("/tasks/list", requireLogin, newPlanController.tasks_list);
router.get("/tasks/create", requireLogin, newPlanController.tasks_create);
router.post("/tasks/save", requireLogin, validateCleaningTask, newPlanController.tasks_save);

// DAILY BUNDLE
router.post("/tasks/dailyBundle/update", requireLogin, validateDailyBundle, newPlanController.tasks_updateDailyBundle);
router.get("/tasks/dailyBundle/edit", requireLogin, newPlanController.tasks_editDailyBundle);
router.get("/tasks/dailyBundle/create", requireLogin, newPlanController.tasks_createDailyBundle);
router.post("/tasks/dailyBundle/save", requireLogin, validateDailyBundle, newPlanController.tasks_saveDailyBundle);

// ALMINDELIGE TASKS
router.get("/tasks/:taskId/edit", requireLogin, validateObjectId("taskId"), newPlanController.tasks_edit);
router.post("/tasks/:taskId/preview", requireLogin, validateObjectId("taskId"), newPlanController.tasks_preview);
router.delete("/tasks/:taskId/delete", requireLogin, validateObjectId("taskId"), newPlanController.tasks_delete);
router.patch("/tasks/:taskId/update", requireLogin, validateObjectId("taskId"), validateCleaningTask, newPlanController.tasks_update);

router.post("/tasks/previewNew", requireLogin, validateCleaningTask, newPlanController.tasks_previewNew);

// Step 4: Lav tilbud
router.get("/offer", requireLogin, newPlanController.step4_offer);
router.post("/offer/save", requireLogin, validateOffer, newPlanController.saveOffer);
router.post("/offer/preview", requireLogin, validateOfferPreview, newPlanController.previewOffer);

// Step 1: Vælg kunde (skal ligge til sidst!)
router.get("/", requireLogin, newPlanController.step1_customer);

module.exports = router;
