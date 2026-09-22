// routes/newPlanDraftRoutes.js

const express = require("express");
const router = express.Router();

const draftController = require("../controllers/newPlanDraftController");

// STEP 1: Vælg kunde & lokation
router.get("/customer", draftController.step1_customer);
router.get("/customerLocations", draftController.customerLocations);
router.get("/customerSearch", draftController.customerSearch);
router.get("/selectCustomer", draftController.selectCustomer);
router.post("/saveLocation", draftController.saveLocation);

// Editor visning (den store træk-og-slip editor)
router.get("/summary", draftController.step4_summary);

// Editor handlinger: Lokaler
router.post("/addRoom", draftController.addRoom);
router.post("/removeRoom", draftController.removeRoom);
router.post("/updateRoom", draftController.updateRoom);
router.post("/reorderRooms", draftController.reorderRooms);

// Editor handlinger: Opgaver
router.post("/addTask", draftController.addTask);
router.post("/addTaskToPlan", draftController.addTask);
router.post("/addTaskToRoom", draftController.addTaskToRoom);
router.post("/removeTask", draftController.removeTask);
router.post("/updateTask", draftController.updateTask);

// Editor handlinger: Dage
router.post("/addDay", draftController.addDay);
router.post("/removeDay", draftController.removeDay);
router.post("/addDayToRoom", draftController.addDayToRoom);
router.post("/setDaysForRoom", draftController.setDaysForRoom);

// Editor handlinger: Justeringer & Noter
router.post("/summary", draftController.saveSummaryAdjustments);
router.post("/adjustments", draftController.saveSummaryAdjustments);
router.post("/saveSummaryAdjustments", draftController.saveSummaryAdjustments);
router.post("/updateRoomNotes", draftController.updateRoomNotes);

// Tilbud & afslutning
router.post("/generateOffer", draftController.generateOffer);
router.get("/offer", draftController.step6_offer);
router.post("/saveAsDraftOffer", draftController.saveAsDraftOffer);
router.post("/finalize", draftController.finalizePlan);

module.exports = router;
