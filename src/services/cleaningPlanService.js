const cleaningPlanRepo = require('../data/cleaningPlanRepo');
const cleaningTaskRepo = require('../data/cleaningTaskRepo');
const systemSettingsRepo = require('../data/systemSettingsRepo');
const { ensureExists, userError } = require("../utils/userError");
const { calculateTaskPrice } = require("../services/priceService");
const { categoryTypes } = require("../utils/categoryEnum");


function extractInstructionDescriptions(tasks) {

    const dailyTasks = tasks.filter(t => t.category === categoryTypes.daily);
    const floorTasks = tasks.filter(t => t.category === categoryTypes.floor);
    const inventoryTasks = tasks.filter(t => t.category === categoryTypes.inventory);

    const dailyDescriptions = dailyTasks
        .map(t => t.description)
        .filter(Boolean);

    const floorDescriptions = floorTasks
        .map(t => t.description)
        .filter(Boolean);

    const inventoryDescriptions = inventoryTasks
        .map(t => t.description)
        .filter(Boolean);

    return {
        dailyDescriptions,
        floorDescriptions,
        inventoryDescriptions
    };
}

async function recalculatePlanTotal(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const tasks = await cleaningTaskRepo.findByPlanId(planId);
    const hourlyRate = plan.hourlyRate;

    let subtotal = 0;

    for (const t of tasks) {

        // Beregn pris via priceService (kategori er ligegyldig)
        const prices = calculateTaskPrice(t, hourlyRate);

        // Kun månedlige priser med i totalen
        if (prices.monthlyPrice > 0) {
            subtotal += prices.monthlyPrice;
        }
    }

    // Rabat
    const discountPercent = plan.discountPercent || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;

    // Miljøtillæg
    const environmentalFeePercent = plan.environmentalFeePercent || 0;
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


async function createCleaningPlan(data) {
    const settings = await systemSettingsRepo.getSettings();

    const plan = await cleaningPlanRepo.create({
        customerId: data.customerId,
        locationId: data.locationId,
        name: data.name?.trim() || "Rengøringsplan",
        description: data.description?.trim() || "",
        roomNotes: data.roomNotes || [],
            hourlyRate: data.hourlyRate
                ? Number(data.hourlyRate)
                : settings.hourlyRate,
        isActive: false,

        totalMonthlyPrice: 0,
        discountPercent: 0,
        environmentalFeePercent: settings.environmentalFee,
        environmentalFeeAmount: 0,
        subtotalBeforeDiscount: 0,
        discountAmount: 0,

        indexRegulationPercent: settings.inflationRate * 100,
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
        hourlyRate: data.hourlyRate ?? plan.hourlyRate,
        discountPercent: data.discountPercent ?? plan.discountPercent,
        environmentalFeePercent: data.environmentalFeePercent ?? plan.environmentalFeePercent,
        roomNotes: data.roomNotes ?? plan.roomNotes
    });

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
    getTasksForPlan,
    extractInstructionDescriptions
};
