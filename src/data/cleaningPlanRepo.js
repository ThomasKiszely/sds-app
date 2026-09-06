const CleaningPlan = require('../models/CleaningPlan');
const mongoose = require('mongoose');

async function create(data) {
    return CleaningPlan.create(data);
}

async function findById(id) {
    return CleaningPlan.findById(id);
}

async function findByCustomerId(customerId) {
    return CleaningPlan.find({
        customerId: new mongoose.Types.ObjectId(customerId),
        isActive: true
    }).populate("locationId");
}


async function findAllActive() {
    return CleaningPlan.find({ isActive: true }).sort({ createdAt: -1 });
}

async function findAllDeleted() {
    return CleaningPlan.find({ isActive: false }).sort({ createdAt: -1 });
}

async function updateById(id, data) {
    return CleaningPlan.findByIdAndUpdate(id, data, { returnDocument: 'after' });
}

async function findByLocationId(locationId) {
    return CleaningPlan.find({ locationId });
}


module.exports = {
    create,
    findById,
    findAllActive,
    findAllDeleted,
    updateById,
    findByCustomerId,
    findByLocationId
};
