const locationService = require("../services/locationService");
const customerService = require("../services/customerService");


async function createLocation(req, res, next) {
    try {
        const customerId = req.params.customerId;

        // Opret lokation
        const location = await locationService.createLocation(customerId, req.body);

        // Hent kunden + alle lokationer igen
        const customer = await customerService.getCustomerById(customerId);
        const locations = await locationService.getLocationsForCustomer(customerId);

        // Toast
        res.setHeader("HX-Trigger", JSON.stringify({ toast: "Lokation oprettet" }));

        // Render kundedetaljer med lokationer
        return res.render("customers/details", {
            customer,
            locations,
            user: req.session.user
        });

    } catch (error) {
        if (error.isUserError) {
            res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
            return res.status(error.status).end();
        }

        next(error);
    }
}


async function getLocation(req, res, next) {
    try {
        const location = await locationService.getLocationById(req.params.id);
        return res.status(200).json({ success: true, location });
    } catch (error) {
        next(error);
    }
}

async function updateLocation(req, res, next) {
    try {
        const updated = await locationService.updateLocation(req.params.id, req.body);

        res.setHeader("HX-Trigger", JSON.stringify({ toast: "Lokation opdateret" }));

        return res.render("locations/details", {
            location: updated,
            user: req.session.user
        });

    } catch (error) {
        if (error.isUserError) {
            res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
            return res.status(error.status).end();
        }

        next(error);
    }
}

async function deleteLocation(req, res, next) {
    try {
        const locationId = req.params.id;

        const location = await locationService.getLocationById(locationId);
        const customerId = location.customerId;

        await locationService.deleteLocation(locationId);

        const locations = await locationService.getLocationsForCustomer(customerId);

        return res.render("locations/list", {
            locations,
            customerId,
            user: req.session.user
        });

    } catch (error) {
        next(error);
    }
}


async function listLocations(req, res, next) {
    try {
        const customerId = req.params.customerId;
        const locations = await locationService.getLocationsForCustomer(customerId);

        return res.render("locations/list", {
            locations,
            customerId,
            user: req.session.user
        });
    } catch (error) {
        next(error);
    }
}

async function createLocationForm(req, res, next) {
    try {
        const customerId = req.params.customerId;
        const customer = await customerService.getCustomerById(customerId);

        return res.render("locations/create", {
            customer,
            customerId,
            user: req.session.user
        });
    } catch (error) {
        next(error);
    }
}

async function editLocationForm(req, res, next) {
    try {
        const location = await locationService.getLocationById(req.params.id);

        return res.render("locations/edit", {
            location,
            user: req.session.user
        });
    } catch (error) {
        next(error);
    }
}

async function locationDetails(req, res, next) {
    try {
        const location = await locationService.getLocationById(req.params.id);

        return res.render("locations/details", {
            location,
            user: req.session.user
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createLocation,
    getLocation,
    updateLocation,
    deleteLocation,

    listLocations,
    createLocationForm,
    editLocationForm,
    locationDetails
};
