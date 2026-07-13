const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

//Husk nu for helvede rækkefølgen... De mere specifikke først...

router.get('/', UserController.getAll);
module.exports = router;