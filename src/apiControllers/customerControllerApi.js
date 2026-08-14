const customerService = require("../services/customerService");

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
        const customer = await customerService.updateCustomer(req.params.id, req.body);
        return res.status(200).json({ success: true, customer });
    } catch (error) {
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





module.exports = {
    createCustomer,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    reactivateCustomer,
};
