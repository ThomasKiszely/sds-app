const Location = require("../models/Location");

async function createLocation(data) {
    return Location.create(data);
}

async function getLocationById(id) {
    return Location.findById(id);
}

async function getLocationsForCustomer(customerId) {
    return Location.find({ customerId }).sort({ name: 1 });
}

async function updateLocation(id, data) {
    return Location.findByIdAndUpdate(
        id,
        data,
        { returnDocument: 'after', runValidators: true }
    );
}

async function deleteLocation(id) {
    return Location.findByIdAndDelete(id);
}

module.exports = {
    createLocation,
    getLocationById,
    getLocationsForCustomer,
    updateLocation,
    deleteLocation
};
