const Customer = require('../models/Customer');

async function createCustomer(data) {
    console.log(data);
    const newCustomer = new Customer(data);
    return await newCustomer.save();
}

async function getCustomerById(id) {
    return Customer.findOne({ _id: id, isDeleted: false });
}

async function updateCustomer(id, data) {
    return Customer.findOneAndUpdate(
        { _id: id, isDeleted: false },
        data,
        { returnDocument: 'after', runValidators: true }
    );
}

async function softDeleteCustomer(id) {
    return Customer.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { returnDocument: 'after', runValidators: true }
    );
}

async function listCustomers({ filter, search, sort, page, pageSize }) {
    const query = {};

    // Filter
    if (filter === "active") query.isDeleted = false;
    if (filter === "inactive") query.isDeleted = true;

    // Intelligent søgning (ét felt)
    if (search) {
        const regex = new RegExp(search, "i");

        const orConditions = [
            { customerName: regex },
            { customerAddress: regex },
            { billingAddress: regex },
            { phoneNumber: regex },
            { customerEmail: regex },
            { customerNumber: regex },
            { city: regex },
            { contactPerson: regex },
            { notes: regex }
        ];

        // Hvis søgeordet er et tal → søg i CVR, zip, kundenummer
        if (!isNaN(search)) {
            const num = Number(search);
            orConditions.push({ cvr: num });
            orConditions.push({ zip: num });
            orConditions.push({ customerNumber: num });
        }

        query.$or = orConditions;
    }

    // Sortering
    const sortMap = {
        name: { customerName: 1 },
        number: { customerNumber: 1 },
        address: { customerAddress: 1 },
        phone: { phoneNumber: 1 }
    };

    const skip = (page - 1) * pageSize;

    const customers = await Customer.find(query)
        .sort(sortMap[sort] || sortMap.name)
        .skip(skip)
        .limit(pageSize);

    const total = await Customer.countDocuments(query);

    return { customers, total };
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
