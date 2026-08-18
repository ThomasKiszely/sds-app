const mongoose = require("mongoose");
const { units } = require("../utils/unitEnum");
const { frequency } = require("../utils/frequencyEnum");
const { days } = require("../utils/dayEnum");
const { categoryTypes } = require("../utils/categoryEnum");



const cleaningTaskSchema = new mongoose.Schema({
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CleaningPlan",
        required: true
    },

    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CleaningTaskTemplate",
        required: true
    },

    // kopieret fra template
    name: { type: String, required: true },
    category: {
        type: String,
        enum: Object.values(categoryTypes),
        required: true
    },
    unit: {
        type: String,
        enum: Object.values(units),
        default: units.ingen,
    },
    duration: { type: Number, default: 0 },
    price: { type: Number, default: 0 },

    // brugerens valg
    days: {
        type: [String],
        enum: Object.values(days),
        default: []
    },

    frequency: {
        type: String,
        enum: Object.values(frequency),
        required: true
    },

    quantity: { type: Number, default: 1 },

    amount: { type: Number, default: 0 }, // m2, lbm, stk

    // beregnet pris for denne opgave (amount * price * frequency)
    totalPrice: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CleaningTask", cleaningTaskSchema);
