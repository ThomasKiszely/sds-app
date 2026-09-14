const { userError } = require("../utils/userError");

function validateObjectId(paramName) {
    return function (req, res, next) {
        const id = req.params[paramName];
        console.log("validateObjectId", id);

        // Hvis HTMX har sendt en request uden params
        // → så må vi IKKE blokere, men returnere en userError
        if (!id) {
            return next(userError(`Mangler ID i URL (${paramName})`, 400));
        }

        // Fjern farlige tegn
        const cleaned = String(id).trim();

        // Gyldigt MongoDB ObjectId?
        const isValid = /^[0-9a-fA-F]{24}$/.test(cleaned);

        if (!isValid) {
            return next(userError(`Ugyldigt ID: ${paramName}`, 400));
        }

        // Sæt det rensede ID tilbage
        req.params[paramName] = cleaned;

        next();
    };
}

module.exports = { validateObjectId };
