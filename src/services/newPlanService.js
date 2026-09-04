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
const { calculateProgramCodeForRoom } = require("../utils/programCodeUtil");
const { paymentTerms } = require("../utils/paymentTerms");



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

    // ⭐ FORBRUGSVARE
    if (template.isConsumable === true) {
        return await cleaningTaskService.createCleaningTask(planId, {
            templateId,
            name: template.name,
            description: template.description,
            category: categoryTypes.consumables,
            unit: units.stk,

            // ⭐ Brug customPrice (ikke pricePerUnit)
            customPrice: Number(template.customPrice ?? 0),

            durationPerUnit: 0,
            frequency: null,
            days: template.days ?? [],

            amount: template.amount ?? 0,
            quantity: template.quantity ?? 1,
            roomName: template.roomName ?? "",
        });
    }

    // ⭐ ALMINDELIGE OPERATIONER (extra, adHoc, windows, etc.)
    return await cleaningTaskService.createCleaningTask(planId, {
        templateId,
        name: template.name,
        description: template.description,
        category: template.category,
        unit: template.unit,

        durationPerUnit: template.durationPerUnit,
        frequency: template.frequency,
        days: template.days ?? [],

        // ⭐ VIGTIGT: brug customPrice fra template
        customPrice: Number(template.customPrice ?? 0),

        amount: template.amount ?? 0,
        quantity: template.quantity ?? 1,
        roomName: template.roomName ?? "",
    });
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

    const frequency = body.frequency ?? task.frequency;
    const amount = Number(body.amount ?? task.amount);
    const quantity = Number(body.quantity ?? task.quantity);
    const durationPerUnit = Number(body.durationPerUnit ?? task.durationPerUnit);

    const daysNormalized = (() => {
        if (!body.days) return task.days;
        if (Array.isArray(body.days)) return body.days;
        return [body.days];
    })();

    const customPrice =
        body.customPrice === "" || body.customPrice === undefined
            ? task.customPrice
            : Number(body.customPrice);

    const tempTask = {
        ...task.toObject(),
        frequency,
        amount,
        quantity,
        durationPerUnit,
        days: daysNormalized,
        customPrice
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

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = typeof t.toObject === "function" ? t.toObject() : t;
        const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
        return { ...plain,
            ...prices,
        totalPrice: prices.monthlyPrice
        };
    });

    const discountPercent = 0;
    const environmentalFee = systemSettings.environmentalFee;

    const totals = offerService.calculateOfferTotals(
        enrichedTasks,
        discountPercent,
        environmentalFee,
        hourlyRate
    );

    return {
        planId,
        tasks: enrichedTasks,
        discountPercent,
        environmentalFee,
        subtotal: totals.subtotal,
        monthlyTotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        environmentalFeeAmount: totals.environmentalFeeAmount,
        total: totals.total,
        paymentTerms: plan.paymentTerms || paymentTerms.netto14
    };
}

// ------------------------------------------------------------
// 9. OFFER PREVIEW
// ------------------------------------------------------------
async function getOfferPreview(planId, discountPercent, environmentalFee) {
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningPlanService.getTasksForPlan(planId);

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = typeof t.toObject === "function" ? t.toObject() : t;
        const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);

        return {
            ...plain,
            ...prices,
            totalPrice: prices.monthlyPrice
        };
    });

    const totals = offerService.calculateOfferTotals(
        enrichedTasks,
        discountPercent,
        environmentalFee,
        hourlyRate
    );

    return totals.total;
}


// ------------------------------------------------------------
// UPDATE DAILY BUNDLE (Soignering + Gulv + Inventar)
// ------------------------------------------------------------
async function updateDailyBundle(planId, body) {

    const roomName = body.roomName;
    const amount = Number(body.amount);

    // ⭐ Bemærkninger for rummet
    const notesRaw = body.roomNotes || "";
    const notesArray = notesRaw
        .split("\n")
        .map(n => n.trim())
        .filter(n => n.length > 0);

    // ⭐ Hent planen
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const hourlyRate = plan.hourlyRate;

    // ⭐ Opdater roomNotes
    const filtered = plan.roomNotes.filter(r => r.roomName !== roomName);
    filtered.push({ roomName, notes: notesArray });
    await cleaningPlanService.updateCleaningPlan(planId, { roomNotes: filtered });

    // ⭐ Hent SDS-opgaver for rummet
    const sdsTasks = await cleaningTaskService.findSdsTasksForRoom(planId, roomName);

    // ⭐ Fælles felter
    const frequency = body.frequency || frequencies.weekly;

    const daysNormalized = (() => {
        if (!body.days) return [];
        if (Array.isArray(body.days)) return body.days;
        return [body.days];
    })();

    for (const task of sdsTasks) {

        // ⭐ Individuelle felter (MATCHER EJS)
        const durationPerUnit = Number(body[`duration_${task._id}`] ?? task.durationPerUnit);
        const customPrice = body[`custom_${task._id}`] ? Number(body[`custom_${task._id}`]) : null;
        const description = body[`description_${task._id}`] || "";

        // ⭐ Saml opdateret task
        const updatedTask = {
            ...task.toObject(),
            roomName,
            amount,
            days: daysNormalized,
            frequency,
            durationPerUnit,
            customPrice,
            description
        };

        // ⭐ Beregn priser
        const prices = calculateTaskMonthlyPrice(updatedTask, hourlyRate);

        // ⭐ Gem task
        await cleaningTaskService.updateCleaningTask(task._id, {
            roomName,
            amount,
            days: daysNormalized,
            frequency,
            durationPerUnit,
            customPrice,
            description,
            ...prices
        });
    }

    // ⭐ Recalculate plan total
    await cleaningPlanService.recalculatePlanTotal(planId);

    return true;
}


