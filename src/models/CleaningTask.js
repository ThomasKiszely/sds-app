const mongoose = require("mongoose");
const { units } = require("../utils/unitEnum");
const { frequencies } = require("../utils/frequencyEnum");
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
    description: { type: String, default: "" },

    category: {
        type: String,
        enum: Object.values(categoryTypes),
        required: true
    },

    roomName: { type: String, required: true },
    programCode: { type: String, required: true },


    unit: {
        type: String,
        enum: Object.values(units),
        required: true
    },

    // NYT: kopieres fra template
    durationPerUnit: { type: Number, required: true },

    // ⭐ NYT: mængde (m2, lbm, stk)
    amount: { type: Number, default: 0 },

    // brugerens valg
    quantity: { type: Number, default: 1 },

    frequency: {
        type: String,
        enum: Object.values(frequencies),
        required: true
    },

    days: {
        type: [String],
        enum: Object.values(days),
        default: []
    },

    // specialpris pr. gang (underleverandør, særpris, fast pris)
    customPrice: { type: Number, default: null },

    // systemfelter
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CleaningTask", cleaningTaskSchema);
