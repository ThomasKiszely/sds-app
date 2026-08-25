const planRepo = require('../data/cleaningPlanRepo');
const taskRepo = require('../data/cleaningTaskRepo');
const cleaningTaskTemplateService = require('./cleaningTaskTemplateService');
const { ensureExists } = require("../utils/userError");

// ---------------------------------------------------------
// GENBEREGN TOTAL
// ---------------------------------------------------------
async function recalculatePlanTotal(planId) {
    const tasks = await taskRepo.findByPlanId(planId);
    const total = tasks.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

    await planRepo.updateById(planId, { totalPrice: total });
}

// ---------------------------------------------------------
// OPRET PLAN (nu med locationId)
// ---------------------------------------------------------
async function createCleaningPlan(data) {
    const plan = await planRepo.create({
        customerId: data.customerId,
        locationId: data.locationId,     // ← NYT
        name: data.name.trim(),
        description: data.description ?? "",
        isActive: true,
        totalPrice: 0
    });

    return plan;
}

// ---------------------------------------------------------
// LISTE
// ---------------------------------------------------------
async function listCleaningPlans() {
    return planRepo.findAllActive();
}

async function listDeletedCleaningPlans() {
    return planRepo.findAllDeleted();
}

// ---------------------------------------------------------
// FIND
// ---------------------------------------------------------
async function findCleaningPlanById(planId) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");
    return plan;
}

// ---------------------------------------------------------
// UPDATE
// ---------------------------------------------------------
async function updateCleaningPlan(planId, data) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await planRepo.updateById(planId, {
        name: data.name?.trim() ?? plan.name,
        description: data.description ?? plan.description
    });

    return updated;
}

// ---------------------------------------------------------
// DELETE / REACTIVATE
// ---------------------------------------------------------
async function deleteCleaningPlan(planId) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    return planRepo.updateById(planId, { isActive: false });
}

async function reactivateCleaningPlan(planId) {
    const plan = await planRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await planRepo.updateById(planId, { isActive: true });
    await recalculatePlanTotal(planId);

    return updated;
}

// ---------------------------------------------------------
// GET PLANS (kunde + lokation)
// ---------------------------------------------------------
async function getPlansForCustomer(customerId) {
    return planRepo.findByCustomerId(customerId);
}

async function getPlansForLocation(locationId) {
    return planRepo.findByLocationId(locationId);   // ← NYT
}

// ---------------------------------------------------------
// TASKS
// ---------------------------------------------------------
async function getTasksForPlan(planId) {
    return taskRepo.findByPlanId(planId);
}

async function addTaskFromTemplate(planId, templateId) {
    const template = await cleaningTaskTemplateService.findTemplateById(templateId);

    const task = await taskRepo.create({
        planId,
        name: template.name,
        description: template.description,
        category: template.category,
        duration: template.defaultDuration,
        unit: template.unit,
        price: template.defaultPrice,
        totalPrice: template.defaultPrice,
        isActive: true
    });

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
    getPlansForLocation,
    getTasksForPlan,
    addTaskFromTemplate
};
