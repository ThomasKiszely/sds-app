const mongoose = require("mongoose");
const { paymentTerms } = require("../utils/paymentTerms");

const contractSchema = new mongoose.Schema({
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

    offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        required: false
    },

    snapshot: {
        type: Object,
        required: true
    },

    paymentTerms: {
        type: String,
        enum: Object.keys(paymentTerms),
        required: true
    },


    generatedAt: {
        type: Date,
        default: Date.now
    },

    generatedBy: {
        type: String,
        default: "system"
    },

    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("Contract", contractSchema);
