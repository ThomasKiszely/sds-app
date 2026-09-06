module.exports = function validateOfferPreview(req, res, next) {
    const errors = [];
    const { paymentTerms } = req.body;

    if (!paymentTerms) {
        errors.push("Betalingsbetingelser er påkrævet for preview.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};
