const offerRepo = require("../data/offerRepo");
const cleaningTaskRepo = require("../data/cleaningTaskRepo");
const cleaningPlanRepo = require("../data/cleaningPlanRepo");
const { userError } = require("../utils/userError");
const crypto = require("crypto");
const { calculateTaskMonthlyPrice } = require("../utils/priceUtil");

async function getOfferById(id) {
    return await offerRepo.findById(id);
}

async function createOffer(planId, { discountPercent = 0, environmentalFeePercent = 4 }) {

    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) throw userError("Rengøringsplanen findes ikke");

    const tasks = await cleaningTaskRepo.findByPlanId(planId);
    if (!tasks || tasks.length === 0) {
        throw userError("Rengøringsplanen har ingen opgaver");
    }

    const totals = calculateOfferTotals(tasks, discountPercent, environmentalFeePercent);

    const snapshot = {
        plan: {
            name: plan.name,
            description: plan.description,
            hourlyRate: plan.hourlyRate,

            subtotalBeforeDiscount: totals.subtotal,
            discountPercent,
            discountAmount: totals.discountAmount,

            environmentalFeePercent,
            environmentalFeeAmount: totals.environmentalFeeAmount,

            indexRegulationPercent: plan.indexRegulationPercent,
            totalMonthlyPrice: totals.total,

            paymentTerms: plan.paymentTerms
        },

        tasks: tasks.map(t => {
            const { monthlyPrice, pricePerTime, duration } =
                calculateTaskMonthlyPrice(t, plan.hourlyRate);

            return {
                name: t.name,
                category: t.category,
                unit: t.unit,
                amount: t.amount,
                quantity: t.quantity,

                durationPerUnit: t.durationPerUnit,
                durationPerTask: duration,

                frequency: t.frequency,
                days: t.days,

                pricePerTime,
                monthlyPrice,

                description: t.description
            };
        })
    };

    const signatureToken = crypto.randomBytes(32).toString("hex");

    const offer = await offerRepo.create({
        customerId: plan.customerId,
        planId,
        snapshot,
        status: "sent",
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

    offer.status = "accepted";
    offer.acceptedByName = name;
    offer.acceptedByEmail = email;
    offer.acceptedAt = new Date();

    await offerRepo.update(offerId, offer);

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

function calculateOfferTotals(tasks, discountPercent, environmentalFeePercent) {

    const subtotal = tasks.reduce((sum, t) => {
        const hourlyRate = t.hourlyRate || t.planHourlyRate || t._doc?.hourlyRate;
        const rate = hourlyRate ?? 0;

        const { monthlyPrice } = calculateTaskMonthlyPrice(t, rate);
        return sum + monthlyPrice;
    }, 0);

    const environmentalFeeAmount = subtotal * (environmentalFeePercent / 100);
    const subtotalWithFee = subtotal + environmentalFeeAmount;

    const discountAmount = subtotalWithFee * (discountPercent / 100);

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
