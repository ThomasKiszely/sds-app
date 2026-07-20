const mongoose = require("mongoose");
const { cleaningTypes } = require("../utils/cleaningTypeEnum");
const { units } = require("../utils/unitEnum");
const { days } = require("../utils/dayEnum");
const { frequency } = require("../utils/frequencyEnum");


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
    unit: {
        type: String,
        enum: Object.values(units),
        default: "none"
    },
    duration: { type: Number, default: 0 },
    price: { type: Number, default: 0 },

    // brugerens valg
    frequency: {
        type: String,
        enum: Object.values(frequency),
        required: true
    },

    quantity: { type: Number, default: 1 },

    amount: { type: Number, default: 0 }, // m2, lbm, stk

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CleaningTask", cleaningTaskSchema);
