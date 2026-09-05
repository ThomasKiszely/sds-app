const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAdmin } = require('../middlewares/requireAdmin');
const { validateCreateUser } = require('../middlewares/validateCreateUser');
const { validateUserId } = require('../middlewares/validateUserId');
const { validateUserUpdate } = require('../middlewares/validateUserUpdate');
const { validateLogin } = require('../middlewares/validateLogin');
const { requireLogin } = require('../middlewares/requireLogin');
const { lookupLimiter } = require('../middlewares/lookupLimiter');


router.post('/logout', requireLogin, userController.logout);
router.post('/login', validateLogin, userController.login);
router.post('/me/password', requireLogin, userController.changePassword);
router.get('/:id/edit', requireAdmin, validateUserId, userController.editUser);
router.patch('/:id/reset-password', requireAdmin, validateUserId, userController.resetPassword);
router.patch('/:id/reactivate', requireAdmin, validateUserId, userController.reactivateUser );
router.patch('/:id/role', requireAdmin, validateUserId, userController.updateUserRole);
router.patch('/:id/user', requireAdmin, validateUserId, validateUserUpdate, userController.updateUser);
router.delete('/:id/permanent', requireAdmin, validateUserId, userController.deleteUser);
router.delete('/:id', requireAdmin, validateUserId, userController.deactivateUser);
router.get('/:id', requireAdmin, validateUserId, lookupLimiter, userController.getUserById);

router.get('/', requireAdmin, userController.listUsers);

router.post('/', requireAdmin, validateCreateUser, userController.createUser);
module.exports = router;