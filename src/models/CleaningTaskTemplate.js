const mongoose = require("mongoose");
const { categoryTypes } = require("../utils/categoryEnum");
const { units } = require("../utils/unitEnum");

const cleaningTaskTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },

    category: {
        type: String,
        enum: Object.values(categoryTypes),
        required: true
    },

    defaultDuration: { type: Number, default: 0 }, // minutter
    defaultPrice: { type: Number, default: 0 },    // pris pr. gang

    unit: {
        type: String,
        enum: Object.values(units),
        default: "none"
    },

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CleaningTaskTemplate", cleaningTaskTemplateSchema);
