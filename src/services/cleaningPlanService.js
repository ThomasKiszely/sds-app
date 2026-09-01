const cleaningPlanRepo = require('../data/cleaningPlanRepo');
const cleaningTaskRepo = require('../data/cleaningTaskRepo');
const { ensureExists, userError } = require("../utils/userError");
const { calculateTaskMonthlyPrice } = require("../utils/priceUtil");
const { categoryTypes } = require('../utils/categoryEnum');

// ------------------------------------------------------------
// GENBEREGN TOTALPRIS FOR PLAN
// ------------------------------------------------------------
async function recalculatePlanTotal(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const tasks = await cleaningTaskRepo.findByPlanId(planId);
    const hourlyRate = plan.hourlyRate;

    let subtotal = 0;

    for (const t of tasks) {
        if (t.category === categoryTypes.consumables) continue;  // IGNORÉR FORBRUGSVARER

        const { monthlyPrice } = calculateTaskMonthlyPrice(t, hourlyRate);
        subtotal += monthlyPrice;
    }


    // Rabat
    const discountPercent = plan.discountPercent || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;

    // Miljøtillæg
    const environmentalFeePercent = plan.environmentalFeePercent || 4;
    const environmentalFeeAmount = afterDiscount * (environmentalFeePercent / 100);

    // Total pr måned
    const totalMonthlyPrice = afterDiscount + environmentalFeeAmount;

    await cleaningPlanRepo.updateById(planId, {
        subtotalBeforeDiscount: subtotal,
        discountAmount,
        environmentalFeeAmount,
        totalMonthlyPrice
    });
}


// ------------------------------------------------------------
// OPRET PLAN
// ------------------------------------------------------------
async function createCleaningPlan(data) {

    if (data.hourlyRate === undefined || data.hourlyRate === null) {
        throw new userError("Timeprisen mangler ved oprettelse af plan.");
    }

    if (typeof data.hourlyRate === "string" && data.hourlyRate.trim() === "") {
        throw new userError("Timeprisen må ikke være tom.");
    }

    if (isNaN(Number(data.hourlyRate))) {
        throw new userError("Timeprisen skal være et tal.");
    }

    const plan = await cleaningPlanRepo.create({
        customerId: data.customerId,
        locationId: data.locationId,
        name: data.name?.trim() || "Ukendt plan",
        description: data.description?.trim() || "",
        hourlyRate: Number(data.hourlyRate),
        isActive: false,
        totalMonthlyPrice: 0,
        discountPercent: 0,
        environmentalFeePercent: 4
    });

    return plan;
}


// ------------------------------------------------------------
// LIST / FIND
// ------------------------------------------------------------
async function listCleaningPlans() {
    return cleaningPlanRepo.findAllActive();
}

async function listDeletedCleaningPlans() {
    return cleaningPlanRepo.findAllDeleted();
}

async function findCleaningPlanById(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");
    return plan;
}


// ------------------------------------------------------------
// OPDATER PLAN
// ------------------------------------------------------------
async function updateCleaningPlan(planId, data) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await cleaningPlanRepo.updateById(planId, {
        name: data.name?.trim() ?? plan.name,
        description: data.description ?? plan.description,
        hourlyRate: data.hourlyRate ?? plan.hourlyRate,
        discountPercent: data.discountPercent ?? plan.discountPercent,
        environmentalFeePercent: data.environmentalFeePercent ?? plan.environmentalFeePercent,
        roomNotes: data.roomNotes ?? plan.roomNotes
    });

    await recalculatePlanTotal(planId);

    return updated;
}


// ------------------------------------------------------------
// DEAKTIVER / GENAKTIVER
// ------------------------------------------------------------
async function deleteCleaningPlan(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    return cleaningPlanRepo.updateById(planId, { isActive: false });
}

async function reactivateCleaningPlan(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await cleaningPlanRepo.updateById(planId, { isActive: true });
    await recalculatePlanTotal(planId);

    return updated;
}


// ------------------------------------------------------------
// HENT PLANER FOR KUNDE / LOKATION
// ------------------------------------------------------------
async function getPlansForCustomer(customerId) {
    return cleaningPlanRepo.findByCustomerId(customerId);
}

async function getPlansForLocation(locationId) {
    return cleaningPlanRepo.findByLocationId(locationId);
}


// ------------------------------------------------------------
// HENT TASKS FOR PLAN
// ------------------------------------------------------------
async function getTasksForPlan(planId) {
    return cleaningTaskRepo.findByPlanId(planId);
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
    getTasksForPlan
};
