const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/requireAdmin');
const cleaningTaskTemplateController = require('../controllers/cleaningTaskTemplateController');
const validateCleaningTaskTemplate = require('../middlewares/validateCleaningTaskTemplate');

// 1) SPECIFIKKE ROUTES (må ALDRIG rammes af :id)
router.get('/archived', requireAdmin, cleaningTaskTemplateController.getDeletedCleaningTaskTemplates);
router.patch('/:id/reactivate', requireAdmin, cleaningTaskTemplateController.reactivateCleaningTaskTemplate);
router.get('/create', requireAdmin, cleaningTaskTemplateController.showCreateForm);   // ← VIGTIG!
router.get('/:id/edit', requireAdmin, cleaningTaskTemplateController.editCleaningTaskTemplate);

// 2) WRAPPER-SIDEN (hele layoutet)
router.get('/page', requireAdmin, cleaningTaskTemplateController.showTemplatePage);

// 3) CREATE (POST)
router.post('/', validateCleaningTaskTemplate, cleaningTaskTemplateController.createCleaningTaskTemplate);

// 4) LIST (HTMX partial)
router.get('/', cleaningTaskTemplateController.listCleaningTaskTemplates);

// 5) FIND BY ID (MÅ ALTID LIGGE TIL SIDST)
router.get('/:id', cleaningTaskTemplateController.findCleaningTaskTemplateById);
router.patch('/:id', requireAdmin, validateCleaningTaskTemplate, cleaningTaskTemplateController.updateCleaningTaskTemplate);
router.delete('/:id', requireAdmin, cleaningTaskTemplateController.deleteCleaningTaskTemplate);

module.exports = router;
