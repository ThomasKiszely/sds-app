const Customer = require('../models/Customer');

async function createCustomer(data) {
    const newCustomer = new Customer(data)
    return await newCustomer.save();
}

async function getCustomerById(id) {
    return Customer.findOne({ _id: id, isDeleted: false });
}

async function updateCustomer(id, data) {
    return Customer.findOneAndUpdate(
        { _id: id, isDeleted: false },
        data,
        { new: true, runValidators: true }
    );
}

async function softDeleteCustomer(id) {
    return Customer.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true, runValidators: true }
    );
}

async function listCustomers() {
    return Customer.find({ isDeleted: false });
}

async function findByCustomerNumber(customerNumber) {
    return Customer.findOne({ customerNumber, isDeleted: false });
}


module.exports = {
    createCustomer,
    getCustomerById,
    updateCustomer,
    softDeleteCustomer,
    listCustomers,
    findByCustomerNumber,
};
