const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middlewares/requireLogin');
const customerController = require('../controllers/CustomerController');

router.delete('/:id', requireLogin, customerController.deleteCustomer);
router.get('/:id', requireLogin, customerController.getCustomer);
router.patch('/:id', requireLogin, customerController.updateCustomer);
router.get('/', requireLogin, customerController.listCustomers);
router.post('/', requireLogin, customerController.createCustomer);

module.exports = router;
