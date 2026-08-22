const offerRepo = require("../data/offerRepo");
const cleaningTaskRepo = require("../data/cleaningTaskRepo");
const cleaningPlanRepo = require("../data/cleaningPlanRepo");
const { userError } = require("../utils/userError");
const crypto = require("crypto");

async function getOfferById(id) {
    return await offerRepo.findById(id);
}

async function createOffer(planId, { discountPercent = 0, environmentalFee = 1 }) {

    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) throw userError("Rengøringsplanen findes ikke");

    const tasks = await cleaningTaskRepo.findByPlanId(planId);
    if (!tasks || tasks.length === 0) {
        throw userError("Rengøringsplanen har ingen opgaver");
    }

    // Brug fælles beregning
    const totals = calculateOfferTotals(tasks, discountPercent, environmentalFee);

    const signatureToken = crypto.randomBytes(32).toString("hex");

    const offer = await offerRepo.create({
        customerId: plan.customerId,
        planId,
        taskIds: tasks.map(t => t._id),

        subtotalBeforeDiscount: totals.subtotal,
        discountPercent,
        discountAmount: totals.discountAmount,

        environmentalFee,
        environmentalFeeAmount: totals.environmentalFeeAmount,

        totalPrice: totals.total,

        status: "draft",
        signatureToken
    });

    return offer;
}


async function sendOffer(offerId) {
    const offer = await offerRepo.findById(offerId);
    if (!offer) throw userError("Tilbud findes ikke");

    if (offer.status !== "draft") {
        throw userError("Dette tilbud er allerede sendt");
    }

    offer.status = "sent";
    offer.updatedAt = new Date();

    return await offerRepo.update(offerId, offer);
}

async function acceptOffer(offerId, { name, email }) {
    const offer = await offerRepo.findById(offerId);
    if (!offer) throw userError("Tilbud findes ikke");

    if (offer.status !== "sent") {
        throw userError("Kun sendte tilbud kan accepteres");
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

function calculateOfferTotals(tasks, discountPercent, environmentalFee) {
    const subtotal = tasks.reduce((sum, t) => sum + t.totalPrice, 0);

    // 1) Miljøafgift først
    const environmentalFeeAmount = subtotal * (environmentalFee / 100);
    const subtotalWithFee = subtotal + environmentalFeeAmount;

    // 2) Rabat på subtotal + miljøafgift
    const discountAmount = subtotalWithFee * (discountPercent / 100);

    // 3) Total
    const total = subtotalWithFee - discountAmount;

    return {
        subtotal,
        environmentalFeeAmount,
        discountAmount,
        total
    };
}


module.exports = {
    getOfferById,
    createOffer,
    sendOffer,
    acceptOffer,
    listOffersForCustomer,
    listOffersForPlan,
    calculateOfferTotals
};
