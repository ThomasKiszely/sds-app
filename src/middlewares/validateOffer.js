module.exports = function validateOffer(req, res, next) {
    const errors = [];
    const { paymentTerms, validUntil } = req.body;

    if (!paymentTerms) {
        errors.push("Betalingsbetingelser er påkrævet.");
    }

    if (!validUntil) {
        errors.push("Tilbud skal have en gyldighedsdato.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};
