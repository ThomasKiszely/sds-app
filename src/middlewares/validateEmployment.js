const { areas } = require("../utils/areas");
const { weekDays, weekDayLabels } = require("../utils/weekDays");
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
    const { hoursPerWeek, startDate } = req.body;
    const selectedAreas = toArray(req.body.areas);

    const employment = {};

    // --- timer pr. uge ---
    if (hoursPerWeek !== undefined && hoursPerWeek !== "") {
        const hours = Number(hoursPerWeek);
        if (!Number.isFinite(hours) || hours <= 0) {
            return next(userError("Kontrakttimer skal være større end 0", 400));
        }
        if (hours > 500) {
            return next(userError("Kontrakttimer må højst være 500", 400));
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

    // --- arbejdstider pr. dag ---
    const rawHours = req.body.workHours ?? {};

    if (typeof rawHours !== "object" || Array.isArray(rawHours)) {
        return next(userError("Ugyldige arbejdstider", 400));
    }

    const validDays = Object.values(weekDays);

    if (!Object.keys(rawHours).every(day => validDays.includes(day))) {
        return next(userError("Ugyldige arbejdsdage", 400));
    }

    const workHours = [];

    for (const day of validDays) {
        const hours = rawHours[day];
        if (!hours) continue;

        const {from, to} = hours;
        if (!timePattern.test(from) || !timePattern.test(to)) {
            return next(userError(`Tid skal skrives som TT:MM (${weekDayLabels[day]})`, 400));
        }
        // TT:MM kan sammenlignes som tekst
        if (to <= from) {
            return next(userError(`Til-tid skal være senere end fra-tid (${weekDayLabels[day]})`, 400));
        }
        workHours.push({day, from, to});
    }
    if (workHours.length > 0) {
        employment.workHours = workHours;
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
