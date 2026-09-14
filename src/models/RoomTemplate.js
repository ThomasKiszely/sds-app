const mongoose = require('mongoose');
const { bundleTypes } = require('../utils/bundleType');

const roomTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    defaultSize: {
        type: Number,
        required: true,
    },
    bundleType: {
        type: String,
        required: true,
        enum: Object.values(bundleTypes),
    },

    taskTemplateId: {
        daily: { type: mongoose.Schema.Types.ObjectId, ref: "CleaningTaskTemplate" },
        floor: { type: mongoose.Schema.Types.ObjectId, ref: "CleaningTaskTemplate" },
        inventory: { type: mongoose.Schema.Types.ObjectId, ref: "CleaningTaskTemplate" }
    }
});

module.exports = mongoose.model('RoomTemplate', roomTemplateSchema);
