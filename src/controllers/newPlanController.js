const cleaningPlanService = require("../services/cleaningPlanService");
const customerService = require("../services/customerService");
const offerService = require("../services/offerService");
const cleaningTaskTemplateService = require("../services/cleaningTaskTemplateService");
const cleaningTaskService = require("../services/cleaningTaskService");
const systemSettingsService = require("../services/systemSettingsService");
const locationService = require("../services/locationService");

const { categoryTypes, categoryLabels } = require("../utils/categoryEnum");
const { days, daysLabels } = require("../utils/dayEnum");
const { frequency, frequencyLabels } = require("../utils/frequencyEnum");
const { units, unitsLabels } = require("../utils/unitEnum");
const { calculateTaskTotalPrice } = require("../utils/priceUtil");


// ---------------------------------------------------------
// STEP 1: Vælg kunde
// ---------------------------------------------------------
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


// ---------------------------------------------------------
// STEP 2: Opret plan
// ---------------------------------------------------------
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

        // Hent kunde (kun for navngivning)
        const customer = await customerService.getCustomerById(customerId);

        // Hent eksisterende planer for lokationen
        const existingPlans = await cleaningPlanService.getPlansForLocation(locationId);
        const count = existingPlans.length + 1;

        // Generér navn
        const name = `Rengøringsplan – ${customer.customerName} – ${new Date().toLocaleDateString("da-DK")} – #${count}`;

        // Opret plan
        const plan = await cleaningPlanService.createCleaningPlan({
            customerId,
            locationId,
            name,
            description: ""
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



// ---------------------------------------------------------
// STEP 3: Tilføj opgaver
// ---------------------------------------------------------
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


// ---------------------------------------------------------
// TILFØJ OPERATION: Opret task → Redirect til editTask
// ---------------------------------------------------------
async function tasks_add(req, res) {
    try {
        const planId = req.body.planId;
        const templateId = req.body.templateId;

        const template = await cleaningTaskTemplateService.findTemplateById(templateId);

        const task = await cleaningTaskService.createCleaningTask(planId, {
            templateId,
            name: template.name,
            description: template.description,   // ← NYT
            frequency: frequency.weekly,
            amount: 0,
            quantity: 1
        });

        return res.render("newPlan/partials/tasks/editTask", {
            task,
            days,
            daysLabels,
            frequency,
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




// ---------------------------------------------------------
// EDIT TASK VIEW
// ---------------------------------------------------------
async function tasks_edit(req, res) {
    try {
        const { taskId } = req.params;

        const task = await cleaningTaskService.findCleaningTaskById(taskId);

        return res.render("newPlan/partials/tasks/editTask", {
            task,
            days,
            daysLabels,
            frequency,
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


// ---------------------------------------------------------
// UPDATE TASK (PATCH)
// ---------------------------------------------------------
async function tasks_update(req, res) {
    try {
        const { taskId } = req.params;

        const updatedTask = await cleaningTaskService.updateCleaningTask(taskId, req.body);

        // Efter opdatering → hent task-listen igen
        const tasks = await cleaningPlanService.getTasksForPlan(updatedTask.planId);
        const plan = await cleaningPlanService.findCleaningPlanById(updatedTask.planId);

        return res.render("newPlan/partials/tasks/taskList", {
            tasks,
            planTotal: plan.totalPrice,
            units,
            unitsLabels,
            categoryLabels,
            categoryTypes,
            daysLabels,
            frequencyLabels
        });



    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
        return res.status(500).end();
    }
}


// ---------------------------------------------------------
// STEP 4: Tilbud
// ---------------------------------------------------------
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

        const frequency = req.body.frequency ?? task.frequency;
        const amount = req.body.amount ?? task.amount;
        const quantity = req.body.quantity ?? task.quantity;
        const description = req.body.description ?? task.description;


        // Normaliser days (vigtigt!)
        const days = (() => {
            if (!req.body.days) return task.days;        // ingen ændring
            if (Array.isArray(req.body.days)) return req.body.days;
            return [req.body.days];                      // én dag valgt
        })();

        const totalPrice = calculateTaskTotalPrice({
            unit: task.unit,
            category: task.category,
            price: task.price,
            amount,
            quantity,
            frequency,
            days
        });

        return res.send(`${totalPrice} kr.`);

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

        // Soft delete i service
        const deletedTask = await cleaningTaskService.deleteCleaningTask(taskId);

        // Hent opdateret task‑liste
        const tasks = await cleaningPlanService.getTasksForPlan(deletedTask.planId);
        const plan = await cleaningPlanService.findCleaningPlanById(deletedTask.planId);

        return res.render("newPlan/partials/tasks/taskList", {
            tasks,
            planTotal: plan.totalPrice,
            units,
            unitsLabels,
            categoryLabels,
            categoryTypes,
            daysLabels,
            frequencyLabels
        });


    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
        return res.status(500).end();
    }
}

async function tasks_list(req, res) {
    const planId = req.query.planId;
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    const tasks = await cleaningPlanService.getTasksForPlan(planId);

    return res.render("newPlan/partials/tasks/taskList", {
        planId,
        tasks,
        planTotal: plan.totalPrice,
        units,
        unitsLabels,
        categoryLabels,
        categoryTypes,
        daysLabels,
        frequencyLabels
    });
}


// ---------------------------------------------------------
// EXPORT
// ---------------------------------------------------------
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
