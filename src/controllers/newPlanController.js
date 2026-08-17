const cleaningPlanService = require("../services/cleaningPlanService");
const customerService = require("../services/customerService");
const offerService = require("../services/offerService");

class NewPlanController {

    // STEP 1: Vælg kunde
    async step1_customer(req, res) {
        res.render("newPlan/step1_customer", { user: req.session.user });
    }

    // Kundeliste (HTMX partial)
    async customerList(req, res) {
        const result = await customerService.listCustomers();

        // result.customers er et array
        res.render("newPlan/partials/customerList", { customers: result.customers });
    }

    // STEP 2: Opret plan
    async step2_plan(req, res) {
        const customerId = req.query.customerId;
        res.render("newPlan/step2_plan", { customerId });
    }

    async savePlan(req, res) {
        try {
            const customerId = req.body.customerId;

            const customer = await customerService.getCustomerById(customerId);
            const existingPlans = await cleaningPlanService.getPlansForCustomer(customerId);
            const count = existingPlans.length + 1;

            const name = `Rengøringsplan – ${customer.customerName} – ${new Date().toLocaleDateString("da-DK")} – #${count}`;

            const plan = await cleaningPlanService.createCleaningPlan({
                customerId,
                name,
                description: ""
            });

            // ✅ Render partialet direkte til HTMX, som sætter det ind i #content
            return res.render("newPlan/partials/tasks", {
                planId: plan._id,
                customerId: plan.customerId
            });

        } catch (error) {
            // Håndter eventuel fejl med en toast
            res.setHeader("HX-Trigger", JSON.stringify({ toast: error.message }));
            return res.status(500).end();
        }
    }




    // STEP 3: Tilføj opgaver
    // STEP 3: Tilføj opgaver
    async step3_tasks(req, res) {
        const planId = req.query.planId;
        const plan = await cleaningPlanService.findCleaningPlanById(planId);

        // Hvis det tilgås direkte fra adresselinjen (eller ved hard refresh)
        if (!req.headers['hx-request']) {
            return res.render("index", { // eller din primære ramme-fil
                user: req.session.user,
                loadMe: false
            });
        }

        // Hvis det er et HTMX kald
        res.render("newPlan/partials/tasks", {
            planId,
            customerId: plan.customerId
        });
    }



    // STEP 4: Lav tilbud
    async step4_offer(req, res) {
        const planId = req.query.planId;
        res.render("newPlan/step4_offer", { planId });
    }

    async saveOffer(req, res) {
        const offer = await offerService.createOffer(
            req.body.planId,
            {
                discountPercent: Number(req.body.discountPercent),
                environmentalFeePercent: Number(req.body.environmentalFeePercent)
            }
        );

        res.redirect(`/offers/${offer._id}/view`);
    }
}

module.exports = new NewPlanController();
