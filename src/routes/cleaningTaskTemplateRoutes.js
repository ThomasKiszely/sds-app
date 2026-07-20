const express = require('express');
const router = express.Router();
const cleaningTaskTemplateController = require('../controllers/cleaningTaskTemplateController');
const validateCleaningTaskTemplate = require('../middlewares/validateCleaningTaskTemplate');

router.get('/archived', cleaningTaskTemplateController.getDeletedCleaningTaskTemplates);
router.patch('/:id/reactivate', cleaningTaskTemplateController.reactivateCleaningTaskTemplate);

router.post('/', validateCleaningTaskTemplate, cleaningTaskTemplateController.createCleaningTaskTemplate);
router.get('/', cleaningTaskTemplateController.listCleaningTaskTemplates);
router.get('/:id', cleaningTaskTemplateController.findCleaningTaskTemplateById);
router.patch('/:id', validateCleaningTaskTemplate, cleaningTaskTemplateController.updateCleaningTaskTemplate);
router.delete('/:id', cleaningTaskTemplateController.deleteCleaningTaskTemplate);

module.exports = router;
