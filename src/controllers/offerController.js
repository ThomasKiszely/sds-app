const offerService = require("../services/offerService");
const cleaningTaskService = require("../services/cleaningTaskService");
const pdfService = require("../services/pdfService");

async function pdfOffer(req, res, next) {
    try {
        const offer = await offerService.getOfferById(req.params.id);
        if (!offer) return res.status(404).send("Tilbud ikke fundet");

        const tasks = await cleaningTaskService.findByIds(offer.taskIds);

        const signatureLink =
            `${req.protocol}://${req.get("host")}/offers/${offer._id}/accept?token=${offer.signatureToken}`;

        const pdfBuffer = await pdfService.generateOfferPdf(offer, tasks, signatureLink);

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

        return res.render("offers/view", {
            offer,
            tasks,
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

        return res.render("offers/accept", { offer });
    } catch (err) {
        next(err);
    }
}

async function acceptOffer(req, res, next) {
    try {
        const offer = await offerService.acceptOffer(
            req.params.id,
            {
                name: req.body.name,
                email: req.body.email
            }
        );

        return res.render("offers/accepted", { offer });
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
