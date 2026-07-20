const cleaningTaskTemplateService = require('../services/cleaningTaskTemplateService');

// Opret template (master-opgave)
async function createCleaningTaskTemplate(req, res, next) {
    try {
        const template = await cleaningTaskTemplateService.createTemplate(req.body);

        return res.status(201).json({
            success: true,
            message: 'Opgave-skabelon oprettet',
            template
        });
    } catch (error) {
        next(error);
    }
}

// List alle aktive templates
async function listCleaningTaskTemplates(req, res, next) {
    try {
        const templates = await cleaningTaskTemplateService.listTemplates();

        return res.status(200).json({
            success: true,
            templates
        });
    } catch (error) {
        next(error);
    }
}

// Hent én template
async function findCleaningTaskTemplateById(req, res, next) {
    try {
        const { id } = req.params;
        const template = await cleaningTaskTemplateService.findTemplateById(id);

        return res.status(200).json({
            success: true,
            template
        });
    } catch (error) {
        next(error);
    }
}

// Opdater template
async function updateCleaningTaskTemplate(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await cleaningTaskTemplateService.updateTemplate(id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Opgave-skabelon opdateret',
            updated
        });
    } catch (error) {
        next(error);
    }
}

// Soft delete
async function deleteCleaningTaskTemplate(req, res, next) {
    try {
        const { id } = req.params;
        await cleaningTaskTemplateService.deleteTemplate(id);

        return res.status(200).json({
            success: true,
            message: 'Opgave-skabelon deaktiveret'
        });
    } catch (error) {
        next(error);
    }
}

// Reactivate
async function reactivateCleaningTaskTemplate(req, res, next) {
    try {
        const { id } = req.params;
        const reactivated = await cleaningTaskTemplateService.reactivateTemplate(id);

        return res.status(200).json({
            success: true,
            message: 'Opgave-skabelon genaktiveret',
            reactivated
        });
    } catch (error) {
        next(error);
    }
}

// List arkiverede templates
async function getDeletedCleaningTaskTemplates(req, res, next) {
    try {
        const deletedTemplates = await cleaningTaskTemplateService.getDeletedTemplates();

        return res.status(200).json({
            success: true,
            deletedTemplates
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCleaningTaskTemplate,
    listCleaningTaskTemplates,
    findCleaningTaskTemplateById,
    updateCleaningTaskTemplate,
    deleteCleaningTaskTemplate,
    reactivateCleaningTaskTemplate,
    getDeletedCleaningTaskTemplates
};
