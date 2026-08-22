function validateCreateOffer(req, res, next) {
    const { planId, discountPercent, environmentalFee } = req.body;

    if (!planId) return res.status(400).send("planId mangler");

    if (discountPercent < 0 || discountPercent > 100)
        return res.status(400).send("Rabat skal være mellem 0 og 100");

    if (environmentalFee < 0 || environmentalFee > 10)
        return res.status(400).send("Miljøafgift skal være mellem 0 og 10");

    next();
}

module.exports = { validateCreateOffer };
