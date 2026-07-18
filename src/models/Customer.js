const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerNumber: { type: String, unique: true },
    customerName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    customerEmail: { type: String, required: true },
    cvr: { type: Number, required: true },
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

//Pre-save schema så den automatisk opretter kundenummer
customerSchema.pre('save', async function(next) {
    // Hvis kundenummer allerede er sat (fx ved import), så skip
    if (this.customerNumber) {
        return next();
    }

    // Find sidste kunde
    const lastCustomer = await mongoose.model('Customer')
        .findOne({})
        .sort({ customerNumber: -1 })
        .exec();

    // Udregn næste nummer
    const nextNumber = lastCustomer
        ? parseInt(lastCustomer.customerNumber) + 1
        : 1;

    // Pad med nuller: 000001
    this.customerNumber = String(nextNumber).padStart(6, '0');

    next();
});


module.exports = mongoose.model('Customer', customerSchema);
