const express = require('express');
const router = express.Router();
const {requireAdmin} = require('../middlewares/requireAdmin');
const consumableController = require('../controllers/consumableController');
const validateCleaningTaskTemplate = require('../middlewares/validateCleaningTaskTemplate');
const validateTemplateId = require('../middlewares/validateTemplateId');

router.get('/page', requireAdmin, consumableController.showConsumablePage);
router.get('/archived', requireAdmin, consumableController.getDeletedConsumables);
router.get('/create', requireAdmin, consumableController.showCreateForm);

router.get('/:id/edit', requireAdmin, validateTemplateId, consumableController.editConsumable);
router.patch('/:id/reactivate', requireAdmin, validateTemplateId, consumableController.reactivateConsumable);

router.get('/', requireAdmin, consumableController.listConsumables);
router.post('/', requireAdmin, validateCleaningTaskTemplate, consumableController.createConsumable);
router.patch('/:id', requireAdmin, validateTemplateId, validateCleaningTaskTemplate, consumableController.updateConsumable);
router.delete('/:id', requireAdmin, validateTemplateId, consumableController.deleteConsumable);

module.exports = router;