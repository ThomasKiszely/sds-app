const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middlewares/requireLogin");

const newPlanController = require("../controllers/newPlanController");

// Step 1b: Kundeliste (HTMX partial)
router.get("/customerList", requireLogin, newPlanController.customerList);

// Step 1c: Vælg lokation (HTMX partial)
router.get("/locationList", requireLogin, newPlanController.locationList);

// Step 2: Opret plan
router.get("/plan", requireLogin, newPlanController.step2_plan);
router.post("/plan", requireLogin, newPlanController.savePlan);

// Step 3: Tilføj opgaver
router.get("/tasks", requireLogin, newPlanController.step3_tasks);
router.get("/tasks/daily", requireLogin, newPlanController.tasks_daily);
router.get("/tasks/extra", requireLogin, newPlanController.tasks_extra);
router.get("/tasks/consumables", requireLogin, newPlanController.tasks_consumables);
router.get("/tasks/windows", requireLogin, newPlanController.tasks_windows);
router.get("/tasks/list", requireLogin, newPlanController.tasks_list);
router.get("/tasks/create", requireLogin, newPlanController.tasks_create);
router.post("/tasks/save", requireLogin, newPlanController.tasks_save);


// ⭐ DAILY BUNDLE — skal stå FØRST
router.post("/tasks/dailyBundle/update", requireLogin, newPlanController.tasks_updateDailyBundle);
router.get("/tasks/dailyBundle/edit", requireLogin, newPlanController.tasks_editDailyBundle);
router.get("/tasks/dailyBundle/create", requireLogin, newPlanController.tasks_createDailyBundle);
router.post("/tasks/dailyBundle/save", requireLogin, newPlanController.tasks_saveDailyBundle);

// ⭐ ALMINDELIGE TASKS — skal stå BAGEFTER
router.get("/tasks/:taskId/edit", requireLogin, newPlanController.tasks_edit);
router.post("/tasks/:taskId/preview", requireLogin, newPlanController.tasks_preview);
router.delete("/tasks/:taskId/delete", requireLogin, newPlanController.tasks_delete);
router.patch("/tasks/:taskId/update", requireLogin, newPlanController.tasks_update);
router.post("/tasks/previewNew", requireLogin, newPlanController.tasks_previewNew);

// Step 4: Lav tilbud
router.get("/offer", requireLogin, newPlanController.step4_offer);
router.post("/offer/save", requireLogin, newPlanController.saveOffer);
router.post("/offer/preview", requireLogin, newPlanController.previewOffer);

// Step 1: Vælg kunde (skal ligge til sidst!)
router.get("/", requireLogin, newPlanController.step1_customer);

module.exports = router;
