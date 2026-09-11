// services/newPlanDraftService.js

const cleaningTaskTemplateService = require("./cleaningTaskTemplateService");
const cleaningPlanService = require("./cleaningPlanService");
const cleaningTaskService = require("./cleaningTaskService");
const roomTemplateService = require("../services/roomTemplateService");


const { calculateTaskPrice } = require("./priceService");
const { groupSdsTasksByRoom } = require("../utils/groupedUtil");
const { categoryTypes } = require("../utils/categoryEnum");


// ------------------------------------------------------------
// INIT: Start draft
// ------------------------------------------------------------
function initDraft() {
    return {
        customerId: null,
        locationId: null,       // optional, if you add location later
        name: null,             // optional, if you add plan name later
        description: null,      // optional
        rooms: [],
        tasks: [],
        hourlyRate: 250,
        discounts: {},
        environment: {},
        operations: {}
    };
}


// ------------------------------------------------------------
// STEP 2: Vælg rum → generér rum-instansliste
// ------------------------------------------------------------
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
                taskTemplateId: tpl.taskTemplateId,   // ⭐ DETTE ER NØGLEN
                name: tpl.name,
                index: i
            });
        }
    }

    return rooms;
}


// ------------------------------------------------------------
// STEP 3: Generér SDS tasks for hvert rum
// ------------------------------------------------------------
async function generateDraftTasks(draft) {
    const tasks = [];

    for (const room of draft.rooms) {
        const templates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.daily);

        for (const tpl of templates) {
            const base = {
                templateId: tpl._id,
                name: tpl.name,
                description: tpl.description,
                category: tpl.category,
                unit: tpl.unit,
                durationPerUnit: tpl.durationPerUnit,
                frequency: tpl.frequency,
                days: tpl.days ?? [],
                amount: tpl.amount ?? 0,
                quantity: tpl.quantity ?? 1,
                roomName: room.name,
                customPrice: tpl.customPrice ?? null
            };

            const priced = {
                ...base,
                ...calculateTaskPrice(base, draft.hourlyRate)
            };

            tasks.push(priced);
        }
    }

    draft.tasks = tasks;

    return buildTaskViewModel(draft);
}


// ------------------------------------------------------------
// Hjælpemetode: Byg viewmodel for tasks
// ------------------------------------------------------------
function buildTaskViewModel(draft) {
    const tasks = draft.tasks;

    const grouped = groupSdsTasksByRoom(tasks);

    const monthlyTotal = tasks.reduce((sum, t) => {
        const p = t.monthlyPrice > 0 ? t.monthlyPrice : t.pricePerTime;
        return sum + (p || 0);
    }, 0);

    return {
        tasks,
        grouped,
        monthlyTotal,
        yearlyTotal: monthlyTotal * 12
    };
}


// ------------------------------------------------------------
// STEP 4: Rediger SDS bundle
// ------------------------------------------------------------
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

        const priced = calculateTaskPrice(t, draft.hourlyRate);
        Object.assign(t, priced);
    }

    return buildTaskViewModel(draft);
}


// ------------------------------------------------------------
// STEP 5: Rabat / drift / miljø
// ------------------------------------------------------------
function updateAdjustments(draft, body) {
    draft.discounts = {
        discountPercent: Number(body.discountPercent || 0)
    };

    draft.environment = {
        environmentalFeePercent: Number(body.environmentalFee || 0)
    };

    draft.operations = {
        paymentTerms: body.paymentTerms,
        terminationNotice: body.terminationNotice
    };

    return draft;
}


// ------------------------------------------------------------
// STEP 6: Tilbud
// ------------------------------------------------------------
function buildOffer(draft) {
    const monthlyTotal = draft.tasks.reduce((sum, t) => {
        const p = t.monthlyPrice > 0 ? t.monthlyPrice : t.pricePerTime;
        return sum + (p || 0);
    }, 0);

    const discount = draft.discounts.discountPercent || 0;
    const envFee = draft.environment.environmentalFeePercent || 0;

    const finalTotal =
        monthlyTotal * (1 - discount / 100) * (1 + envFee / 100);

    return {
        monthlyTotal,
        finalTotal,
        discounts: draft.discounts,
        environment: draft.environment,
        operations: draft.operations
    };
}


// ------------------------------------------------------------
// STEP 7: Kontrakt (draft → viewmodel)
// ------------------------------------------------------------
function buildContract(draft) {
    return draft;
}


// ------------------------------------------------------------
// STEP 8: Opret cleaningPlan i databasen
// ------------------------------------------------------------
async function finalizePlan(draft) {
    const plan = await cleaningPlanService.createCleaningPlan({
        customerId: draft.customerId,
        locationId: draft.locationId || null,
        name: draft.name || "Ny rengøringsplan",
        description: draft.description || "",
        hourlyRate: draft.hourlyRate
    });

    for (const t of draft.tasks) {
        await cleaningTaskService.createCleaningTask(plan._id, t);
    }

    await cleaningPlanService.recalculatePlanTotal(plan._id);

    return { plan };
}


module.exports = {
    initDraft,
    generateRooms,
    generateDraftTasks,
    getBundleForRoom,
    updateBundle,
    updateAdjustments,
    buildOffer,
    buildContract,
    finalizePlan
};
