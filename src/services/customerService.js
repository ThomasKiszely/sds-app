const customerRepo = require("../data/customerRepo");
const planRepo = require("../data/cleaningPlanRepo");
const { validateCVR } = require("../utils/validateCVR");
const { validateCustomerNumber } = require("../utils/validateCustomerNumber");
const { userError, ensureExists } = require("../utils/userError");

const locationRepo = require("../data/locationRepo");

async function createCustomer(data) {
    // Trim
    data.customerNumber = data.customerNumber?.trim();
    data.customerName = data.customerName.trim();
    data.customerEmail = data.customerEmail.trim();
    data.phoneNumber = data.phoneNumber.trim();
    data.billingAddress = data.billingAddress.trim();
    data.customerAddress = data.customerAddress.trim();
    data.contactPerson.name = data.contactPerson.name.trim();
    data.contactPerson.email = data.contactPerson.email.trim();
    data.contactPerson.phone = data.contactPerson.phone.trim();

    // Kundenummer
    if (!validateCustomerNumber(data.customerNumber)) {
        throw userError("Kundenummer skal være 8 cifre", 400);
    }

    // CVR
    if (data.cvr && !validateCVR(data.cvr)) {
        throw userError("CVR er ugyldig", 400);
    }

    // 1) Opret kunden
    const customer = await customerRepo.createCustomer(data);

    // 2) Opret default lokation
    await locationRepo.createLocation({
        customerId: customer._id,
        name: customer.customerName,          // fx "Zenvo"
        address: customer.customerAddress,    // kundens adresse
        contactPerson: customer.contactPerson // samme kontaktperson
    });

    return customer;
}


async function getCustomerById(id) {
    const customer = await customerRepo.getCustomerById(id);
    ensureExists(customer, "Kunde findes ikke", 404);
    return customer.toObject();
}

async function updateCustomer(id, data) {
    const customer = await customerRepo.getCustomerById(id);
    ensureExists(customer, "Kunde findes ikke", 404);

    // Trim
    if (data.customerName) data.customerName = data.customerName.trim();
    if (data.customerEmail) data.customerEmail = data.customerEmail.trim();
    if (data.phoneNumber) data.phoneNumber = data.phoneNumber.trim();

    const updated = await customerRepo.updateCustomer(id, data);
    return updated.toObject();
}

async function deleteCustomer(id) {
    const customer = await customerRepo.getCustomerById(id);
    ensureExists(customer, "Kunde findes ikke", 404);

    await customerRepo.softDeleteCustomer(id);
}

async function listCustomers(filter, search, sort, page, pageSize, city, zip, contact, notes) {
    const { customers, total } = await customerRepo.listCustomers({
        filter,
        search,
        sort,
        page,
        pageSize,
        city,
        zip,
        contact,
        notes
    });

    return {
        customers: customers.map(c => c.toObject()),
        total
    };
}




async function getPlansForCustomer(customerId) {
    return planRepo.findByCustomerId(customerId);
}

async function reactivateCustomer(id) {
    const customer = await customerRepo.getCustomerById(id);
    ensureExists(customer, "Kunde findes ikke", 404);

    return customerRepo.updateCustomer(id, { isDeleted: false });
}

async function getActiveCustomers() {
    return await customerRepo.getActiveCustomers();
}

module.exports = {
    createCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    listCustomers,
    getPlansForCustomer,
    reactivateCustomer,
    getActiveCustomers
};
