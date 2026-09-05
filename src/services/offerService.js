const offerRepo = require("../data/offerRepo");
const cleaningTaskRepo = require("../data/cleaningTaskRepo");
const cleaningPlanRepo = require("../data/cleaningPlanRepo");
const { userError } = require("../utils/userError");
const crypto = require("crypto");
const { calculateTaskMonthlyPrice } = require("../utils/priceUtil");
const { categoryTypes } = require("../utils/categoryEnum");
const { terminationNotice: terminationNoticeEnum, terminationNoticeLabels } = require("../utils/terminationNotice");


async function getOfferById(id) {
    return await offerRepo.findById(id);
}

async function createOffer(planId, { discountPercent = 0, environmentalFeePercent = 4, paymentTerms, terminationNotice }) {
    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) throw userError("Rengøringsplanen findes ikke");

    const rawTasks = await cleaningTaskRepo.findByPlanId(planId);
    if (!rawTasks || rawTasks.length === 0) {
        throw userError("Rengøringsplanen har ingen opgaver");
    }

    const hourlyRate = plan.hourlyRate;

    // Enrich alle tasks med priser
    const enrichedTasks = rawTasks.map(t => {
        const plain = typeof t.toObject === "function" ? t.toObject() : t;
        const { monthlyPrice, pricePerTime, duration } =
            calculateTaskMonthlyPrice(plain, hourlyRate);

        return {
            ...plain,
            monthlyPrice,
            pricePerTime,
            durationPerTask: duration
        };
    });

    // Split i normale opgaver og forbrugsvarer
    const consumables = enrichedTasks.filter(t => t.category === categoryTypes.consumables);
    const normalTasks = enrichedTasks.filter(t => t.category !== categoryTypes.consumables);

    // Beregn totals KUN for normale opgaver
    const totals = calculateOfferTotals(normalTasks, discountPercent, environmentalFeePercent, hourlyRate);

    // Snapshot til tilbuddet
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

            paymentTerms: plan.paymentTerms,
            terminationNotice: terminationNotice || terminationNoticeEnum.month3,
            terminationNoticeLabel: terminationNoticeLabels[terminationNotice || terminationNoticeEnum.month3],
        },

        // Normale opgaver
        tasks: normalTasks.map(t => ({
            name: t.name,
            category: t.category,
            unit: t.unit,
            amount: t.amount,
            quantity: t.quantity,

            durationPerUnit: t.durationPerUnit,
            durationPerTask: t.durationPerTask,

            frequency: t.frequency,
            days: t.days,

            pricePerTime: t.pricePerTime,
            monthlyPrice: t.monthlyPrice,

            description: t.description
        })),

        // Forbrugsvarer (tilkøb)
        consumables: consumables.map(c => ({
            name: c.name,
            quantity: c.quantity,
            unit: c.unit,                // altid stk
            pricePerUnit: c.customPrice, // pris pr stk
            description: c.description
        }))
    };

    const signatureToken = crypto.randomBytes(32).toString("hex");

    const offer = await offerRepo.create({
        customerId: plan.customerId,
        planId,
        snapshot,
        status: "sent",
        signatureToken,
        signatureTokenExpiresAt: Date.now() + (14 * 24 * 60 * 60 * 1000),
        paymentTerms: paymentTerms || plan.paymentTerms,
        terminationNotice: terminationNotice || terminationNoticeEnum.month3,
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
    offer.signatureToken = null;
    offer.signatureTokenExpiresAt = null;

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

// ⭐ Nu med eksplicit hourlyRate, så både step4 og createOffer får korrekt total
function calculateOfferTotals(tasks, discountPercent, environmentalFeePercent, hourlyRate) {
    const rate = hourlyRate ?? 0;

    const subtotal = tasks.reduce((sum, t) => {
        const plain = typeof t.toObject === "function" ? t.toObject() : t;
        const { monthlyPrice } = calculateTaskMonthlyPrice(plain, rate);
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
