const locationRepo = require("../data/locationRepo");
const customerRepo = require("../data/customerRepo");
const { ensureExists, userError } = require("../utils/userError");

async function createLocation(customerId, data) {
    // Tjek at kunden findes
    const customer = await customerRepo.getCustomerById(customerId);
    ensureExists(customer, "Kunde findes ikke", 404);

    // Trim
    data.name = data.name.trim();
    data.address = data.address.trim();

    if (data.contactPerson) {
        data.contactPerson.name = data.contactPerson.name?.trim();
        data.contactPerson.phone = data.contactPerson.phone?.trim();
        data.contactPerson.email = data.contactPerson.email?.trim();
    }

    // Opret lokation
    return locationRepo.createLocation({
        customerId,
        ...data
    });
}

async function getLocationById(id) {
    const location = await locationRepo.getLocationById(id);
    ensureExists(location, "Lokation findes ikke", 404);
    return location.toObject();
}

async function getLocationsForCustomer(customerId) {
    return locationRepo.getLocationsForCustomer(customerId);
}

async function updateLocation(id, data) {
    const location = await locationRepo.getLocationById(id);
    ensureExists(location, "Lokation findes ikke", 404);

    // Trim
    if (data.name) data.name = data.name.trim();
    if (data.address) data.address = data.address.trim();

    if (data.contactPerson) {
        if (data.contactPerson.name) data.contactPerson.name = data.contactPerson.name.trim();
        if (data.contactPerson.phone) data.contactPerson.phone = data.contactPerson.phone.trim();
        if (data.contactPerson.email) data.contactPerson.email = data.contactPerson.email.trim();
    }

    const updated = await locationRepo.updateLocation(id, data);
    return updated.toObject();
}

async function deleteLocation(id) {
    const location = await locationRepo.getLocationById(id);
    ensureExists(location, "Lokation findes ikke", 404);

    return locationRepo.deleteLocation(id);
}

module.exports = {
    createLocation,
    getLocationById,
    getLocationsForCustomer,
    updateLocation,
    deleteLocation
};
