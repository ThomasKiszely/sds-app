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
const { calculateTaskPrice } = require("../services/priceService");
const { calculateProgramCodeForRoom } = require("../utils/programCodeUtil");
const { paymentTerms } = require("../utils/paymentTerms");


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



async function addTaskFromTemplate(planId, templateId, body) {
    const template = await cleaningTaskTemplateService.findTemplateById(templateId);

    //  Merge template + body
    const merged = {
        templateId,
        name: body.name ?? template.name,
        description: body.description ?? template.description,
        category: template.category,
        unit: template.unit,

        durationPerUnit: Number(body.durationPerUnit ?? template.durationPerUnit ?? 0),
        frequency: body.frequency ?? template.frequency ?? null,

        days: (() => {
            if (body.days === undefined) return template.days ?? [];
            if (Array.isArray(body.days)) return body.days;
            return [body.days];
        })(),

        amount: Number(body.amount ?? template.amount ?? 0),
        quantity: Number(body.quantity ?? template.quantity ?? 1),

        roomName: body.roomName ?? template.roomName ?? "",
        customPrice: Number(body.customPrice ?? template.customPrice ?? 0),
    };

    // Hent hourlyRate
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const hourlyRate = plan.hourlyRate;

    // Beregn pris
    const prices = calculateTaskPrice(merged, hourlyRate);

    // Merge pris ind i task
    const pricedTask = { ...merged, ...prices };

    // Gem task
    const task = await cleaningTaskService.createCleaningTask(planId, pricedTask);

    // Opdater plan total
    await cleaningPlanService.recalculatePlanTotal(planId);

    return task;
}



async function getEditTaskViewModel(taskId) {
    return await cleaningTaskService.findCleaningTaskById(taskId);
}


async function updateTask(taskId, body) {
    const updatedTask = await cleaningTaskService.updateCleaningTask(taskId, body);

    const plan = await cleaningPlanService.findCleaningPlanById(updatedTask.planId);
    const tasks = await cleaningTaskService.listCleaningTasks(updatedTask.planId);

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = t.toObject();
        const prices = calculateTaskPrice(plain, hourlyRate);
        return { ...plain, ...prices };
    });

    // RETTET: brug både monthlyPrice OG pricePerTime
    const monthlyTotal = enrichedTasks.reduce((sum, t) => {
        const prices = calculateTaskPrice(t, hourlyRate);
        const price =
            prices.monthlyPrice > 0
                ? prices.monthlyPrice
                : prices.pricePerTime > 0
                    ? prices.pricePerTime
                    : 0;
        return sum + price;
    }, 0);


    const yearlyTotal = monthlyTotal * 12;

    return {
        planId: updatedTask.planId,
        tasks: enrichedTasks,
        monthlyTotal,
        yearlyTotal
    };
}


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

    const { monthlyPrice } = calculateTaskPrice(tempTask, hourlyRate);

    return Math.round(monthlyPrice);
}


async function previewNewTaskPrice(body) {
    if (!body.planId) return 0;

    const hourlyRate = await cleaningTaskService.getHourlyRateForPlan(body.planId);

    // Hent skabelonen hvis templateId er sendt med
    let template = {};
    if (body.templateId) {
        try {
            template = await cleaningTaskTemplateService.findTemplateById(body.templateId) || {};
        } catch (e) {
            template = {};
        }
    }

    const customPriceNum =
        body.customPrice !== "" &&
        body.customPrice !== undefined &&
        body.customPrice !== null
            ? Number(body.customPrice)
            : null;

    const tempTask = {
        category: template.category || body.category,
        unit: body.unit || template.unit || "stk",
        durationPerUnit: Number(body.durationPerUnit ?? template.durationPerUnit ?? 0),
        frequency: body.frequency || template.frequency || null,
        days: (() => {
            if (!body.days) return template.days ?? [];
            if (Array.isArray(body.days)) return body.days;
            return [body.days];
        })(),
        amount: Number(body.amount ?? template.amount ?? 0),
        quantity: Number(body.quantity ?? template.quantity ?? 1),
        customPrice: customPriceNum
    };

    const { monthlyPrice, pricePerTime } = calculateTaskPrice(tempTask, hourlyRate);

    //  1) Hvis månedlig pris findes → brug den
    if (monthlyPrice > 0) {
        return monthlyPrice;
    }

    // 2) Ellers → pris pr gang (varighed × mængde × timepris)
    if (pricePerTime > 0) {
        return pricePerTime;
    }

    // 3) Ellers → brug customPrice
    return customPriceNum ?? 0;
}


