const cleaningPlanService = require('../services/cleaningPlanService');
const cleaningTaskService = require('../services/cleaningTaskService');
const locationService = require('../services/locationService');
const customerService = require('../services/customerService');
const pdfService = require('../services/pdfService');
const { groupSdsTasksByRoom } = require('../utils/groupedUtil');
const { categoryTypes } = require('../utils/categoryEnum');
const { calculateTaskPrice } = require('../services/priceService');
const { frequencyLabels } = require("../utils/frequencyEnum");
const { makePdfFilename } = require('../utils/pdfFilenameUtil');
const { parseAddress } = require("../utils/addressUtil");


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
            const vm = await buildPlanViewModel(planId, req.session.user);
            return res.render("plans/view", vm);
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
            const vm = await buildPlanViewModel(planId, req.session.user);
            return res.render("plans/view", vm);
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


// Bygger alt det plans/view skal bruge. Bruges af viewPlan og af delete/reactivate,
// der renderer samme view igen via HTMX.
async function buildPlanViewModel(planId, user) {
    const plan = await cleaningPlanService.findCleaningPlanById(planId);

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

    // Øvrige opgaver (uden programkode): faste (månedspris) og pris pr. gang
    const { monthlyOtherTasks, perTimeTasks } = cleaningPlanService.categorizeOtherTasks(enrichedTasks);

    const consumables = enrichedTasks.filter(t =>
        t.category === "consumables"
    );

    // Kunde + adresse
    const customer = await customerService.getCustomerById(plan.customerId);
    const { street, zip, city } = parseAddress(customer.customerAddress);

    const { daysLabels } = require("../utils/dayEnum");

    const {
        dailyDescriptions,
        floorDescriptions,
        inventoryDescriptions
    } = cleaningPlanService.extractInstructionDescriptions(enrichedTasks);

    const roomTimeBreakdown = cleaningPlanService.buildRoomTimeBreakdown(grouped);
    const dailyTimeTotals = cleaningPlanService.buildDailyTimeTotals(grouped);

    return {
        plan,
        tasks: enrichedTasks,
        grouped,
        roomNotes: plan.roomNotes,
        monthlyOtherTasks,
        perTimeTasks,
        consumables,
        customer,
        street,
        zip,
        city,
        daysLabels,
        frequencyLabels,
        user,
        dailyDescriptions,
        floorDescriptions,
        inventoryDescriptions,
        roomTimeBreakdown,
        dailyTimeTotals
    };
}

async function viewPlan(req, res, next) {
    try {
        const vm = await buildPlanViewModel(req.params.planId, req.session.user);
        return res.render("plans/view", vm);
    } catch (err) {
        next(err);
    }
}

async function generatePlanPdf(req, res) {
    try {
        const planId = req.params.planId;

        // Hent planen
        const plan = await cleaningPlanService.findCleaningPlanWithCustomerById(planId);
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

        // Øvrige opgaver (uden programkode): faste (månedspris) og pris pr. gang
        const { monthlyOtherTasks, perTimeTasks } = cleaningPlanService.categorizeOtherTasks(enrichedTasks);

        const consumables = enrichedTasks.filter(t =>
            t.category === "consumables"
        );

        // SDS-instruktionsbeskrivelser (bygget på enrichedTasks)
        const {
            dailyDescriptions,
            floorDescriptions,
            inventoryDescriptions
        } = cleaningPlanService.extractInstructionDescriptions(enrichedTasks);

        const operatingDays = cleaningPlanService.describeOperatingDays(enrichedTasks);

        // Kunde- og lokationsoplysninger til "Kundeoplysninger"-blokken
        const customer = plan.customerId;
        const location = plan.locationId;
        const { street, zip, city } = parseAddress(location?.address);

        const pdfBuffer = await pdfService.generatePlanPdf({
            plan,
            customer,
            location,
            street,
            zip,
            city,
            operatingDays,
            sender: {
                address: req.session.user?.address,
                phoneNumber: req.session.user?.phoneNumber
            },
            tasks: enrichedTasks,
            grouped,
            roomNotes,
            dailyDescriptions,
            floorDescriptions,
            inventoryDescriptions,
            monthlyOtherTasks,
            perTimeTasks,
            consumables,
            frequencyLabels,
        });
        const filename = makePdfFilename(
            "rengøringsplan", plan.customerId.customerName
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error("Fejl ved generering af plan-PDF:", err);
        res.status(500).send("Fejl ved generering af PDF");
    }
}

async function editPlan(req, res, next) {
    try {
        const { planId } = req.params;
        const newPlanService = require("../services/newPlanService");
        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
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
