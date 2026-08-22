const mongoose = require("mongoose");

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

    // Hvilke tasks indgår i tilbuddet
    taskIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "CleaningTask"
    }],

    // Pris-snapshot
    subtotalBeforeDiscount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },

    environmentalFee: { type: Number, default: 1 },
    environmentalFeeAmount: { type: Number, default: 0 },

    totalPrice: { type: Number, default: 0 },

    // Status
    status: {
        type: String,
        enum: ["draft", "sent", "accepted", "expired"],
        default: "draft"
    },

    // Underskrift
    acceptedByName: String,
    acceptedByEmail: String,
    acceptedAt: Date,

    signatureToken: String,

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Offer", offerSchema);
