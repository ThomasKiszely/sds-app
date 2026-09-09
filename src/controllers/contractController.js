const contractService = require("../services/contractService");
const cleaningPlanRepo = require("../data/cleaningPlanRepo");
const customerService = require("../services/customerService");
const { paymentTermLabels } = require("../utils/paymentTerms");
const { makePdfFilename } = require("../utils/pdfFilenameUtil");

// Generér kontrakt
async function generateContract(req, res, next) {
    try {
        const planId = req.params.planId;

        const plan = await cleaningPlanRepo.findById(planId);
        if (!plan) {
            return next({ isUserError: true, message: "Plan findes ikke" });
        }

        const contract = await contractService.generateContract({
            planId,
            offerId: null,
            generatedBy: req.session.user?.username || "admin"
        });

        return res.render("contracts/generated", {
            contract,
            plan,
            user: req.session.user
        });

    } catch (err) {
        next(err);
    }
}

// Download PDF
async function downloadContractPdf(req, res, next) {
    try {
        const contractId = req.params.id;

        const pdfBuffer = await contractService.getContractPdf(contractId);
        const contract = await contractService.getContractById(contractId);

        // Dynamisk SDS-filnavn
        const filename = makePdfFilename(
            "kontrakt",
            contract.snapshot.customer.name
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.send(pdfBuffer);

    } catch (err) {
        next(err);
    }
}


async function listContractsForPlan(req, res, next) {
    try {
        const planId = req.params.planId;

        const contracts = await contractService.listContractsForPlan(planId);

        return res.render("contracts/list", {
            contracts,
            planId,
            user: req.session.user
        });

    } catch (err) {
        next(err);
    }
}

async function listContractsForCustomer(req, res, next) {
    try {
        const customerId = req.params.customerId;

        const contracts = await contractService.listContractsForCustomer(customerId);
        const customer = await customerService.getCustomerById(customerId);

        return res.render("contracts/customerList", {
            contracts,
            customer,
            user: req.session.user
        });

    } catch (err) {
        next(err);
    }
}

async function viewContract(req, res, next) {
    try {
        const contract = await contractService.getContractById(req.params.id);
        if (!contract) return res.status(404).send("Kontrakt ikke fundet");

        return res.render("contracts/view", { contract, paymentTermLabels });
    } catch (err) {
        next(err);
    }
}


module.exports = {
    generateContract,
    listContractsForPlan,
    listContractsForCustomer,
    downloadContractPdf,
    viewContract
};
