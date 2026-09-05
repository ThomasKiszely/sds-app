const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/requireAdmin');
const cleaningTaskTemplateController = require('../controllers/cleaningTaskTemplateController');
const validateCleaningTaskTemplate = require('../middlewares/validateCleaningTaskTemplate');
const validateTemplateId = require('../middlewares/validateTemplateId');   // ← DEN HER SKAL DU LAVE
const { lookupLimiter } = require('../middlewares/lookupLimiter');

// 1) SPECIFIKKE ROUTES (må ALDRIG rammes af :id)
router.get('/archived', requireAdmin, cleaningTaskTemplateController.getDeletedCleaningTaskTemplates);
router.patch('/:id/reactivate', requireAdmin, validateTemplateId, cleaningTaskTemplateController.reactivateCleaningTaskTemplate);

router.get('/create', requireAdmin, cleaningTaskTemplateController.showCreateForm);
router.get('/create/taskFields', requireAdmin, cleaningTaskTemplateController.showTaskFields);
router.get("/create/consumableFields", requireAdmin, cleaningTaskTemplateController.showConsumableFields);

router.get("/:id/edit/taskFields", requireAdmin, validateTemplateId, cleaningTaskTemplateController.showTaskFields);
router.get('/:id/edit', requireAdmin, validateTemplateId, cleaningTaskTemplateController.editCleaningTaskTemplate);

// 2) WRAPPER-SIDEN (hele layoutet)
router.get('/page', requireAdmin, cleaningTaskTemplateController.showTemplatePage);

// 3) CREATE (POST)
router.post('/', requireAdmin, validateCleaningTaskTemplate, cleaningTaskTemplateController.createCleaningTaskTemplate);

// 4) LIST (HTMX partial)
router.get('/', cleaningTaskTemplateController.listCleaningTaskTemplates);

// 5) FIND BY ID (MÅ ALTID LIGGE TIL SIDST)
router.get('/:id', lookupLimiter, validateTemplateId, cleaningTaskTemplateController.findCleaningTaskTemplateById);

router.patch('/:id', requireAdmin, validateTemplateId, validateCleaningTaskTemplate, cleaningTaskTemplateController.updateCleaningTaskTemplate);

router.delete('/:id', requireAdmin, validateTemplateId, cleaningTaskTemplateController.deleteCleaningTaskTemplate);

module.exports = router;
