const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const locationController = require("../controllers/locationController");
const { validateLocation } = require("../middlewares/validateLocation");
const { lookupLimiter } = require('../middlewares/lookupLimiter');
const { validateObjectId } = require("../middlewares/validateObjectId");
const { requireRole } = require("../middlewares/requireRole");
const { roleGroups } = require("../utils/userRoles");

// Planner må kun læse kunder og deres planer. Ændringer og oprettelse kræver salg.
const requireSales = requireRole(...roleGroups.sales);

// CUSTOMER DETAILS
router.get('/:id/details',
    validateObjectId("id"),
    customerController.customerDetails
);

// EDIT CUSTOMER FORM
router.get('/:id/edit',
    requireSales,
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
    requireSales,
    validateObjectId("customerId"),
    locationController.createLocationForm
);

// CREATE LOCATION (POST)
router.post("/:customerId/locations",
    requireSales,
    validateObjectId("customerId"),
    validateLocation,
    locationController.createLocation
);

// REACTIVATE CUSTOMER
router.put("/:id/reactivate",
    requireSales,
    validateObjectId("id"),
    customerController.reactivateCustomer
);

// DELETE CUSTOMER
router.delete('/:id',
    requireSales,
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
    requireSales,
    validateObjectId("id"),
    customerController.updateCustomer
);

// CREATE CUSTOMER (API)
router.post('/api',
    requireSales,
    customerController.createCustomer
);

// LIST CUSTOMERS
router.get('/',
    customerController.listCustomers
);

// CREATE CUSTOMER VIEW
router.post('/',
    requireSales,
    customerController.createCustomerView
);

module.exports = router;
