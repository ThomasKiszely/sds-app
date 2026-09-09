const cleaningPlanService = require('../services/cleaningPlanService');
const cleaningTaskService = require('../services/cleaningTaskService');
const locationService = require('../services/locationService');
const customerService = require('../services/customerService');
const pdfService = require('../services/pdfService');
const { groupSdsTasksByRoom } = require('../utils/groupedUtil');
const { categoryTypes } = require('../utils/categoryEnum');
const { calculateTaskPrice } = require('../services/priceService');
const { frequencyLabels } = require("../utils/frequencyEnum");


async function createCleaningPlan(req, res, next) {
    try {
        const created = await cleaningPlanService.createCleaningPlan(req.body);

        return res.status(201).json({
            status: 'success',
            message: 'Rengøringsplan oprettet',
            created
        });
    } catch (error) {
        next(error);
    }
}

async function listCleaningPlans(req, res, next) {
    try {
        const cleaningPlans = await cleaningPlanService.listCleaningPlans();

        return res.status(200).json({
            status: 'success',
            cleaningPlans
        });
    } catch (error) {
        next(error);
    }
}

async function findCleaningPlanById(req, res, next) {
    try {
        const { planId } = req.params;

        const cleaningPlan = await cleaningPlanService.findCleaningPlanById(planId);

        return res.status(200).json({
            status: 'success',
            cleaningPlan
        });
    } catch (error) {
        next(error);
    }
}

async function updateCleaningPlan(req, res, next) {
    try {
        const { planId } = req.params;

        const updated = await cleaningPlanService.updateCleaningPlan(planId, req.body);

        return res.status(200).json({
            status: 'success',
            message: 'Rengøringsplan opdateret',
            updated
        });
    } catch (error) {
        next(error);
    }
}

async function deleteCleaningPlan(req, res, next) {
    try {
        const { planId } = req.params;
        const { context, customerId } = req.query;

        await cleaningPlanService.deleteCleaningPlan(planId);

        if (context === "planView") {
            // Render plan-view igen
            const plan = await cleaningPlanService.findCleaningPlanById(planId);
            const tasks = await cleaningPlanService.getTasksForPlan(planId);

            const enrichedTasks = tasks.map(t => {
                const plain = t.toObject();
                const prices = calculateTaskPrice(plain, plan.hourlyRate);
                return { ...plain, ...prices };
            });

            return res.render("plans/view", {
                plan,
                tasks: enrichedTasks,
                user: req.session.user
            });
        }

        if (context === "customerPlans") {
            // Render kundens planliste igen
            const locations = await locationService.getLocationsForCustomer(customerId);

            const plans = [];
            for (const loc of locations) {
                const locPlans = await cleaningPlanService.getPlansForLocation(loc._id);
                plans.push(...locPlans.map(p => ({
                    ...p.toObject(),
                    location: loc
                })));
            }

            return res.render("customers/plans", {
                customerId,
                plans,
                user: req.session.user
            });
        }

        // fallback
        return res.status(200).json({ status: "success" });

    } catch (error) {
        next(error);
    }
}


async function getDeletedCleaningPlans(req, res, next) {
    try {
        const deletedPlans = await cleaningPlanService.listDeletedCleaningPlans();

        return res.status(200).json({
            status: 'success',
            deletedPlans
        });
    } catch (error) {
        next(error);
    }
}

async function reactivateCleaningPlan(req, res, next) {
    try {
        const { planId } = req.params;
        const { context, customerId } = req.query;

        await cleaningPlanService.reactivateCleaningPlan(planId);

        if (context === "planView") {
            // Render plan-view igen
            const plan = await cleaningPlanService.findCleaningPlanById(planId);
            const tasks = await cleaningPlanService.getTasksForPlan(planId);

            const enrichedTasks = tasks.map(t => {
                const plain = t.toObject();
                const prices = calculateTaskPrice(plain, plan.hourlyRate);
                return { ...plain, ...prices };
            });

            return res.render("plans/view", {
                plan,
                tasks: enrichedTasks,
                user: req.session.user
            });
        }

        if (context === "customerPlans") {
            // Render kundens planliste igen
            const locations = await locationService.getLocationsForCustomer(customerId);

            const plans = [];
            for (const loc of locations) {
                const locPlans = await cleaningPlanService.getPlansForLocation(loc._id);
                plans.push(...locPlans.map(p => ({
                    ...p.toObject(),
                    location: loc
                })));
            }

            return res.render("customers/plans", {
                customerId,
                plans,
                user: req.session.user
            });
        }

        // fallback
        return res.status(200).json({ status: "success" });

    } catch (error) {
        next(error);
    }
}


