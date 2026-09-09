const mongoose = require("mongoose");
const { paymentTerms } = require("../utils/paymentTerms");
const { terminationNotice } = require("../utils/terminationNotice");


const offerSchema = new mongoose.Schema({

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CleaningPlan",
        required: true
    },

    // Snapshot af CleaningPlan + CleaningTasks
    snapshot: {
        type: mongoose.Schema.Types.Mixed,   // ← VIGTIGT: tillader nested objekter
        required: true
    },

    paymentTerms: {
        type: String,
        enum: Object.keys(paymentTerms),
        required: true
    },

    terminationNotice: {
        type: String,
        enum: Object.keys(terminationNotice),
        required: true
    },


    status: {
        type: String,
        enum: ["draft", "sent", "accepted", "expired"],
        default: "draft"
    },

    acceptedByName: String,
    acceptedByEmail: String,
    acceptedAt: Date,

    signatureToken: String,
    signatureTokenExpiresAt: Date

}, {
    timestamps: true   // ← VIGTIGT: opdaterer createdAt + updatedAt automatisk
});

module.exports = mongoose.model("Offer", offerSchema);
