const CleaningTask = require('../models/CleaningTask');

async function create(data) {
    return CleaningTask.create(data);
}

async function findById(id) {
    return CleaningTask.findById(id);
}

async function findByPlanId(planId) {
    return CleaningTask.find({ planId, isActive: true }).sort({ name: 1 });
}

async function findDeletedByPlanId(planId) {
    return CleaningTask.find({ planId, isActive: false }).sort({ name: 1 });
}

async function updateById(id, data) {
    return CleaningTask.findByIdAndUpdate(id, data, { returnDocument: 'after' });
}

async function deleteById(id) {
    return CleaningTask.deleteOne({ _id: id });
}

async function findTasksByIds(ids) {
    return CleaningTask.find({ _id: { $in: ids } });
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
