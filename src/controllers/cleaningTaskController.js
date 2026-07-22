const cleaningTaskService = require('../services/cleaningTaskService');

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

        const tasks = await cleaningTaskService.listCleaningTasks(planId);

        return res.status(200).json({
            success: true,
            tasks
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
    reactivateCleaningTask,
    getDeletedCleaningTasks
};
