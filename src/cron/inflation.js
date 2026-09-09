// cron/inflation.js

const CleaningTask = require('../models/CleaningTask');
const CleaningPlan = require('../models/CleaningPlan');
const InflationLog = require('../models/InflationLog');
const taskRepo = require('../data/cleaningTaskRepo');
const planRepo = require('../data/cleaningPlanRepo');
const { calculateTaskTotalPrice } = require('../utils/priceUtil');
const SystemSettings = require('../models/SystemSettings');

async function getInflationRate() {
    const settings = await SystemSettings.findOne();
    return settings?.inflationRate ?? 0.025;
}



async function runInflationAdjustment() {
    console.log("Inflations-justering startet...");

    const INFLATION_RATE = await getInflationRate();

    const tasks = await CleaningTask.find({ isActive: true });
    console.log(`Antal aktive opgaver: ${tasks.length}`);

    for (const task of tasks) {
        const newPrice = Number((task.price * (1 + INFLATION_RATE)).toFixed(2));

        const newTotalPrice = calculateTaskTotalPrice({
            unit: task.unit,
            category: task.category,
            price: newPrice,
            amount: task.amount,
            frequency: task.frequency
        });

        await taskRepo.updateById(task._id, {
            price: newPrice,
            totalPrice: newTotalPrice
        });
    }

    console.log("Alle opgaver er opdateret.");

    const plans = await CleaningPlan.find({ isActive: true });

    for (const plan of plans) {
        const tasksForPlan = await taskRepo.findByPlanId(plan._id);
        const total = tasksForPlan.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
        await planRepo.updateById(plan._id, { totalPrice: total });
    }

    console.log("Alle planer er opdateret.");

    await InflationLog.create({
        year: new Date().getFullYear(),
        date: new Date(),
        rate: INFLATION_RATE
    });

    console.log("Inflations-justering logget.");
}

async function runInflationCatchUp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 = januar

    // Kun relevant i januar
    if (month !== 0) return;

    const alreadyRun = await InflationLog.findOne({ year });

    if (!alreadyRun) {
        console.log("Inflation ikke kørt for i år — kører catch-up...");
        await runInflationAdjustment();
    }
}

module.exports = {
    runInflationAdjustment,
    runInflationCatchUp,
    getInflationRate,
};
