const cleaningTaskTemplateRepo = require('../data/cleaningTaskTemplateRepo');
const { ensureTemplateExists } = require('../utils/templateValidationUtil');
const { categoryTypes } = require('../utils/categoryEnum');
const { units } = require('../utils/unitEnum');

async function createTemplate(data) {
    const isConsumable = data.category === categoryTypes.consumables;

    return cleaningTaskTemplateRepo.createTemplate({
        name: data.name.trim(),
        description: data.description?.trim() ?? "",
        category: data.category,

        // Kun almindelige opgaver
        durationPerUnit: isConsumable ? 0 : Number(data.durationPerUnit ?? 0),
        frequency: isConsumable ? null : data.frequency,
        unit: isConsumable ? units.stk : data.unit,

        // Forbrugsvarer
        isConsumable,
        pricePerUnit: isConsumable ? Number(data.pricePerUnit) : null,

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

    const isConsumable = data.category === categoryTypes.consumables;

    return cleaningTaskTemplateRepo.updateTemplate(id, {
        name: data.name?.trim() ?? template.name,
        description: data.description?.trim() ?? template.description,
        category: data.category ?? template.category,

        // Kun almindelige opgaver
        durationPerUnit: isConsumable
            ? 0
            : (data.durationPerUnit !== undefined
                ? Number(data.durationPerUnit)
                : template.durationPerUnit),

        frequency: isConsumable
            ? null
            : (data.frequency ?? template.frequency),

        unit: isConsumable
            ? units.stk
            : (data.unit ?? template.unit),

        // Forbrugsvarer
        isConsumable,
        pricePerUnit: isConsumable
            ? Number(data.pricePerUnit)
            : null,

        isActive: true
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
