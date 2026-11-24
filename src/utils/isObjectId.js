function isObjectId(value) {
    return typeof value ===  'string' && /^[0-9a-fA-F]{24}$/.test(value);
}

module.exports = {isObjectId};