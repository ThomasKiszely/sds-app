const newPlanService = require("../services/newPlanService");

const cleaningPlanService = require("../services/cleaningPlanService");
const customerService = require("../services/customerService");
const locationService = require("../services/locationService");
const cleaningTaskTemplateService = require("../services/cleaningTaskTemplateService");

const { categoryTypes, categoryLabels } = require("../utils/categoryEnum");
const { days, daysLabels } = require("../utils/dayEnum");
const { frequencies, frequencyLabels } = require("../utils/frequencyEnum");
const { units, unitsLabels } = require("../utils/unitEnum");
const { frequencyMultipliers } = require("../utils/frequencyEnum");


// ------------------------------------------------------------
// STEP 1: Vælg kunde
// ------------------------------------------------------------
async function step1_customer(req, res) {
    res.render("newPlan/step1_customer", { user: req.session.user });
}

async function customerList(req, res) {
    const result = await customerService.listCustomers();
    res.render("newPlan/partials/customerList", { customers: result.customers });
}


// ------------------------------------------------------------
// STEP 2: Vælg lokation / opret plan
// ------------------------------------------------------------
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

    if (planId) {
        const plan = await cleaningPlanService.findCleaningPlanById(planId);

        return res.render("newPlan/step2_plan", {
            customerId: plan.customerId,
            locationId: plan.locationId,
            planId: plan._id,
            planName: plan.name
        });
    }

    if (!locationId) {
        return res.render("newPlan/locationList", {
            customerId,
            locations: await locationService.getLocationsForCustomer(customerId),
            user: req.session.user
        });
    }

    return res.render("newPlan/step2_plan", {
        customerId,
        locationId,
        planId: null,
        planName: null
    });
}

async function savePlan(req, res) {
    try {
        const plan = await newPlanService.createPlan({
            customerId: req.body.customerId,
            locationId: req.body.locationId,
            nameFromUI: req.body.name,
            description: req.body.description
        });

        return res.render("newPlan/partials/tasks", {
            planId: plan._id,
            locationId: plan.locationId
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
        return res.status(500).end();
    }
}


// ------------------------------------------------------------
// STEP 3: Opgaver
// ------------------------------------------------------------
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


// ------------------------------------------------------------
// TASKS: Daglig / Extra / Consumables / Windows
// ------------------------------------------------------------
async function tasks_daily(req, res) {
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


// ------------------------------------------------------------
// TASKS: Add / Edit / Update / Delete / Preview / List
// ------------------------------------------------------------
async function tasks_add(req, res) {
    try {
        const task = await newPlanService.addTaskFromTemplate(
            req.body.planId,
            req.body.templateId
        );

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
        const task = await newPlanService.getEditTaskViewModel(req.params.taskId);

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
        const vm = await newPlanService.updateTask(req.params.taskId, req.body);

        return res.render("newPlan/partials/tasks/taskList", {
            ...vm,
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

async function tasks_preview(req, res) {
    try {
        const price = await newPlanService.previewTaskPrice(req.params.taskId, req.body);
        return res.send(`${price} kr.`);
    } catch (error) {
        return res.send("Fejl");
    }
}

async function tasks_delete(req, res) {
    try {
        const vm = await newPlanService.deleteTask(req.params.taskId);

        return res.render("newPlan/partials/tasks/taskList", {
            ...vm,
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
    const vm = await newPlanService.listTasks(req.query.planId);

    return res.render("newPlan/partials/tasks/taskList", {
        ...vm,
        units,
        unitsLabels,
        categoryLabels,
        categoryTypes,
        daysLabels,
        frequencyLabels,
        frequencyMultipliers
    });
}


// ------------------------------------------------------------
// STEP 4: Tilbud
// ------------------------------------------------------------
async function step4_offer(req, res) {
    const vm = await newPlanService.getOfferStep4ViewModel(req.query.planId);
    res.render("newPlan/step4_offer", vm);
}

async function tasks_updateDailyBundle(req, res) {
    try {
        const planId = req.body.planId;

        // Én service-metode der opdaterer alle tre SDS-opgaver
        await newPlanService.updateDailyBundle(planId, req.body);

        // Når bundle er opdateret, viser vi daglige opgaver igen
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


async function previewOffer(req, res) {
    const total = await newPlanService.getOfferPreview(
        req.body.planId,
        Number(req.body.discountPercent || 0),
        Number(req.body.environmentalFee || 0)
    );

    return res.send(`${total.toFixed(2)} kr.`);
}

async function saveOffer(req, res) {
    const offer = await offerService.createOffer(
        req.body.planId,
        {
            discountPercent: Number(req.body.discountPercent),
            environmentalFeePercent: Number(req.body.environmentalFee)
        }
    );

    res.redirect(`/offers/${offer._id}/view`);
}

async function tasks_editDailyBundle(req, res) {
    try {
        const planId = req.query.planId;

        // Hent alle tasks for planen
        const tasks = await cleaningPlanService.getTasksForPlan(planId);

        // Find de tre SDS-opgaver
        const soignering = tasks.find(t => t.category === categoryTypes.daily && t.name.toLowerCase().includes("soignering"));
        const gulv = tasks.find(t => t.category === categoryTypes.daily && t.name.toLowerCase().includes("gulv"));
        const inventar = tasks.find(t => t.category === categoryTypes.daily && t.name.toLowerCase().includes("inventar"));

        if (!soignering || !gulv || !inventar) {
            res.setHeader("HX-Trigger", JSON.stringify({ toast: "Daglig bundle mangler opgaver" }));
            return res.status(400).end();
        }

        return res.render("newPlan/partials/tasks/editDailyBundle", {
            planId,
            tasks: [soignering, gulv, inventar],
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

async function tasks_createDailyBundle(req, res) {
    try {
        const planId = req.query.planId;

        const plan = await cleaningPlanService.findCleaningPlanById(planId);

        // HENT DAGLIGE TEMPLATES
        const templates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.daily);

        // FIND DE TRE SPECIFIKKE TEMPLATES
        const soigneringTemplate = templates.find(t => t.name.toLowerCase().includes("soignering"));
        const gulvTemplate = templates.find(t => t.name.toLowerCase().includes("gulv"));
        const inventarTemplate = templates.find(t => t.name.toLowerCase().includes("inventar"));

        return res.render("newPlan/partials/tasks/createDailyBundle", {
            plan,
            soigneringTemplate,
            gulvTemplate,
            inventarTemplate,
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


async function tasks_saveDailyBundle(req, res) {
    try {
        const planId = req.body.planId;

        // Opret de tre SDS-opgaver
        await newPlanService.createDailyBundle(planId, req.body);

        // Efter oprettelse viser vi daglige opgaver igen
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
    tasks_updateDailyBundle,
    previewOffer,
    tasks_editDailyBundle,
    tasks_createDailyBundle,
    tasks_saveDailyBundle,
};
