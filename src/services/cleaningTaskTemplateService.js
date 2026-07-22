const repo = require('../data/cleaningTaskTemplateRepo');
const { ensureTemplateExists } = require('../utils/templateValidationUtil');

async function createTemplate(data) {
    return repo.create({
        name: data.name.trim(),
        category: data.category,
        defaultDuration: data.defaultDuration ?? 0,
        defaultPrice: data.defaultPrice ?? 0,
        unit: data.unit ?? "none",
        isActive: true
    });
}

async function listTemplates() {
    return repo.findAllActive();
}

async function findTemplateById(id) {
    const template = await repo.findById(id);
    ensureTemplateExists(template);
    return template;
}

async function updateTemplate(id, data) {
    const template = await repo.findById(id);
    ensureTemplateExists(template);

    const updated = await repo.updateById(id, {
        name: data.name?.trim() ?? template.name,
        category: data.category ?? template.category,
        defaultDuration: data.defaultDuration ?? template.defaultDuration,
        defaultPrice: data.defaultPrice ?? template.defaultPrice,
        unit: data.unit ?? template.unit
    });

    return updated;
}

async function deleteTemplate(id) {
    const template = await repo.findById(id);
    ensureTemplateExists(template);

    return repo.updateById(id, { isActive: false });
}

async function reactivateTemplate(id) {
    const template = await repo.findById(id);
    ensureTemplateExists(template);

    return repo.updateById(id, { isActive: true });
}

async function getDeletedTemplates() {
    return repo.findAllDeleted();
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
