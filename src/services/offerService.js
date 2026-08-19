const offerRepo = require("../data/offerRepo");
const cleaningTaskRepo = require("../data/cleaningTaskRepo");
const cleaningPlanRepo = require("../data/cleaningPlanRepo");
const crypto = require("crypto");

async function getOfferById(id) {
    return await offerRepo.findById(id);
}

async function createOffer(planId, { discountPercent = 0, environmentalFeePercent = 1 }) {

    // 1) Tjek at planen findes
    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) {
        throw new Error("CleaningPlan findes ikke");
    }

    // 2) Hent tasks
    const tasks = await cleaningTaskRepo.findByPlanId(planId);
    if (!tasks || tasks.length === 0) {
        throw new Error("CleaningPlan har ingen opgaver");
    }

    // 3) Beregn subtotal
    const subtotal = tasks.reduce((sum, task) => {
        return sum + (task.price * task.quantity);
    }, 0);

    // 4) Rabat
    const discountAmount = subtotal * (discountPercent / 100);

    // 5) Miljøafgift
    const environmentalFeeAmount = subtotal * (environmentalFeePercent / 100);

    // 6) Total
    const total = subtotal - discountAmount + environmentalFeeAmount;

    // 7) Token til underskrift
    const signatureToken = crypto.randomBytes(32).toString("hex");

    // 8) Gem tilbud
    const offer = await offerRepo.create({
        customerId: plan.customerId,
        planId,
        taskIds: tasks.map(t => t._id),

        subtotalBeforeDiscount: subtotal,
        discountPercent,
        discountAmount,

        environmentalFeePercent,
        environmentalFeeAmount,

        totalPrice: total,

        status: "draft",
        signatureToken
    });

    return offer;
}

async function sendOffer(offerId) {
    const offer = await offerRepo.findById(offerId);
    if (!offer) throw new Error("Tilbud findes ikke");

    if (offer.status !== "draft") {
        throw new Error("Kun draft-tilbud kan sendes");
    }

    offer.status = "sent";
    offer.updatedAt = new Date();

    return await offerRepo.update(offerId, offer);
}

async function acceptOffer(offerId, { name, email }) {
    const offer = await offerRepo.findById(offerId);
    if (!offer) throw new Error("Tilbud findes ikke");

    if (offer.status !== "sent") {
        throw new Error("Kun sendte tilbud kan accepteres");
    }

    // Opdater tilbud
    offer.status = "accepted";
    offer.acceptedByName = name;
    offer.acceptedByEmail = email;
    offer.acceptedAt = new Date();

    await offerRepo.update(offerId, offer);

    // Opdater CleaningPlan med accept-info
    await cleaningPlanRepo.updateById(offer.planId, {
        acceptedOfferId: offerId,
        acceptedAt: offer.acceptedAt,
        acceptedByName: name,
        acceptedByEmail: email
    });

    return offer;
}

async function listOffersForCustomer(customerId) {
    return await offerRepo.findByCustomerId(customerId);
}

async function listOffersForPlan(planId) {
    return await offerRepo.findByPlanId(planId);
}

module.exports = {
    getOfferById,
    createOffer,
    sendOffer,
    acceptOffer,
    listOffersForCustomer,
    listOffersForPlan
};
