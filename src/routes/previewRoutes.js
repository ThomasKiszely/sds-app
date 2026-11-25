// Preview-sider: funktioner fra det nye design, som ikke er bygget endnu.
// De viser kun eksempeldata fra src/preview/placeholderData.js og skriver
// intet til databasen.

const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/requireAdmin');
const data = require('../preview/placeholderData');
const { requireRole } = require('../middlewares/requireRole');
const { roleGroups } = require('../utils/userRoles');

const requirePlanning = requireRole(...roleGroups.planning);
const requireSales = requireRole(...roleGroups.sales);

function page(view, pick) {
    return (req, res) => res.render(`preview/${view}`, { ...pick(data), user: req.session.user });
}

// Rengøring
router.get('/cleaning/today', requireAdmin, page('cleaning/today', d => ({ today: d.today })));
router.get('/cleaning/week', requireAdmin, page('cleaning/week', d => ({ week: d.week })));
router.get('/cleaning/time-off', requireAdmin, page('cleaning/timeOff', d => ({ timeOff: d.timeOff })));
router.get('/cleaning/sick', requireAdmin, page('cleaning/sick', d => ({ sick: d.sick, cleaner: d.cleaner })));
router.get('/cleaning/finish', requireAdmin, page('cleaning/finish', d => ({ finish: d.finishVisit })));

// Admin
router.get('/planning', requirePlanning, page('planning/decisions', d => ({ planning: d.planning })));
router.get('/planning/week', requirePlanning, page('planning/week', d => ({ planning: d.planning })));
router.get('/employees', requireAdmin, page('employees', d => ({ employees: d.employees })));
router.get('/invoices', requireAdmin, page('invoices/list', d => ({ invoices: d.invoices })));
router.get('/invoices/review', requireAdmin, page('invoices/review', d => ({ invoice: d.invoice })));
router.get('/invoices/document', requireAdmin, page('invoices/document', d => ({ invoice: d.invoice, company: d.company })));
router.get('/customer-group/discount', requireAdmin, page('customerGroup/discount', d => ({ group: d.customerGroup })));

// Salg og admin
router.get('/customer-group', requireSales, page('customerGroup/overview', d => ({ group: d.customerGroup })));
router.get('/customer-group/offer', requireSales, page('customerGroup/offer', d => ({ group: d.customerGroup })));

module.exports = router;
