// controllers/newPlanDraftController.js

const newPlanDraftService = require("../services/newPlanDraftService");
const roomTemplateService = require("../services/roomTemplateService");
const customerService = require("../services/customerService");

const { daysLabels } = require("../utils/dayEnum");
const { frequencyLabels } = require("../utils/frequencyEnum");
const { categoryLabels, categoryTypes } = require("../utils/categoryEnum");
const { units, unitsLabels } = require("../utils/unitEnum");


// ------------------------------------------------------------
// INIT: Start draft
// ------------------------------------------------------------
function startDraft(req, res) {
    req.session.planDraft = newPlanDraftService.initDraft();

    res.setHeader("HX-Location", JSON.stringify({
        path: "/newPlanDraft/customer",
        target: "#content",
        swap: "innerHTML"
    }));

    return res.status(200).end();
}


// ------------------------------------------------------------
// STEP 1: Vælg kunde
// ------------------------------------------------------------
async function step1_customer(req, res) {
    const customers = await customerService.getActiveCustomers();

    return res.render("newPlanDraft/step1_customer", {
        customers,
        error: null
    });
}

async function saveCustomer(req, res) {
    req.session.planDraft.customerId = req.body.customerId;

    const templates = await roomTemplateService.getAllRoomTemplates();

    return res.render("newPlanDraft/rooms", {
        templates,
        error: null,
        draft: req.session.planDraft
    });
}


// ------------------------------------------------------------
// STEP 2: Vælg rum
// ------------------------------------------------------------
async function step2_rooms(req, res) {
    const templates = await roomTemplateService.getAllRoomTemplates();

    return res.render("newPlanDraft/rooms", {
        templates,
        error: null,
        draft: req.session.planDraft
    });
}


async function saveRooms(req, res) {
    const selectedIds = Array.isArray(req.body.selectedTemplates)
        ? req.body.selectedTemplates
        : [req.body.selectedTemplates];

    const counts = req.body.counts || {};

    const rooms = await newPlanDraftService.generateRooms(selectedIds, counts);

    req.session.planDraft.rooms = rooms;

    const vm = await newPlanDraftService.generateDraftTasks(req.session.planDraft);

    return res.render("newPlanDraft/tasks", {
        ...vm,
        daysLabels,
        frequencyLabels,
        categoryLabels,
        categoryTypes,
        units,
        unitsLabels
    });
}


// ------------------------------------------------------------
// STEP 3: Generér tasks (SDS bundles) i session
// ------------------------------------------------------------
async function step3_tasks(req, res) {
    const draft = req.session.planDraft;

    if (!draft || !draft.rooms || draft.rooms.length === 0) {
        const templates = await roomTemplateService.getAllRoomTemplates();
        return res.render("newPlanDraft/rooms", {
            templates,
            error: "Vælg venligst mindst én rum-mal først.",
            draft: draft || {}
        });
    }

    const vm = await newPlanDraftService.generateDraftTasks(draft);

    return res.render("newPlanDraft/tasks", {
        ...vm,
        daysLabels,
        frequencyLabels,
        categoryLabels,
        categoryTypes,
        units,
        unitsLabels
    });
}


// ------------------------------------------------------------
// STEP 4: Rediger SDS bundle (session)
// ------------------------------------------------------------
function editDailyBundle(req, res) {
    const draft = req.session.planDraft;
    const roomName = req.query.roomName;

    try {
        const tasks = newPlanDraftService.getBundleForRoom(draft, roomName);

        return res.render("newPlanDraft/editDailyBundle", {
            roomName,
            tasks,
            daysLabels,
            frequencyLabels,
            units,
            unitsLabels,
            categoryLabels,
            categoryTypes
        });

    } catch (err) {
        return res.render("newPlanDraft/error", { message: err.message });
    }
}

function saveDailyBundle(req, res) {
    const draft = req.session.planDraft;
    const roomName = req.body.roomName;

    const vm = newPlanDraftService.updateBundle(draft, roomName, req.body);

    return res.render("newPlanDraft/tasks", {
        ...vm,
        daysLabels,
        frequencyLabels,
        categoryLabels,
        categoryTypes,
        units,
        unitsLabels
    });
}


// ------------------------------------------------------------
// STEP 5: Rabat / drift / miljø
// ------------------------------------------------------------
function step5_adjustments(req, res) {
    const draft = req.session.planDraft || {};
    return res.render("newPlanDraft/adjustments", {
        discounts: draft.discounts || {},
        environment: draft.environment || {},
        operations: draft.operations || {}
    });
}

function saveAdjustments(req, res) {
    newPlanDraftService.updateAdjustments(req.session.planDraft, req.body);

    // Render tilbudssiden direkte i stedet for redirect
    const vm = newPlanDraftService.buildOffer(req.session.planDraft);
    return res.render("newPlanDraft/offer", vm);
}


// ------------------------------------------------------------
// STEP 6: Tilbud
// ------------------------------------------------------------
function step6_offer(req, res) {
    const vm = newPlanDraftService.buildOffer(req.session.planDraft);

    return res.render("newPlanDraft/offer", vm);
}


// ------------------------------------------------------------
// STEP 7: Kontrakt
// ------------------------------------------------------------
function step7_contract(req, res) {
    const vm = newPlanDraftService.buildContract(req.session.planDraft);
    return res.render("newPlanDraft/contract", { draft: vm });
}


// ------------------------------------------------------------
// STEP 8: Opret cleaningPlan i databasen
// ------------------------------------------------------------
async function finalizePlan(req, res) {
    const draft = req.session.planDraft;

    const { plan } = await newPlanDraftService.finalizePlan(draft);

    req.session.planDraft = null;

    res.setHeader("HX-Location", JSON.stringify({
        path: `/newPlan/step4_offer?planId=${plan._id}`,
        target: "#content",
        swap: "innerHTML"
    }));

    return res.status(200).end();
}


module.exports = {
    startDraft,
    step1_customer,
    saveCustomer,
    step2_rooms,
    saveRooms,
    step3_tasks,
    editDailyBundle,
    saveDailyBundle,
    step5_adjustments,
    saveAdjustments,
    step6_offer,
    step7_contract,
    finalizePlan
};