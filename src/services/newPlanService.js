const cleaningPlanService = require("./cleaningPlanService");
const cleaningTaskService = require("./cleaningTaskService");
const cleaningTaskTemplateService = require("./cleaningTaskTemplateService");
const customerService = require("./customerService");
const locationService = require("./locationService");
const systemSettingsService = require("./systemSettingsService");
const offerService = require("./offerService");

const { categoryTypes } = require("../utils/categoryEnum");
const { days } = require("../utils/dayEnum");
const { frequencies, frequencyMultipliers } = require("../utils/frequencyEnum");
const { units } = require("../utils/unitEnum");
const { calculateTaskMonthlyPrice } = require("../utils/priceUtil");



// ------------------------------------------------------------
// 1. CREATE PLAN
// ------------------------------------------------------------
async function createPlan({ customerId, locationId, nameFromUI, description }) {

    const customer = await customerService.getCustomerById(customerId);
    const location = await locationService.getLocationById(locationId);

    const locationName = location?.name?.trim();
    const userName = nameFromUI?.trim();

    const existingPlans = await cleaningPlanService.getPlansForLocation(locationId);
    const count = existingPlans.length + 1;

    const defaultName = locationName
        ? `${customer.customerName} – ${locationName} – Rengøringsplan – #${count}`
        : `${customer.customerName} – Rengøringsplan – #${count}`;

    const finalName = userName
        ? (locationName
            ? `${customer.customerName} – ${locationName} – ${userName} – #${count}`
            : `${customer.customerName} – ${userName} – #${count}`)
        : defaultName;

    const systemSettings = await systemSettingsService.getSettings();

    const plan = await cleaningPlanService.createCleaningPlan({
        customerId,
        locationId,
        name: finalName,
        description: description?.trim() || "",
        hourlyRate: systemSettings.hourlyRate
    });

    return plan;
}


// ------------------------------------------------------------
// 2. ADD TASK FROM TEMPLATE
// ------------------------------------------------------------
async function addTaskFromTemplate(planId, templateId) {
    const template = await cleaningTaskTemplateService.findTemplateById(templateId);

    const task = await cleaningTaskService.createCleaningTask(planId, {
        templateId,
        name: template.name,
        description: template.description,
        category: template.category,
        unit: template.unit,
        durationPerUnit: template.durationPerUnit,
        frequency: frequencies.weekly,
        amount: 0,
        quantity: 1,
        roomName: "Ukendt lokale",
        programCode: "000"
    });

    return task;
}


// ------------------------------------------------------------
// 3. EDIT TASK VIEWMODEL
// ------------------------------------------------------------
async function getEditTaskViewModel(taskId) {
    return await cleaningTaskService.findCleaningTaskById(taskId);
}


// ------------------------------------------------------------
// 4. UPDATE TASK
// ------------------------------------------------------------
async function updateTask(taskId, body) {
    const updatedTask = await cleaningTaskService.updateCleaningTask(taskId, body);

    const plan = await cleaningPlanService.findCleaningPlanById(updatedTask.planId);
    const tasks = await cleaningTaskService.listCleaningTasks(updatedTask.planId);

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = t.toObject();
        const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
        return { ...plain, ...prices };
    });


    const monthlyTotal = enrichedTasks.reduce((sum, t) => sum + t.monthlyPrice, 0);
    const yearlyTotal = monthlyTotal * 12;

    return {
        planId: updatedTask.planId,
        tasks: enrichedTasks,
        monthlyTotal,
        yearlyTotal
    };
}


