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

    // ⭐ Opret tasken (midlertidig programkode)
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

        programCode: "000",
        isActive: true
    });

    // ⭐ Find alle tasks i samme plan
    const siblings = await cleaningTaskRepo.findByPlanId(planId);

    // ⭐ Find alle tasks i samme lokale
    const sameRoomTasks = siblings.filter(t => t.roomName === roomName);

    // ⭐ SDS mapping
    const sdsCategoryMap = {
        daily: 0,
        floor: 1,
        inventory: 2
    };

    // ⭐ Start med tre null-cifre
    let digits = ["0", "0", "0"];

    // ⭐ Gennemgå alle tasks i lokalet
    sameRoomTasks.forEach(t => {
        const index = sdsCategoryMap[t.category];
        if (index !== undefined) {
            digits[index] = String(sdsDigitFromDays(t.days));
        }
    });

    // ⭐ Generér SDS-koden
    const finalProgramCode = digits.join("");

    // ⭐ Opdater ALLE tasks i lokalet med den nye SDS-kode
    for (const t of sameRoomTasks) {
        await cleaningTaskRepo.updateById(t._id, { programCode: finalProgramCode });
    }

    await recalculatePlanTotal(planId);
    return task;
}



// Update
async function updateCleaningTask(taskId, data) {
    const task = await cleaningTaskRepo.findById(taskId);
    ensureExists(task, "Rengøringsopgave blev ikke fundet.");

    // ⭐ Find alle tasks i samme plan
    const siblings = await cleaningTaskRepo.findByPlanId(task.planId);

    // ⭐ Find alle tasks i samme lokale (roomName)
    const roomName = data.roomName ?? task.roomName;
    const sameRoomTasks = siblings.filter(t => t.roomName === roomName);

    // ⭐ SDS mapping (daily → 0, floor → 1, inventory → 2)
    const sdsCategoryMap = {
        daily: 0,
        floor: 1,
        inventory: 2
    };

    // ⭐ Start med tre null-cifre
    let digits = ["0", "0", "0"];

    // ⭐ Gennemgå alle tasks i lokalet (før opdatering)
    sameRoomTasks.forEach(t => {
        const index = sdsCategoryMap[t.category];
        if (index !== undefined) {
            digits[index] = String(sdsDigitFromDays(t.days));
        }
    });

    // ⭐ Opdater cifret for den task der ændres
    const updatedCategory = data.category ?? task.category;
    const updatedDays = normalizeDays(data.days ?? task.days);

    const updatedIndex = sdsCategoryMap[updatedCategory];
    if (updatedIndex !== undefined) {
        digits[updatedIndex] = String(sdsDigitFromDays(updatedDays));
    }

    // ⭐ Generér SDS-koden
    const finalProgramCode = digits.join("");

    // ⭐ Opdater tasken
    const quantity = Number(data.quantity ?? task.quantity);
    const frequency = data.frequency ?? task.frequency;
    const days = updatedDays;
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
