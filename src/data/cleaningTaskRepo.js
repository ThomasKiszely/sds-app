const CleaningTask = require('../models/CleaningTask');

// Opret task
async function create(data) {
    return CleaningTask.create(data);
}

// Find aktiv task
async function findById(id) {
    return CleaningTask.findOne({ _id: id, isActive: true });
}

// Find alle aktive tasks for plan
async function findByPlanId(planId) {
    return CleaningTask.find({ planId, isActive: true }).sort({ name: 1 });
}

// Find alle slettede tasks for plan
async function findDeletedByPlanId(planId) {
    return CleaningTask.find({ planId, isActive: false }).sort({ name: 1 });
}

// Opdater task (Mongoose v7)
async function updateById(id, data) {
    return CleaningTask.findByIdAndUpdate(
        id,
        data,
        { returnDocument: 'after', runValidators: true }
    );
}

// Soft delete (Mongoose v7)
async function deleteById(id) {
    return CleaningTask.findByIdAndUpdate(
        id,
        { isActive: false },
        { returnDocument: 'after' }
    );
}

// Find tasks efter liste af IDs (kun aktive)
async function findTasksByIds(ids) {
    return CleaningTask.find({
        _id: { $in: ids },
        isActive: true
    });
}

module.exports = {
    create,
    findById,
    findByPlanId,
    findDeletedByPlanId,
    updateById,
    deleteById,
    findTasksByIds
};
