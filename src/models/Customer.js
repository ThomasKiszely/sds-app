const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerNumber: {
        type: String,
        required: true,
        unique: true,
        match: /^\d{8}$/ // 8 cifre
    },
    customerName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    customerEmail: { type: String, required: true },
    cvr: { type: Number, default: null },
    contactPerson: {
        name: {type: String, required: true},
        phone: {type: String, required: true},
        email: {type: String, required: true},
    },
    billingAddress: { type: String, required: true },
    customerAddress: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Customer', customerSchema);
