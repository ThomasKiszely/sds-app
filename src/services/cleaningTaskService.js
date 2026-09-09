const cleaningTaskRepo = require('../data/cleaningTaskRepo');
const cleaningTaskTemplateRepo = require('../data/cleaningTaskTemplateRepo');
const cleaningPlanRepo = require('../data/cleaningPlanRepo');

const { ensureExists } = require("../utils/userError");
const { recalculatePlanTotal } = require('./cleaningPlanService');
const { categoryTypes } = require("../utils/categoryEnum");
const { units } = require("../utils/unitEnum");
const { calculateProgramCodeForRoom } = require("../utils/programCodeUtil");

// Helpers
function normalizeDays(days) {
    if (!days) return [];
    if (Array.isArray(days)) return days;
    return [days];
}

// Find opgaver for programkode (daily/floor/inventory pr. rum)
async function findSdsTasksForRoom(planId, roomName) {
    const allTasks = await cleaningTaskRepo.findByPlanId(planId);

    return allTasks.filter(t =>
        t.isActive &&
        t.roomName === roomName &&
        [
            categoryTypes.daily,
            categoryTypes.floor,
            categoryTypes.inventory
        ].includes(t.category)
    );
}

async function getProgramCodeForRoom(planId, roomName) {
    const tasksForRoom = await findSdsTasksForRoom(planId, roomName);
    return calculateProgramCodeForRoom(tasksForRoom);
}

async function getHourlyRateForPlan(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Plan ikke fundet.");
    return plan.hourlyRate;
}

async function createCleaningTask(planId, data) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const template = await cleaningTaskTemplateRepo.findTemplateById(data.templateId);
    ensureExists(template, "Opgave-skabelon blev ikke fundet.");

    const roomName = data.roomName ?? "";

    const category = data.category ?? template.category;

    const amount = Number(data.amount ?? template.amount ?? 1);
    const durationPerUnit =
        category === categoryTypes.consumables
            ? 0
            : Number(data.durationPerUnit ?? template.durationPerUnit ?? 0);

    const frequency = data.frequency ?? template.frequency;
    const days = normalizeDays(data.days ?? template.days ?? []);

    const customPrice =
        data.customPrice != null
            ? Number(data.customPrice)
            : template.pricePerUnit != null
                ? Number(template.pricePerUnit)
                : null;

    const unit =
        category === categoryTypes.consumables
            ? units.stk
            : template.unit;

    const task = await cleaningTaskRepo.create({
        planId,
        templateId: template._id,

        name: template.name,
        description: template.description,
        category,
        unit,

        amount,
        durationPerUnit,
        frequency,
        days,
        customPrice,
        roomName,
        isActive: true
    });

    await recalculatePlanTotal(planId);
    return task;
}


async function updateCleaningTask(taskId, data) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const amount = Number(data.amount ?? task.amount);

    const durationPerUnit =
        task.category === categoryTypes.consumables
            ? 0
            : Number(data.durationPerUnit ?? task.durationPerUnit);

    const frequency = data.frequency ?? task.frequency;
    const days = normalizeDays(data.days ?? task.days);
    const customPrice = data.customPrice != null ? Number(data.customPrice) : task.customPrice;
    const roomName = data.roomName ?? task.roomName;

    const updated = await cleaningTaskRepo.updateById(taskId, {
        amount,
        durationPerUnit,
        frequency,
        days,
        customPrice,
        roomName
    });

    await recalculatePlanTotal(task.planId);
    return updated;
}

async function deleteCleaningTask(taskId) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    await cleaningTaskRepo.updateById(taskId, { isActive: false });
    await recalculatePlanTotal(task.planId);

    return task;
}

async function reactivateCleaningTask(taskId) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const updated = await cleaningTaskRepo.updateById(taskId, { isActive: true });
    await recalculatePlanTotal(task.planId);

    return updated;
}


async function getDeletedCleaningTasks(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    return cleaningTaskRepo.findDeletedByPlanId(planId);
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
    findSdsTasksForRoom,
    getProgramCodeForRoom
};
