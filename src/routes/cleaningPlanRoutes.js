const express = require('express');
const router = express.Router();
const cleaningPlanController = require('../controllers/cleaningPlanController');
const validateCleaningPlan = require('../middlewares/validateCleaningPlan');
const validatePlanId = require('../middlewares/validatePlanId');
const { lookupLimiter } = require('../middlewares/lookupLimiter');
const { requireRole } = require('../middlewares/requireRole');
const { roleGroups } = require('../utils/userRoles');

// Se plan (VIEW). Planner må læse; priserne skjules i viewet.
router.get('/:planId/view',
    validatePlanId,
    lookupLimiter,
    cleaningPlanController.viewPlan
);

// Alt herunder kræver salg (PDF'en indeholder priser)
router.use(requireRole(...roleGroups.sales));

router.get('/:planId/planPdf', validatePlanId, cleaningPlanController.generatePlanPdf);

// Arkiverede planer
router.get('/archived',
    cleaningPlanController.getDeletedCleaningPlans
);

// Genaktiver plan
router.patch('/:planId/reactivate',
    validatePlanId,
    cleaningPlanController.reactivateCleaningPlan
);

// Opdater plan
router.put('/:planId',
    validatePlanId,
    validateCleaningPlan,
    cleaningPlanController.updateCleaningPlan
);

// Deaktiver plan
router.delete('/:planId',
    validatePlanId,
    cleaningPlanController.deleteCleaningPlan
);

// Find plan (JSON)
router.get('/:planId',
    validatePlanId,
    lookupLimiter,
    cleaningPlanController.findCleaningPlanById
);

router.get('/:planId/edit',
    validatePlanId,
    cleaningPlanController.editPlan
);


// Opret plan
router.post('/',
    validateCleaningPlan,
    cleaningPlanController.createCleaningPlan
);

// List alle planer
router.get('/',
    cleaningPlanController.listCleaningPlans
);

module.exports = router;
