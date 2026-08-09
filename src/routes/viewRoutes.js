const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { requireLogin } = require('../middlewares/requireLogin');

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


// CUSTOMERS
router.get('/customers', requireLogin, async (req, res) => {
    const customers = await Customer.find({ isDeleted: false });
    res.render('customers', {
        customers,
        user: req.session.user
    });
});

// PLANS
router.get('/plans', requireLogin, async (req, res) => {
    res.render('plans', { user: req.session.user });
});

// TASKS
router.get('/tasks', requireLogin, async (req, res) => {
    res.render('tasks', { user: req.session.user });
});

//logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});


module.exports = router;
