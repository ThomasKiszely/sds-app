const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const locationController = require("../controllers/locationController");
const {validateLocation} = require("../middlewares/validateLocation");

router.get('/:id/details', customerController.customerDetails);
router.get('/:id/edit', customerController.editCustomerForm);
router.get('/:id/plans', customerController.customerPlans);
router.get("/:customerId/locations/create", locationController.createLocationForm);
router.post("/:customerId/locations", validateLocation, locationController.createLocation);
router.put("/customers/:id/reactivate", customerController.reactivateCustomer);

router.delete('/:id', customerController.deleteCustomer);
router.get('/:id', customerController.getCustomer);
router.patch('/:id', customerController.updateCustomer);
router.post('/api', customerController.createCustomer);
router.get('/', customerController.listCustomers);
router.post('/', customerController.createCustomerView);


module.exports = router;
