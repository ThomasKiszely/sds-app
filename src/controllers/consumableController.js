const cleaningTaskTemplateService = require('../services/cleaningTaskTemplateService');
const {categoryTypes} = require("../utils/categoryEnum");
const {units, unitsLabels} = require("../utils/unitEnum");
const {frequencies} = require("../utils/frequencyEnum");

function showConsumablePage(req, res) {
    return res.render('consumables/list');
}

async function listConsumables(req, res, next) {
    try {
        const search = req.query.search || "";
        const consumables = await cleaningTaskTemplateService.listTemplates(search, null, "consumables");
        return res.render('consumables/_listPartial', {
            consumables,
            search,
            unitsLabels,
        });
    } catch (error) {
        next(error);
    }
}

async function getDeletedConsumables(req, res, next) {
    try {
        const consumables = await cleaningTaskTemplateService.getDeletedTemplates("consumables");
        return res.render('consumables/_listPartialArchived', {
            consumables,
            unitsLabels,
        });
    } catch (error) {
        next(error);
    }
}

function showCreateForm(req, res) {
    return res.render('consumables/create', {
        categoryTypes,
        units,
        frequencies,
    });
}

async function createConsumable(req, res, next) {
    try {
        await cleaningTaskTemplateService.createTemplate({
            ...req.body,
            category: categoryTypes.consumables
        });
        return res.render('consumables/list');
    } catch (error) {
        next(error);
    }
}

async function editConsumable(req, res, next) {
    try {
        const template = await cleaningTaskTemplateService.findTemplateById(req.params.id);
        return res.render('consumables/edit', {
            template,
            categoryTypes,
            units,
            frequencies,
        });
    } catch (error) {
        next(error);
    }
}

async function updateConsumable(req, res, next) {
    try {
        await cleaningTaskTemplateService.updateTemplate(req.params.id, {
            ...req.body,
            category: categoryTypes.consumables
        });
        return res.render('consumables/list');
    } catch (error) {
        next(error);
    }
}

async function deleteConsumable(req, res, next) {
    try {
        await cleaningTaskTemplateService.deleteTemplate(req.params.id);
        const consumables = await cleaningTaskTemplateService.listTemplates("", null, "consumables");
        return res.render('consumables/_listPartial', {
            consumables,
            unitsLabels,
        });
    } catch (error) {
        next(error);
    }
}

async function reactivateConsumable(req, res, next) {
    try {
        await cleaningTaskTemplateService.reactivateTemplate(req.params.id);
        return res.render('consumables/list');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    showConsumablePage,
    listConsumables,
    getDeletedConsumables,
    showCreateForm,
    createConsumable,
    editConsumable,
    updateConsumable,
    deleteConsumable,
    reactivateConsumable,
};