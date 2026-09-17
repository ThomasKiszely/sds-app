// controllers/newPlanDraftController.js

const newPlanDraftService = require("../services/newPlanDraftService");
const roomTemplateService = require("../services/roomTemplateService");
const customerService = require("../services/customerService");
const locationService = require("../services/locationService");
const cleaningTaskTemplateService = require("../services/cleaningTaskTemplateService");
const offerService = require("../services/offerService");


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

    const customer = await customerService.getCustomerById(customerId);


    req.session.planDraft.customerId = customerId;

    const locations = await locationService.getLocationsForCustomer(customerId);

    if (locations.length === 1) {
        req.session.planDraft.locationId = locations[0]._id;
    }

    console.log("customerId from query:", req.query.customerId);
    console.log("customerId in session:", req.session.planDraft.customerId);


    return res.render("newPlanDraft/_locationSelect", {
        locations,
        customerId,
        selectedCustomerId: customerId,
        selectedCustomerName: customer.customerName,
        selectedLocationId: req.session.planDraft.locationId
    });
}


// HTMX: gem valgt lokation
function saveLocation(req, res) {
    req.session.planDraft.locationId = req.body.locationId;
    console.log("saveLocation: customerId in session:", req.session.planDraft.customerId);

    return res.render("newPlanDraft/_continueToRooms");
}


// STEP 1: Vælg kunde
async function step1_customer(req, res) {
    const systemSettings = await systemSettingsService.getSettings();
    req.session.planDraft = newPlanDraftService.initDraft(systemSettings);

    const customers = await customerService.getActiveCustomers();

    return res.render("newPlanDraft/step1_customer", {
        customers,
        selectedCustomerId: req.session.planDraft.customerId || null,
        error: null
    });
}


// HTMX: live-søgning efter kunder
async function customerSearch(req, res) {
    const search = req.query.search?.trim() || "";

    const customers = await customerService.searchCustomers(search);

    return res.render("newPlanDraft/partials/customerSearchResults", {
        customers
    });
}

// HTMX: vælg kunde fra søgeresultatet
async function selectCustomer(req, res) {
    const customerId = req.query.customerId;

    const customer = await customerService.getCustomerById(customerId);

    // Sæt valgt kunde i draft
    req.session.planDraft.customerId = customerId;

    return res.send(`
        <option value="${customer._id}" selected>${customer.customerName}</option>
    `);
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
        unitsLabels,
        draft: req.session.planDraft
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
        unitsLabels,
        draft: req.session.planDraft
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
            categoryTypes,
            draft,
        });

    } catch (err) {
        return res.render("newPlanDraft/error", { message: err.message });
    }
}

function saveDailyBundle(req, res) {
    const draft = req.session.planDraft;
    const roomName = req.body.roomName;

    newPlanDraftService.updateRoomNotes(draft, roomName, req.body.roomNotes);

    const vm = newPlanDraftService.updateBundle(draft, roomName, req.body);

    return res.render("newPlanDraft/tasks", {
        ...vm,
        daysLabels,
        frequencyLabels,
        categoryLabels,
        categoryTypes,
        units,
        unitsLabels,
        draft
    });
}


