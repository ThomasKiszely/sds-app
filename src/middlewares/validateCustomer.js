const { validateCVR } = require("../utils/validateCVR");
const { normalizeAddress } = require("../utils/addressUtil");

function validateCustomer(req, res, next) {
    const data = req.body;

    const required = [
        "customerName",
        "phoneNumber",
        "customerEmail",
        "cvr",
        "billingAddress",
        "customerAddress"
    ];

    for (const field of required) {
        if (!data[field]) {
            return next({ isUserError: true, message: `Mangler felt: ${field}` });
        }
    }

    if (!data.contactPerson ||
        !data.contactPerson.name ||
        !data.contactPerson.phone ||
        !data.contactPerson.email) {

        return next({ isUserError: true, message: "Kontaktperson mangler felter" });
    }

    if (!validateCVR(data.cvr)) {
        return next({ isUserError: true, message: "CVR er ugyldig" });
    }

    // Normaliser adresser (tilføj komma hvis nødvendigt)
    data.customerAddress = normalizeAddress(data.customerAddress);
    data.billingAddress = normalizeAddress(data.billingAddress);

    next();
}

module.exports = validateCustomer;
