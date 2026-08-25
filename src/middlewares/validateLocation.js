const { userError } = require("../utils/userError");

function validateLocation(req, res, next) {
    const { name, address, contactPerson } = req.body;

    const forbidden = /[<>\/\\{}$]/;

    // --- name ---
    if (name !== undefined) {
        if (typeof name !== "string") {
            return next(userError("Ugyldigt lokationsnavn", 400));
        }
        if (name.trim().length === 0) {
            return next(userError("Lokationsnavn må ikke være tomt", 400));
        }
        if (name.length > 100) {
            return next(userError("Lokationsnavn er for langt", 400));
        }
        if (forbidden.test(name)) {
            return next(userError("Lokationsnavn indeholder ugyldige tegn", 400));
        }
    }

    // --- address ---
    if (address !== undefined) {
        if (typeof address !== "string") {
            return next(userError("Ugyldig adresse", 400));
        }
        if (address.trim().length === 0) {
            return next(userError("Adresse må ikke være tom", 400));
        }
        if (address.length > 200) {
            return next(userError("Adresse er for lang", 400));
        }
        if (forbidden.test(address)) {
            return next(userError("Adresse indeholder ugyldige tegn", 400));
        }
    }

    // --- contactPerson ---
    if (contactPerson !== undefined) {

        // name
        if (contactPerson.name !== undefined) {
            if (typeof contactPerson.name !== "string" || contactPerson.name.trim().length === 0) {
                return next(userError("Kontaktpersonens navn er ugyldigt", 400));
            }
            if (forbidden.test(contactPerson.name)) {
                return next(userError("Kontaktpersonens navn indeholder ugyldige tegn", 400));
            }
        }

        // phone
        if (contactPerson.phone !== undefined) {
            const phoneRegex = /^[0-9+\-\s]{5,20}$/;
            if (!phoneRegex.test(contactPerson.phone)) {
                return next(userError("Kontaktpersonens telefonnummer er ugyldigt", 400));
            }
        }

        // email
        if (contactPerson.email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contactPerson.email)) {
                return next(userError("Kontaktpersonens email er ugyldig", 400));
            }
        }
    }

    next();
}

module.exports = { validateLocation };
