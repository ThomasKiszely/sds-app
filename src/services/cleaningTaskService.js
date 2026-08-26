const cleaningTaskRepo = require('../data/cleaningTaskRepo');
const cleaningTaskTemplateRepo = require('../data/cleaningTaskTemplateRepo');
const cleaningPlanRepo = require('../data/cleaningPlanRepo');

const { ensureExists } = require("../utils/userError");
const { frequencyMultipliers } = require("../utils/frequencyEnum");
const { recalculatePlanTotal } = require('./cleaningPlanService');

// Helper
function normalizeDays(days) {
    if (!days) return [];
    if (Array.isArray(days)) return days;
    return [days];
}

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

    const quantity = Number(data.quantity ?? 1);
    const frequency = data.frequency ?? "weekly";
    const days = normalizeDays(data.days ?? []);
    const customPrice = data.customPrice ? Number(data.customPrice) : null;

    const task = await cleaningTaskRepo.create({
        planId,
        templateId: template._id,

        // kopieret fra template
        name: template.name,
        description: template.description,
        category: template.category,
        unit: template.unit,

        // NYT — disse SKAL gemmes
        durationPerUnit: Number(data.durationPerUnit ?? template.durationPerUnit),
        amount: Number(data.amount ?? 0),

        // brugerens valg
        quantity,
        frequency,
        days,
        customPrice,

        isActive: true
    });

    await recalculatePlanTotal(planId);
    return task;
}

// Update
async function updateCleaningTask(taskId, data) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const quantity = Number(data.quantity ?? task.quantity);
    const frequency = data.frequency ?? task.frequency;
    const days = normalizeDays(data.days ?? task.days);
    const customPrice = data.customPrice ? Number(data.customPrice) : task.customPrice;

    const updated = await cleaningTaskRepo.updateById(taskId, {

        // NYT — disse SKAL gemmes
        amount: Number(data.amount ?? task.amount),
        durationPerUnit: Number(data.durationPerUnit ?? task.durationPerUnit),

        quantity,
        frequency,
        days,
        customPrice
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
    const quantity = Number(task.quantity ?? 1);
    const amount = Number(task.amount ?? 0);

    // Varighed pr gang
    let duration = task.durationPerUnit;
    if (task.unit === "stk") duration *= quantity;
    if (task.unit === "m2" || task.unit === "lbm") duration *= amount;

    // Pris pr gang
    const pricePerTime = task.customPrice != null
        ? Number(task.customPrice)
        : (duration / 60) * hourlyRate;

    // Dage
    const dayCount = Array.isArray(task.days) ? task.days.length : 0;

    // Frekvens
    const freqMultiplier = frequencyMultipliers[task.frequency] ?? 1;

    // Pris pr måned
    const monthlyPrice = pricePerTime * freqMultiplier * dayCount;

    return {
        durationPerTask: duration,
        pricePerTime,
        monthlyPrice
    };
}


module.exports = {
    createCleaningTask,
    updateCleaningTask,
    deleteCleaningTask,
    reactivateCleaningTask,
    getDeletedCleaningTasks,
    findCleaningTaskById: cleaningTaskRepo.findById,
    listCleaningTasks: cleaningTaskRepo.findByPlanId,
    getHourlyRateForPlan,
    calculateCleaningTaskPrices
};
