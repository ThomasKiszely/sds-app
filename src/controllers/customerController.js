const customerService = require("../services/customerService");

async function createCustomer(req, res, next) {
    try {
        const customer = await customerService.createCustomer(req.body);
        res.status(201).json({ success: true, customer });
    } catch (error) {
        next(error);
    }
}

async function getCustomer(req, res, next) {
    try {
        const customer = await customerService.getCustomerById(req.params.id);

        res.status(200).json({ success: true, customer });
    } catch (error) {
        next(error);
    }
}

async function updateCustomer(req, res, next) {
    try {
        const customer = await customerService.updateCustomer(req.params.id, req.body);

        res.status(200).json({ success: true, customer });
    } catch (error) {
        next(error);
    }
}

async function deleteCustomer(req, res, next) {
    try {
        const customer = await customerService.deleteCustomer(req.params.id);

        res.status(200).json({
            success: true,
            message: "Kunde arkiveret",
            customer,
        });
    } catch (error) {
        next(error);
    }
}

async function listCustomers(req, res, next) {
    try {
        const customers = await customerService.listCustomers();
        res.status(200).json({ success: true, customers });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCustomer,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    listCustomers
};