async function deleteTask(taskId) {
    const deletedTask = await cleaningTaskService.deleteCleaningTask(taskId);

    const plan = await cleaningPlanService.findCleaningPlanById(deletedTask.planId);
    const tasks = await cleaningTaskService.listCleaningTasks(deletedTask.planId);

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = t.toObject();
        const prices = calculateTaskPrice(plain, hourlyRate);
        return { ...plain, ...prices };
    });

    // RETTET: brug både monthlyPrice OG pricePerTime
    const monthlyTotal = enrichedTasks.reduce((sum, t) => {
        const prices = calculateTaskPrice(t, hourlyRate);
        const price =
            prices.monthlyPrice > 0
                ? prices.monthlyPrice
                : prices.pricePerTime > 0
                    ? prices.pricePerTime
                    : 0;
        return sum + price;
    }, 0);


    const yearlyTotal = monthlyTotal * 12;

    return {
        planId: deletedTask.planId,
        tasks: enrichedTasks,
        monthlyTotal,
        yearlyTotal
    };
}


async function listTasks(planId) {
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningTaskService.listCleaningTasks(planId);

    const hourlyRate = plan.hourlyRate;

    // Samme enrich som step4Offer
    const enrichedTasks = tasks.map(t => {
        const plain = t.toObject();
        const prices = calculateTaskPrice(plain, hourlyRate);
        return { ...plain, ...prices };
    });

    // RETTET: brug både monthlyPrice OG pricePerTime
    const monthlyTotal = enrichedTasks.reduce((sum, t) => {
        const price =
            t.monthlyPrice > 0
                ? t.monthlyPrice
                : t.pricePerTime > 0
                    ? t.pricePerTime
                    : 0;
        return sum + price;
    }, 0);


    return {
        planId,
        tasks: enrichedTasks,
        monthlyTotal,                 // nu 10.250 kr
        yearlyTotal: monthlyTotal * 12
    };
}



async function getOfferStep4ViewModel(planId) {
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningPlanService.getTasksForPlan(planId);
    const systemSettings = await systemSettingsService.getSettings();

    const hourlyRate = plan.hourlyRate;

    // Enrich tasks
    const enrichedTasks = tasks.map(t => {
        const plain = typeof t.toObject === "function" ? t.toObject() : t;
        const prices = calculateTaskPrice(plain, hourlyRate);

        return {
            ...plain,
            ...prices
        };
    });

    // ⭐ Brug både monthlyPrice OG pricePerTime
    const subtotal = enrichedTasks.reduce((sum, t) => {
        const price =
            t.monthlyPrice > 0
                ? t.monthlyPrice
                : t.pricePerTime > 0
                    ? t.pricePerTime
                    : 0;
        return sum + price;
    }, 0);


    const discountPercent = plan.discountPercent || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;

    const environmentalFeePercent = systemSettings.environmentalFee || 0;
    const environmentalFeeAmount = afterDiscount * (environmentalFeePercent / 100);

    const total = afterDiscount + environmentalFeeAmount;

    return {
        planId,
        tasks: enrichedTasks,
        discountPercent,
        environmentalFee: environmentalFeePercent,
        subtotal,
        monthlyTotal: subtotal,
        discountAmount,
        environmentalFeeAmount,
        total,
        paymentTerms: plan.paymentTerms || paymentTerms.netto14
    };
}


