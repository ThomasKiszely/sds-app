const cleaningPlanService = require('../services/cleaningPlanService');

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
        const cleaningPlan = await cleaningPlanService.findCleaningPlanById(req.params.id);
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
        const updated = await cleaningPlanService.updateCleaningPlan(req.params.id, req.body);
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
        await cleaningPlanService.deleteCleaningPlan(req.params.id);
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
        const deletedPlans = await cleaningPlanService.getDeletedPlans(req.params.id);
        return res.status(200).json({
            status: 'success',
            deletedPlans
        });
    } catch (error) {
        next(error);
    }
}

async function reActivateCleaningPlan(req, res, next) {
    try {
        const reactivated = await cleaningPlanService.reactivateCleaningPlan(req.params.id);
        return res.status(200).json({
            status: 'success',
            message: 'Rengøringsplan genaktiveret',
            reactivated
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCleaningPlan,
    listCleaningPlans,
    findCleaningPlanById,
    updateCleaningPlan,
    getDeletedCleaningPlans,
    reActivateCleaningPlan,
    deleteCleaningPlan,
};
