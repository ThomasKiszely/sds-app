const express = require('express');
const router = express.Router();
const cleaningTaskController = require('../controllers/cleaningTaskController');
const validateCleaningTask = require('../middlewares/validateCleaningTask');
const validateTaskId = require('../middlewares/validateTaskId');
const validatePlanId = require('../middlewares/validatePlanId');
const { lookupLimiter } = require('../middlewares/lookupLimiter');

// Arkiverede opgaver
router.get('/:planId/tasks/archived',
    validatePlanId,
    cleaningTaskController.getDeletedCleaningTasks
);

// Genaktiver opgave
router.patch('/:planId/tasks/:taskId/reactivate',
    validatePlanId,
    validateTaskId,
    cleaningTaskController.reactivateCleaningTask
);

// Rediger opgave (view)
router.get('/:planId/tasks/:taskId/edit',
    validatePlanId,
    validateTaskId,
    cleaningTaskController.editCleaningTask
);

// Opret opgave
router.post('/:planId/tasks',
    validatePlanId,
    validateCleaningTask,
    cleaningTaskController.createCleaningTask
);

// List opgaver
router.get('/:planId/tasks',
    validatePlanId,
    cleaningTaskController.listCleaningTasks
);

// Find opgave (JSON)
router.get('/:planId/tasks/:taskId',
    validatePlanId,
    validateTaskId,
    lookupLimiter,
    cleaningTaskController.findCleaningTaskById
);

// Opdater opgave
router.patch('/:planId/tasks/:taskId',
    validatePlanId,
    validateTaskId,
    validateCleaningTask,
    cleaningTaskController.updateCleaningTask
);

// Slet opgave
router.delete('/:planId/tasks/:taskId',
    validatePlanId,
    validateTaskId,
    cleaningTaskController.deleteCleaningTask
);

module.exports = router;
