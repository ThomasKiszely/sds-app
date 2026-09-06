const contractRepo = require("../data/contractRepo");
const cleaningPlanRepo = require("../data/cleaningPlanRepo");
const customerService = require("../services/customerService");
const offerService = require("../services/offerService");
const pdfService = require("../services/pdfService");
const { parseAddress } = require("../utils/addressUtil");
const {paymentTerms, paymentTermLabels} = require("../utils/paymentTerms");

// -----------------------------------------------------
// GENERATE CONTRACT (snapshot + DB record)
// -----------------------------------------------------
async function generateContract({ planId, generatedBy = "system" }) {

    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) throw new Error("Plan findes ikke");

    if (!plan.offerId) {
        throw new Error("Planen har ikke et tilbud – kan ikke oprette kontrakt");
    }

    const offerId = plan.offerId;

    const offer = await offerService.getOfferById(offerId);
    if (!offer) throw new Error("Tilbud findes ikke");

    const customer = await customerService.getCustomerById(plan.customerId);
    if (!customer) throw new Error("Kunde findes ikke");

    const { street, zip, city } = parseAddress(customer.customerAddress);

    const snapshot = {
        plan: {
            name: plan.name,
            description: plan.description,
            hourlyRate: plan.hourlyRate,
            indexRegulationPercent: plan.indexRegulationPercent,
            paymentTerms: offer.paymentTerms,
            totalMonthlyPrice: plan.totalMonthlyPrice,
            terminationNotice: offer.terminationNotice,
            terminationNoticeLabel: offer.snapshot.plan.terminationNoticeLabel,
        },
        customer: {
            name: customer.customerName,
            email: customer.customerEmail,
            address: customer.customerAddress,
            street,
            zip,
            city
        },
        offerId,
        acceptedAt: offer.acceptedAt || null,
        acceptedByName: offer.acceptedByName || null,
        acceptedByEmail: offer.acceptedByEmail || null
    };

    await contractRepo.deactivateContractsForPlan(planId);

    const contract = await contractRepo.create({
        customerId: plan.customerId,
        planId,
        offerId,
        generatedBy,
        snapshot,
        paymentTerms: offer.paymentTerms,
        terminationNotice: offer.terminationNotice,
        isActive: true
    });

    return contract;
}


// -----------------------------------------------------
// GENERATE PDF (on-the-fly)
// -----------------------------------------------------
async function getContractPdf(contractId) {
    const contract = await contractRepo.findById(contractId);
    if (!contract) throw new Error("Kontrakt findes ikke");

    // Brug snapshot direkte
    const snapshot = contract.snapshot;

    // Generér PDF i memory
    const pdfBuffer = await pdfService.generateContractPdf(snapshot, contract.paymentTerms, paymentTermLabels);

    return pdfBuffer;
}

// -----------------------------------------------------
// LIST CONTRACTS
// -----------------------------------------------------
async function listContractsForPlan(planId) {
        return contractRepo.findByPlanId(planId);
}

async function listContractsForCustomer(customerId) {
    return contractRepo.findByCustomerId(customerId);
}

async function findByPlanId(planId) {
    return contractRepo.findOneByPlanId(planId);
}

async function getContractById(contractId) {
    return contractRepo.findById(contractId);
}

module.exports = {
    generateContract,
    getContractPdf,
    listContractsForPlan,
    listContractsForCustomer,
    findByPlanId,
    getContractById
};
