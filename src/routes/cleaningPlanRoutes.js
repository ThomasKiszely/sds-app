const express = require('express');
const router = express.Router();
const cleaningPlanController = require('../controllers/cleaningPlanController');
const validateCleaningPlan = require('../middlewares/validateCleaningPlan');


router.get('/archived', cleaningPlanController.getDeletedCleaningPlans);
router.patch('/:id/reactivate', cleaningPlanController.reActivateCleaningPlan);
router.put('/:id', validateCleaningPlan, cleaningPlanController.updateCleaningPlan);
router.delete('/:id', cleaningPlanController.deleteCleaningPlan);
router.get('/:id', cleaningPlanController.findCleaningPlanById);
router.post('/', validateCleaningPlan, cleaningPlanController.createCleaningPlan);
router.get('/', cleaningPlanController.listCleaningPlans);

module.exports = router;