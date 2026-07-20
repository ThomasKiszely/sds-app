const express = require('express');
const router = express.Router();
const cleaningTaskController = require('../controllers/cleaningTaskController');


router.get('/archived', cleaningTaskController.getDeletedCleaningTasks);
router.patch('/:id/reactivate', cleaningTaskController.reactivateCleaningTask);
router.put('/:id', cleaningTaskController.updateCleaningTask);
router.delete('/:id', cleaningTaskController.deleteCleaningTask);
router.get('/:id', cleaningTaskController.findCleaningTaskById);
router.post('/', cleaningTaskController.createCleaningTask);
router.get('/', cleaningTaskController.listCleaningTasks);

module.exports = router;