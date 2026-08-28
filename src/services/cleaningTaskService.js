const cleaningTaskRepo = require('../data/cleaningTaskRepo');
const cleaningTaskTemplateRepo = require('../data/cleaningTaskTemplateRepo');
const cleaningPlanRepo = require('../data/cleaningPlanRepo');

const { ensureExists } = require("../utils/userError");
const { frequencyMultipliers } = require("../utils/frequencyEnum");
const { recalculatePlanTotal } = require('./cleaningPlanService');
const { calculateTaskMonthlyPrice } = require("../utils/priceUtil");
const { frequencyDigit, sdsDigitFromDays } = require("../utils/sdsUtil");


// Helpers
function normalizeDays(days) {
    if (!days) return [];
    if (Array.isArray(days)) return days;
    return [days];
}

const sdsCategoryMap = {
    daily: 0,      // Daglig soignering → 1. ciffer
    floor: 1,      // Gulv → 2. ciffer
    inventory: 2   // Inventar → 3. ciffer
};


// Hent kundens timepris via planRepo
async function getHourlyRateForPlan(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Plan ikke fundet.");
    return plan.hourlyRate;
}


// Create
async function createCleaningTask(planId, data) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    const template = await cleaningTaskTemplateRepo.findTemplateById(data.templateId);
    ensureExists(template, "Opgave-skabelon blev ikke fundet.");

    const quantity = Number(data.quantity ?? 1);
    const frequency = data.frequency ?? "weekly";
    const days = normalizeDays(data.days ?? []);
    const customPrice = data.customPrice ? Number(data.customPrice) : null;

    const roomName = data.roomName ?? "Ukendt lokale";

    // ⭐ Kun SDS-kategorier skal have programkode
    const isSdsCategory = ["daily", "floor", "inventory"].includes(template.category);

    // ⭐ Opret tasken
    const task = await cleaningTaskRepo.create({
        planId,
        templateId: template._id,

        name: template.name,
        description: template.description,
        category: template.category,
        unit: template.unit,

        durationPerUnit: Number(data.durationPerUnit ?? template.durationPerUnit),
        amount: Number(data.amount ?? 0),

        quantity,
        frequency,
        days,
        customPrice,
        roomName,

        programCode: isSdsCategory ? "000" : null,
        isActive: true
    });

    // ⭐ SDS-kode skal kun genereres for SDS-opgaver
    if (isSdsCategory) {
        const siblings = await cleaningTaskRepo.findByPlanId(planId);
        const sameRoomTasks = siblings.filter(t => t.roomName === roomName);

        let digits = ["0", "0", "0"];

        sameRoomTasks.forEach(t => {
            const index = sdsCategoryMap[t.category];
            if (index !== undefined) {
                digits[index] = String(sdsDigitFromDays(t.days));
            }
        });

        const finalProgramCode = digits.join("");

        for (const t of sameRoomTasks) {
            await cleaningTaskRepo.updateById(t._id, { programCode: finalProgramCode });
        }
    }

    await recalculatePlanTotal(planId);
    return task;
}




// Update
async function updateCleaningTask(taskId, data) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const siblings = await cleaningTaskRepo.findByPlanId(task.planId);

    const roomName = data.roomName ?? task.roomName;
    const sameRoomTasks = siblings.filter(t => t.roomName === roomName);

    const isSdsCategory = ["daily", "floor", "inventory"].includes(task.category);

    let finalProgramCode = null;

    // ⭐ Kun SDS-opgaver skal have SDS-kode
    if (isSdsCategory) {
        let digits = ["0", "0", "0"];

        sameRoomTasks.forEach(t => {
            const index = sdsCategoryMap[t.category];
            if (index !== undefined) {
                digits[index] = String(sdsDigitFromDays(t.days));
            }
        });

        const updatedDays = normalizeDays(data.days ?? task.days);
        const updatedIndex = sdsCategoryMap[task.category];

        if (updatedIndex !== undefined) {
            digits[updatedIndex] = String(sdsDigitFromDays(updatedDays));
        }

        finalProgramCode = digits.join("");
    }

    const quantity = Number(data.quantity ?? task.quantity);
    const frequency = data.frequency ?? task.frequency;
    const days = normalizeDays(data.days ?? task.days);
    const customPrice = data.customPrice ? Number(data.customPrice) : task.customPrice;

    const updated = await cleaningTaskRepo.updateById(taskId, {
        amount: Number(data.amount ?? task.amount),
        durationPerUnit: Number(data.durationPerUnit ?? task.durationPerUnit),

        quantity,
        frequency,
        days,
        customPrice,

        roomName,
        programCode: finalProgramCode
    });

    await recalculatePlanTotal(task.planId);
    return updated;
}



// Delete (soft)
async function deleteCleaningTask(taskId) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    await cleaningTaskRepo.updateById(taskId, { isActive: false });
    await recalculatePlanTotal(task.planId);

    return task;
}

// Reactivate
async function reactivateCleaningTask(taskId) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    const updated = await cleaningTaskRepo.updateById(taskId, { isActive: true });
    await recalculatePlanTotal(task.planId);

    return updated;
}

// Deleted list
async function getDeletedCleaningTasks(planId) {
    const plan = await cleaningPlanRepo.findById(planId);
    ensureExists(plan, "Rengøringsplan blev ikke fundet.");

    return cleaningTaskRepo.findDeletedByPlanId(planId);
}

// Dynamisk prisberegning til visning
function calculateCleaningTaskPrices(task, hourlyRate) {
    return calculateTaskMonthlyPrice(task, hourlyRate);
}



module.exports = {
    createCleaningTask,
    updateCleaningTask,
    deleteCleaningTask,
    reactivateCleaningTask,
    getDeletedCleaningTasks,
    findCleaningTaskById: cleaningTaskRepo.findById,
    listCleaningTasks: cleaningTaskRepo.findByPlanId,
    getHourlyRateForPlan,
    calculateCleaningTaskPrices
};
