const cleaningTaskService = require('../services/cleaningTaskService');
const cleaningPlanService = require('../services/cleaningPlanService');
const { days, daysLabels } = require("../utils/dayEnum");
const { frequencies, frequencyLabels } = require("../utils/frequencyEnum");
const { units, unitsLabels } = require("../utils/unitEnum");
const { categoryLabels } = require("../utils/categoryEnum");

async function editCleaningTask(req, res, next) {
    try {
        const { planId, taskId } = req.params;

        const task = await cleaningTaskService.findCleaningTaskById(taskId);
        const hourlyRate = await cleaningTaskService.getHourlyRateForPlan(planId);

        return res.render("newPlan/partials/tasks/editTask", {
            planId,
            task,
            hourlyRate,
            days,
            daysLabels,
            frequencies,
            frequencyLabels,
            units,
            unitsLabels,
            categoryLabels
        });

    } catch (error) {
        next(error);
    }
}

async function createCleaningTask(req, res, next) {
    try {
        const { planId } = req.params;
        const data = req.body;

        const savedTask = await cleaningTaskService.createCleaningTask(planId, data);

        return res.status(201).json({
            success: true,
            message: 'Rengøringsopgave tilføjet til planen',
            task: savedTask
        });
    } catch (error) {
        next(error);
    }
}

async function listCleaningTasks(req, res, next) {
    try {
        const { planId } = req.params;

        const plan = await cleaningPlanService.findCleaningPlanById(planId);
        const hourlyRate = plan.hourlyRate;

        const tasks = await cleaningTaskService.listCleaningTasks(planId);

        const enrichedTasks = tasks.map(t => {
            const plain = t.toObject();
            const prices = cleaningTaskService.calculateCleaningTaskPrices(plain, hourlyRate);
            return { ...plain, ...prices };
        });

        return res.render("cleaningTasks/list", {
            planId,
            tasks: enrichedTasks,
            frequencyLabels,
            unitsLabels,
            categoryLabels
        });
    } catch (error) {
        next(error);
    }
}


async function findCleaningTaskById(req, res, next) {
    try {
        const { taskId } = req.params;

        const task = await cleaningTaskService.findCleaningTaskById(taskId);

        return res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        next(error);
    }
}

async function updateCleaningTask(req, res, next) {
    try {
        const { taskId } = req.params;
        const update = req.body;

        const updatedTask = await cleaningTaskService.updateCleaningTask(taskId, update);

        return res.status(200).json({
            success: true,
            updatedTask
        });
    } catch (error) {
        next(error);
    }
}

async function deleteCleaningTask(req, res, next) {
    try {
        const { taskId } = req.params;

        await cleaningTaskService.deleteCleaningTask(taskId);

        return res.status(200).json({
            success: true,
            message: 'Rengøringsopgave deaktiveret'
        });
    } catch (error) {
        next(error);
    }
}

async function reactivateCleaningTask(req, res, next) {
    try {
        const { taskId } = req.params;

        const reactivated = await cleaningTaskService.reactivateCleaningTask(taskId);

        return res.status(200).json({
            success: true,
            reactivated
        });
    } catch (error) {
        next(error);
    }
}

async function getDeletedCleaningTasks(req, res, next) {
    try {
        const { planId } = req.params;

        const deletedTasks = await cleaningTaskService.getDeletedCleaningTasks(planId);

        return res.status(200).json({
            success: true,
            deletedTasks
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCleaningTask,
    listCleaningTasks,
    findCleaningTaskById,
    updateCleaningTask,
    deleteCleaningTask,
    editCleaningTask,
    reactivateCleaningTask,
    getDeletedCleaningTasks,
};
