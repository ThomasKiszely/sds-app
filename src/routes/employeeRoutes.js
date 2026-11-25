const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { validateCreateUser } = require('../middlewares/validateCreateUser');
const { validateEmployment } = require('../middlewares/validateEmployment');

// Adgang (admin + planner) sættes, hvor routeren monteres i app.js.
// Hvilke roller man må oprette, afgøres i userService.canManage.

// Tomme valgfri felter fra formularen fjernes, så de ikke valideres som ugyldige
function dropEmptyOptionalFields(req, res, next) {
    for (const field of ['phoneNumber', 'email', 'position', 'address']) {
        if (typeof req.body[field] === 'string' && req.body[field].trim() === '') {
            delete req.body[field];
        }
    }
    next();
}

router.get('/', employeeController.listEmployees);
router.get('/create', employeeController.showCreateForm);
router.post('/',
    dropEmptyOptionalFields,
    validateCreateUser,
    validateEmployment,
    employeeController.createEmployee
);

module.exports = router;
