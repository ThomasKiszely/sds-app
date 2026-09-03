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
async function generateContract({ planId, offerId = null, generatedBy = "system" }) {

    // Hent plan
    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) throw new Error("Plan findes ikke");

    // Hent kunde
    const customer = await customerService.getCustomerById(plan.customerId);
    if (!customer) throw new Error("Kunde findes ikke");

    const { street, zip, city } = parseAddress(customer.customerAddress);

    // Hent offer (hvis der er et)
    let offer = null;
    if (offerId) {
        offer = await offerService.getOfferById(offerId);
    }

    // Lav snapshot af plan (frossen kontrakt)
    const snapshot = {
        plan: {
            name: plan.name,
            description: plan.description,
            hourlyRate: plan.hourlyRate,
            indexRegulationPercent: plan.indexRegulationPercent,
            paymentTerms: plan.paymentTerms,
            totalMonthlyPrice: plan.totalMonthlyPrice,
            terminationNotice: offer?.snapshot?.plan?.terminationNotice || null,
            terminationNoticeLabel: offer?.snapshot?.plan?.terminationNoticeLabel || null,
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
        acceptedAt: offer?.acceptedAt || null,
        acceptedByName: offer?.acceptedByName || null,
        acceptedByEmail: offer?.acceptedByEmail || null
    };

    // Deaktiver gamle kontrakter for denne plan
    await contractRepo.deactivateContractsForPlan(planId);

    // Gem kontrakt i DB (snapshot gemmes)
    const contract = await contractRepo.create({
        customerId: plan.customerId,
        planId,
        offerId,
        generatedBy,
        snapshot,
        paymentTerms: offer?.paymentTerms,
        terminationNotice: offer?.terminationNotice,
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

module.exports = {
    generateContract,
    getContractPdf,
    listContractsForPlan,
    listContractsForCustomer
};
