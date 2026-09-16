// services/newPlanDraftService.js

const cleaningTaskTemplateService = require("./cleaningTaskTemplateService");
const cleaningPlanService = require("./cleaningPlanService");
const cleaningTaskService = require("./cleaningTaskService");
const roomTemplateService = require("../services/roomTemplateService");
const systemSettingsService = require("../services/systemSettingsService");

const { calculateTaskPrice, calculateTotals } = require("./priceService");
const { groupSdsTasksByRoom } = require("../utils/groupedUtil");
const { categoryTypes } = require("../utils/categoryEnum");
const { days, daysLabels } = require("../utils/dayEnum");
const { frequencyLabels } = require("../utils/frequencyEnum");


// CENTRAL PRISBEREGNING — eneste sted i hele systemet
function priceAllTasks(draft) {
    const priced = draft.tasks.map(t =>
        calculateTaskPrice(t, draft.hourlyRate)
    );

    draft.tasks.forEach((t, i) => {
        Object.assign(t, priced[i]);
    });

    return draft;
}


// INIT: Start draft
function initDraft(systemSettings) {
    return {
        customerId: null,
        locationId: null,
        name: null,
        description: null,
        rooms: [],
        tasks: [],
        hourlyRate: systemSettings.hourlyRate,
        discounts: {},
        environment: {},
        operations: {}
    };
}


// STEP 2: Vælg rum → generér rum-instansliste
async function generateRooms(selectedTemplates, counts) {
    const roomTemplates = await roomTemplateService.getAllRoomTemplates();
    const rooms = [];

    for (const templateId of selectedTemplates) {
        const tpl = roomTemplates.find(t => t._id.toString() === templateId);
        if (!tpl) throw new Error(`Room template not found: ${templateId}`);

        const count = Number(counts[templateId] || 1);

        for (let i = 1; i <= count; i++) {
            rooms.push({
                templateId,
                taskTemplateId: tpl.taskTemplateId,
                name: count === 1 ? tpl.name : `${tpl.name} ${i}`,
                baseName: tpl.name,
                index: i,
                size: tpl.defaultSize,
            });
        }
    }

    return rooms;
}


// STEP 3: Generér SDS tasks for hvert rum (uden pris)
async function generateDraftTasks(draft) {
    const tasks = [];

    for (const room of draft.rooms) {

        const { daily, floor, inventory } = room.taskTemplateId || {};
        const ids = [daily, floor, inventory].filter(Boolean);

        const sdsTemplates = await cleaningTaskTemplateService.getByIds(ids);

        for (const tpl of sdsTemplates) {

            const cat = tpl.category.toLowerCase();

            let autoDays = [];

            if (cat === categoryTypes.daily) {
                autoDays = [
                    days.monday,
                    days.tuesday,
                    days.wednesday,
                    days.thursday,
                    days.friday
                ];
            } else if (cat === categoryTypes.floor) {
                autoDays = [
                    days.monday,
                    days.wednesday,
                    days.friday
                ];
            } else if (cat === categoryTypes.inventory) {
                autoDays = [
                    days.tuesday,
                    days.thursday
                ];
            } else {
                autoDays = [days.friday];
            }

            const base = {
                templateId: tpl._id,
                name: tpl.name,
                description: tpl.description,
                category: cat,
                unit: tpl.unit,
                durationPerUnit: tpl.durationPerUnit,
                frequency: "weekly",
                days: autoDays,
                amount: room.size,
                quantity: tpl.quantity ?? 1,
                roomName: room.name,
                customPrice: tpl.customPrice ?? null
            };

            tasks.push(base);
        }
    }

    draft.tasks = tasks;

    // ⭐ Prisberegning ét sted
    priceAllTasks(draft);

    return buildTaskViewModel(draft);
}


// Hjælpemetode: Byg viewmodel for tasks (ingen prislogik)
function buildTaskViewModel(draft) {
    const tasks = draft.tasks;

    const grouped = groupSdsTasksByRoom(tasks);

    const totals = calculateTotals({
        tasks,
        discountPercent: draft.discounts?.discountPercent || 0,
        environmentalFeePercent: draft.environment?.environmentalFeePercent ?? 0
    });

    return {
        tasks,
        grouped,
        monthlyTotal: totals.subtotal,
        yearlyTotal: totals.subtotal * 12
    };
}

