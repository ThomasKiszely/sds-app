const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({

    // Reference til det accepterede tilbud
    offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        required: true
    },

    // Snapshot af hele tilbuddet (plan + tasks)
    snapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    // Underskriftsinformation
    signedByName: String,
    signedByEmail: String,
    signedAt: Date,

    // Token til verificering (samme som i Offer)
    signatureToken: String

}, {
    timestamps: true
});

module.exports = mongoose.model("Contract", contractSchema);
