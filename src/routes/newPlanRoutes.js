const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middlewares/requireLogin");
const { validateObjectId } = require("../middlewares/validateObjectId");
const newPlanController = require("../controllers/newPlanController");

// Alle editor-ruter i newPlanRoutes kræver login
router.use(requireLogin);

// Fallback til oprettelse hvis /newPlan tilgås direkte
router.get("/", (req, res) => res.redirect("/newPlanDraft/summary"));

// Hoved-editor visning for eksisterende rengøringsplan
router.get("/:planId/editor", validateObjectId("planId"), newPlanController.showEditor);
router.get("/:planId/summary", validateObjectId("planId"), newPlanController.showEditor);

// Editor handlinger: Lokaler
router.post("/:planId/addRoom", validateObjectId("planId"), newPlanController.addRoom);
router.post("/:planId/removeRoom", validateObjectId("planId"), newPlanController.removeRoom);
router.post("/:planId/updateRoom", validateObjectId("planId"), newPlanController.updateRoom);
router.post("/:planId/reorderRooms", validateObjectId("planId"), newPlanController.reorderRooms);

// Editor handlinger: Opgaver
router.post("/:planId/addTask", validateObjectId("planId"), newPlanController.addTask);
router.post("/:planId/removeTask", validateObjectId("planId"), newPlanController.removeTask);
router.post("/:planId/updateTask", validateObjectId("planId"), newPlanController.updateTask);

// Editor handlinger: Dagsvalg
router.post("/:planId/addDayToRoom", validateObjectId("planId"), newPlanController.addDayToRoom);
router.post("/:planId/setDaysForRoom", validateObjectId("planId"), newPlanController.setDaysForRoom);
router.post("/:planId/addDay", validateObjectId("planId"), newPlanController.addDay);
router.post("/:planId/removeDay", validateObjectId("planId"), newPlanController.removeDay);

// Editor handlinger: Overordnede justeringer & Noter
router.post("/:planId/saveSummaryAdjustments", validateObjectId("planId"), newPlanController.saveSummaryAdjustments);
router.post("/:planId/updateRoomNotes", validateObjectId("planId"), newPlanController.updateRoomNotes);

module.exports = router;
