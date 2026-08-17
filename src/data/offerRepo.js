const Offer = require("../models/Offer");

class OfferRepo {

    async create(data) {
        return await Offer.create(data);
    }

    async findById(id) {
        return await Offer.findById(id);
    }

    async update(id, data) {
        return await Offer.findByIdAndUpdate(id, data, { returnDocument: "after" });
    }

    async findByCustomerId(customerId) {
        return await Offer.find({ customerId }).sort({ createdAt: -1 });
    }

    async findByPlanId(planId) {
        return await Offer.find({ planId }).sort({ createdAt: -1 });
    }
}

module.exports = new OfferRepo();
