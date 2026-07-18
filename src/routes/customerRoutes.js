const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middlewares/requireLogin');
const customerController = require('../controllers/CustomerController');

router.get('/', requireLogin, customerController.listCustomers);
router.get('/:id', requireLogin, customerController.getCustomer);
router.post('/', requireLogin, customerController.createCustomer);
router.patch('/:id', requireLogin, customerController.updateCustomer);
router.delete('/:id', requireLogin, customerController.deleteCustomer);

module.exports = router;
