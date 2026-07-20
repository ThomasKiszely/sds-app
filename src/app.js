const express = require('express');
const app = express();
const path = require('path');
const userRouter = require('./routes/userRoutes');
const customerRouter = require('./routes/customerRoutes');
const cleaningPlanRouter = require('./routes/cleaningPlanRoutes');
const cleaningTaskRouter = require('./routes/cleaningTaskRoutes');
const cleaningTaskTemplateRouter = require('./routes/cleaningTaskTemplateRoutes');
const { requireAdmin } = require('./middlewares/requireAdmin');
const { requireLogin } = require('./middlewares/requireLogin');
const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');
const { log } = require('./middlewares/logger');
const { connectToMongo } = require('./services/db');
const session = require('express-session');
connectToMongo();
//npx nodemon server eller npm run dev for at starte nodemon - ctrl-c for at afslutte

// Middleware
app.use(express.json());
app.use(log);
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html']}));
app.use(session({
    secret: process.env.SESSION_SECRET,   // skal være en lang, random streng
    resave: false,
    saveUninitialized: false,
    rolling: true,                        // forny cookie ved aktivitet
    cookie: {
        httpOnly: true,                   // JS kan ikke læse cookien
        secure: false,                    // true i produktion (HTTPS)
        sameSite: 'strict',               // beskytter mod CSRF
        maxAge: 1000 * 60 * 60 * 24 * 7   // 7 dage
    }
}));

// adminRoutes
app.use('/cleaningTaskTemplate', requireAdmin, cleaningTaskTemplateRouter);

// loginRoutes
app.use('/cleaningPlan', requireLogin, cleaningPlanRouter);
app.use('/cleaningPlan', requireLogin, cleaningTaskRouter);
app.use('/customer', requireLogin, customerRouter);

//custom routes
app.use('/user', userRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;