const cleaningTaskTemplateService = require('../services/cleaningTaskTemplateService');
const { categoryTypes, categoryLabels } = require('../utils/categoryEnum');
const { units, unitsLabels } = require('../utils/unitEnum');
const { frequencies, frequencyLabels } = require('../utils/frequencyEnum');


// Opret template (master-opgave)
async function createCleaningTaskTemplate(req, res, next) {
    try {
        const template = await cleaningTaskTemplateService.createTemplate(req.body);

        const templates = await cleaningTaskTemplateService.listTemplates();
        return res.render('cleaningTaskTemplates/list', {
            templates,
            categoryLabels,
            unitsLabels,
            frequencyLabels
        });
    } catch (error) {
        next(error);
    }
}

// List alle aktive templates
async function listCleaningTaskTemplates(req, res, next) {
    try {
        const templates = await cleaningTaskTemplateService.listTemplates();

        return res.render('cleaningTaskTemplates/_listPartial', {
            templates,
            categoryLabels,
            unitsLabels,
            frequencyLabels
        });
    } catch (error) {
        next(error);
    }
}


// Hent én template
async function findCleaningTaskTemplateById(req, res, next) {
    try {
        const template = await cleaningTaskTemplateService.findTemplateById(req.params.id);
        return res.render('cleaningTaskTemplates/edit', {
            template,
            categoryTypes,
            categoryLabels,
            units,
            unitsLabels,
            frequencyLabels
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

        const templates = await cleaningTaskTemplateService.listTemplates();
        return res.render('cleaningTaskTemplates/_listPartial', {
            templates,
            categoryLabels,
            unitsLabels,
            frequencyLabels
        });
    } catch (error) {
        next(error);
    }
}

async function editCleaningTaskTemplate(req, res, next) {
    try {
        const template = await cleaningTaskTemplateService.findTemplateById(req.params.id);

        return res.render('cleaningTaskTemplates/edit', {
            template,
            categoryTypes,
            categoryLabels,
            units,
            unitsLabels,
            frequencies,
            frequencyLabels
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
        return res.render('cleaningTaskTemplates/_listPartial', {
            templates,
            categoryLabels,
            unitsLabels,
            frequencyLabels
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

        const templates = await cleaningTaskTemplateService.listTemplates();
        return res.render('cleaningTaskTemplates/_listPartial', {
            templates,
            categoryLabels,
            unitsLabels,
            frequencyLabels
        });
    } catch (error) {
        next(error);
    }
}

// List arkiverede templates
async function getDeletedCleaningTaskTemplates(req, res, next) {
    try {
        const deletedTemplates = await cleaningTaskTemplateService.getDeletedTemplates();

        return res.render('cleaningTaskTemplates/_listPartialArchived', {
            templates: deletedTemplates,
            categoryLabels,
            unitsLabels,
            frequencyLabels
        });
    } catch (error) {
        next(error);
    }
}

async function showTemplatePage(req, res) {
    return res.render("cleaningTaskTemplates/list", {
        categoryLabels,
        unitsLabels,
        frequencyLabels
    });
}

async function showCreateForm(req, res) {
    const emptyTemplate = {
        durationPerUnit: "",
        pricePerUnit: "",
        unit: "",
        frequency: "",
        category: req.query.category || null
    };

    return res.render("cleaningTaskTemplates/create", {
        template: emptyTemplate,
        category: emptyTemplate.category,
        categoryTypes,
        categoryLabels,
        units,
        unitsLabels,
        frequencies,
        frequencyLabels
    });
}


function showConsumableFields(req, res) {
    const category = req.query.category || null;

    return res.render("cleaningTaskTemplates/partials/consumableFields", {
        category,
        categoryTypes
    });
}

function showTaskFields(req, res) {
    const category = req.query.category || null;

    const emptyTemplate = {
        durationPerUnit: "",
        pricePerUnit: "",
        unit: "",
        frequency: "",
        category
    };

    res.render("cleaningTaskTemplates/partials/taskFields", {
        template: emptyTemplate,
        category,
        categoryTypes,
        units,
        unitsLabels,
        frequencies,
        frequencyLabels
    });
}



module.exports = {
    createCleaningTaskTemplate,
    editCleaningTaskTemplate,
    listCleaningTaskTemplates,
    findCleaningTaskTemplateById,
    updateCleaningTaskTemplate,
    deleteCleaningTaskTemplate,
    reactivateCleaningTaskTemplate,
    getDeletedCleaningTaskTemplates,
    showTemplatePage,
    showCreateForm,
    showConsumableFields,
    showTaskFields
};
