const cleaningPlanService = require("../services/cleaningPlanService");
const customerService = require("../services/customerService");
const offerService = require("../services/offerService");
const cleaningTaskTemplateService = require("../services/cleaningTaskTemplateService");
const cleaningTaskService = require("../services/cleaningTaskService");
const systemSettingsService = require("../services/systemSettingsService");
const locationService = require("../services/locationService");

const { categoryTypes, categoryLabels } = require("../utils/categoryEnum");
const { days, daysLabels } = require("../utils/dayEnum");
const { frequencies, frequencyMultipliers, frequencyLabels } = require("../utils/frequencyEnum");
const { units, unitsLabels } = require("../utils/unitEnum");
const { calculateTaskTotalPrice } = require("../utils/priceUtil");


async function step1_customer(req, res) {
    res.render("newPlan/step1_customer", { user: req.session.user });
}


// Kundeliste (HTMX partial)
async function customerList(req, res) {
    const result = await customerService.listCustomers();
    res.render("newPlan/partials/customerList", { customers: result.customers });
}


// Vælg lokation
async function locationList(req, res, next) {
    try {
        const customerId = req.query.customerId;
        const locations = await locationService.getLocationsForCustomer(customerId);

        return res.render("newPlan/locationList", {
            customerId,
            locations,
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
}

async function step2_plan(req, res) {
    const customerId = req.query.customerId;
    const locationId = req.query.locationId;
    const planId = req.query.planId;

    // Hvis vi kommer fra "rediger plan" eller step3
    if (planId) {
        const plan = await cleaningPlanService.findCleaningPlanById(planId);

        return res.render("newPlan/step2_plan", {
            customerId: plan.customerId,
            locationId: plan.locationId,
            planId: plan._id,
            planName: plan.name
        });
    }

    // Hvis vi kommer fra "opret kunde" og der ikke er valgt lokation endnu
    if (!locationId) {
        return res.render("newPlan/locationList", {
            customerId,
            locations: await locationService.getLocationsForCustomer(customerId),
            user: req.session.user
        });
    }

    // Ellers er det en ny plan
    return res.render("newPlan/step2_plan", {
        customerId,
        locationId,
        planId: null,
        planName: null
    });
}



async function savePlan(req, res) {
    try {
        const customerId = req.body.customerId;
        const locationId = req.body.locationId;

        // Hent kunde og lokation
        const customer = await customerService.getCustomerById(customerId);
        const location = await locationService.getLocationById(locationId);

        const userName = req.body.name?.trim();          // Navn fra UI
        const locationName = location?.name?.trim();     // Lokationsnavn (valgfri)

        // Hent eksisterende planer for lokationen (til løbenummer)
        const existingPlans = await cleaningPlanService.getPlansForLocation(locationId);
        const count = existingPlans.length + 1;

        // Auto-navn hvis brugeren ikke skriver noget
        const defaultName = locationName
            ? `${customer.customerName} – ${locationName} – Rengøringsplan – #${count}`
            : `${customer.customerName} – Rengøringsplan – #${count}`;

        // Kombineret navn (professionelt)
        const name = userName
            ? (locationName
                ? `${customer.customerName} – ${locationName} – ${userName} – #${count}`
                : `${customer.customerName} – ${userName} – #${count}`)
            : defaultName;

        // Beskrivelse fra UI
        const description = req.body.description?.trim() || "";

        // Hent systemets timepris
        const systemSettings = await systemSettingsService.getSettings();

        // Opret plan
        const plan = await cleaningPlanService.createCleaningPlan({
            customerId,
            locationId,
            name,
            description,
            hourlyRate: systemSettings.hourlyRate
        });

        // Gå direkte til opgavevalg
        return res.render("newPlan/partials/tasks", {
            planId: plan._id,
            locationId: plan.locationId
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
        return res.status(500).end();
    }
}


async function step3_tasks(req, res) {
    const planId = req.query.planId;
    const plan = await cleaningPlanService.findCleaningPlanById(planId);

    if (!req.headers['hx-request']) {
        return res.render("index", {
            user: req.session.user,
            loadMe: false
        });
    }

    res.render("newPlan/partials/tasks", {
        planId,
        customerId: plan.customerId
    });
}


// Daglige opgaver
async function tasks_daily(req, res) {
    try {
        const planId = req.query.planId;

        const plan = await cleaningPlanService.findCleaningPlanById(planId);
        const templates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.daily);
        const tasks = await cleaningPlanService.getTasksForPlan(planId);

        return res.render("newPlan/partials/tasks/daily", {
            plan,
            templates,
            tasks,
            units,
            unitsLabels,
            categoryLabels,
            categoryTypes,
            daysLabels,
            frequencyLabels,
            customerId: plan.customerId
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
        return res.status(500).end();
    }
}

async function tasks_add(req, res) {
    try {
        const planId = req.body.planId;
        const templateId = req.body.templateId;

        const template = await cleaningTaskTemplateService.findTemplateById(templateId);

        const task = await cleaningTaskService.createCleaningTask(planId, {
            templateId,
            name: template.name,
            description: template.description,   // ← NYT
            frequency: frequencies.weekly,
            amount: 0,
            quantity: 1
        });

        return res.render("newPlan/partials/tasks/editTask", {
            task,
            days,
            daysLabels,
            frequencies,
            frequencyLabels,
            units,
            unitsLabels,
            categoryLabels,
            categoryTypes
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
        return res.status(500).end();
    }
}

async function tasks_edit(req, res) {
    try {
        const { taskId } = req.params;

        const task = await cleaningTaskService.findCleaningTaskById(taskId);

        return res.render("newPlan/partials/tasks/editTask", {
            task,
            days,
            daysLabels,
            frequencies,
            frequencyLabels,
            units,
            unitsLabels,
            categoryLabels,
            categoryTypes
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
        return res.status(500).end();
    }
}

async function tasks_update(req, res) {
    try {
        const { taskId } = req.params;

        // Opdater opgaven
        const updatedTask = await cleaningTaskService.updateCleaningTask(taskId, req.body);

        // Hent plan og tasks
        const plan = await cleaningPlanService.findCleaningPlanById(updatedTask.planId);
        const tasks = await cleaningTaskService.listCleaningTasks(updatedTask.planId);

        const hourlyRate = plan.hourlyRate;

        // Enrich tasks med pris, varighed, mængde osv.
        const enrichedTasks = tasks.map(t => {
            const prices = cleaningTaskService.calculateCleaningTaskPrices(t, hourlyRate);
            return { ...t, ...prices };
        });

        // Beregn totaler
        const monthlyTotal = enrichedTasks.reduce((sum, t) => sum + t.monthlyPrice, 0);
        const yearlyTotal = monthlyTotal * 12;

        // Render taskList
        return res.render("newPlan/partials/tasks/taskList", {
            planId: updatedTask.planId,
            tasks: enrichedTasks,
            monthlyTotal,
            yearlyTotal,
            units,
            unitsLabels,
            categoryLabels,
            categoryTypes,
            daysLabels,
            frequencyLabels,
            frequencyMultipliers
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
        return res.status(500).end();
    }
}


async function step4_offer(req, res) {
    const planId = req.query.planId;

    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningPlanService.getTasksForPlan(planId);
    const systemSettings = await systemSettingsService.getSettings();

    const discountPercent = 0;
    const environmentalFee = systemSettings.environmentalFee;

    // Brug fælles beregningsmetode
    const totals = offerService.calculateOfferTotals(
        tasks,
        discountPercent,
        environmentalFee
    );

    res.render("newPlan/step4_offer", {
        planId,
        tasks,

        discountPercent,
        environmentalFee,

        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        environmentalFeeAmount: totals.environmentalFeeAmount,
        total: totals.total
    });
}


async function previewOffer(req, res) {
    const planId = req.body.planId;

    const discountPercent = Number(req.body.discountPercent || 0);
    const environmentalFee = Number(req.body.environmentalFee || 0);

    const tasks = await cleaningPlanService.getTasksForPlan(planId);

    const totals = offerService.calculateOfferTotals(
        tasks,
        discountPercent,
        environmentalFee
    );

    return res.send(`${totals.total.toFixed(2)} kr.`);
}


async function saveOffer(req, res) {
    const offer = await offerService.createOffer(
        req.body.planId,
        {
            discountPercent: Number(req.body.discountPercent),
            environmentalFee: Number(req.body.environmentalFee)
        }
    );

    res.redirect(`/offers/${offer._id}/view`);
}

//Preview
async function tasks_preview(req, res) {
    try {
        const { taskId } = req.params;

        const task = await cleaningTaskService.findCleaningTaskById(taskId);

        const hourlyRate = await cleaningTaskService.getHourlyRateForPlan(task.planId);

        const frequency = req.body.frequency ?? task.frequency;
        const amount = Number(req.body.amount ?? task.amount);
        const quantity = Number(req.body.quantity ?? task.quantity);
        const description = req.body.description ?? task.description;

        // Normaliser days
        const days = (() => {
            if (!req.body.days) return task.days;
            if (Array.isArray(req.body.days)) return req.body.days;
            return [req.body.days];
        })();

        // NYT: durationPerUnit
        const durationPerUnit = Number(req.body.durationPerUnit ?? task.durationPerUnit);

        // Beregn varighed pr gang
        let totalDuration = durationPerUnit;

        if (task.unit === "stk") {
            totalDuration = durationPerUnit * quantity;
        } else if (task.unit === "m2" || task.unit === "lbm") {
            totalDuration = durationPerUnit * amount;
        }

        // Pris pr gang
        const pricePerTime = (totalDuration / 60) * hourlyRate;

        // Pris pr måned
        const multiplier = frequencyMultipliers[frequency] ?? 1;
        const totalPrice = pricePerTime * multiplier;

        return res.send(`${Math.round(totalPrice)} kr.`);

    } catch (error) {
        console.log("Preview error:", error);
        return res.send("Fejl");
    }
}


async function tasks_extra(req, res) {
    const planId = req.query.planId;
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const templates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.extra);
    const tasks = await cleaningPlanService.getTasksForPlan(planId);

    return res.render("newPlan/partials/tasks/extra", {
        plan,
        templates,
        tasks,
        units,
        unitsLabels,
        categoryLabels,
        categoryTypes,
        daysLabels,
        frequencyLabels,
        customerId: plan.customerId
    });

}

async function tasks_consumables(req, res) {
    const planId = req.query.planId;
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const templates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.consumables);
    const tasks = await cleaningPlanService.getTasksForPlan(planId);

    return res.render("newPlan/partials/tasks/consumables", {
        plan,
        templates,
        tasks,
        units,
        unitsLabels,
        categoryLabels,
        categoryTypes,
        daysLabels,
        frequencyLabels,
        customerId: plan.customerId
    });

}

async function tasks_windows(req, res) {
    const planId = req.query.planId;
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const templates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.windows);
    const tasks = await cleaningPlanService.getTasksForPlan(planId);

    return res.render("newPlan/partials/tasks/windows", {
        plan,
        templates,
        tasks,
        units,
        unitsLabels,
        categoryLabels,
        categoryTypes,
        daysLabels,
        frequencyLabels,
        customerId: plan.customerId
    });
}

async function tasks_delete(req, res) {
    try {
        const { taskId } = req.params;

        // Soft delete
        const deletedTask = await cleaningTaskService.deleteCleaningTask(taskId);

        // Hent plan og tasks
        const plan = await cleaningPlanService.findCleaningPlanById(deletedTask.planId);
        const tasks = await cleaningTaskService.listCleaningTasks(deletedTask.planId);

        const hourlyRate = plan.hourlyRate;

        // Enrich tasks
        const enrichedTasks = tasks.map(t => {
            const prices = cleaningTaskService.calculateCleaningTaskPrices(t, hourlyRate);
            return { ...t, ...prices };
        });

        // Beregn totaler
        const monthlyTotal = enrichedTasks.reduce((sum, t) => sum + t.monthlyPrice, 0);
        const yearlyTotal = monthlyTotal * 12;

        // Render taskList
        return res.render("newPlan/partials/tasks/taskList", {
            planId: deletedTask.planId,
            tasks: enrichedTasks,
            monthlyTotal,
            yearlyTotal,
            units,
            unitsLabels,
            categoryLabels,
            categoryTypes,
            daysLabels,
            frequencyLabels,
            frequencyMultipliers
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
        return res.status(500).end();
    }
}



async function tasks_list(req, res) {
    const planId = req.query.planId;

    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningTaskService.listCleaningTasks(planId);

    const hourlyRate = plan.hourlyRate;

    // Enrich tasks
    const enrichedTasks = tasks.map(t => {
        const prices = cleaningTaskService.calculateCleaningTaskPrices(t, hourlyRate);
        return { ...t, ...prices };
    });

    // Beregn totaler
    const monthlyTotal = enrichedTasks.reduce((sum, t) => sum + t.monthlyPrice, 0);
    const yearlyTotal = monthlyTotal * 12;

    // Render taskList
    return res.render("newPlan/partials/tasks/taskList", {
        planId,
        tasks: enrichedTasks,
        monthlyTotal,
        yearlyTotal,
        units,
        unitsLabels,
        categoryLabels,
        categoryTypes,
        daysLabels,
        frequencyLabels,
        frequencyMultipliers
    });
}


module.exports = {
    step1_customer,
    customerList,
    locationList,
    step2_plan,
    savePlan,
    step3_tasks,
    tasks_daily,
    tasks_add,
    tasks_edit,
    tasks_update,
    step4_offer,
    saveOffer,
    tasks_preview,
    tasks_extra,
    tasks_consumables,
    tasks_windows,
    tasks_delete,
    tasks_list,
    previewOffer
};
