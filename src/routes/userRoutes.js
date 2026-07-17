const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { requireAdmin } = require('../middlewares/requireAdmin');
const { validateCreateUser } = require('../middlewares/validateCreateUser');
const { validateUserId } = require('../middlewares/validateUserId');
const { validateUserUpdate } = require('../middlewares/validateUserUpdate');
const { validateLogin } = require('../middlewares/validateLogin');
const { requireLogin } = require('../middlewares/requireLogin');

//Husk nu for helvede rækkefølgen... De mere specifikke først...

router.post('/:id', requireAdmin, validateUserId, userController.reactivateUser );
router.patch('/:id', requireAdmin, validateUserId, validateUserUpdate, userController.updateUser);
router.patch('/me/password', userController.changePassword);
router.patch('/:id/reset-password', requireAdmin, validateUserId, userController.resetPassword);
router.delete('/:id', requireAdmin, validateUserId, userController.deactivateUser);
router.get('/:id', requireAdmin, validateUserId, userController.getUserById);
router.post('/login', validateLogin, userController.login);
router.post('/logout', requireLogin, userController.logout);
router.get('/', requireAdmin, userController.listUsers);

router.post('/', requireAdmin, validateCreateUser, userController.createUser);
module.exports = router;