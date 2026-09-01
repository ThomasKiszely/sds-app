const mongoose = require("mongoose");
const { categoryTypes } = require("../utils/categoryEnum");
const { units } = require("../utils/unitEnum");
const { frequencies } = require("../utils/frequencyEnum");

const cleaningTaskTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },

    category: {
        type: String,
        enum: Object.values(categoryTypes),
        required: true
    },

    // Tid pr. enhed (minutter)
    durationPerUnit: { type: Number, default: 0 },

    // Frekvens
    frequency: {
        type: String,
        enum: Object.values(frequencies),
        default: frequencies.weekly,
    },

    // Enhed (m2, stk, rum)
    unit: {
        type: String,
        enum: Object.values(units),
        default: units.ingen
    },

    isConsumable: { type: Boolean, default: false },

    pricePerUnit: { type: Number, default: null },

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CleaningTaskTemplate", cleaningTaskTemplateSchema);
