const cleaningPlanService = require('../services/cleaningPlanService');
const cleaningTaskService = require('../services/cleaningTaskService');
const locationService = require('../services/locationService');
const customerService = require('../services/customerService');
const { groupSdsTasksByRoom } = require('../utils/groupedUtil');

async function createCleaningPlan(req, res, next) {
    try {
        const created = await cleaningPlanService.createCleaningPlan(req.body);

        return res.status(201).json({
            status: 'success',
            message: 'Rengøringsplan oprettet',
            created
        });
    } catch (error) {
        next(error);
    }
}

async function listCleaningPlans(req, res, next) {
    try {
        const cleaningPlans = await cleaningPlanService.listCleaningPlans();

        return res.status(200).json({
            status: 'success',
            cleaningPlans
        });
    } catch (error) {
        next(error);
    }
}

async function findCleaningPlanById(req, res, next) {
    try {
        const { planId } = req.params;

        const cleaningPlan = await cleaningPlanService.findCleaningPlanById(planId);

        return res.status(200).json({
            status: 'success',
            cleaningPlan
        });
    } catch (error) {
        next(error);
    }
}

async function updateCleaningPlan(req, res, next) {
    try {
        const { planId } = req.params;

        const updated = await cleaningPlanService.updateCleaningPlan(planId, req.body);

        return res.status(200).json({
            status: 'success',
            message: 'Rengøringsplan opdateret',
            updated
        });
    } catch (error) {
        next(error);
    }
}

async function deleteCleaningPlan(req, res, next) {
    try {
        const { planId } = req.params;
        const { context, customerId } = req.query;

        await cleaningPlanService.deleteCleaningPlan(planId);

        if (context === "planView") {
            // Render plan-view igen
            const plan = await cleaningPlanService.findCleaningPlanById(planId);
            const tasks = await cleaningPlanService.getTasksForPlan(planId);

            const enrichedTasks = tasks.map(t => {
                const plain = t.toObject();
                const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, plan.hourlyRate);
                return { ...plain, ...prices };
            });

            return res.render("plans/view", {
                plan,
                tasks: enrichedTasks,
                user: req.session.user
            });
        }

        if (context === "customerPlans") {
            // Render kundens planliste igen
            const locations = await locationService.getLocationsForCustomer(customerId);

            const plans = [];
            for (const loc of locations) {
                const locPlans = await cleaningPlanService.getPlansForLocation(loc._id);
                plans.push(...locPlans.map(p => ({
                    ...p.toObject(),
                    location: loc
                })));
            }

            return res.render("customers/plans", {
                customerId,
                plans,
                user: req.session.user
            });
        }

        // fallback
        return res.status(200).json({ status: "success" });

    } catch (error) {
        next(error);
    }
}


async function getDeletedCleaningPlans(req, res, next) {
    try {
        const deletedPlans = await cleaningPlanService.listDeletedCleaningPlans();

        return res.status(200).json({
            status: 'success',
            deletedPlans
        });
    } catch (error) {
        next(error);
    }
}

async function reactivateCleaningPlan(req, res, next) {
    try {
        const { planId } = req.params;
        const { context, customerId } = req.query;

        await cleaningPlanService.reactivateCleaningPlan(planId);

        if (context === "planView") {
            // Render plan-view igen
            const plan = await cleaningPlanService.findCleaningPlanById(planId);
            const tasks = await cleaningPlanService.getTasksForPlan(planId);

            const enrichedTasks = tasks.map(t => {
                const plain = t.toObject();
                const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, plan.hourlyRate);
                return { ...plain, ...prices };
            });

            return res.render("plans/view", {
                plan,
                tasks: enrichedTasks,
                user: req.session.user
            });
        }

        if (context === "customerPlans") {
            // Render kundens planliste igen
            const locations = await locationService.getLocationsForCustomer(customerId);

            const plans = [];
            for (const loc of locations) {
                const locPlans = await cleaningPlanService.getPlansForLocation(loc._id);
                plans.push(...locPlans.map(p => ({
                    ...p.toObject(),
                    location: loc
                })));
            }

            return res.render("customers/plans", {
                customerId,
                plans,
                user: req.session.user
            });
        }

        // fallback
        return res.status(200).json({ status: "success" });

    } catch (error) {
        next(error);
    }
}


async function viewPlan(req, res, next) {
    try {
        const { planId } = req.params;

        // ⭐ Hent planen
        const plan = await cleaningPlanService.findCleaningPlanById(planId);
        if (!plan) return res.status(404).send("Plan ikke fundet");

        // ⭐ Hent tasks
        const tasks = await cleaningPlanService.getTasksForPlan(planId);

        // ⭐ Beregn priser
        const hourlyRate = plan.hourlyRate;
        const enrichedTasks = tasks.map(t => {
            const plain = t.toObject();
            const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
            return { ...plain, ...prices };
        });

        // ⭐ Gruppér rum (bundles)
        const grouped = groupSdsTasksByRoom(enrichedTasks);

// ⭐ Tilføj "other" så PDF ikke crasher
        for (const roomName of Object.keys(grouped)) {
            grouped[roomName].other = enrichedTasks.filter(t =>
                t.roomName === roomName &&
                ![
                    categoryTypes.daily,
                    categoryTypes.floor,
                    categoryTypes.inventory
                ].includes(t.category)
            );
        }

        // ⭐ Øvrige opgaver (uden programkode)
        const noRoomTasks = enrichedTasks.filter(t =>
            (!t.roomName || t.roomName.trim() === "") &&
            t.monthlyPrice > 0
        );

        const adHocTasks = enrichedTasks.filter(t =>
            t.monthlyPrice === 0 &&
            t.customPrice != null &&
            t.category !== "consumables"
        );

        const consumables = enrichedTasks.filter(t =>
            t.category === "consumables"
        );

        // ⭐ Kunde + adresse
        const customer = await customerService.getCustomerById(plan.customerId);
        const { street, zip, city } = require("../utils/addressUtil").parseAddress(customer.customerAddress);

        // ⭐ Labels til EJS
        const { daysLabels } = require("../utils/dayEnum");
        const { frequencyLabels } = require("../utils/frequencyEnum");

        // ⭐ Send ALT til view’et
        return res.render("plans/view", {
            plan,
            tasks: enrichedTasks,
            grouped,
            roomNotes: plan.roomNotes,
            noRoomTasks,
            adHocTasks,
            consumables,
            customer,
            street,
            zip,
            city,
            daysLabels,
            frequencyLabels,
            user: req.session.user
        });

    } catch (err) {
        next(err);
    }
}



module.exports = {
    createCleaningPlan,
    listCleaningPlans,
    findCleaningPlanById,
    updateCleaningPlan,
    deleteCleaningPlan,
    getDeletedCleaningPlans,
    reactivateCleaningPlan,
    viewPlan
};
