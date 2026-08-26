const CleaningTaskTemplate = require('../models/CleaningTaskTemplate');

// CREATE
async function createTemplate(data) {
    return CleaningTaskTemplate.create(data);
}

// LIST ACTIVE
async function listTemplates() {
    return CleaningTaskTemplate.find({ isActive: true })
        .sort({ name: 1 })
        .lean();
}

// LIST DELETED
async function listDeletedTemplates() {
    return CleaningTaskTemplate.find({ isActive: false })
        .sort({ name: 1 })
        .lean();
}

// FIND BY ID
async function findTemplateById(id) {
    return CleaningTaskTemplate.findById(id).lean();
}

// UPDATE
async function updateTemplate(id, data) {
    return CleaningTaskTemplate.findByIdAndUpdate(
        id,
        {
            ...data,
            updatedAt: new Date()
        },
        { new: true }
    ).lean();
}

// SOFT DELETE
async function softDeleteTemplate(id) {
    return CleaningTaskTemplate.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
    ).lean();
}

// REACTIVATE
async function reactivateTemplate(id) {
    return CleaningTaskTemplate.findByIdAndUpdate(
        id,
        { isActive: true, updatedAt: new Date() },
        { new: true }
    ).lean();
}

// FIND BY CATEGORY
async function findByCategory(category) {
    return CleaningTaskTemplate.find({
        category,
        isActive: true
    })
        .sort({ name: 1 })
        .lean();
}

module.exports = {
    createTemplate,
    listTemplates,
    listDeletedTemplates,
    findTemplateById,
    updateTemplate,
    softDeleteTemplate,
    reactivateTemplate,
    findByCategory
};
