const planRepo = require('../data/cleaningPlanRepo');
const taskRepo = require('../data/cleaningTaskRepo');
const { ensureExists } = require("../utils/userError");

// Til når man opdaterer priser
async function recalculatePlanTotal(planId) {
    const tasks = await taskRepo.findByPlanId(planId);
    const total = tasks.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

    await planRepo.updateById(planId, { totalPrice: total });
}


async function createCleaningPlan(data) {
    const plan = await planRepo.create({
        customerId: data.customerId,
        name: data.name.trim(),
        description: data.description ?? "",
        isActive: true,
        totalPrice: 0
    });

    return plan;
}


async function listCleaningPlans() {
    return planRepo.findAllActive();
}


async function listDeletedCleaningPlans() {
    return planRepo.findAllDeleted();
}


async function findCleaningPlanById(planId) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");
    return plan;
}


async function updateCleaningPlan(planId, data) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await planRepo.updateById(planId, {
        name: data.name?.trim() ?? plan.name,
        description: data.description ?? plan.description
    });

    return updated;
}


async function deleteCleaningPlan(planId) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await planRepo.updateById(planId, { isActive: false });
    return updated;
}


async function reactivateCleaningPlan(planId) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await planRepo.updateById(planId, { isActive: true });

    // Regne pris ud igen efter reaktivering
    await recalculatePlanTotal(planId);

    return updated;
}

async function getPlansForCustomer(customerId) {
    const cleaningPlans = await planRepo.findByCustomerId(customerId);
    return cleaningPlans;
}

async function getTasksForPlan(planId) {
    const tasks = await taskRepo.findByPlanId(planId);
    return tasks;
}

async function addTaskFromTemplate(planId, templateId) {
    // 1. Hent template
    const template = await cleaningTaskTemplateService.findTemplateById(templateId);

    // 2. Opret task baseret på template
    const task = await taskRepo.create({
        planId,
        name: template.name,
        description: template.description,
        category: template.category,
        duration: template.defaultDuration,
        unit: template.unit,
        price: template.defaultPrice,
        totalPrice: template.defaultPrice, // senere: duration * price hvis du vil
        isActive: true
    });

    // 3. Opdater plan total
    await recalculatePlanTotal(planId);

    return task;
}

module.exports = {
    createCleaningPlan,
    listCleaningPlans,
    listDeletedCleaningPlans,
    findCleaningPlanById,
    updateCleaningPlan,
    deleteCleaningPlan,
    reactivateCleaningPlan,
    recalculatePlanTotal,
    getPlansForCustomer,
    getTasksForPlan,
    addTaskFromTemplate
};
