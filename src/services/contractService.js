const contractRepo = require("../data/contractRepo");
const cleaningPlanRepo = require("../data/cleaningPlanRepo");
const offerService = require("../services/offerService");
const pdfService = require("../services/pdfService");
const { parseAddress } = require("../utils/addressUtil");

// -----------------------------------------------------
// GENERATE CONTRACT (snapshot + DB record)
// -----------------------------------------------------
async function generateContract({ planId, generatedBy = "system" }) {

    const plan = await cleaningPlanRepo.findByIdWithCustomer(planId);
    if (!plan) throw new Error("Plan findes ikke");

    if (!plan.offerId) {
        throw new Error("Planen har ikke et tilbud – kan ikke oprette kontrakt");
    }

    const offerId = plan.offerId;

    const offer = await offerService.getOfferById(offerId);
    if (!offer) throw new Error("Tilbud findes ikke");

    const customer = plan.customerId;
    if (!customer) throw new Error("Kunde findes ikke");

    const location = plan.locationId;

    const { street, zip, city } = parseAddress(customer.customerAddress);
    const locationAddress = parseAddress(location?.address || customer.customerAddress);

    const snapshot = {
        plan: {
            ...offer.snapshot.plan
        },
        sender: offer.snapshot.sender || {},
        customer: {
            name: customer.customerName,
            email: customer.customerEmail,
            phone: customer.phoneNumber,
            cvr: customer.cvr,
            address: customer.customerAddress,
            street,
            zip,
            city,
            contactPerson: customer.contactPerson
        },
        location: {
            name: location?.name || null,
            address: location?.address || customer.customerAddress,
            street: locationAddress.street,
            zip: locationAddress.zip,
            city: locationAddress.city,
            contactPerson: location?.contactPerson || null
        },
        consumables: offer.snapshot.consumables || [],
        offerId,
        acceptedAt: offer.acceptedAt || null,
        acceptedByName: offer.acceptedByName || null,
        acceptedByEmail: offer.acceptedByEmail || null
    };

    await contractRepo.deactivateContractsForPlan(planId);

    const contract = await contractRepo.create({
        customerId: customer._id,
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

    return pdfService.generateContractPdf(contract);
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
