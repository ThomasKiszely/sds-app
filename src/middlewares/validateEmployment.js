const { areas } = require("../utils/areas");
const { weekDays } = require("../utils/weekDays");
const { userError } = require("../utils/userError");

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

// Checkbokse sender en streng ved ét valg og et array ved flere
function toArray(value) {
    if (value === undefined || value === "") return [];
    return Array.isArray(value) ? value : [value];
}

/**
 * Samler de flade formularfelter til req.body.employment
 * og validerer dem. Køres efter validateCreateUser.
 */
function validateEmployment(req, res, next) {
    const { hoursPerWeek, startDate, workFrom, workTo } = req.body;
    const workDays = toArray(req.body.workDays);
    const selectedAreas = toArray(req.body.areas);

    const employment = {};

    // --- timer pr. uge ---
    if (hoursPerWeek !== undefined && hoursPerWeek !== "") {
        const hours = Number(hoursPerWeek);
        if (!Number.isFinite(hours) || hours <= 0 || hours > 60) {
            return next(userError("Timer pr. uge skal være mellem 1 og 60", 400));
        }
        employment.hoursPerWeek = hours;
    }

    // --- startdato ---
    if (startDate !== undefined && startDate !== "") {
        const date = new Date(startDate);
        if (Number.isNaN(date.getTime())) {
            return next(userError("Ugyldig startdato", 400));
        }
        employment.startDate = date;
    }

    // --- arbejdsdage ---
    if (!workDays.every(d => Object.values(weekDays).includes(d))) {
        return next(userError("Ugyldig arbejdsdag", 400));
    }
    if (workDays.length > 0) {
        employment.workDays = workDays;
    }

    // --- arbejdstid ---
    const hasFrom = workFrom !== undefined && workFrom !== "";
    const hasTo = workTo !== undefined && workTo !== "";
    if (hasFrom !== hasTo) {
        return next(userError("Udfyld både Fra og Til", 400));
    }
    if (hasFrom) {
        if (!timePattern.test(workFrom) || !timePattern.test(workTo)) {
            return next(userError("Tid skal skrives som TT:MM", 400));
        }
        if (workFrom >= workTo) {
            return next(userError("Fra skal være før Til", 400));
        }
        employment.workFrom = workFrom;
        employment.workTo = workTo;
    }

    // --- områder ---
    if (!selectedAreas.every(a => Object.values(areas).includes(a))) {
        return next(userError("Ugyldigt område", 400));
    }
    if (selectedAreas.length > 0) {
        employment.areas = selectedAreas;
    }

    req.body.employment = Object.keys(employment).length > 0 ? employment : undefined;
    next();
}

module.exports = { validateEmployment };
