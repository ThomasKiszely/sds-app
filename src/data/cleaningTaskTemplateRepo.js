const CleaningTaskTemplate = require('../models/CleaningTaskTemplate');

async function create(data) {
    return CleaningTaskTemplate.create(data);
}

async function findAllActive() {
    return CleaningTaskTemplate.find({ isActive: true }).sort({ name: 1 });
}

async function findAllDeleted() {
    return CleaningTaskTemplate.find({ isActive: false }).sort({ name: 1 });
}

async function findById(id) {
    return CleaningTaskTemplate.findById(id);
}

async function updateById(id, data) {
    return CleaningTaskTemplate.findByIdAndUpdate(id, data, { new: true });
}

module.exports = {
    create,
    findAllActive,
    findAllDeleted,
    findById,
    updateById
};
