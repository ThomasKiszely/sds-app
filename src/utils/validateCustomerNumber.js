function validateCustomerNumber(num) {
    return /^\d{8}$/.test(num);
}

module.exports = {
    validateCustomerNumber
};