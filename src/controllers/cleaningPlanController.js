const cleaningPlanService = require('../services/cleaningPlanService');
const cleaningTaskService = require('../services/cleaningTaskService');

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

        await cleaningPlanService.deleteCleaningPlan(planId);

        return res.status(200).json({
            status: 'success',
            message: 'Rengøringsplan deaktiveret'
        });
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

        const reactivated = await cleaningPlanService.reactivateCleaningPlan(planId);

        return res.status(200).json({
            status: 'success',
            message: 'Rengøringsplan genaktiveret',
            reactivated
        });
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

        console.log("LOGGER HER: ", plan, tasks, hourlyRate);
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
