const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/:id/details', customerController.customerDetails);
router.get('/:id/edit', customerController.editCustomerForm);
router.get('/:id/plans', customerController.customerPlans);
router.put("/customers/:id/reactivate", customerController.reactivateCustomer);

router.delete('/:id', customerController.deleteCustomer);
router.get('/:id', customerController.getCustomer);
router.patch('/:id', customerController.updateCustomer);
router.post('/api', customerController.createCustomer);
router.get('/', customerController.listCustomers);
router.post('/', customerController.createCustomerView);


module.exports = router;
