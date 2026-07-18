const customerRepo = require("../data/customerRepo");
const { validateCVR } = require("../utils/validateCVR");

async function createCustomer(data) {
    data.customerName = data.customerName.trim();
    data.customerEmail = data.customerEmail.trim();
    data.phoneNumber = data.phoneNumber.trim();
    data.billingAddress = data.billingAddress.trim();
    data.customerAddress = data.customerAddress.trim();
    data.contactPerson.name = data.contactPerson.name.trim();
    data.contactPerson.email = data.contactPerson.email.trim();
    data.contactPerson.phone = data.contactPerson.phone.trim();

    // Unikt kundenummer
    const existingNumber = await customerRepo.findByCustomerNumber(data.customerNumber);
    if (existingNumber) {
        throw new Error("Kundenummer findes allerede");
    }

    // CVR skal være ægte
    if (!validateCVR(data.cvr)) {
        throw new Error("CVR er ugyldig");
    }

    // Create customer
    const customer = await customerRepo.createCustomer(data);

    return {
        id: customer._id,
        customerNumber: customer.customerNumber,
        customerName: customer.customerName,
        phoneNumber: customer.phoneNumber,
        customerEmail: customer.customerEmail,
        cvr: customer.cvr,
        contactPerson: customer.contactPerson,
        billingAddress: customer.billingAddress,
        customerAddress: customer.customerAddress,
        createdAt: customer.createdAt
    };
}

async function getCustomerById(id) {
    const customer = await customerRepo.getCustomerById(id);

    if (!customer) {
        throw new Error("Kunde findes ikke");
    }

    return {
        id: customer._id,
        customerNumber: customer.customerNumber,
        customerName: customer.customerName,
        phoneNumber: customer.phoneNumber,
        customerEmail: customer.customerEmail,
        cvr: customer.cvr,
        contactPerson: customer.contactPerson,
        billingAddress: customer.billingAddress,
        customerAddress: customer.customerAddress,
        createdAt: customer.createdAt
    };
}

async function updateCustomer(id, data) {
    const customer = await customerRepo.getCustomerById(id);
    if (!customer) {
        throw new Error("Kunde findes ikke");
    }

    // Trim input
    if (data.customerName) data.customerName = data.customerName.trim();
    if (data.customerEmail) data.customerEmail = data.customerEmail.trim();
    if (data.phoneNumber) data.phoneNumber = data.phoneNumber.trim();

    // Må cvr ændres??
    /*if (data.cvr && data.cvr !== customer.cvr) {
        throw new Error("CVR kan ikke ændres");
    }*/

    const updated = await customerRepo.updateCustomer(id, data);

    return {
        id: updated._id,
        customerNumber: updated.customerNumber,
        customerName: updated.customerName,
        phoneNumber: updated.phoneNumber,
        customerEmail: updated.customerEmail,
        cvr: updated.cvr,
        contactPerson: updated.contactPerson,
        billingAddress: updated.billingAddress,
        customerAddress: updated.customerAddress,
        createdAt: updated.createdAt
    };
}

async function deleteCustomer(id) {
    const customer = await customerRepo.getCustomerById(id);
    if (!customer) {
        throw new Error("Kunde findes ikke");
    }

    // Tjek om aktive ordrer??
    // if (await orderRepo.hasActiveOrders(id)) {
    //     throw new Error("Kunde har aktive ordrer og kan ikke slettes");
    // }

    await customerRepo.softDeleteCustomer(id);
}

async function listCustomers() {
    const customers = await customerRepo.listCustomers();

    return customers.map(c => ({
        id: c._id,
        customerNumber: c.customerNumber,
        customerName: c.customerName,
        phoneNumber: c.phoneNumber,
        customerEmail: c.customerEmail,
        cvr: c.cvr,
        contactPerson: c.contactPerson,
        billingAddress: c.billingAddress,
        customerAddress: c.customerAddress,
        createdAt: c.createdAt
    }));
}

module.exports = {
    createCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    listCustomers
};
