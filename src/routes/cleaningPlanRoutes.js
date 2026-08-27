const express = require('express');
const router = express.Router();
const cleaningPlanController = require('../controllers/cleaningPlanController');
const validateCleaningPlan = require('../middlewares/validateCleaningPlan');

// Arkiverede planer
router.get('/archived', cleaningPlanController.getDeletedCleaningPlans);

// Genaktiver plan
router.patch('/:planId/reactivate', cleaningPlanController.reactivateCleaningPlan);

// Opdater plan
router.put('/:planId', validateCleaningPlan, cleaningPlanController.updateCleaningPlan);

// Deaktiver plan
router.delete('/:planId', cleaningPlanController.deleteCleaningPlan);

// Se plan (VIEW)
router.get('/:planId/view', cleaningPlanController.viewPlan);

// Find plan (JSON)
router.get('/:planId', cleaningPlanController.findCleaningPlanById);

// Opret plan
router.post('/', validateCleaningPlan, cleaningPlanController.createCleaningPlan);

// List alle planer
router.get('/', cleaningPlanController.listCleaningPlans);

module.exports = router;
