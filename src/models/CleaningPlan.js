const mongoose = require("mongoose");

const cleaningPlanSchema = new mongoose.Schema({
    // Reference til Location
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
        required: true
    },

    // Navn på planen (fx "Daglig rengøring", "Vinduespudsning", "Total rengøringsplan")
    name: {
        type: String,
        required: true
    },

    // Beskrivelse (valgfri)
    description: {
        type: String
    },

    // Total pris for hele planen (beregnes ud fra CleaningTasks)
    totalPrice: {
        type: Number,
        default: 0
    },

    hourlyRate: {
        type: Number,
        required: true
    },

    acceptedOfferId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        default: null
    },

    acceptedAt: {
        type: Date,
        default: null
    },

    acceptedByName: {
        type: String,
        default: null
    },

    acceptedByEmail: {
        type: String,
        default: null
    },

    // Metadata
    isActive: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("CleaningPlan", cleaningPlanSchema);
