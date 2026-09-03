const express = require('express');
const app = express();
const path = require('path');

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

// Services
const cron = require('node-cron');
const { runInflationCatchUp } = require('./cron/inflation');
const { connectToMongo } = require('./services/db');
connectToMongo();

// Security
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { ipKeyGenerator } = require("express-rate-limit");


// ⭐ View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ⭐ Railway / proxy support = 1
app.set("trust proxy", false);

// ⭐ Security headers
app.use(helmet());

// ⭐ Rate limiting
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

// ⭐ Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⭐ Logger
app.use(log);

// ⭐ Static files
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

// ⭐ Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        secure: false, // Railway håndterer HTTPS
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// ⭐ Global middleware
app.use(mustChangePassword);

// ⭐ Routes
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

// ⭐ Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
