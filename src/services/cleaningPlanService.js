const cleaningPlanRepo = require('../data/cleaningPlanRepo');
const cleaningTaskRepo = require('../data/cleaningTaskRepo');
const { ensureExists, userError } = require("../utils/userError");
const { frequencyMultipliers } = require("../utils/frequencyEnum");

// Genberegn totalPrice for en plan baseret på dens opgaver
async function recalculatePlanTotal(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const tasks = await cleaningTaskRepo.findByPlanId(planId);
    const hourlyRate = plan.hourlyRate;

    let total = 0;

    for (const t of tasks) {
        // Pris pr. gang
        let price;

        if (t.customPrice !== null && t.customPrice !== undefined) {
            price = Number(t.customPrice);
        } else {
            const duration = t.quantity * t.durationPerUnit; // minutter
            price = (duration / 60) * hourlyRate;
        }

        // Pris pr. måned
        const multiplier = frequencyMultipliers[t.frequency] ?? 1;
        const monthlyPrice = price * multiplier;

        total += monthlyPrice;
    }

    await cleaningPlanRepo.updateById(planId, { totalPrice: total });
}
// Opret rengøringsplan
async function createCleaningPlan(data) {

    // Mangler helt
    if (data.hourlyRate === undefined || data.hourlyRate === null) {
        throw new userError("Timeprisen mangler ved oprettelse af plan.");
    }

    // Tom string eller whitespace
    if (typeof data.hourlyRate === "string" && data.hourlyRate.trim() === "") {
        throw new userError("Timeprisen må ikke være tom.");
    }

    // Ikke et tal
    if (isNaN(Number(data.hourlyRate))) {
        throw new userError("Timeprisen skal være et tal.");
    }

    const plan = await cleaningPlanRepo.create({
        customerId: data.customerId,
        locationId: data.locationId,
        name: data.name?.trim() || "Ukendt plan",
        description: data.description?.trim() || "",
        hourlyRate: Number(data.hourlyRate),   // aldrig fallback til 0
        isActive: true,
        totalPrice: 0
    });

    return plan;
}



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

async function updateCleaningPlan(planId, data) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const updated = await cleaningPlanRepo.updateById(planId, {
        name: data.name?.trim() ?? plan.name,
        description: data.description ?? plan.description,
        hourlyRate: data.hourlyRate ?? plan.hourlyRate
    });

    // Hvis timepris ændres → genberegn total
    await recalculatePlanTotal(planId);

    return updated;
}

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

async function getPlansForCustomer(customerId) {
    return cleaningPlanRepo.findByCustomerId(customerId);
}

async function getPlansForLocation(locationId) {
    return cleaningPlanRepo.findByLocationId(locationId);
}

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
