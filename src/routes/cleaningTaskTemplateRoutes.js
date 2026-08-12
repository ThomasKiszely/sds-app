const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/requireAdmin');
const cleaningTaskTemplateController = require('../controllers/cleaningTaskTemplateController');
const validateCleaningTaskTemplate = require('../middlewares/validateCleaningTaskTemplate');

router.get('/archived', requireAdmin, cleaningTaskTemplateController.getDeletedCleaningTaskTemplates);
router.patch('/:id/reactivate', requireAdmin, cleaningTaskTemplateController.reactivateCleaningTaskTemplate);

router.post('/', validateCleaningTaskTemplate, cleaningTaskTemplateController.createCleaningTaskTemplate);
router.get('/', cleaningTaskTemplateController.listCleaningTaskTemplates);
router.get('/:id', cleaningTaskTemplateController.findCleaningTaskTemplateById);
router.patch('/:id', requireAdmin, validateCleaningTaskTemplate, cleaningTaskTemplateController.updateCleaningTaskTemplate);
router.delete('/:id', requireAdmin, cleaningTaskTemplateController.deleteCleaningTaskTemplate);

module.exports = router;
