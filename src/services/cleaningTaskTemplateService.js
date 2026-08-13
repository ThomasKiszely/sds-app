const cleaningTaskTemplateRepo = require('../data/cleaningTaskTemplateRepo');
const { ensureTemplateExists } = require('../utils/templateValidationUtil');

async function createTemplate(data) {
    return cleaningTaskTemplateRepo.create({
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category,
        defaultDuration: data.defaultDuration ?? 0,
        defaultPrice: data.defaultPrice ?? 0,
        unit: data.unit ?? "none",
        isActive: true
    });
}

async function listTemplates() {
    return cleaningTaskTemplateRepo.findAllActive();
}

async function findTemplateById(id) {
    const template = await cleaningTaskTemplateRepo.findById(id);
    ensureTemplateExists(template);
    return template;
}

async function updateTemplate(id, data) {
    const template = await cleaningTaskTemplateRepo.findById(id);
    ensureTemplateExists(template);

    const updated = await cleaningTaskTemplateRepo.updateById(id, {
        name: data.name?.trim() ?? template.name,
        category: data.category ?? template.category,
        defaultDuration: data.defaultDuration ?? template.defaultDuration,
        defaultPrice: data.defaultPrice ?? template.defaultPrice,
        unit: data.unit ?? template.unit
    });

    return updated;
}

async function deleteTemplate(id) {
    const template = await cleaningTaskTemplateRepo.findById(id);
    ensureTemplateExists(template);

    return cleaningTaskTemplateRepo.updateById(id, { isActive: false });
}

async function reactivateTemplate(id) {
    const template = await cleaningTaskTemplateRepo.findById(id);
    ensureTemplateExists(template);

    return cleaningTaskTemplateRepo.updateById(id, { isActive: true });
}

async function getDeletedTemplates() {
    return cleaningTaskTemplateRepo.findAllDeleted();
}

module.exports = {
    createTemplate,
    listTemplates,
    findTemplateById,
    updateTemplate,
    deleteTemplate,
    reactivateTemplate,
    getDeletedTemplates
};