// STEP 4: Rediger SDS bundle (uden pris)
function getBundleForRoom(draft, roomName) {
    const tasks = draft.tasks.filter(t => t.roomName === roomName);

    if (tasks.length !== 3) {
        throw new Error("Bundle mangler opgaver");
    }

    return tasks.sort((a, b) => a.category.localeCompare(b.category));
}


function updateBundle(draft, roomName, body) {
    const tasks = draft.tasks.filter(t => t.roomName === roomName);

    for (const t of tasks) {
        t.frequency = body[`frequency_${t.templateId}`];

        const rawDays = body[`days_${t.templateId}`];
        t.days = Array.isArray(rawDays) ? rawDays : rawDays ? [rawDays] : [];
    }

    // ⭐ Prisberegning ét sted
    priceAllTasks(draft);

    return buildTaskViewModel(draft);
}


// STEP 5: Rabat / drift / miljø (ingen prislogik)
function updateAdjustments(draft, body, systemSettings) {
    draft.discounts = draft.discounts || {};
    draft.environment = draft.environment || {};
    draft.operations = draft.operations || {};

    draft.discounts.discountPercent = Number(body.discountPercent || 0);
    draft.environment.environmentalFeePercent = body.environmentalFeePercent != null
        ? Number(body.environmentalFeePercent)
        : systemSettings.environmentalFee;

    if (body.paymentTerms) {
        draft.operations.paymentTerms = body.paymentTerms;
    }

    if (body.terminationNotice) {
        draft.operations.terminationNotice = body.terminationNotice;
    }

    return draft;
}



// STEP 6: Tilbud (ingen prislogik)
function buildOffer(draft) {
    const totals = calculateTotals({
        tasks: draft.tasks,
        discountPercent: draft.discounts?.discountPercent || 0,
        environmentalFeePercent: draft.environment?.environmentalFeePercent ?? 0
    });

    return {
        tasks: draft.tasks,
        grouped: groupSdsTasksByRoom(draft.tasks),
        monthlyTotal: totals.subtotal,
        finalTotal: totals.total,
        discounts: draft.discounts,
        environment: draft.environment,
        operations: draft.operations,
        environmentalFeeAmount: totals.environmentalFeeAmount,
        discountAmount: totals.discountAmount,
        categoryTypes,
        daysLabels,
        frequencyLabels
    };
}


// STEP 8: Opret cleaningPlan i databasen (tasks er allerede prissat)
async function finalizePlan(draft) {
    const totals = calculateTotals({
        tasks: draft.tasks,
        discountPercent: draft.discounts?.discountPercent || 0,
        environmentalFeePercent: draft.environment?.environmentalFeePercent ?? 0
    });

    const plan = await cleaningPlanService.createCleaningPlan({
        customerId: draft.customerId,
        locationId: draft.locationId || null,
        name: draft.name || "Ny rengøringsplan",
        description: draft.description || "",
        roomNotes: draft.roomNotes || [],
        hourlyRate: draft.hourlyRate,

        subtotalBeforeDiscount: totals.subtotal,
        discountPercent: totals.discountPercent,
        discountAmount: totals.discountAmount,
        environmentalFeePercent: totals.environmentalFeePercent,
        environmentalFeeAmount: totals.environmentalFeeAmount,
        indexRegulationPercent: draft.indexRegulationPercent ?? 0,
        totalMonthlyPrice: totals.total,
        paymentTerms: draft.operations?.paymentTerms,
        terminationNotice: draft.operations?.terminationNotice,
    });

    for (const t of draft.tasks) {
        await cleaningTaskService.createCleaningTask(plan._id, t);
    }

    await cleaningPlanService.recalculatePlanTotal(plan._id);

    return { plan };
}


function updateRoomNotes(draft, roomName, notesText) {
    draft.roomNotes = draft.roomNotes || [];

    const existing = draft.roomNotes.find(r => r.roomName === roomName);

    if (existing) {
        existing.notes = notesText ? notesText.split("\n") : [];
    } else {
        draft.roomNotes.push({
            roomName,
            notes: notesText ? notesText.split("\n") : []
        });
    }
}


module.exports = {
    initDraft,
    generateRooms,
    generateDraftTasks,
    getBundleForRoom,
    updateBundle,
    updateAdjustments,
    buildOffer,
    finalizePlan,
    priceAllTasks,
    buildTaskViewModel,
    updateRoomNotes
};
