const offerService = require("../services/offerService");

async function createOffer(req, res, next) {
    try {
        const offer = await offerService.createOffer(
            req.body.planId,
            {
                discountPercent: Number(req.body.discountPercent || 0),
                environmentalFee: Number(req.body.environmentalFee || 1),
                sender: {
                    fullName: req.session.user?.fullName,
                    position: req.session.user?.position,
                    phoneNumber: req.session.user?.phoneNumber,
                    email: req.session.user?.email,
                    address: req.session.user?.address
                }
            }
        );

        return res.status(201).json({ success: true, offer });
    } catch (err) {
        next(err);
    }
}

async function sendOffer(req, res, next) {
    try {
        const offer = await offerService.sendOffer(req.params.id);
        return res.json({ success: true, offer });
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

        return res.json({ success: true, offer });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createOffer,
    sendOffer,
    acceptOffer
};
