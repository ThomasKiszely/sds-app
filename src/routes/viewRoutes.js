const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { requireLogin } = require('../middlewares/requireLogin');

// LOGIN (public)
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login');
});

// INDEX
router.get('/', requireLogin, (req, res) => {
    res.render('index', { user: req.session.user });
});

// Change password
router.get('/change-password', requireLogin, (req, res) => {
    res.render('changePassword', { user: req.session.user });
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
