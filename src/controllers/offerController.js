const offerService = require("../services/offerService");
const pdfService = require("../services/pdfService");
const contractService = require("../services/contractService");
const cleaningPlanService = require("../services/cleaningPlanService");
const customerService = require("../services/customerService");
const { parseAddress } = require("../utils/addressUtil");
const { makePdfFilename } = require("../utils/pdfFilenameUtil");

async function pdfOffer(req, res, next) {
    try {
        const offerId = req.params.id;

        let offer = await offerService.getOfferById(offerId);
        if (!offer) return res.status(404).send("Tilbud ikke fundet");

        if (offer.status === "draft") {
            await offerService.sendOffer(offerId);
            offer = await offerService.getOfferById(offerId);
        }

        if (!offer.signatureToken || !offer.signatureTokenExpiresAt) {
            return res.status(400).send("Tilbuddet har ikke et gyldigt acceptlink");
        }

        if (offer.signatureTokenExpiresAt < Date.now()) {
            return res.status(410).send("Acceptlinket er udløbet");
        }

        const pdfBuffer = await pdfService.generateOfferPdf(offer);

        const filename = makePdfFilename("tilbud", offer.snapshot.plan.name);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (err) {
        next(err);
    }
}

async function viewOffer(req, res, next) {
    try {
        const offer = await offerService.getOfferById(req.params.id);
        if (!offer) return res.status(404).send("Tilbud ikke fundet");

        const plan = await cleaningPlanService.findCleaningPlanById(offer.planId);

        const customer = await customerService.getCustomerById(plan.customerId);

        const { street, zip, city } = parseAddress(customer.customerAddress);

        return res.render("offers/view", {
            offer,
            snapshot: offer.snapshot,
            user: req.session.user,

            customer,
            street,
            zip,
            city
        });

    } catch (err) {
        next(err);
    }
}


async function sendOffer(req, res, next) {
    try {
        const offer = await offerService.sendOffer(req.params.id);

        return res.render("offers/sent", {
            offer,
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
}

async function acceptView(req, res, next) {
    try {
        const offer = await offerService.getOfferById(req.params.id);
        if (!offer) return res.status(404).send("Tilbud ikke fundet");

        if (offer.signatureToken !== req.query.token) {
            return res.status(403).render("offers/invalid");
        }

        if (offer.signatureTokenExpiresAt < Date.now()) {
            return res.status(410).render("offers/invalid");
        }

        return res.render("offers/accept", {
            offer,
            snapshot: offer.snapshot,
            csrfToken: req.csrfToken()
        });

    } catch (err) {
        next(err);
    }
}

async function acceptOffer(req, res, next) {
    try {
        const offerId = req.params.id;

        const offer = await offerService.getOfferById(offerId);
        if (!offer) {
            return next({ isUserError: true, message: "Tilbud findes ikke" });
        }

        if (offer.signatureToken !== req.query.token) {
            return res.status(403).render("offers/invalid");
        }

        if (offer.signatureTokenExpiresAt < Date.now()) {
            return res.status(410).render("offers/invalid");
        }

        if (!req.body._csrf) {
            return res.status(403).render("offers/invalid");
        }

        if (offer.status !== "sent") {
            return next({ isUserError: true, message: "Tilbuddet kan ikke accepteres" });
        }

        const updatedOffer = await offerService.acceptOffer(
            offerId,
            {
                name: req.body.name,
                email: req.body.email
            }
        );

        await contractService.generateContract({
            planId: updatedOffer.planId,
            offerId: updatedOffer._id,
            generatedBy: "system"
        });

        return res.render("offers/accepted", {
            offer: updatedOffer,
        });

    } catch (err) {
        next(err);
    }
}

module.exports = {
    viewOffer,
    sendOffer,
    acceptView,
    acceptOffer,
    pdfOffer
};
