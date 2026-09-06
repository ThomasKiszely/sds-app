const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const locationController = require("../controllers/locationController");
const { validateLocation } = require("../middlewares/validateLocation");
const { lookupLimiter } = require('../middlewares/lookupLimiter');
const { validateObjectId } = require("../middlewares/validateObjectId");

// CUSTOMER DETAILS
router.get('/:id/details',
    validateObjectId("id"),
    customerController.customerDetails
);

// EDIT CUSTOMER FORM
router.get('/:id/edit',
    validateObjectId("id"),
    customerController.editCustomerForm
);

// CUSTOMER PLANS
router.get('/:id/plans',
    validateObjectId("id"),
    customerController.customerPlans
);

// CREATE LOCATION FORM
router.get("/:customerId/locations/create",
    validateObjectId("customerId"),
    locationController.createLocationForm
);

// CREATE LOCATION (POST)
router.post("/:customerId/locations",
    validateObjectId("customerId"),
    validateLocation,
    locationController.createLocation
);

// REACTIVATE CUSTOMER
router.put("/customers/:id/reactivate",
    validateObjectId("id"),
    customerController.reactivateCustomer
);

// DELETE CUSTOMER
router.delete('/:id',
    validateObjectId("id"),
    customerController.deleteCustomer
);

// GET CUSTOMER (lookup)
router.get('/:id',
    validateObjectId("id"),
    lookupLimiter,
    customerController.getCustomer
);

// UPDATE CUSTOMER
router.patch('/:id',
    validateObjectId("id"),
    customerController.updateCustomer
);

// CREATE CUSTOMER (API)
router.post('/api',
    customerController.createCustomer
);

// LIST CUSTOMERS
router.get('/',
    customerController.listCustomers
);

// CREATE CUSTOMER VIEW
router.post('/',
    customerController.createCustomerView
);

module.exports = router;
