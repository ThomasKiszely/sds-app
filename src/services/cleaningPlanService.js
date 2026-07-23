const planRepo = require('../data/cleaningPlanRepo');
const taskRepo = require('../data/cleaningTaskRepo');

function ensureExists(entity, message) {
    if (!entity) {
        const err = new Error(message);
        err.status = 404;
        throw err;
    }
}

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

module.exports = {
    createCleaningPlan,
    listCleaningPlans,
    listDeletedCleaningPlans,
    findCleaningPlanById,
    updateCleaningPlan,
    deleteCleaningPlan,
    reactivateCleaningPlan,
    recalculatePlanTotal,
};