async function viewPlan(req, res, next) {
    try {
        const { planId } = req.params;

        // Hent planen
        const plan = await cleaningPlanService.findCleaningPlanById(planId);
        if (!plan) return res.status(404).send("Plan ikke fundet");

        // Hent tasks
        const tasks = await cleaningPlanService.getTasksForPlan(planId);

        // Beregn priser
        const hourlyRate = plan.hourlyRate;
        const enrichedTasks = tasks.map(t => {
            const plain = t.toObject();
            const prices = calculateTaskPrice(plain, hourlyRate);
            return { ...plain, ...prices };
        });

        // Gruppér rum (bundles)
        const grouped = groupSdsTasksByRoom(enrichedTasks);

// Tilføj "other" så PDF ikke crasher
        for (const roomName of Object.keys(grouped)) {
            grouped[roomName].other = enrichedTasks.filter(t =>
                t.roomName === roomName &&
                ![
                    categoryTypes.daily,
                    categoryTypes.floor,
                    categoryTypes.inventory
                ].includes(t.category)
            );
        }

        // Øvrige opgaver (uden programkode)
        const noRoomTasks = enrichedTasks.filter(t =>
            (!t.roomName || t.roomName.trim() === "") &&
            t.monthlyPrice > 0
        );

        const adHocTasks = enrichedTasks.filter(t =>
            t.monthlyPrice === 0 &&
            t.customPrice != null &&
            t.category !== "consumables"
        );

        const consumables = enrichedTasks.filter(t =>
            t.category === "consumables"
        );

        // Kunde + adresse
        const customer = await customerService.getCustomerById(plan.customerId);
        const { street, zip, city } = require("../utils/addressUtil").parseAddress(customer.customerAddress);

        // Labels til EJS
        const { daysLabels } = require("../utils/dayEnum");
        const { frequencyLabels } = require("../utils/frequencyEnum");

        const {
            dailyDescriptions,
            floorDescriptions,
            inventoryDescriptions
        } = cleaningPlanService.extractInstructionDescriptions(enrichedTasks);


        // Send ALT til view’et
        return res.render("plans/view", {
            plan,
            tasks: enrichedTasks,
            grouped,
            roomNotes: plan.roomNotes,
            noRoomTasks,
            adHocTasks,
            consumables,
            customer,
            street,
            zip,
            city,
            daysLabels,
            frequencyLabels,
            user: req.session.user,
            dailyDescriptions,
            floorDescriptions,
            inventoryDescriptions
        });

    } catch (err) {
        next(err);
    }
}

