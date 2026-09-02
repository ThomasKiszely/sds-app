const cleaningPlanService = require('../services/cleaningPlanService');
const cleaningTaskService = require('../services/cleaningTaskService');
const locationService = require('../services/locationService');

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

        const plan = await cleaningPlanService.findCleaningPlanById(planId);
        const tasks = await cleaningPlanService.getTasksForPlan(planId);

        const hourlyRate = plan.hourlyRate;

        // Tilføj priser til tasks
        const enrichedTasks = tasks.map(t => {
            const plain = t.toObject();
            const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
            return { ...plain, ...prices };
        });

        return res.render('plans/view', {
            plan,
            tasks: enrichedTasks,
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
