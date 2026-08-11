const CleaningPlan = require('../models/CleaningPlan');

async function create(data) {
    return CleaningPlan.create(data);
}

async function findById(id) {
    return CleaningPlan.findById(id);
}

async function findByCustomerId(customerId) {
    return CleaningPlan.find({ customerId, isDeleted: false });
}

async function findAllActive() {
    return CleaningPlan.find({ isActive: true }).sort({ createdAt: -1 });
}

async function findAllDeleted() {
    return CleaningPlan.find({ isActive: false }).sort({ createdAt: -1 });
}

async function updateById(id, data) {
    return CleaningPlan.findByIdAndUpdate(id, data, { new: true });
}

module.exports = {
    create,
    findById,
    findAllActive,
    findAllDeleted,
    updateById,
    findByCustomerId,
};
