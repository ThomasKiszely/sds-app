const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { requireAdmin } = require('../middlewares/requireAdmin');
const { validateCreateUser } = require('../middlewares/validateCreateUser');
const { validateUserId } = require('../middlewares/validateUserId');

//Husk nu for helvede rækkefølgen... De mere specifikke først...

router.post('/:id', requireAdmin, validateUserId, userController.reactivateUser );
router.delete('/:id', requireAdmin, validateUserId, userController.deactivateUser);

router.post('/', requireAdmin, validateCreateUser, userController.createUser);
module.exports = router;