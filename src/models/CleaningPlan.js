const mongoose = require("mongoose");
const { paymentTerms } = require("../utils/paymentTerms");

const cleaningPlanSchema = new mongoose.Schema({

    // Reference til Location
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
        required: true
    },

    // Reference til Customer (du bruger det i newPlanController)
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    // Navn på planen
    name: {
        type: String,
        required: true
    },

    description: String,

    // Timepris (fra systemSettings)
    hourlyRate: {
        type: Number,
        required: true
    },

    roomNotes: [{
        roomName: String,
        notes: [String]
    }],


    // ⭐ Prisberegning (beregnes ud fra CleaningTasks)
    subtotalBeforeDiscount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },

    environmentalFeePercent: { type: Number, default: 4 },
    environmentalFeeAmount: { type: Number, default: 0 },

    indexRegulationPercent: { type: Number, default: 2.5 },

    totalMonthlyPrice: { type: Number, default: 0 },

    // ⭐ Betalingsbetingelser (dropdown)
    paymentTerms: {
        type: String,
        enum: Object.keys(paymentTerms),
        required: false // du kan sætte til true når UI er klar
    },

    // ⭐ Tilbud der er accepteret
    offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        default: null
    },

    acceptedAt: Date,
    acceptedByName: String,
    acceptedByEmail: String,

    isActive: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CleaningPlan", cleaningPlanSchema);
