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
    }
});

module.exports = mongoose.model('RoomTemplate', roomTemplateSchema);