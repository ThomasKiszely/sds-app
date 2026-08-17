const offerService = require("../services/offerService");
const offerRepo = require("../data/offerRepo");
const cleaningTaskRepo = require("../data/cleaningTaskRepo");

async function viewOffer(req, res, next) {
    try {
        const offer = await offerRepo.findById(req.params.id);
        if (!offer) return res.status(404).send("Tilbud ikke fundet");

        const tasks = await cleaningTaskRepo.findByIds(offer.taskIds);

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
        const offer = await offerRepo.findById(req.params.id);
        if (!offer) return res.status(404).send("Tilbud ikke fundet");

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
    acceptOffer
};
