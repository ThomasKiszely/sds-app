const express = require('express');
const app = express();
const path = require('path');
const userRouter = require('./routes/userRoutes');
const customerRouter = require('./routes/customerRoutes');
const cleaningPlanRouter = require('./routes/cleaningPlanRoutes');
const cleaningTaskRouter = require('./routes/cleaningTaskRoutes');
const cleaningTaskTemplateRouter = require('./routes/cleaningTaskTemplateRoutes');
const viewRouter = require('./routes/viewRoutes');
const adminRouter = require('./routes/adminRoutes');
const { requireAdmin } = require('./middlewares/requireAdmin');
const { requireLogin } = require('./middlewares/requireLogin');
const { mustChangePassword } = require('./middlewares/mustChangePassword');
const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');
const { log } = require('./middlewares/logger');
const cron = require('node-cron');
const { runInflationCatchUp } = require('./cron/inflation');
const { connectToMongo } = require('./services/db');
const session = require('express-session');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


connectToMongo();
(async () => {
    try {
        await runInflationCatchUp();
    } catch (err) {
        console.error("Inflation catch-up ved serverstart fejlede:", err);
    }
})();


// Dagligt cron-job kl. 03:00
// til test kan bruges: cron.schedule('* * * * *', () => {
//    runInflationCatchUp();
//});
// for at køre det hvert minut
cron.schedule('0 3 * * *', () => {
    console.log("Dagligt inflation catch-up check...");
    runInflationCatchUp().catch(err => console.error("Cron fejl:", err));
});
//npx nodemon server eller npm run dev for at starte nodemon - ctrl-c for at afslutte

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

//view routes
app.use(mustChangePassword);
app.use('/', viewRouter);
// adminRoutes
app.use('/cleaningTaskTemplates', requireAdmin, cleaningTaskTemplateRouter);
app.use('/admin', requireAdmin, adminRouter);

// loginRoutes
app.use('/cleaningPlans', requireLogin, cleaningPlanRouter);
app.use('/cleaningTasks', requireLogin, cleaningTaskRouter);
app.use('/customers', requireLogin, customerRouter);

//custom routes
app.use('/users', userRouter);


app.use(notFound);
app.use(errorHandler);

module.exports = app;