const customerService = require("../services/customerService");
const cleaningPlanService = require("../services/cleaningPlanService");

// -----------------------------
// API ENDPOINTS (JSON)
// -----------------------------

async function createCustomer(req, res, next) {
    try {
        const customer = await customerService.createCustomer(req.body);
        return res.status(201).json({ success: true, customer });
    } catch (error) {
        next(error);
    }
}

async function getCustomer(req, res, next) {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        return res.status(200).json({ success: true, customer });
    } catch (error) {
        next(error);
    }
}

async function updateCustomer(req, res, next) {
    try {
        const updated = await customerService.updateCustomer(req.params.id, req.body);

        // HTMX toast
        res.setHeader("HX-Trigger", JSON.stringify({ toast: "Kunde opdateret" }));

        // Render kundedetaljer
        return res.render("customers/details", {
            customer: updated,
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


async function deleteCustomer(req, res, next) {
    try {
        await customerService.deleteCustomer(req.params.id);

        const filter = req.query.filter || "active";
        const search = req.query.search || "";
        const sort = req.query.sort || "name";

        const customers = await customerService.listCustomers(filter, search, sort);

        return res.render("customers/list", {
            customers,
            user: req.session.user,
            filter,
            search,
            sort
        });
    } catch (error) {
        next(error);
    }
}

async function reactivateCustomer(req, res, next) {
    try {
        await customerService.reactivateCustomer(req.params.id);

        const filter = req.query.filter || "inactive";
        const search = req.query.search || "";
        const sort = req.query.sort || "name";

        const customers = await customerService.listCustomers(filter, search, sort);

        return res.render("customers/list", {
            customers,
            user: req.session.user,
            filter,
            search,
            sort
        });
    } catch (error) {
        next(error);
    }
}


// -----------------------------
// VIEW ENDPOINTS (HTMX + EJS)
// -----------------------------

/*async function listCustomers(req, res, next) {
    try {
        const customers = await customerService.listCustomers();
        return res.render("customers/list", {
            customers,
            user: req.session.user
        });
    } catch (error) {
        next(error);
    }
}*/

async function listCustomers(req, res, next) {
    try {
        const filter = req.query.filter || "active";
        const search = req.query.search || "";
        const sort = req.query.sort || "name";
        const page = Number(req.query.page) || 1;
        const pageSize = 20;

        const { customers, total } = await customerService.listCustomers(
            filter,
            search,
            sort,
            page,
            pageSize
        );

        return res.render("customers/list", {
            customers,
            user: req.session.user,
            filter,
            search,
            sort,
            page,
            pageSize,
            total
        });
    } catch (error) {
        next(error);
    }
}




async function customerDetails(req, res, next) {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        return res.render("customers/details", { customer });
    } catch (error) {
        next(error);
    }
}

async function editCustomerForm(req, res, next) {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        return res.render("customers/edit", { customer });
    } catch (error) {
        next(error);
    }
}

async function customerPlans(req, res, next) {
    try {
        const customerId = req.params.id;

        const plans = await cleaningPlanService.getPlansForCustomer(customerId);

        return res.render("customers/plans", {
            customerId,
            plans,
            user: req.session.user
        });

    } catch (err) {
        next(err);
    }
}

async function createCustomerView(req, res, next) {
    try {
        const customer = await customerService.createCustomer(req.body);
        const customers = await customerService.listCustomers();

        if ( req.body.flow === "newPlan") {
            return res.redirect(`/newPlan/plan?customerId=${customer._id}`)
        }

        return res.render("customers/list", { customers, user: req.session.user });
    } catch (error) {
        return res.status(400).send(error.message);
    }
}



module.exports = {
    // API
    createCustomer,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    reactivateCustomer,

    // Views
    listCustomers,
    customerDetails,
    editCustomerForm,
    customerPlans,
    createCustomerView,
};
