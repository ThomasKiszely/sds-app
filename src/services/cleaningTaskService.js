const cleaningTaskRepo = require('../data/cleaningTaskRepo');
const cleaningTaskTemplateRepo = require('../data/cleaningTaskTemplateRepo');
const cleaningPlanRepo = require('../data/cleaningPlanRepo');

const { ensureExists } = require("../utils/userError");
const { recalculatePlanTotal } = require('./cleaningPlanService');
const { calculateTaskMonthlyPrice } = require("../utils/priceUtil");
const { categoryTypes } = require("../utils/categoryEnum");
const { units } = require("../utils/unitEnum");
const { calculateProgramCodeForRoom } = require("../utils/programCodeUtil");

// Beregn programkode for et bestemt rum
async function getProgramCodeForRoom(planId, roomName) {
    const tasksForRoom = await findSdsTasksForRoom(planId, roomName);
    return calculateProgramCodeForRoom(tasksForRoom);
}



// Helpers
function normalizeDays(days) {
    if (!days) return [];
    if (Array.isArray(days)) return days;
    return [days];
}

// SDS-kategorier (bruges senere til programkode pr. rum)
const sdsCategoryMap = {
    daily: 0,      // Daglig soignering → 1. ciffer
    floor: 1,      // Gulv → 2. ciffer
    inventory: 2   // Inventar → 3. ciffer
};


// Hent kundens timepris via planRepo
async function getHourlyRateForPlan(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Plan ikke fundet.");
    return plan.hourlyRate;
}


// Create
async function createCleaningTask(planId, data) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const template = await cleaningTaskTemplateRepo.findTemplateById(data.templateId);
    ensureExists(template, "Opgave-skabelon blev ikke fundet.");

    const roomName = data.roomName ?? "Ukendt lokale";

    const isConsumable =
        template.isConsumable === true ||
        data.category === categoryTypes.consumables;

    // ⭐ FORBRUGSVARE – tilkøb, ikke en del af planens pris
    if (isConsumable) {
        const quantity = Number(data.quantity ?? 1);
        const customPrice = data.customPrice != null
            ? Number(data.customPrice)
            : Number(template.pricePerUnit);

        const task = await cleaningTaskRepo.create({
            planId,
            templateId: template._id,

            name: template.name,
            description: template.description,
            category: categoryTypes.consumables,

            unit: units.stk,

            // ingen varighed, ingen frekvens, ingen SDS, ingen dage
            durationPerUnit: 0,
            amount: 0,
            quantity,
            frequency: null,
            days: [],
            customPrice,
            roomName,
            isActive: true
        });

        await recalculatePlanTotal(planId); // totalen vil senere ignorere forbrugsvarer
        return task;
    }

    // ⭐ ALMINDELIG OPERATION (SDS + normale opgaver)
    const quantity = Number(data.quantity ?? 1);
    const frequency = data.frequency ?? template.frequency;
    const days = normalizeDays(data.days ?? []);
    const customPrice = data.customPrice ? Number(data.customPrice) : null;

    const task = await cleaningTaskRepo.create({
        planId,
        templateId: template._id,

        name: template.name,
        description: template.description,
        category: template.category,
        unit: template.unit,

        durationPerUnit: Number(data.durationPerUnit ?? template.durationPerUnit),
        amount: Number(data.amount ?? 0),

        quantity,
        frequency,
        days,
        customPrice,
        roomName,
        isActive: true
    });

    // ⭐ VIGTIGT: ingen programCode her – den bliver senere beregnet dynamisk pr. rum

    await recalculatePlanTotal(planId);
    return task;
}


// Update
async function updateCleaningTask(taskId, data) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    // ⭐ FORBRUGSVARE – kun pris, antal, lokale
    if (task.category === categoryTypes.consumables) {
        const quantity = Number(data.quantity ?? task.quantity);
        const customPrice = data.customPrice != null
            ? Number(data.customPrice)
            : task.customPrice;
        const roomName = data.roomName ?? task.roomName;

        const updated = await cleaningTaskRepo.updateById(taskId, {
            quantity,
            customPrice,
            roomName
        });

        await recalculatePlanTotal(task.planId); // totalen ignorerer dem
        return updated;
    }

    // ⭐ ALMINDELIGE + SDS-opgaver – ingen programCode i DB
    const roomName = data.roomName ?? task.roomName;

    const quantity = Number(data.quantity ?? task.quantity);
    const frequency = data.frequency ?? task.frequency;
    const days = normalizeDays(data.days ?? task.days);
    const customPrice = data.customPrice ? Number(data.customPrice) : task.customPrice;

    const updated = await cleaningTaskRepo.updateById(taskId, {
        amount: Number(data.amount ?? task.amount),
        durationPerUnit: Number(data.durationPerUnit ?? task.durationPerUnit),
        quantity,
        frequency,
        days,
        customPrice,
        roomName,
    });

    await recalculatePlanTotal(task.planId);
    return updated;
}


// Delete (soft)
async function deleteCleaningTask(taskId) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    await cleaningTaskRepo.updateById(taskId, { isActive: false });
    await recalculatePlanTotal(task.planId);

    return task;
}

// Reactivate
async function reactivateCleaningTask(taskId) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const updated = await cleaningTaskRepo.updateById(taskId, { isActive: true });
    await recalculatePlanTotal(task.planId);

    return updated;
}

// Deleted list
async function getDeletedCleaningTasks(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    return cleaningTaskRepo.findDeletedByPlanId(planId);
}

// Dynamisk prisberegning til visning
function calculateCleaningTaskPrices(task, hourlyRate) {
    return calculateTaskMonthlyPrice(task, hourlyRate);
}

// Find alle SDS-opgaver for et bestemt rum
async function findSdsTasksForRoom(planId, roomName) {
    const allTasks = await cleaningTaskRepo.findByPlanId(planId);

    return allTasks.filter(t =>
        t.isActive &&
        t.roomName === roomName &&
        ["daily", "floor", "inventory"].includes(t.category)
    );
}



module.exports = {
    createCleaningTask,
    updateCleaningTask,
    deleteCleaningTask,
    reactivateCleaningTask,
    getDeletedCleaningTasks,
    findCleaningTaskById: cleaningTaskRepo.findById,
    listCleaningTasks: cleaningTaskRepo.findByPlanId,
    findCleaningTasksByIds: cleaningTaskRepo.findTasksByIds,
    getHourlyRateForPlan,
    calculateCleaningTaskPrices,
    findSdsTasksForRoom,
    getProgramCodeForRoom
};
