// cron/inflation.js

const CleaningPlan = require('../models/CleaningPlan');
const InflationLog = require('../models/InflationLog');
const taskRepo = require('../data/cleaningTaskRepo');
const planRepo = require('../data/cleaningPlanRepo');
const SystemSettings = require('../models/SystemSettings');
const systemSettingsRepo = require('../data/systemSettingsRepo');
const cron = require('node-cron');

// Samme totalberegning (via priceService) som resten af systemet
const { recalculatePlanTotal } = require('../services/cleaningPlanService');

async function getInflationRate() {
    const settings = await SystemSettings.findOne();
    return settings?.inflationRate ?? 0.025;
}

function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Priser beregnes altid ud fra plan.hourlyRate (og evt. task.customPrice),
 * så det er dem der reguleres. Derefter genberegnes planens totaler.
 */
async function runInflationAdjustment() {
    console.log("Inflations-justering startet...");

    const year = new Date().getFullYear();

    // Må kun køre én gang pr. år
    const alreadyRun = await InflationLog.findOne({ year });
    if (alreadyRun) {
        console.log(`Inflation er allerede kørt for ${year} — springer over.`);
        return;
    }

    const INFLATION_RATE = await getInflationRate();
    const factor = 1 + INFLATION_RATE;

    // Systemets timepris (bruges til nye planer)
    const settings = await systemSettingsRepo.getSettings();
    if (settings.hourlyRate > 0) {
        const newSystemRate = round(settings.hourlyRate * factor);
        await systemSettingsRepo.updateHourlyRate(newSystemRate);
        console.log(`Systemets timepris: ${settings.hourlyRate} → ${newSystemRate} kr.`);
    }

    const plans = await CleaningPlan.find({ isActive: true });
    console.log(`Antal aktive planer: ${plans.length}`);

    for (const plan of plans) {
        if (!(plan.hourlyRate > 0)) {
            console.warn(`Plan ${plan._id} har ingen gyldig timepris — springer over.`);
            continue;
        }

        // Timepris
        await planRepo.updateById(plan._id, {
            hourlyRate: round(plan.hourlyRate * factor)
        });

        // Særpriser (customPrice) på planens opgaver
        const tasks = await taskRepo.findByPlanId(plan._id);
        for (const task of tasks) {
            if (task.customPrice != null) {
                await taskRepo.updateById(task._id, {
                    customPrice: round(task.customPrice * factor)
                });
            }
        }

        // Subtotal, rabat, miljøtillæg og totalMonthlyPrice
        await recalculatePlanTotal(plan._id);
    }

    console.log("Alle planer er opdateret.");

    await InflationLog.create({
        year,
        date: new Date(),
        rate: INFLATION_RATE
    });

    console.log("Inflations-justering logget.");
}

/**
 * Tjekkes ved hver serverstart. Kører reguleringen hvis den mangler for i år,
 * og enten det er januar, eller den har kørt et tidligere år (dvs. systemet har
 * været i drift og har misset 1. januar). Uden tidligere log og uden for januar
 * køres der ikke, så en første deploy midt på året ikke hæver alle priser.
 */
async function runInflationCatchUp() {
    const now = new Date();
    const year = now.getFullYear();
    const isJanuary = now.getMonth() === 0;

    const alreadyRun = await InflationLog.findOne({ year });
    if (alreadyRun) {
        console.log(`Inflation er allerede kørt for ${year}.`);
        return;
    }

    const hasRunBefore = await InflationLog.exists({ year: { $lt: year } });

    if (isJanuary || hasRunBefore) {
        console.log(`Inflation ikke kørt for ${year} — kører catch-up...`);
        await runInflationAdjustment();
    } else {
        console.log(`Inflation ikke kørt for ${year}, men ingen tidligere kørsel — venter til 1. januar.`);
    }
}

/**
 * Starter den årlige indeksregulering (1. januar kl. 03:00 dansk tid)
 * og kører catch-up ved opstart, hvis serveren var nede 1. januar.
 * Kaldes fra server.js efter forbindelsen til MongoDB er oprettet.
 */
function startInflationCron() {
    cron.schedule('0 3 1 1 *', async () => {
        try {
            await runInflationAdjustment();
        } catch (err) {
            console.error("❌ Inflations-justering fejlede:", err);
        }
    }, {
        timezone: 'Europe/Copenhagen',
        name: 'inflation',
        noOverlap: true
    });

    runInflationCatchUp().catch(err => {
        console.error("❌ Inflations catch-up fejlede:", err);
    });

    console.log("Inflations-cron startet (1. januar kl. 03:00).");
}

module.exports = {
    runInflationAdjustment,
    runInflationCatchUp,
    getInflationRate,
    startInflationCron,
};
