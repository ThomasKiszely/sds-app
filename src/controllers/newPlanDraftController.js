// controllers/newPlanDraftController.js

const newPlanDraftService = require("../services/newPlanDraftService");
const roomTemplateService = require("../services/roomTemplateService");
const customerService = require("../services/customerService");
const locationService = require("../services/locationService");
const cleaningTaskTemplateService = require("../services/cleaningTaskTemplateService");

const { daysLabels } = require("../utils/dayEnum");
const { frequencyLabels } = require("../utils/frequencyEnum");
const { categoryLabels, categoryTypes } = require("../utils/categoryEnum");
const { units, unitsLabels } = require("../utils/unitEnum");
const { paymentTerms, paymentTermLabels } = require("../utils/paymentTerms");
const { terminationNotice, terminationNoticeLabels } = require("../utils/terminationNotice");
const systemSettingsService = require("../services/systemSettingsService");


// HTMX: hent lokationer for valgt kunde
async function customerLocations(req, res) {
    const customerId = req.query.customerId;

    if (!customerId) {
        return res.render("newPlanDraft/_locationSelect", {
            locations: [],
            customerId: null,
            selectedLocationId: null
        });
    }

    req.session.planDraft.customerId = customerId;

    const locations = await locationService.getLocationsForCustomer(customerId);

    if (locations.length === 1) {
        req.session.planDraft.locationId = locations[0]._id;
    }

    return res.render("newPlanDraft/_locationSelect", {
        locations,
        customerId,
        selectedLocationId: req.session.planDraft.locationId
    });
}


// HTMX: gem valgt lokation
function saveLocation(req, res) {
    req.session.planDraft.locationId = req.body.locationId;
    return res.render("newPlanDraft/_continueToRooms");
}


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

    if (!selectedIds) selectedIds = [];
    else if (!Array.isArray(selectedIds)) selectedIds = [selectedIds];

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


// STEP 3: Generér SDS tasks
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


// STEP 4: Rediger SDS bundle
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


// ⭐ STEP 4: SUMMARY — controlleren laver INGEN prislogik
async function step4_summary(req, res) {
    const draft = req.session.planDraft;

    if (!draft || !draft.tasks || draft.tasks.length === 0) {
        return res.redirect("/newPlanDraft/tasks");
    }

    // ⭐ Prisberegning ét sted
    newPlanDraftService.priceAllTasks(draft);

    // ⭐ Byg viewmodel — UDEN at genskabe SDS tasks
    const vm = newPlanDraftService.buildTaskViewModel(draft);

    const systemSettings = await systemSettingsService.getSettings();

    return res.render("newPlanDraft/summary", {
        ...vm,
        draft,
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


// SUMMARY: opdater avanceret
async function saveSummaryAdjustments(req, res) {
    const systemSettings = await systemSettingsService.getSettings();

    newPlanDraftService.updateAdjustments(
        req.session.planDraft,
        req.body,
        systemSettings
    );

    return step4_summary(req, res);
}


// STEP 6: Tilbud — ingen prislogik
function step6_offer(req, res) {
    newPlanDraftService.priceAllTasks(req.session.planDraft);

    const vm = newPlanDraftService.buildOffer(req.session.planDraft);

    return res.render("newPlanDraft/offer", vm);
}


// STEP 8: Finalize — ingen prislogik
async function finalizePlan(req, res) {
    const draft = req.session.planDraft;

    newPlanDraftService.priceAllTasks(draft);

    const { plan } = await newPlanDraftService.finalizePlan(draft);

    req.session.planDraft = null;

    res.setHeader("HX-Location", JSON.stringify({
        path: `/newPlanDraft/offer?planId=${plan._id}`,
        target: "#content",
        swap: "innerHTML"
    }));

    return res.status(200).end();
}


// Offer snapshot — ingen prislogik
function generateOffer(req, res) {
    const draft = req.session.planDraft;

    newPlanDraftService.priceAllTasks(draft);

    const vm = newPlanDraftService.buildOffer(draft);

    return res.render("newPlanDraft/offer", vm);
}


// Overlay-editor
async function taskEditor(req, res) {
    const templateId = req.query.templateId;

    const tpl = await cleaningTaskTemplateService.getById(templateId);

    // HENT ALLE TEMPLATES FOR DENNE KATEGORI
    const templates = await cleaningTaskTemplateService.getTemplatesByCategory(tpl.category);

    const task = {
        templateId: tpl._id,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        unit: tpl.unit,
        durationPerUnit: tpl.durationPerUnit,
        frequency: tpl.frequency || "weekly",
        amount: tpl.amount ?? 1,
        customPrice: tpl.customPrice ?? null,
        days: tpl.days ?? [],
        roomName: ""
    };

    return res.render("newPlanDraft/taskEditor", {
        task,
        templates,
        categoryTypes,
        categoryLabels,
        frequencyLabels,
        daysLabels,
        units,
        unitsLabels
    });
}


function taskSelectCategory(req, res) {
    return res.render("newPlanDraft/taskSelectCategory", {
        categoryTypes,
        categoryLabels
    });
}


async function taskSave(req, res) {
    const draft = req.session.planDraft;

    const tpl = await cleaningTaskTemplateService.findTemplateById(req.body.templateId);

    const task = {
        templateId: tpl._id,
        name: req.body.name,
        description: req.body.description || tpl.description,
        category: tpl.category,
        frequency: req.body.frequency,
        amount: Number(req.body.amount || tpl.amount || 1),
        durationPerUnit: Number(req.body.durationPerUnit || tpl.durationPerUnit),
        customPrice: Number(req.body.customPrice || tpl.customPrice || 0),
        roomName: "",
        days: req.body.days || tpl.days || []
    };

    draft.tasks.push(task);

    return step4_summary(req, res);
}


async function taskSelectTemplate(req, res) {
    const category = req.query.category;

    const templates = await cleaningTaskTemplateService.getTemplatesByCategory(category);

    return res.render("newPlanDraft/taskSelectTemplate", {
        category,
        templates,
        categoryLabels
    });
}


module.exports = {
    step1_customer,
    step2_rooms,
    saveRooms,
    step3_tasks,
    editDailyBundle,
    saveDailyBundle,
    step6_offer,
    finalizePlan,
    customerLocations,
    saveLocation,
    generateOffer,
    saveSummaryAdjustments,
    step4_summary,
    taskEditor,
    taskSave,
    taskSelectCategory,
    taskSelectTemplate
};
