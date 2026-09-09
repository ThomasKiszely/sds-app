const offerRepo = require("../data/offerRepo");
const cleaningTaskRepo = require("../data/cleaningTaskRepo");
const cleaningPlanRepo = require("../data/cleaningPlanRepo");
const customerService = require("../services/customerService");
const { parseAddress } = require("../utils/addressUtil");
const { categoryLabels } = require("../utils/categoryEnum");
const { unitsLabels } = require("../utils/unitEnum");
const { frequencyLabels } = require("../utils/frequencyEnum");


const crypto = require("crypto");
require('dotenv').config();
const { userError } = require("../utils/userError");
const { categoryTypes } = require("../utils/categoryEnum");
const { calculateTaskPrice } = require("../services/priceService");
const { terminationNotice: terminationNoticeEnum, terminationNoticeLabels } = require("../utils/terminationNotice");

async function getOfferById(id) {
    return await offerRepo.findById(id);
}

async function createOffer(
    planId,
    { discountPercent = 0, environmentalFeePercent = 4, paymentTerms, terminationNotice }
) {
    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) throw userError("Rengøringsplanen findes ikke");

    const rawTasks = await cleaningTaskRepo.findByPlanId(planId);
    if (!rawTasks || rawTasks.length === 0) {
        throw userError("Rengøringsplanen har ingen opgaver");
    }

    const hourlyRate = plan.hourlyRate;

    // Kunde + parsed adresse
    const customer = await customerService.getCustomerById(plan.customerId);
    const { street, zip, city } = parseAddress(customer.customerAddress);

    // Enrich tasks
    const enrichedTasks = rawTasks.map(t => {
        const plain = typeof t.toObject === "function" ? t.toObject() : t;
        const { monthlyPrice, pricePerTime, duration } = calculateTaskPrice(plain, hourlyRate);

        return {
            ...plain,
            monthlyPrice,
            pricePerTime,
            durationPerTask: duration
        };
    });

    const consumables = enrichedTasks.filter(t => t.category === categoryTypes.consumables);
    const normalTasks = enrichedTasks.filter(t => t.category !== categoryTypes.consumables);

    const totals = calculateOfferTotals(enrichedTasks, discountPercent, environmentalFeePercent, hourlyRate);

    // Signature token
    const signatureToken = crypto.randomBytes(32).toString("hex");
    const signatureTokenExpiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);

    // Acceptlink (til snapshot)
    const signatureLink =
        `${process.env.BASE_URL || "https://sds-app-production-a900.up.railway.app"}/offers/${planId}/accept?token=${signatureToken}`;

    // Snapshot – komplet
    const snapshot = {
        offerMeta: {
            createdAt: new Date(),
            status: "sent"
        },

        plan: {
            // Basis
            name: plan.name,
            description: plan.description,

            // Lokation
            locationStreet: plan.locationStreet,
            locationZip: plan.locationZip,
            locationCity: plan.locationCity,
            locationName: plan.locationName,
            locationFloor: plan.locationFloor,
            locationNotes: plan.locationNotes,

            // Noter
            customerNotes: plan.customerNotes,
            internalNotes: plan.internalNotes,

            // Prisfelter
            hourlyRate: plan.hourlyRate,
            subtotalBeforeDiscount: totals.subtotal,
            discountPercent,
            discountAmount: totals.discountAmount,
            environmentalFeePercent,
            environmentalFeeAmount: totals.environmentalFeeAmount,
            indexRegulationPercent: plan.indexRegulationPercent,
            totalMonthlyPrice: totals.total,

            // Kontraktfelter
            paymentTerms: paymentTerms || plan.paymentTerms,
            terminationNotice: terminationNotice || terminationNoticeEnum.month3,
            terminationNoticeLabel: terminationNoticeLabels[terminationNotice || terminationNoticeEnum.month3],

            // Metadata
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
        },

        customer: {
            // Basis
            name: customer.customerName,
            email: customer.customerEmail,
            phone: customer.customerPhone,

            // CVR / P-nummer
            cvr: customer.customerCvr,
            pNumber: customer.customerPNumber,

            // Adresse
            address: customer.customerAddress,
            street,
            zip,
            city,

            // Kontaktperson
            contactPerson: {
                name: customer.contactPerson?.name,
                email: customer.contactPerson?.email,
                phone: customer.contactPerson?.phone
            }
        },

        tasks: normalTasks.map(t => ({
            name: t.name,
            category: t.category,
            categoryLabel: categoryLabels[t.category],

            unit: t.unit,
            unitLabel: unitsLabels[t.unit],

            amount: t.amount,
            roomName: t.roomName,

            durationPerUnit: t.durationPerUnit,
            durationPerTask: t.durationPerTask,

            frequency: t.frequency,
            frequencyLabel: frequencyLabels[t.frequency],
            days: t.days,

            pricePerTime: t.pricePerTime,
            monthlyPrice: t.monthlyPrice,

            description: t.description
        })),

        consumables: consumables.map(c => ({
            name: c.name,
            amount: c.amount,

            unit: c.unit,
            unitLabel: unitsLabels[c.unit],

            pricePerUnit: c.customPrice,

            frequency: c.frequency,
            frequencyLabel: frequencyLabels[c.frequency],

            monthlyPrice: c.monthlyPrice,
            pricePerTime: c.pricePerTime,

            durationPerUnit: c.durationPerUnit,
            durationPerTask: c.durationPerTask,

            days: c.days,

            description: c.description
        })),

        signatureLink
    };


    const offer = await offerRepo.create({
        customerId: plan.customerId,
        planId,
        snapshot,
        status: "sent",
        signatureToken,
        signatureTokenExpiresAt,
        paymentTerms: paymentTerms || plan.paymentTerms,
        terminationNotice: terminationNotice || terminationNoticeEnum.month3,
    });

    await cleaningPlanRepo.updateById(planId, { offerId: offer._id });

    return offer;
}



async function sendOffer(offerId) {
    const offer = await offerRepo.findById(offerId);
    if (!offer) throw userError("Tilbud findes ikke");

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

function calculateOfferTotals(tasks, discountPercent, environmentalFeePercent, hourlyRate) {
    const rate = hourlyRate ?? 0;

    const subtotal = tasks.reduce((sum, t) => {
        const plain = typeof t.toObject === "function" ? t.toObject() : t;
        const { monthlyPrice } = calculateTaskPrice(plain, rate);
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
