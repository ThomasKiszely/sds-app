const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomTypeController');
const validateRoomType = require('../middlewares/validateRoomType');
const {requireAdmin} = require('../middlewares/requireAdmin');
const {validateObjectId} = require('../middlewares/validateObjectId');

router.get('/', requireAdmin, roomTypeController.listRoomTypes);
router.post('/', requireAdmin, validateRoomType, roomTypeController.createRoomType);
router.put('/:id', requireAdmin, validateObjectId('id'), validateRoomType, roomTypeController.renameRoomType);
router.delete('/:id', requireAdmin, validateObjectId('id'), roomTypeController.deleteRoomType);

module.exports = router;