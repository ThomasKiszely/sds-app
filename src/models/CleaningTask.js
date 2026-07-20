const mongoose = require("mongoose");
const { cleaningTypes } = require("../utils/cleaningTypeEnum");
const { units } = require("../utils/unitEnum");
const { days } = require("../utils/dayEnum");
const { frequency } = require("../utils/frequencyEnum");

const cleaningTaskSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: Object.values(cleaningTypes),
        required: true
    },

    name: { type: String, required: true },
    description: { type: String },

    category: { type: String },

    unit: {
        type: String,
        enum: Object.values(units),
        default: units.none
    },

    quantity: { type: Number, default: 0 },

    days: {
        type: [String],
        enum: Object.values(days),
        default: []
    },

    frequency: {
        type: String,
        enum: Object.values(frequency),
        default: frequency.daily
    },

    isRecurring: { type: Boolean, default: true },
    recurrenceInterval: { type: Number, default: 1 },

    isOptional: { type: Boolean, default: false },
    notes: { type: String },

    pricePerUnit: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },

    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CleaningPlan",
        required: true
    },

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer"
    },

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CleaningTask", cleaningTaskSchema);
