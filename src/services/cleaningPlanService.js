const planRepo = require('../data/cleaningPlanRepo');
const taskRepo = require('../data/cleaningTaskRepo');

function ensureExists(entity, message) {
    if (!entity) {
        const err = new Error(message);
        err.status = 404;
        throw err;
    }
}

/**
 * Recalculate total price for a plan based on active tasks.
 */
async function recalculatePlanTotal(planId) {
    const tasks = await taskRepo.findByPlanId(planId);
    const total = tasks.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

    await planRepo.updateById(planId, { totalPrice: total });
}

/**
 * Create a new cleaning plan.
 */
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

/**
 * List all active cleaning plans.
 */
async function listCleaningPlans() {
    return planRepo.findAllActive();
}

/**
 * List all deleted (inactive) cleaning plans.
 */
async function listDeletedCleaningPlans() {
    return planRepo.findAllDeleted();
}

/**
 * Find a plan by ID.
 */
async function findCleaningPlanById(planId) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");
    return plan;
}

/**
 * Update a plan (name, description).
 */
async function updateCleaningPlan(planId, data) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await planRepo.updateById(planId, {
        name: data.name?.trim() ?? plan.name,
        description: data.description ?? plan.description
    });

    return updated;
}

/**
 * Soft delete a plan.
 */
async function deleteCleaningPlan(planId) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await planRepo.updateById(planId, { isActive: false });
    return updated;
}

/**
 * Reactivate a plan.
 */
async function reactivateCleaningPlan(planId) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await planRepo.updateById(planId, { isActive: true });

    // Recalculate total price after reactivation
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
    reactivateCleaningPlan
};
