const CleaningTaskTemplate = require('../models/CleaningTaskTemplate');
const CleaningPlan = require('../models/CleaningPlan');
const taskRepo = require('../data/cleaningTaskRepo');
const { calculateTaskTotalPrice } = require('../utils/priceUtil');
const { recalculatePlanTotal } = require('./cleaningPlanService');

function ensureExists(entity, message) {
    if (!entity) {
        const err = new Error(message);
        err.status = 404;
        throw err;
    }
}


async function createCleaningTask(planId, data) {
    const plan = await CleaningPlan.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const template = await CleaningTaskTemplate.findById(data.templateId);
    ensureExists(template, "Opgave-skabelon blev ikke fundet.");

    const totalPrice = calculateTaskTotalPrice({
        unit: template.unit,
        category: template.category,
        price: template.defaultPrice,
        amount: data.amount,
        quantity: data.quantity,
        frequency: data.frequency
    });

    const task = await taskRepo.create({
        planId,
        templateId: template._id,
        name: template.name,
        unit: template.unit,
        category: template.category,
        price: template.defaultPrice,
        duration: template.defaultDuration,
        frequency: data.frequency,
        amount: data.amount,
        quantity: data.quantity,
        totalPrice,
        isActive: true
    });

    await recalculatePlanTotal(planId);
    return task;
}

async function listCleaningTasks(planId) {
    const plan = await CleaningPlan.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");
    return taskRepo.findByPlanId(planId);
}

async function findCleaningTaskById(taskId) {
    const task = await taskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");
    return task;
}

async function updateCleaningTask(taskId, data) {
    const task = await taskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const frequency = data.frequency ?? task.frequency;
    const amount = data.amount ?? task.amount;
    const quantity = data.quantity ?? task.quantity;

    const totalPrice = calculateTaskTotalPrice({
        unit: task.unit,
        category: task.category,
        price: task.price,
        amount,
        quantity,
        frequency
    });

    const updated = await taskRepo.updateById(taskId, {
        frequency,
        amount,
        quantity,
        totalPrice
    });

    await recalculatePlanTotal(task.planId);
    return updated;
}

async function deleteCleaningTask(taskId) {
    const task = await taskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const updated = await taskRepo.updateById(taskId, { isActive: false });
    await recalculatePlanTotal(task.planId);
    return updated;
}

async function reactivateCleaningTask(taskId) {
    const task = await taskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const updated = await taskRepo.updateById(taskId, { isActive: true });
    await recalculatePlanTotal(task.planId);
    return updated;
}

async function getDeletedCleaningTasks(planId) {
    const plan = await CleaningPlan.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");
    return taskRepo.findDeletedByPlanId(planId);
}

module.exports = {
    createCleaningTask,
    listCleaningTasks,
    findCleaningTaskById,
    updateCleaningTask,
    deleteCleaningTask,
    reactivateCleaningTask,
    getDeletedCleaningTasks
};
