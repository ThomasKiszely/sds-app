const CleaningTaskTemplate = require('../models/CleaningTaskTemplate');
const CleaningPlan = require('../models/CleaningPlan');
const taskRepo = require('../data/cleaningTaskRepo');

const { calculateTaskTotalPrice } = require('../utils/priceUtil');
const { recalculatePlanTotal } = require('./cleaningPlanService');

// Helper
function normalizeDays(days) {
    if (!days) return [];
    if (Array.isArray(days)) return days;
    return [days]; // hvis kun én dag
}


function ensureExists(entity, message) {
    if (!entity) {
        const err = new Error(message);
        err.status = 404;
        throw err;
    }
}

// Create a new cleaning task for a specific plan
async function createCleaningTask(planId, data) {
    const plan = await CleaningPlan.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const template = await CleaningTaskTemplate.findById(data.templateId);
    ensureExists(template, "Opgave-skabelon blev ikke fundet.");

    // Default værdier ved oprettelse
    const frequency = data.frequency ?? "weekly";
    const amount = data.amount ?? 0;
    const quantity = data.quantity ?? 1;
    const days = normalizeDays(data.days);

    const totalPrice = calculateTaskTotalPrice({
        unit: template.unit,
        category: template.category,
        price: template.defaultPrice,
        amount,
        quantity,
        frequency,
        days
    });

    const task = await taskRepo.create({
        planId,
        templateId: template._id,
        name: template.name,
        description: template.description,
        unit: template.unit,
        category: template.category,
        price: template.defaultPrice,
        duration: template.defaultDuration,

        frequency,
        amount,
        quantity,
        days,

        totalPrice,
        isActive: true
    });

    await recalculatePlanTotal(planId);
    return task;
}

// List all tasks for a specific plan
async function listCleaningTasks(planId) {
    const plan = await CleaningPlan.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");
    return taskRepo.findByPlanId(planId);
}

// Find task by ID
async function findCleaningTaskById(taskId) {
    const task = await taskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");
    return task;
}

// Update task
async function updateCleaningTask(taskId, data) {
    const task = await taskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const frequency = data.frequency ?? task.frequency;
    const amount = data.amount ?? task.amount;
    const quantity = data.quantity ?? task.quantity;
    const days = normalizeDays(data.days ?? task.days);
    const description = data.description ?? task.description;

    const totalPrice = calculateTaskTotalPrice({
        unit: task.unit,
        category: task.category,
        price: task.price,
        amount,
        quantity,
        frequency,
        days
    });

    const updated = await taskRepo.updateById(taskId, {
        frequency,
        amount,
        quantity,
        days,
        description,
        totalPrice
    });

    await recalculatePlanTotal(task.planId);
    return updated;
}

// Delete task (soft delete)
async function softDeleteCleaningTask(taskId) {
    const task = await taskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const updated = await taskRepo.updateById(taskId, { isActive: false });
    await recalculatePlanTotal(task.planId);
    return updated;
}

async function deleteCleaningTask(taskId) {
    const task = await taskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    await taskRepo.deleteById(taskId);
    await recalculatePlanTotal(task.planId);

    return task; // returnér original task for planId
}


// Reactivate a deleted task
async function reactivateCleaningTask(taskId) {
    const task = await taskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const updated = await taskRepo.updateById(taskId, { isActive: true });
    await recalculatePlanTotal(task.planId);
    return updated;
}

// Get all deleted tasks for a specific plan
async function getDeletedCleaningTasks(planId) {
    const plan = await CleaningPlan.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");
    return taskRepo.findDeletedByPlanId(planId);
}

async function findCleaningTasksByIds(ids) {
    return taskRepo.findTasksByIds(ids);
}

module.exports = {
    createCleaningTask,
    listCleaningTasks,
    findCleaningTaskById,
    updateCleaningTask,
    deleteCleaningTask,
    reactivateCleaningTask,
    getDeletedCleaningTasks,
    findCleaningTasksByIds
};