async function generatePlanPdf(req, res) {
    try {
        const planId = req.params.planId;

        // Hent planen
        const plan = await cleaningPlanService.findCleaningPlanById(planId);
        if (!plan) {
            return res.status(404).send("Plan ikke fundet");
        }

        // Hent tasks (samme som viewPlan)
        const tasks = await cleaningPlanService.getTasksForPlan(planId);

        // Beregn priser (samme som viewPlan)
        const hourlyRate = plan.hourlyRate;
        const enrichedTasks = tasks.map(t => {
            const plain = t.toObject();
            const prices = calculateTaskPrice(plain, hourlyRate);
            return { ...plain, ...prices };
        });

        // Gruppér rum (SDS-bundles – samme som viewPlan)
        const grouped = groupSdsTasksByRoom(enrichedTasks);

        // Tilføj "other" pr. rum (samme som viewPlan)
        for (const roomName of Object.keys(grouped)) {
            grouped[roomName].other = enrichedTasks.filter(t =>
                t.roomName === roomName &&
                ![
                    categoryTypes.daily,
                    categoryTypes.floor,
                    categoryTypes.inventory
                ].includes(t.category)
            );
        }

        // Room notes
        const roomNotes = plan.roomNotes || [];

        // Øvrige opgaver (uden programkode – samme som viewPlan)
        const noRoomTasks = enrichedTasks.filter(t =>
            (!t.roomName || t.roomName.trim() === "") &&
            t.monthlyPrice > 0
        );

        const adHocTasks = enrichedTasks.filter(t =>
            t.monthlyPrice === 0 &&
            t.customPrice != null &&
            t.category !== "consumables"
        );

        const consumables = enrichedTasks.filter(t =>
            t.category === "consumables"
        );

        // SDS-instruktionsbeskrivelser (bygget på enrichedTasks)
        const {
            dailyDescriptions,
            floorDescriptions,
            inventoryDescriptions
        } = cleaningPlanService.extractInstructionDescriptions(enrichedTasks);

        const pdfBuffer = await pdfService.generatePlanPdf({
            plan,
            tasks: enrichedTasks,
            grouped,
            roomNotes,
            dailyDescriptions,
            floorDescriptions,
            inventoryDescriptions,
            noRoomTasks,
            adHocTasks,
            consumables,
            frequencyLabels,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="rengøringsplan.pdf"`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error("Fejl ved generering af plan-PDF:", err);
        res.status(500).send("Fejl ved generering af PDF");
    }
}

async function editPlan(req, res, next) {
    try {
        const { planId } = req.params;

        // Hent planen
        const plan = await cleaningPlanService.findCleaningPlanById(planId);
        if (!plan) return res.status(404).send("Plan ikke fundet");

        // Hent tasks
        const tasks = await cleaningPlanService.getTasksForPlan(planId);

        // Beregn priser
        const hourlyRate = plan.hourlyRate;
        const enrichedTasks = tasks.map(t => {
            const plain = t.toObject();
            const prices = calculateTaskPrice(plain, hourlyRate);
            return { ...plain, ...prices };
        });

        // Gruppér rum
        const grouped = groupSdsTasksByRoom(enrichedTasks);

        // Tilføj "other"
        for (const roomName of Object.keys(grouped)) {
            grouped[roomName].other = enrichedTasks.filter(t =>
                t.roomName === roomName &&
                ![
                    categoryTypes.daily,
                    categoryTypes.floor,
                    categoryTypes.inventory
                ].includes(t.category)
            );
        }

        // Øvrige opgaver
        const noRoomTasks = enrichedTasks.filter(t =>
            (!t.roomName || t.roomName.trim() === "") &&
            t.monthlyPrice > 0
        );

        const adHocTasks = enrichedTasks.filter(t =>
            t.monthlyPrice === 0 &&
            t.customPrice != null &&
            t.category !== "consumables"
        );

        const consumables = enrichedTasks.filter(t =>
            t.category === "consumables"
        );

        // Kunde + adresse
        const customer = await customerService.getCustomerById(plan.customerId);
        const { street, zip, city } = require("../utils/addressUtil").parseAddress(customer.customerAddress);

        // Labels
        const { daysLabels } = require("../utils/dayEnum");
        const { frequencyLabels } = require("../utils/frequencyEnum");

        // SDS-instruktioner
        const {
            dailyDescriptions,
            floorDescriptions,
            inventoryDescriptions
        } = cleaningPlanService.extractInstructionDescriptions(enrichedTasks);

        const monthlyTotal = enrichedTasks
            .filter(t => t.monthlyPrice > 0)
            .reduce((sum, t) => sum + t.monthlyPrice, 0);


        // Render editor-view
        return res.render("plans/edit", {
            plan,
            tasks: enrichedTasks,
            grouped,
            roomNotes: plan.roomNotes,
            noRoomTasks,
            adHocTasks,
            consumables,
            dailyDescriptions,
            floorDescriptions,
            inventoryDescriptions,
            customer,
            street,
            zip,
            city,
            daysLabels,
            frequencyLabels,
            user: req.session.user,
            monthlyTotal,
            categoryTypes
        });

    } catch (err) {
        next(err);
    }
}



module.exports = {
    createCleaningPlan,
    listCleaningPlans,
    findCleaningPlanById,
    updateCleaningPlan,
    deleteCleaningPlan,
    getDeletedCleaningPlans,
    reactivateCleaningPlan,
    viewPlan,
    generatePlanPdf,
    editPlan
};
