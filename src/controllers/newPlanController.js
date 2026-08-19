const cleaningPlanService = require("../services/cleaningPlanService");
const customerService = require("../services/customerService");
const offerService = require("../services/offerService");
const cleaningTaskTemplateService = require("../services/cleaningTaskTemplateService");
const cleaningTaskService = require("../services/cleaningTaskService");

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


// ---------------------------------------------------------
// STEP 2: Opret plan
// ---------------------------------------------------------
async function step2_plan(req, res) {
    const customerId = req.query.customerId;
    const planId = req.query.planId;

    // Hvis vi kommer fra Step 3, skal vi vise eksisterende plan
    if (planId) {
        const plan = await cleaningPlanService.findCleaningPlanById(planId);

        return res.render("newPlan/step2_plan", {
            customerId: plan.customerId,
            planId: plan._id,
            planName: plan.name
        });
    }

    // Ellers er det en ny plan
    res.render("newPlan/step2_plan", { customerId });
}




async function savePlan(req, res) {
    try {
        const customerId = req.body.customerId;

        const customer = await customerService.getCustomerById(customerId);
        const existingPlans = await cleaningPlanService.getPlansForCustomer(customerId);
        const count = existingPlans.length + 1;

        const name = `Rengøringsplan – ${customer.customerName} – ${new Date().toLocaleDateString("da-DK")} – #${count}`;

        const plan = await cleaningPlanService.createCleaningPlan({
            customerId,
            name,
            description: ""
        });

        return res.render("newPlan/partials/tasks", {
            planId: plan._id,
            customerId: plan.customerId
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

    res.render("newPlan/step4_offer", {
        planId,
        tasks,
        categoryLabels,
        frequencyLabels,
        unitsLabels,
        daysLabels,
        discountPercent: 0,
        environmentalFeePercent: 1
    });
}




async function saveOffer(req, res) {
    const offer = await offerService.createOffer(
        req.body.planId,
        {
            discountPercent: Number(req.body.discountPercent),
            environmentalFeePercent: Number(req.body.environmentalFeePercent)
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
    tasks_list
};
