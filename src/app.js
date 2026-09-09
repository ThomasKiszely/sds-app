const express = require('express');
const app = express();
const path = require('path');

// Security & Utility
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const { ipKeyGenerator } = require("express-rate-limit");

// Routers
const userRouter = require('./routes/userRoutes');
const customerRouter = require('./routes/customerRoutes');
const cleaningPlanRouter = require('./routes/cleaningPlanRoutes');
const cleaningTaskRouter = require('./routes/cleaningTaskRoutes');
const cleaningTaskTemplateRouter = require('./routes/cleaningTaskTemplateRoutes');
const viewRouter = require('./routes/viewRoutes');
const adminRouter = require('./routes/adminRoutes');
const newPlanRouter = require('./routes/newPlanRoutes');
const offerRouter = require('./routes/offerRoutes');
const locationRouter = require('./routes/locationRoutes');
const contractRouter = require('./routes/contractRoutes');

// Middlewares
const { requireAdmin } = require('./middlewares/requireAdmin');
const { requireLogin } = require('./middlewares/requireLogin');
const { mustChangePassword } = require('./middlewares/mustChangePassword');
const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');
const { log } = require('./middlewares/logger');

// 1. View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 2. Proxy (Railway)
app.set("trust proxy", 1);

// 3. Helmet Security Headers (Tidligt i chain)
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "script-src": ["'self'"],
                "style-src": ["'self'", "'unsafe-inline'"],
                "img-src": ["'self'", "data:"],
                "connect-src": ["'self'"],
            }
        }
    })
);

// 4. Statiske filer (Før Session & CSRF for bedre performance)
app.use(express.static(path.join(__dirname, '../public'), { extensions: ['html'] }));

// 5. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            secure: false, // Railway håndterer HTTPS foran
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);

// 7. CSRF (Kræver session)
app.use(csrf());

// 8. Global data til views
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.user = req.session ? req.session.user : null;
    next();
});

// 9. Rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator
});
app.use(globalLimiter);

const acceptLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "For mange accept-forsøg. Prøv igen senere.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator
});
app.use("/offers/:id/accept", acceptLimiter);

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: "For mange login-forsøg. Prøv igen senere.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator
});
app.use("/users/login", loginLimiter);

// 10. Logger
app.use(log);

// 11. Custom Middleware
app.use(mustChangePassword);

// 12. Routes
app.use('/', viewRouter);
app.use('/newPlan', newPlanRouter);
app.use('/offers', offerRouter);

app.use('/admin', requireAdmin, adminRouter);

app.use('/cleaningTaskTemplates', requireLogin, cleaningTaskTemplateRouter);
app.use('/cleaningPlans', requireLogin, cleaningPlanRouter);
app.use('/cleaningTasks', requireLogin, cleaningTaskRouter);
app.use('/customers', requireLogin, customerRouter);
app.use('/locations', requireLogin, locationRouter);
app.use('/contracts', requireLogin, contractRouter);

app.use('/users', userRouter);

// 13. Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;