async function createDailyBundle(planId, body) {

    const roomName = body.roomName;

    const amount = Number(body.amount);

    // ⭐ Bemærkninger for rummet
    const notesRaw = body.roomNotes || "";
    const notesArray = notesRaw
        .split("\n")
        .map(n => n.trim())
        .filter(n => n.length > 0);

// ⭐ Hent planen
    const plan = await cleaningPlanService.findCleaningPlanById(planId);

// ⭐ Fjern gamle bemærkninger for rummet
    const filtered = plan.roomNotes.filter(r => r.roomName !== roomName);

// ⭐ Tilføj nye bemærkninger
    filtered.push({
        roomName,
        notes: notesArray
    });

// ⭐ Gem via repo
    await cleaningPlanService.updateCleaningPlan(planId, { roomNotes: filtered });

    // ⭐ Hent dage pr kategori
    const daysS = Array.isArray(body.days_soignering)
        ? body.days_soignering
        : (body.days_soignering ? [body.days_soignering] : []);

    const daysG = Array.isArray(body.days_gulv)
        ? body.days_gulv
        : (body.days_gulv ? [body.days_gulv] : []);

    const daysI = Array.isArray(body.days_inventar)
        ? body.days_inventar
        : (body.days_inventar ? [body.days_inventar] : []);

    const frequency = body.frequency || frequencies.weekly;

    // Varighed pr enhed
    const durS = Number(body.duration_soignering);
    const durG = Number(body.duration_gulv);
    const durI = Number(body.duration_inventar);

    // Custom priser
    const customS = body.custom_soignering ? Number(body.custom_soignering) : null;
    const customG = body.custom_gulv ? Number(body.custom_gulv) : null;
    const customI = body.custom_inventar ? Number(body.custom_inventar) : null;

    // Find templates via kategori (robust)
    const soigneringTemplate = (await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.daily))[0];
    const gulvTemplate       = (await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.floor))[0];
    const inventarTemplate   = (await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.inventory))[0];

    // ⭐ Opret Soignering
    await cleaningTaskService.createCleaningTask(planId, {
        templateId: soigneringTemplate._id,
        roomName,
        durationPerUnit: durS,
        customPrice: customS,
        frequency,
        amount,
        quantity: 1,
        days: daysS
    });

    // ⭐ Opret Gulv
    await cleaningTaskService.createCleaningTask(planId, {
        templateId: gulvTemplate._id,
        roomName,
        durationPerUnit: durG,
        customPrice: customG,
        frequency,
        amount,
        quantity: 1,
        days: daysG
    });

    // ⭐ Opret Inventar
    await cleaningTaskService.createCleaningTask(planId, {
        templateId: inventarTemplate._id,
        roomName,
        durationPerUnit: durI,
        customPrice: customI,
        frequency,
        amount,
        quantity: 1,
        days: daysI
    });

    await cleaningPlanService.recalculatePlanTotal(planId);

    return true;
}

/*
function groupTasksByRoom(tasks) {
    const rooms = {};

    for (const t of tasks) {

        // ⭐ Kun bundle-opgaver har rum
        if (!t.roomName || t.roomName.trim() === "") {
            continue; // skip tasks uden lokale
        }

        if (!rooms[t.roomName]) {
            rooms[t.roomName] = { sds: [], other: [] };
        }

        // ⭐ SDS-opgaver (daily, floor, inventory)
        if (["daily", "floor", "inventory"].includes(t.category)) {
            rooms[t.roomName].sds.push(t);
        } else {
            rooms[t.roomName].other.push(t);
        }
    }

    // ⭐ Beregn programkode KUN for SDS-opgaver
    for (const room of Object.keys(rooms)) {
        const sdsTasks = rooms[room].sds;

        // Sortér SDS-opgaver efter kategori
        sdsTasks.sort((a, b) => a.category.localeCompare(b.category));

        // Beregn programkode (kan være "000" hvis ingen SDS)
        rooms[room].programCode = calculateProgramCodeForRoom(sdsTasks);
    }

    return rooms;
}
*/


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
    createDailyBundle,
};
