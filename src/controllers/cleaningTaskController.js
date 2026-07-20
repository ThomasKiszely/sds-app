const cleaningTaskService = require('../services/cleaningTaskService');

async function createCleaningTask(req, res, next) {
    try{
        const cleaningTask = req.body;
        const savedTask = await cleaningTaskService.createCleaningTask(cleaningTask);

        return res.status(201).json({
            success: true,
            message: 'Rengøringsopgave oprettet',
            savedTask
        });
    } catch (error) {
        next(error);
    }
}

async function listCleaningTasks(req, res, next) {
    try{
        const cleaningTasks = await cleaningTaskService.listCleaningTasks();
        return res.status(200).json({
            success: true,
            cleaningTasks
        });
    } catch (error) {
        next(error);
    }
}

async function findCleaningTaskById(req, res, next) {
    try{
        const { id } = req.params;
        const cleaningTask = cleaningTaskService.findCleaningTaskById(id);
        return res.status(200).json({
            success: true,
            cleaningTask
        });
    } catch (error) {
        next(error);
    }
}

async function updateCleaningTask(req, res, next) {
    try{
        const { id } = req.params;
        const update = req.body;
        const updatedTask = await cleaningTaskService.updateCleaningTask(id, update);
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
        const { id } = req.params;
        const deleted = await cleaningTaskService.deleteCleaningTask(id);
        return res.status(200).json({
            success: true,
            deleted
        });
    } catch (error) {
        next(error);
    }
}

async function reactivateCleaningTask(req, res, next) {
    try{
        const { id } = req.params;
        const reactivated = await cleaningTaskService.reactivateCleaningTask(id);
        return res.status(200).json({
            success: true,
            reactivated
        });
    } catch (error) {
        next(error);
    }
}

async function getDeletedCleaningTasks(req, res, next) {
    try{
        const deletedCleaningTasks = await cleaningTaskService.getDeletedCleaningTasks();
        return res.status(200).json({
            success: true,
            deletedCleaningTasks
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
}