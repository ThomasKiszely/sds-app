const offerService = require("../services/offerService");
const cleaningTaskService = require("../services/cleaningTaskService");
const pdfService = require("../services/pdfService");
const customerService = require("../services/customerService");
const contractService = require("../services/contractService");
const { parseAddress } = require("../utils/addressUtil");


async function pdfOffer(req, res, next) {
    try {
        const offer = await offerService.getOfferById(req.params.id);
        if (!offer) return res.status(404).send("Tilbud ikke fundet");

        const tasks = await cleaningTaskService.findCleaningTasksByIds(offer.taskIds);

        const customer = await customerService.getCustomerById(offer.customerId);
        const { street, zip, city } = parseAddress(customer.customerAddress);

        const signatureLink =
            `${req.protocol}://${req.get("host")}/offers/${offer._id}/accept?token=${offer.signatureToken}`;

        const pdfBuffer = await pdfService.generateOfferPdf(
            offer,
            tasks,
            customer,
            { street, zip, city },
            signatureLink
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=tilbud.pdf");
        res.send(pdfBuffer);

    } catch (err) {
        next(err);
    }
}

async function viewOffer(req, res, next) {
    try {
        const offer = await offerService.getOfferById(req.params.id);
        if (!offer) return res.status(404).send("Tilbud ikke fundet");

        const tasks = await cleaningTaskService.findCleaningTasksByIds(offer.taskIds);

        const customer = await customerService.getCustomerById(offer.customerId);
        const { street, zip, city } = parseAddress(customer.customerAddress);

        console.log("Logger her: Street " + street + ", Zip: " + zip + ", City: " + city);

        return res.render("offers/view", {
            offer,
            tasks,
            customer,
            street,
            zip,
            city,
            user: req.session.user
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
            return res.status(403).send("Ugyldigt eller udløbet link");
        }

        const customer = await customerService.getCustomerById(offer.customerId);
        const { street, zip, city } = parseAddress(customer.customerAddress);

        return res.render("offers/accept", {
            offer,
            customer,
            street,
            zip,
            city
        });

    } catch (err) {
        next(err);
    }
}


async function acceptOffer(req, res, next) {
    try {
        const offerId = req.params.id;

        // ⭐ 1. Hent tilbud
        const offer = await offerService.getOfferById(offerId);
        if (!offer) {
            return next({ isUserError: true, message: "Tilbud findes ikke" });
        }

        // ⭐ 2. Token check
        if (offer.signatureToken !== req.query.token) {
            return next({ isUserError: true, message: "Ugyldigt eller udløbet link" });
        }

        // ⭐ 3. Status check
        if (offer.status !== "sent") {
            return next({ isUserError: true, message: "Tilbuddet kan ikke accepteres" });
        }

        // ⭐ 4. Accepter tilbuddet
        const updatedOffer = await offerService.acceptOffer(
            offerId,
            {
                name: req.body.name,
                email: req.body.email
            }
        );

        // ⭐ 5. Generér kontrakt automatisk
        await contractService.generateContract({
            planId: updatedOffer.planId,
            offerId: updatedOffer._id,
            generatedBy: "system"
        });

        // ⭐ 6. Vis accepted.ejs
        return res.render("offers/accepted", {
            offer: updatedOffer
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
