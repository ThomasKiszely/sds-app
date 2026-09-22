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

    if (!req.session.planDraft) {
        const systemSettings = await systemSettingsService.getSettings();
        req.session.planDraft = newPlanDraftService.initDraft(systemSettings);
    }

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
        selectedCustomerName: customer ? customer.customerName : "",
        selectedLocationId: req.session.planDraft.locationId
    });
}


// HTMX: gem valgt lokation
function saveLocation(req, res) {
    if (!req.session.planDraft) {
        req.session.planDraft = {};
    }
    req.session.planDraft.locationId = req.body.locationId;
    console.log("saveLocation: customerId in session:", req.session.planDraft.customerId);

    return res.render("newPlanDraft/_continueToRooms");
}


// STEP 1: Vælg kunde (initialiserer draft og åbner editoren)
async function step1_customer(req, res) {
    const systemSettings = await systemSettingsService.getSettings();
    req.session.planDraft = newPlanDraftService.initDraft(systemSettings);

    if (req.query.customerId) {
        req.session.planDraft.customerId = req.query.customerId;
        try {
            const locations = await locationService.getLocationsForCustomer(req.query.customerId);
            if (locations && locations.length === 1) {
                req.session.planDraft.locationId = locations[0]._id;
            }
        } catch (e) {
            console.error("Kunne ikke hente lokationer:", e.message);
        }
    }

    return step4_summary(req, res);
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

    if (!req.session.planDraft) {
        const systemSettings = await systemSettingsService.getSettings();
        req.session.planDraft = newPlanDraftService.initDraft(systemSettings);
    }

    // Sæt valgt kunde i draft
    req.session.planDraft.customerId = customerId;

    return res.send(`
        <option value="${customer._id}" selected>${customer.customerName}</option>
    `);
}


// STEP 4: SUMMARY — den store træk-og-slip editor
async function step4_summary(req, res) {
    const systemSettings = await systemSettingsService.getSettings();

    if (!req.session.planDraft) {
        req.session.planDraft = newPlanDraftService.initDraft(systemSettings);
    }

    const draft = req.session.planDraft;

    draft.roomNotes = draft.roomNotes || [];
    draft.operations = draft.operations || {};
    draft.operations.paymentTerms =
        draft.operations.paymentTerms || paymentTerms.netto30;
    draft.operations.terminationNotice =
        draft.operations.terminationNotice || terminationNotice.month3;

    draft.environment = draft.environment || {};
    if (draft.environment.environmentalFeePercent == null) {
        draft.environment.environmentalFeePercent = systemSettings.environmentalFee;
    }

    let customer = null;
    if (draft.customerId) {
        try {
            customer = await customerService.getCustomerById(draft.customerId);
        } catch (e) {
            console.error("Kunne ikke hente kunde:", e.message);
        }
    }

    let location = null;
    if (draft.locationId) {
        try {
            location = await locationService.getLocationById(draft.locationId);
        } catch (e) {
            console.error("Kunne ikke hente lokation:", e.message);
        }
    }

    const vm = await newPlanDraftService.buildEditorViewModel(draft, systemSettings, customer, location);

    return res.render("newPlanDraft/summary", vm);
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


// EDITOR HANDLERS: Lokaler
async function addRoom(req, res) {
    const { templateId, name, size } = req.body;
    const draft = req.session.planDraft;

    await newPlanDraftService.addRoomToDraft(draft, templateId, name, size);
    return step4_summary(req, res);
}

function removeRoom(req, res) {
    const { roomName } = req.body;
    const draft = req.session.planDraft;

    newPlanDraftService.removeRoomFromDraft(draft, roomName);
    return step4_summary(req, res);
}

function updateRoom(req, res) {
    const { oldRoomName, roomName, size } = req.body;
    const draft = req.session.planDraft;

    newPlanDraftService.updateRoomInDraft(draft, oldRoomName, roomName, size);
    return step4_summary(req, res);
}

function reorderRooms(req, res) {
    let order = req.body.order;
    if (typeof order === "string") {
        try {
            order = JSON.parse(order);
        } catch (e) {
            order = [order];
        }
    }
    const draft = req.session.planDraft;

    newPlanDraftService.reorderRoomsInDraft(draft, order);
    return step4_summary(req, res);
}


// EDITOR HANDLERS: Opgaver
async function addTaskToRoom(req, res) {
    const { roomName, slotName, templateId } = req.body;
    const draft = req.session.planDraft;

    await newPlanDraftService.addTaskToRoomInDraft(draft, roomName, templateId, slotName);
    return step4_summary(req, res);
}

async function addTask(req, res) {
    const { roomName, slotName, templateId } = req.body;
    const draft = req.session.planDraft;

    await newPlanDraftService.addTaskToRoomInDraft(draft, roomName, templateId, slotName);
    return step4_summary(req, res);
}

function removeTask(req, res) {
    const { roomName, templateId, taskIndex } = req.body;
    const draft = req.session.planDraft;

    newPlanDraftService.removeTaskFromDraft(draft, roomName, templateId, taskIndex);
    return step4_summary(req, res);
}

function updateTask(req, res) {
    const { roomName, templateId, taskIndex, frequency, amount, days: taskDays, customPrice } = req.body;
    const draft = req.session.planDraft;

    newPlanDraftService.updateTaskInDraft(draft, {
        roomName,
        templateId,
        taskIndex,
        frequency,
        amount,
        days: taskDays,
        customPrice
    });

    return step4_summary(req, res);
}


// EDITOR HANDLERS: Dage
function addDay(req, res) {
    const { roomName, templateId, day, taskIndex } = req.body;
    const draft = req.session.planDraft;

    newPlanDraftService.addDayToDraft(draft, roomName, templateId, day, taskIndex);
    return step4_summary(req, res);
}

function removeDay(req, res) {
    const { roomName, templateId, day, taskIndex } = req.body;
    const draft = req.session.planDraft;

    newPlanDraftService.removeDayFromDraft(draft, roomName, templateId, day, taskIndex);
    return step4_summary(req, res);
}

function addDayToRoom(req, res) {
    const { roomName, day } = req.body;
    const draft = req.session.planDraft;

    newPlanDraftService.addDayToDraft(draft, roomName, null, day);
    return step4_summary(req, res);
}

function setDaysForRoom(req, res) {
    const { roomName, days: roomDays } = req.body;
    const draft = req.session.planDraft;

    let daysArr = roomDays;
    if (typeof roomDays === "string") {
        try {
            daysArr = JSON.parse(roomDays);
        } catch (e) {
            daysArr = [roomDays];
        }
    }

    newPlanDraftService.setDaysForRoomInDraft(draft, roomName, daysArr || []);
    return step4_summary(req, res);
}

function updateRoomNotes(req, res) {
    const { roomName, notes } = req.body;
    const draft = req.session.planDraft;

    newPlanDraftService.updateRoomNotes(draft, roomName, notes);
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


module.exports = {
    step1_customer,
    step6_offer,
    finalizePlan,
    customerLocations,
    saveLocation,
    generateOffer,
    saveSummaryAdjustments,
    step4_summary,
    saveAsDraftOffer,
    selectCustomer,
    customerSearch,
    addRoom,
    removeRoom,
    updateRoom,
    reorderRooms,
    addTaskToRoom,
    addTask,
    removeTask,
    updateTask,
    addDay,
    removeDay,
    addDayToRoom,
    setDaysForRoom,
    updateRoomNotes
};
