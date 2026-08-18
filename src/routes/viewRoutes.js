const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middlewares/requireLogin');
const { requireAdmin } = require('../middlewares/requireAdmin');
const { categoryTypes, categoryLabels } = require('../utils/categoryEnum');
const { units, unitsLabels } = require('../utils/unitEnum');


// LOGIN (public)
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { error: null });
});

// INDEX
router.get('/', requireLogin, (req, res) => {
    const loadMe = req.session.loadMe || false;
    req.session.loadMe = false; // nulstil

    res.render('index', {
        user: req.session.user,
        loadMe
    });
});


// Change password og user
router.get('/change-password', requireLogin, (req, res) => {
    res.render('changePassword', { user: req.session.user });
});

router.get('/me', requireLogin, (req, res) => {
    const error = req.session.formError || null;
    req.session.formError = null; // nulstil efter visning

    res.render('me', {
        user: req.session.user,
        error
    });
});




router.get('/indexContent', requireLogin, (req, res) => {
    res.render('partials/indexContent', { user: req.session.user });
});

router.get('/customers/create', requireLogin, (req, res) => {
    res.render('customers/create', {
        user: req.session.user,
        flow: req.query.flow || null
    });
});


// PLANS
router.get('/plans', requireLogin, async (req, res) => {
    res.render('plans', { user: req.session.user });
});


// TASKS
router.get('/tasks', async (req, res) => {
    res.render('tasks/list', { user: req.session.user });
});


router.get('/tasks/create', requireAdmin, (req, res) => {
    res.render('tasks/create', {
        categoryTypes,
        categoryLabels,
        units,
        unitsLabels
    });
});

router.get('/admin', requireAdmin, (req, res) => {
    res.render('admin/index', { user: req.session.user });
});

router.get('/users/create', requireAdmin, (req, res) => {
    res.render('admin/users/create');
});


//logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});


module.exports = router;
