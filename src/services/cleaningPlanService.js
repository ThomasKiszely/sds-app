const cleaningPlanRepo = require('../data/cleaningPlanRepo');
const cleaningTaskRepo = require('../data/cleaningTaskRepo');
const systemSettingsRepo = require('../data/systemSettingsRepo');
const { ensureExists, userError } = require("../utils/userError");
const { calculateTaskPrice, calculateTotals } = require("../services/priceService");
const { categoryTypes } = require("../utils/categoryEnum");
const { frequencies } = require("../utils/frequencyEnum");
const { units } = require("../utils/unitEnum");
const { formatDuration } = require("../utils/durationUtil");
const systemSettingsService = require("./systemSettingsService");

// Labels brugt specifikt i tidsoversigten pr. rum (intern visning) — adskilt fra
// den delte categoryLabels, da ordlyden her skal matche "Daglig soignering" osv.
const ROOM_TIME_CATEGORY_LABELS = {
    [categoryTypes.daily]: "Daglig soignering",
    [categoryTypes.floor]: "Grundig gulv",
    [categoryTypes.inventory]: "Inventar"
};


// Beskrivelserne her er den generelle rengøringsinstruktion (hvad der sker ved
// hvert almindeligt/ugentligt besøg pr. kategori) — kun ugentlige opgaver giver
// mening her, da sjældnere opgaver (månedlig, halvårlig osv.) er rum-specifikke
// særopgaver, der i stedet vises som bemærkninger på det enkelte rum.
function extractInstructionDescriptions(tasks) {

    const isWeeklyWithDescription = category => t =>
        t.category === category &&
        t.frequency === frequencies.weekly &&
        Boolean(t.description);

    const dedupe = list => [...new Set(list)];

    const dailyDescriptions = dedupe(
        tasks.filter(isWeeklyWithDescription(categoryTypes.daily)).map(t => t.description)
    );

    const floorDescriptions = dedupe(
        tasks.filter(isWeeklyWithDescription(categoryTypes.floor)).map(t => t.description)
    );

    const inventoryDescriptions = dedupe(
        tasks.filter(isWeeklyWithDescription(categoryTypes.inventory)).map(t => t.description)
    );

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

    const systemSettings = await systemSettingsService.getSettings();
    // Enrich tasks with prices
    const enrichedTasks = tasks.map(t => {
        const plain = typeof t.toObject === "function" ? t.toObject() : t;
        const prices = calculateTaskPrice(plain, hourlyRate);
        return { ...plain, ...prices };
    });

    // CENTRAL PRISBEREGNING
    const totals = calculateTotals({
        tasks: enrichedTasks,
        discountPercent: plan.discountPercent || 0,
        environmentalFeePercent: plan.environmentalFeePercent ?? systemSettings.environmentalFee
    });

    await cleaningPlanRepo.updateById(planId, {
        subtotalBeforeDiscount: totals.subtotal,
        discountAmount: totals.discountAmount,
        environmentalFeeAmount: totals.environmentalFeeAmount,
        totalMonthlyPrice: totals.total
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
        environmentalFeePercent: data.environmentalFeePercent ?? settings.environmentalFee,
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

async function findCleaningPlanWithCustomerById(planId) {
    const plan = await cleaningPlanRepo.findByIdWithCustomer(planId);
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


// Beregner hvilke ugedage der rengøres på, ud fra de ugentlige SDS-opgavers
// dage, og formaterer det som en læsbar sætning ("mandag til fredag" for en
// sammenhængende uge, ellers en kommasepareret liste).
function describeOperatingDays(tasks) {
    const { days: dayEnum, daysLabels } = require("../utils/dayEnum");

    const sdsCategories = [categoryTypes.daily, categoryTypes.floor, categoryTypes.inventory];
    const orderedDays = Object.keys(dayEnum);

    const usedDays = new Set();
    tasks
        .filter(t => sdsCategories.includes(t.category) && t.frequency === frequencies.weekly)
        .forEach(t => (t.days || []).forEach(d => usedDays.add(d)));

    const sorted = orderedDays.filter(d => usedDays.has(d));
    if (sorted.length === 0) return null;

    const lower = label => label.toLowerCase();
    const indices = sorted.map(d => orderedDays.indexOf(d));
    const isContiguous = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);

    if (isContiguous && sorted.length > 1) {
        return `${lower(daysLabels[sorted[0]])} til ${lower(daysLabels[sorted[sorted.length - 1]])}`;
    }

    return sorted.map(d => lower(daysLabels[d])).join(", ");
}


// Bygger en tidsoversigt pr. rum (kun til intern visning, ikke kunde-PDF):
// for hvert rum og hver programkode-kategori (daily/floor/inventory) med
// ugentlig frekvens, vises varighed pr. gang og hvilke ugedage det sker.
// Ikke-ugentlige opgaver og andre kategorier springes over indtil videre.
function buildRoomTimeBreakdown(grouped) {
    const { days: dayEnum, daysShortLabels } = require("../utils/dayEnum");
    const orderedDays = Object.keys(dayEnum);

    const breakdown = {};

    for (const roomName of Object.keys(grouped)) {
        const sdsTasks = grouped[roomName].sds || [];

        const lines = [categoryTypes.daily, categoryTypes.floor, categoryTypes.inventory]
            .map(category => {
                const task = sdsTasks.find(t =>
                    t.category === category && t.frequency === frequencies.weekly
                );
                if (!task) return null;

                const sortedDays = orderedDays.filter(d => (task.days || []).includes(d));

                // Opgaver der kun har en customPrice (ingen durationPerUnit) har
                // ingen tid at vise — "0 min" ville se ud som en rigtig værdi,
                // så vi gør tydeligt at der ikke er tidsregistrering.
                const hasDuration = Number(task.duration) > 0;

                return {
                    label: ROOM_TIME_CATEGORY_LABELS[category],
                    duration: hasDuration ? formatDuration(task.duration) : "ikke tidsregistreret",
                    days: sortedDays.map(d => daysShortLabels[d]).join(", ")
                };
            })
            .filter(Boolean);

        if (lines.length === 0) continue;

        const sizedTask = sdsTasks.find(t => t.unit === units.m2 && t.amount > 0);

        breakdown[roomName] = {
            size: sizedTask ? sizedTask.amount : null,
            lines
        };
    }

    return breakdown;
}


// Summerer tid pr. ugedag på tværs af alle rum (kun ugentlige SDS-opgaver,
// samme afgrænsning som buildRoomTimeBreakdown). Opgaver uden tidsregistrering
// (kun customPrice) bidrager med 0 og gør altså IKKE summen for lav ift.
// virkeligheden — det er bare tid der aldrig var registreret i forvejen.
function buildDailyTimeTotals(grouped) {
    const { days: dayEnum, daysLabels } = require("../utils/dayEnum");
    const orderedDays = Object.keys(dayEnum);

    const totalsByDay = {};
    orderedDays.forEach(d => { totalsByDay[d] = 0; });

    for (const roomName of Object.keys(grouped)) {
        const sdsTasks = grouped[roomName].sds || [];

        sdsTasks
            .filter(t => t.frequency === frequencies.weekly)
            .forEach(t => {
                // Rundes til hele minutter FØR sammenlægning, så tallet matcher
                // det man ser pr. opgave i "Tidsforbrug pr. rum" — ellers kan
                // summen af de viste minuttal afvige med et minut fra totalen.
                const wholeMinutes = Math.round(Number(t.duration) || 0);

                (t.days || []).forEach(d => {
                    if (totalsByDay[d] !== undefined) {
                        totalsByDay[d] += wholeMinutes;
                    }
                });
            });
    }

    return orderedDays
        .filter(d => totalsByDay[d] > 0)
        .map(d => ({
            day: daysLabels[d],
            duration: formatDuration(totalsByDay[d])
        }));
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
    extractInstructionDescriptions,
    describeOperatingDays,
    buildRoomTimeBreakdown,
    buildDailyTimeTotals,
    findCleaningPlanWithCustomerById
};
