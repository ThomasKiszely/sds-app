function validateCVR(cvr) {
    if (!/^\d{8}$/.test(cvr)) {
        return false;
    }

    const digits = cvr.split("").map(Number);
    const weights = [2, 7, 6, 5, 4, 3, 2];

    const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);
    const remainder = sum % 11;
    const control = 11 - remainder;

    if (control === 11) {
        return digits[7] === 0;
    }
    if (control === 10) {
        return false;
    }

    return digits[7] === control;
}

module.exports = {
    validateCVR,
};