// STEP 4: SUMMARY — controlleren laver INGEN prislogik
async function step4_summary(req, res) {
    const draft = req.session.planDraft;

    if (!draft || !draft.tasks || draft.tasks.length === 0) {
        return res.redirect("/newPlanDraft/tasks");
    }

    newPlanDraftService.priceAllTasks(draft);

    draft.roomNotes = draft.roomNotes || [];

    draft.operations = draft.operations || {};
    draft.operations.paymentTerms =
        draft.operations.paymentTerms || paymentTerms.netto30;
    draft.operations.terminationNotice =
        draft.operations.terminationNotice || terminationNotice.month3;

    const vm = newPlanDraftService.buildTaskViewModel(draft);
    const systemSettings = await systemSettingsService.getSettings();

    // Hvis brugeren ikke har trykket "Opdater", så brug systemets default
    draft.environment = draft.environment || {};

    if (draft.environment.environmentalFeePercent == null) {
        draft.environment.environmentalFeePercent = systemSettings.environmentalFee;
    }


    return res.render("newPlanDraft/summary", {
        ...vm,
        draft,
        discounts: draft.discounts || {},
        environment: draft.environment || {},
        operations: draft.operations,
        paymentTerms,
        paymentTermLabels,
        terminationNotice,
        terminationNoticeLabels,
        systemSettings,
        categoryTypes,
        categoryLabels
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

    console.log("BODY paymentTerms:", req.body.paymentTerms);


    return step4_summary(req, res);
}


// STEP 6: Tilbud — ingen prislogik
function step6_offer(req, res) {
    newPlanDraftService.priceAllTasks(req.session.planDraft);

    const vm = newPlanDraftService.buildOffer(req.session.planDraft);

    return res.render("newPlanDraft/offer", vm);
}


async function finalizePlan(req, res) {
    const draft = req.session.planDraft;

    // Beregn priser på draft
    newPlanDraftService.priceAllTasks(draft);

    // 1. Opret cleaningPlan i DB
    const { plan } = await newPlanDraftService.finalizePlan(draft);

    // 2. Opret offer baseret på cleaningPlan
    const offer = await offerService.createOffer(plan._id, {
        discountPercent: draft.discounts?.discountPercent ?? 0,
        environmentalFeePercent: draft.environment?.environmentalFeePercent ?? 4,
        paymentTerms: draft.operations?.paymentTerms,
        terminationNotice: draft.operations?.terminationNotice
    });

    // 3. Slet draft – planen er nu låst
    req.session.planDraft = null;

    // 4. Hop til det færdige tilbud
    res.setHeader("HX-Location", JSON.stringify({
        path: `/offers/${offer._id}/view`,
        target: "#content",
        swap: "innerHTML"
    }));

    return res.status(200).end();
}




// GEM SOM KLADDE-TILBUD
async function saveAsDraftOffer(req, res) {
    const draft = req.session.planDraft;

    newPlanDraftService.priceAllTasks(draft);

    const { plan } = await newPlanDraftService.finalizePlan(draft);

    req.session.planDraft = draft;

    const vm = newPlanDraftService.buildOffer(draft);

    res.setHeader("HX-Trigger", JSON.stringify({ toast: "Tilbud gemt som kladde" }));

    res.setHeader("HX-Location", JSON.stringify({
        path: `/customers/${draft.customerId}/plans`,
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
    const draft = req.session.planDraft;

    // Evt. forudvalgt kategori (fx fra query ?category=consumables)
    const initialCategory = req.query.category || null;

    let templates = null;
    if (initialCategory) {
        templates = await cleaningTaskTemplateService.getTemplatesByCategory(initialCategory);
    }

    // Ingen eksisterende task her – vi tilføjer ny
    const task = null;

    return res.render("newPlanDraft/taskEditor", {
        task,
        templates,
        categoryTypes,
        categoryLabels,
        frequencyLabels,
        daysLabels,
        units,
        unitsLabels,
        initialCategory
    });
}


// HTMX: opdater template-dropdown når kategori ændres
async function taskSelectTemplate(req, res) {
    const category = req.query.category;
    const initialCategory = req.query.category;

    const templates = await cleaningTaskTemplateService.getTemplatesByCategory(category);

    // Denne EJS skal kun rendere <div id="templateSelectContainer"> ... </div>
    return res.render("newPlanDraft/_templateSelect", {
        templates,
        initialCategory
    });
}

// HTMX: hent felter for valgt template
async function taskLoadTemplate(req, res) {
    const templateId = req.query.templateId;

    const initialCategory = req.query.category;

    if (!templateId) {
        return res.send(""); // tomt svar hvis ingen valgt
    }

    const tpl = await cleaningTaskTemplateService.findTemplateById(templateId);

    return res.render("newPlanDraft/_templateFields", {
        tpl,
        frequencyLabels,
        unitsLabels,
        daysLabels,
        initialCategory,
        categoryTypes,
        categoryLabels
    });
}


async function taskSave(req, res) {
    const draft = req.session.planDraft;

    const tpl = await cleaningTaskTemplateService.findTemplateById(req.body.templateId);

    const customPrice =
        req.body.customPrice === "" || req.body.customPrice == null
            ? null
            : Number(req.body.customPrice);

    const task = {
        templateId: tpl._id,
        name: req.body.name || tpl.name,
        description: req.body.description || tpl.description,
        category: tpl.category,
        frequency: req.body.frequency || tpl.frequency || "weekly",
        amount: Number(req.body.amount || tpl.amount || 1),
        durationPerUnit: Number(req.body.durationPerUnit || tpl.durationPerUnit),
        customPrice,
        roomName: "",
        days: req.body.days || tpl.days || []
    };

    console.log(task);

    draft.tasks.push(task);

    return step4_summary(req, res);
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
    taskSelectTemplate,
    taskLoadTemplate,
    saveAsDraftOffer,
    selectCustomer,
    customerSearch
};
