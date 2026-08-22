const cleaningTaskTemplateService = require('../services/cleaningTaskTemplateService');
const { categoryTypes, categoryLabels } = require('../utils/categoryEnum');
const { units, unitsLabels } = require('../utils/unitEnum');


// Opret template (master-opgave)
async function createCleaningTaskTemplate(req, res, next) {
    try {
        const template = await cleaningTaskTemplateService.createTemplate(req.body);

        const templates = await cleaningTaskTemplateService.listTemplates();
        return res.render('tasks/list', { templates, categoryLabels });
    } catch (error) {
        next(error);
    }
}

// List alle aktive templates
async function listCleaningTaskTemplates(req, res, next) {
    try {
        const templates = await cleaningTaskTemplateService.listTemplates();

        return res.render('tasks/_listPartial', { templates, categoryLabels });
    } catch (error) {
        next(error);
    }
}


// Hent én template
async function findCleaningTaskTemplateById(req, res, next) {
    try {
        const template = await cleaningTaskTemplateService.findTemplateById(req.params.id);
        return res.render('tasks/edit', { template });
    } catch (error) {
        next(error);
    }
}

// Opdater template
async function updateCleaningTaskTemplate(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await cleaningTaskTemplateService.updateTemplate(id, req.body);

        const templates = await cleaningTaskTemplateService.listTemplates();
        return res.render('tasks/list', { templates });
    } catch (error) {
        next(error);
    }
}

async function editCleaningTaskTemplate(req, res, next) {
    try {
        const template = await cleaningTaskTemplateService.findTemplateById(req.params.id);

        return res.render('tasks/edit', {
            template,
            categoryTypes,
            categoryLabels,
            units,
            unitsLabels
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

        const templates = await cleaningTaskTemplateService.listTemplates();
        return res.render('tasks/_listPartial', { templates });
    } catch (error) {
        next(error);
    }
}

// Reactivate
async function reactivateCleaningTaskTemplate(req, res, next) {
    try {
        const { id } = req.params;
        const reactivated = await cleaningTaskTemplateService.reactivateTemplate(id);

        const templates = await cleaningTaskTemplateService.listTemplates();
        return res.render('tasks/_listPartial', { templates });
    } catch (error) {
        next(error);
    }
}

// List arkiverede templates
async function getDeletedCleaningTaskTemplates(req, res, next) {
    try {
        const deletedTemplates = await cleaningTaskTemplateService.getDeletedTemplates();

        return res.render('tasks/_listPartialArchived', { templates: deletedTemplates });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCleaningTaskTemplate,
    editCleaningTaskTemplate,
    listCleaningTaskTemplates,
    findCleaningTaskTemplateById,
    updateCleaningTaskTemplate,
    deleteCleaningTaskTemplate,
    reactivateCleaningTaskTemplate,
    getDeletedCleaningTaskTemplates
};
