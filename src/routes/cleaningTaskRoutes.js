const express = require('express');
const router = express.Router();
const cleaningTaskController = require('../controllers/cleaningTaskController');
const validateCleaningTask = require('../middlewares/validateCleaningTask');

router.get('/:planId/tasks/archived', cleaningTaskController.getDeletedCleaningTasks);
router.patch('/:planId/tasks/:taskId/reactivate', cleaningTaskController.reactivateCleaningTask);

router.post('/:planId/tasks', validateCleaningTask, cleaningTaskController.createCleaningTask);
router.get('/:planId/tasks', cleaningTaskController.listCleaningTasks);
router.get('/:planId/tasks/:taskId', cleaningTaskController.findCleaningTaskById);
router.patch('/:planId/tasks/:taskId', validateCleaningTask, cleaningTaskController.updateCleaningTask);
router.delete('/:planId/tasks/:taskId', cleaningTaskController.deleteCleaningTask);

module.exports = router;
