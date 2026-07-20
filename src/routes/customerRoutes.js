const express = require('express');
const router = express.Router();
const customerController = require('../controllers/CustomerController');

router.delete('/:id', customerController.deleteCustomer);
router.get('/:id', customerController.getCustomer);
router.patch('/:id', customerController.updateCustomer);
router.get('/', customerController.listCustomers);
router.post('/', customerController.createCustomer);

module.exports = router;
