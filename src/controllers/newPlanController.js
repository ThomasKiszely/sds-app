const newPlanService = require("../services/newPlanService");
const cleaningTaskService = require("../services/cleaningTaskService");
const cleaningPlanService = require("../services/cleaningPlanService");
const customerService = require("../services/customerService");
const locationService = require("../services/locationService");
const cleaningTaskTemplateService = require("../services/cleaningTaskTemplateService");
const offerService = require("../services/offerService");

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

    const rawTasks = await cleaningPlanService.getTasksForPlan(planId);

    const hourlyRate = plan.hourlyRate;

    const tasks = rawTasks.map(t => {
        const plain = t.toObject();
        const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
        return { ...plain, ...prices };
    });

    const grouped = newPlanService.groupTasksByRoom(tasks);

    return res.render("newPlan/partials/tasks/daily", {
        plan,
        templates,
        tasks,
        grouped,
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

    const rawTasks = await cleaningPlanService.getTasksForPlan(planId);
    const tasks = rawTasks.filter(t => t.category === categoryTypes.extra);

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

    const rawTasks = await cleaningPlanService.getTasksForPlan(planId);
    const tasks = rawTasks.filter(t => t.category === categoryTypes.consumables);

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

    const rawTasks = await cleaningPlanService.getTasksForPlan(planId);
    const tasks = rawTasks.filter(t => t.category === categoryTypes.windows);

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

        const grouped = newPlanService.groupTasksByRoom(vm.tasks);

        return res.render("newPlan/partials/tasks/taskList", {
            ...vm,
            grouped,
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

        const grouped = newPlanService.groupTasksByRoom(vm.tasks);

        return res.render("newPlan/partials/tasks/taskList", {
            ...vm,
            grouped,
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

    const grouped = newPlanService.groupTasksByRoom(vm.tasks);

    return res.render("newPlan/partials/tasks/taskList", {
        ...vm,
        grouped,
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

    const grouped = newPlanService.groupTasksByRoom(vm.tasks);

    const consumables = vm.tasks.filter(t => t.category === categoryTypes.consumables);
    const normalTasks = vm.tasks.filter(t => t.category !== categoryTypes.consumables);

    res.render("newPlan/step4_offer", {
        ...vm,
        tasks: normalTasks,
        consumables,
        grouped,
        frequencyLabels,
        units,
        unitsLabels,
        categoryLabels
    });
}


async function tasks_updateDailyBundle(req, res) {
    try {
        const planId = req.body.planId;

        await newPlanService.updateDailyBundle(planId, req.body);

        const plan = await cleaningPlanService.findCleaningPlanById(planId);
        const templates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.daily);

        const rawTasks = await cleaningPlanService.getTasksForPlan(planId);
        const hourlyRate = plan.hourlyRate;

        const tasks = rawTasks.map(t => {
            const plain = t.toObject();
            const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
            return { ...plain, ...prices };
        });

        const grouped = newPlanService.groupTasksByRoom(tasks);

        return res.render("newPlan/partials/tasks/daily", {
            plan,
            templates,
            tasks,
            grouped,   // ⭐ VIGTIGT
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
        const roomName = req.query.roomName;   // ⭐ VIGTIGT: vi skal vide hvilket rum der redigeres

        if (!roomName) {
            res.setHeader("HX-Trigger", JSON.stringify({ toast: "Rum-navn mangler" }));
            return res.status(400).end();
        }

        // ⭐ Find SDS-opgaver for dette rum (robust)
        const sdsTasks = await cleaningTaskService.findSdsTasksForRoom(planId, roomName);

        if (sdsTasks.length !== 3) {
            res.setHeader("HX-Trigger", JSON.stringify({ toast: "Bundle mangler opgaver" }));
            return res.status(400).end();
        }

        // ⭐ Sortér dem efter kategori, så rækkefølgen er stabil
        const sorted = sdsTasks.sort((a, b) => a.category.localeCompare(b.category));

        return res.render("newPlan/partials/tasks/editDailyBundle", {
            planId,
            roomName,
            tasks: sorted,
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

        // ⭐ Find alle templates for SDS-kategorier
        const dailyTemplates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.daily);
        const floorTemplates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.floor);
        const inventoryTemplates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.inventory);

        // ⭐ Find præcis én template pr kategori (robust)
        const soigneringTemplate = dailyTemplates[0];
        const gulvTemplate       = floorTemplates[0];
        const inventarTemplate   = inventoryTemplates[0];

        if (!soigneringTemplate || !gulvTemplate || !inventarTemplate) {
            res.setHeader("HX-Trigger", JSON.stringify({ toast: "Mangler SDS-skabeloner" }));
            return res.status(400).end();
        }

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

        // ⭐ Opret SDS-bundle via service (robust)
        await newPlanService.createDailyBundle(planId, req.body);

        // ⭐ Hent plan + tasks til visning
        const plan = await cleaningPlanService.findCleaningPlanById(planId);
        const templates = await cleaningTaskTemplateService.getTemplatesByCategory(categoryTypes.daily);

        const rawTasks = await cleaningPlanService.getTasksForPlan(planId);
        const hourlyRate = plan.hourlyRate;

        const tasks = rawTasks.map(t => {
            const plain = t.toObject();
            const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
            return { ...plain, ...prices };
        });

        const grouped = newPlanService.groupTasksByRoom(tasks);

        return res.render("newPlan/partials/tasks/daily", {
            plan,
            templates,
            tasks,
            grouped,   // ⭐ VIGTIGT
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