// ------------------------------------------------------------
// 5. PREVIEW TASK PRICE
// ------------------------------------------------------------
async function previewTaskPrice(taskId, body) {
    const task = await cleaningTaskService.findCleaningTaskById(taskId);
    const hourlyRate = await cleaningTaskService.getHourlyRateForPlan(task.planId);

    // Brug body hvis sat, ellers task
    const frequency = body.frequency ?? task.frequency;
    const amount = Number(body.amount ?? task.amount);
    const quantity = Number(body.quantity ?? task.quantity);
    const durationPerUnit = Number(body.durationPerUnit ?? task.durationPerUnit);

    // Normaliser days (selvom de ikke bruges i prisberegning)
    const daysNormalized = (() => {
        if (!body.days) return task.days;
        if (Array.isArray(body.days)) return body.days;
        return [body.days];
    })();

    // Lav et midlertidigt task‑objekt til priceUtil
    const tempTask = {
        ...task.toObject(),
        frequency,
        amount,
        quantity,
        durationPerUnit,
        days: daysNormalized
    };

    const { monthlyPrice } = calculateTaskMonthlyPrice(tempTask, hourlyRate);

    return Math.round(monthlyPrice);
}



// ------------------------------------------------------------
// 6. DELETE TASK
// ------------------------------------------------------------
async function deleteTask(taskId) {
    const deletedTask = await cleaningTaskService.deleteCleaningTask(taskId);

    const plan = await cleaningPlanService.findCleaningPlanById(deletedTask.planId);
    const tasks = await cleaningTaskService.listCleaningTasks(deletedTask.planId);

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = t.toObject();
        const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
        return { ...plain, ...prices };
    });


    const monthlyTotal = enrichedTasks.reduce((sum, t) => sum + t.monthlyPrice, 0);
    const yearlyTotal = monthlyTotal * 12;

    return {
        planId: deletedTask.planId,
        tasks: enrichedTasks,
        monthlyTotal,
        yearlyTotal
    };
}


// ------------------------------------------------------------
// 7. LIST TASKS
// ------------------------------------------------------------
async function listTasks(planId) {
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningTaskService.listCleaningTasks(planId);

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = t.toObject();
        const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
        return { ...plain, ...prices };
    });


    const monthlyTotal = enrichedTasks.reduce((sum, t) => sum + t.monthlyPrice, 0);
    const yearlyTotal = monthlyTotal * 12;

    return {
        planId,
        tasks: enrichedTasks,
        monthlyTotal,
        yearlyTotal
    };
}


// ------------------------------------------------------------
// 8. OFFER STEP 4 VIEWMODEL
// ------------------------------------------------------------
async function getOfferStep4ViewModel(planId) {
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningPlanService.getTasksForPlan(planId);
    const systemSettings = await systemSettingsService.getSettings();

    const discountPercent = 0;
    const environmentalFee = systemSettings.environmentalFee;

    const totals = offerService.calculateOfferTotals(
        tasks,
        discountPercent,
        environmentalFee
    );

    return {
        planId,
        tasks,
        discountPercent,
        environmentalFee,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        environmentalFeeAmount: totals.environmentalFeeAmount,
        total: totals.total
    };
}


// ------------------------------------------------------------
// 9. OFFER PREVIEW
// ------------------------------------------------------------
async function getOfferPreview(planId, discountPercent, environmentalFee) {
    const tasks = await cleaningPlanService.getTasksForPlan(planId);

    const totals = offerService.calculateOfferTotals(
        tasks,
        discountPercent,
        environmentalFee
    );

    return totals.total;
}

