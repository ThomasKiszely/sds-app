const cleaningTaskTemplateRepo = require('../data/cleaningTaskTemplateRepo');
const { ensureTemplateExists } = require('../utils/templateValidationUtil');

async function createTemplate(data) {
    return cleaningTaskTemplateRepo.createTemplate({
        name: data.name.trim(),
        description: data.description?.trim() ?? "",
        category: data.category,
        durationPerUnit: Number(data.durationPerUnit ?? 0),
        frequency: data.frequency,
        unit: data.unit,
        isActive: true
    });
}

async function listTemplates() {
    return cleaningTaskTemplateRepo.listTemplates();
}

async function findTemplateById(id) {
    const template = await cleaningTaskTemplateRepo.findTemplateById(id);
    ensureTemplateExists(template);
    return template;
}

async function updateTemplate(id, data) {
    const template = await cleaningTaskTemplateRepo.findTemplateById(id);
    ensureTemplateExists(template);

    return cleaningTaskTemplateRepo.updateTemplate(id, {
        name: data.name?.trim() ?? template.name,
        description: data.description?.trim() ?? template.description,
        category: data.category ?? template.category,
        durationPerUnit: data.durationPerUnit !== undefined
            ? Number(data.durationPerUnit)
            : template.durationPerUnit,
        frequency: data.frequency ?? template.frequency,
        unit: data.unit ?? template.unit
    });
}

async function deleteTemplate(id) {
    const template = await cleaningTaskTemplateRepo.findTemplateById(id);
    ensureTemplateExists(template);

    return cleaningTaskTemplateRepo.softDeleteTemplate(id);
}

async function reactivateTemplate(id) {
    const template = await cleaningTaskTemplateRepo.findTemplateById(id);
    ensureTemplateExists(template);

    return cleaningTaskTemplateRepo.reactivateTemplate(id);
}

async function getDeletedTemplates() {
    return cleaningTaskTemplateRepo.listDeletedTemplates();
}

async function getTemplatesByCategory(category) {
    return cleaningTaskTemplateRepo.findByCategory(category);
}

module.exports = {
    createTemplate,
    listTemplates,
    findTemplateById,
    updateTemplate,
    deleteTemplate,
    reactivateTemplate,
    getDeletedTemplates,
    getTemplatesByCategory
};
