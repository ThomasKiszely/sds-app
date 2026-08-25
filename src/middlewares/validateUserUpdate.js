const { userRoles } = require("../utils/userRoles");

function validateUserUpdate(req, res, next) {
    const { fullName, role, position, phoneNumber, email, address } = req.body;

    const forbidden = /[<>\/\\{}$]/;

    // --- fullName ---
    if (fullName !== undefined) {
        if (typeof fullName !== "string") {
            return next(new Error("Ugyldigt fuldt navn"));
        }
        if (fullName.trim().length === 0) {
            return next(new Error("Fuldt navn må ikke være tomt"));
        }
        if (fullName.length > 100) {
            return next(new Error("Fuldt navn er for langt"));
        }
        if (forbidden.test(fullName)) {
            return next(new Error("Fuldt navn indeholder ugyldige tegn"));
        }
    }

    // --- role ---
    if (role !== undefined) {
        if (typeof role !== "string") {
            return next(new Error("Ugyldig rolle-type"));
        }
        if (!Object.values(userRoles).includes(role)) {
            return next(new Error("Ugyldig rolle"));
        }
    }

    // --- position ---
    if (position !== undefined) {
        if (typeof position !== "string" || position.trim().length === 0) {
            return next(new Error("Ugyldig stilling"));
        }
        if (forbidden.test(position)) {
            return next(new Error("Stilling indeholder ugyldige tegn"));
        }
    }

    // --- phoneNumber ---
    if (phoneNumber !== undefined) {
        const phoneRegex = /^[0-9+\-\s]{5,20}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return next(new Error("Ugyldigt telefonnummer"));
        }
    }

    // --- email ---
    if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new Error("Ugyldig email"));
        }
    }

    // --- address ---
    if (address !== undefined) {
        if (typeof address !== "string" || address.trim().length === 0) {
            return next(new Error("Ugyldig adresse"));
        }
        if (forbidden.test(address)) {
            return next(new Error("Adresse indeholder ugyldige tegn"));
        }
    }

    next();
}

module.exports = { validateUserUpdate };