// ------------------------------------------------------------
// UPDATE DAILY BUNDLE (Soignering + Gulv + Inventar)
// ------------------------------------------------------------
async function updateDailyBundle(planId, body) {

    // Fælles felter
    const roomName = body.roomName;
    const amount = Number(body.amount);
    const daysNormalized = Array.isArray(body.days) ? body.days : (body.days ? [body.days] : []);
    const frequency = body.frequency;

    // De tre taskIds kommer som hidden inputs
    const taskIds = Array.isArray(body.taskIds) ? body.taskIds : [body.taskIds];

    for (const id of taskIds) {

        const task = await cleaningTaskService.findCleaningTaskById(id);

        // Fælles felter
        task.roomName = roomName;
        task.amount = amount;
        task.days = daysNormalized;
        task.frequency = frequency;

        // Individuelle felter
        task.durationPerUnit = Number(body[`duration_${id}`]);
        task.customPrice = body[`custom_${id}`] ? Number(body[`custom_${id}`]) : null;
        task.description = body[`description_${id}`] || "";

        await cleaningTaskService.updateCleaningTask(id, task);
    }

    // Recalculate totals
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningTaskService.listCleaningTasks(planId);

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = t.toObject();
        const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
        return { ...plain, ...prices };
    });

    const monthlyTotal = enrichedTasks.reduce((sum, t) => sum + t.monthlyPrice, 0);
    const yearlyTotal = monthlyTotal * 12;

    return {
        planId,
        tasks: enrichedTasks,
        monthlyTotal,
        yearlyTotal
    };
}

async function createDailyBundle(planId, body) {

    const roomName = body.roomName;
    const amount = Number(body.amount);
    const daysNormalized = Array.isArray(body.days)
        ? body.days
        : (body.days ? [body.days] : []);
    const frequency = body.frequency;

    // Varighed pr enhed
    const durS = Number(body.duration_soignering);
    const durG = Number(body.duration_gulv);
    const durI = Number(body.duration_inventar);

    // Custom priser
    const customS = body.custom_soignering ? Number(body.custom_soignering) : null;
    const customG = body.custom_gulv ? Number(body.custom_gulv) : null;
    const customI = body.custom_inventar ? Number(body.custom_inventar) : null;

    // Find templates
    const templates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.daily);

    const soigneringTemplate = templates.find(t => t.name.toLowerCase().includes("soignering"));
    const gulvTemplate = templates.find(t => t.name.toLowerCase().includes("gulv"));
    const inventarTemplate = templates.find(t => t.name.toLowerCase().includes("inventar"));

    // Opret opgaver
    await cleaningTaskService.createCleaningTask(planId, {
        templateId: soigneringTemplate._id,
        name: soigneringTemplate.name,
        description: soigneringTemplate.description,
        category: soigneringTemplate.category,
        unit: soigneringTemplate.unit,
        durationPerUnit: durS,
        customPrice: customS,
        frequency,
        amount,
        quantity: 1,
        roomName,
        days: daysNormalized,
        programCode: "000"
    });

    await cleaningTaskService.createCleaningTask(planId, {
        templateId: gulvTemplate._id,
        name: gulvTemplate.name,
        description: gulvTemplate.description,
        category: gulvTemplate.category,
        unit: gulvTemplate.unit,
        durationPerUnit: durG,
        customPrice: customG,
        frequency,
        amount,
        quantity: 1,
        roomName,
        days: daysNormalized,
        programCode: "000"
    });

    await cleaningTaskService.createCleaningTask(planId, {
        templateId: inventarTemplate._id,
        name: inventarTemplate.name,
        description: inventarTemplate.description,
        category: inventarTemplate.category,
        unit: inventarTemplate.unit,
        durationPerUnit: durI,
        customPrice: customI,
        frequency,
        amount,
        quantity: 1,
        roomName,
        days: daysNormalized,
        programCode: "000"
    });

    // Recalculate totals
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningTaskService.listCleaningTasks(planId);

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = t.toObject();
        const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
        return { ...plain, ...prices };
    });

    const monthlyTotal = enrichedTasks.reduce((sum, t) => sum + t.monthlyPrice, 0);
    const yearlyTotal = monthlyTotal * 12;

    return {
        planId,
        tasks: enrichedTasks,
        monthlyTotal,
        yearlyTotal
    };
}



module.exports = {
    createPlan,
    addTaskFromTemplate,
    getEditTaskViewModel,
    updateTask,
    previewTaskPrice,
    deleteTask,
    listTasks,
    getOfferStep4ViewModel,
    getOfferPreview,
    updateDailyBundle,
    createDailyBundle
};
