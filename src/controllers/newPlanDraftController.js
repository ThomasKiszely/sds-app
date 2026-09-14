// controllers/newPlanDraftController.js

const newPlanDraftService = require("../services/newPlanDraftService");
const roomTemplateService = require("../services/roomTemplateService");
const customerService = require("../services/customerService");

const { daysLabels } = require("../utils/dayEnum");
const { frequencyLabels } = require("../utils/frequencyEnum");
const { categoryLabels, categoryTypes } = require("../utils/categoryEnum");
const { units, unitsLabels } = require("../utils/unitEnum");
const { paymentTerms, paymentTermLabels } = require("../utils/paymentTerms");
const { terminationNotice, terminationNoticeLabels } = require("../utils/terminationNotice");
const systemSettingsService = require("../services/systemSettingsService");


// STEP 1: Vælg kunde
async function step1_customer(req, res) {
    const systemSettings = await systemSettingsService.getSettings();
    req.session.planDraft = newPlanDraftService.initDraft(systemSettings);
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


// STEP 2: Vælg rum
async function step2_rooms(req, res) {
    const templates = await roomTemplateService.getAllRoomTemplates();

    return res.render("newPlanDraft/rooms", {
        templates,
        error: null,
        draft: req.session.planDraft
    });
}


async function saveRooms(req, res) {

    let selectedIds = req.body.selectedTemplates;

    if (!selectedIds) {
        selectedIds = [];
    } else if (!Array.isArray(selectedIds)) {
        selectedIds = [selectedIds];
    }

    const counts = req.body.counts || {};

    if (selectedIds.length === 0) {
        const templates = await roomTemplateService.getAllRoomTemplates();
        return res.render("newPlanDraft/rooms", {
            templates,
            error: "Vælg venligst mindst ét rum.",
            draft: req.session.planDraft
        });
    }

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


// STEP 3: Generér tasks (SDS bundles) i session
async function step3_tasks(req, res) {
    const draft = req.session.planDraft;

    if (!draft || !draft.rooms || draft.rooms.length === 0) {
        const templates = await roomTemplateService.getAllRoomTemplates();
        return res.render("newPlanDraft/rooms", {
            templates,
            error: "Vælg venligst mindst ét rum først.",
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

// STEP 4: Rediger SDS bundle (session)
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


// STEP 5: Rabat / drift / miljø
async function step5_adjustments(req, res) {
    const draft = req.session.planDraft || {};

    const systemSettings = await systemSettingsService.getSettings();

    return res.render("newPlanDraft/adjustments", {
        discounts: draft.discounts || {},
        environment: draft.environment || {},
        operations: draft.operations || {},
        paymentTerms,
        paymentTermLabels,
        terminationNotice,
        terminationNoticeLabels,
        systemSettings
    });
}


async function saveAdjustments(req, res) {
    const systemSettings = await systemSettingsService.getSettings();

    newPlanDraftService.updateAdjustments(
        req.session.planDraft,
        req.body,
        systemSettings
    );

    const vm = newPlanDraftService.buildOffer(req.session.planDraft);
    return res.render("newPlanDraft/offer", vm);
}


// STEP 6: Tilbud
function step6_offer(req, res) {
    const vm = newPlanDraftService.buildOffer(req.session.planDraft);

    return res.render("newPlanDraft/offer", vm);
}


// STEP 7: Kontrakt
function step7_contract(req, res) {
    const vm = newPlanDraftService.buildContract(req.session.planDraft);
    return res.render("newPlanDraft/contract", { draft: vm });
}


// STEP 8: Opret cleaningPlan i databasen
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