async function getOfferPreview(planId, discountPercent, environmentalFee) {
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningPlanService.getTasksForPlan(planId);

    const hourlyRate = plan.hourlyRate;

    const enrichedTasks = tasks.map(t => {
        const plain = typeof t.toObject === "function" ? t.toObject() : t;
        const prices = calculateTaskPrice(plain, hourlyRate);

        return {
            ...plain,
            ...prices,
            totalPrice: prices.monthlyPrice > 0 ? prices.monthlyPrice : prices.pricePerTime
        };
    });

    // Beregn subtotal baseret på totalPrice
    const subtotal = enrichedTasks.reduce((sum, t) => {
        return sum + t.totalPrice;
    }, 0);

    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;

    const environmentalFeeAmount = afterDiscount * (environmentalFee / 100);

    const total = afterDiscount + environmentalFeeAmount;

    return total;
}


async function updateDailyBundle(planId, body) {

    const roomName = body.roomName;
    const amount = Number(body.amount);

    // Bemærkninger for rummet
    const notesRaw = body.roomNotes || "";
    const notesArray = notesRaw
        .split("\n")
        .map(n => n.trim())
        .filter(n => n.length > 0);

    // Hent planen
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const hourlyRate = plan.hourlyRate;

    // Opdater roomNotes
    const filtered = plan.roomNotes.filter(r => r.roomName !== roomName);
    filtered.push({ roomName, notes: notesArray });
    await cleaningPlanService.updateCleaningPlan(planId, { roomNotes: filtered });

    // Hent SDS-opgaver for rummet
    const sdsTasks = await cleaningTaskService.findSdsTasksForRoom(planId, roomName);

    // Fælles felter
    const frequency = body.frequency || frequencies.weekly;

    const daysNormalized = (() => {
        if (!body.days) return [];
        if (Array.isArray(body.days)) return body.days;
        return [body.days];
    })();

    for (const task of sdsTasks) {

        // Individuelle felter (MATCHER EJS)
        const durationPerUnit = Number(body[`duration_${task._id}`] ?? task.durationPerUnit);
        const customPrice = body[`custom_${task._id}`] ? Number(body[`custom_${task._id}`]) : null;
        const description = body[`description_${task._id}`] || "";

        // Saml opdateret task
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

        // Beregn priser
        const prices = calculateTaskPrice(updatedTask, hourlyRate);

        // Gem task
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

    // Recalculate plan total
    await cleaningPlanService.recalculatePlanTotal(planId);

    return true;
}


async function createDailyBundle(planId, body) {

    const roomName = body.roomName;

    const amount = Number(body.amount);

    // Bemærkninger for rummet
    const notesRaw = body.roomNotes || "";
    const notesArray = notesRaw
        .split("\n")
        .map(n => n.trim())
        .filter(n => n.length > 0);

// Hent planen
    const plan = await cleaningPlanService.findCleaningPlanById(planId);

// Fjern gamle bemærkninger for rummet
    const filtered = plan.roomNotes.filter(r => r.roomName !== roomName);

// Tilføj nye bemærkninger
    filtered.push({
        roomName,
        notes: notesArray
    });

// Gem via repo
    await cleaningPlanService.updateCleaningPlan(planId, { roomNotes: filtered });

    // Hent dage pr kategori
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

    // Opret Soignering
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

    // Opret Gulv
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

    // Opret Inventar
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

        // Kun bundle-opgaver har rum
        if (!t.roomName || t.roomName.trim() === "") {
            continue; // skip tasks uden lokale
        }

        if (!rooms[t.roomName]) {
            rooms[t.roomName] = { sds: [], other: [] };
        }

        // SDS-opgaver (daily, floor, inventory)
        if (["daily", "floor", "inventory"].includes(t.category)) {
            rooms[t.roomName].sds.push(t);
        } else {
            rooms[t.roomName].other.push(t);
        }
    }

    // Beregn programkode KUN for SDS-opgaver
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
    previewNewTaskPrice
};
