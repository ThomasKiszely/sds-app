const Contract = require("../models/Contract");

async function create(data) {
    return Contract.create(data);
}

async function findById(id) {
    return Contract.findById(id);
}

async function findByCustomerId(customerId) {
    return Contract.find({ customerId }).sort({ generatedAt: -1 });
}

async function findByPlanId(planId) {
    return Contract.find({ planId }).sort({ generatedAt: -1 });
}

async function deactivateContractsForPlan(planId) {
    return Contract.updateMany(
        { planId },
        { isActive: false }
    );
}

module.exports = {
    create,
    findById,
    findByCustomerId,
    findByPlanId,
    deactivateContractsForPlan
};
