function userError(message, status = 400) {
    return {
        isUserError: true,
        message,
        status
    };
}

function ensureExists(entity, message, status = 404) {
    if (!entity) {
        throw userError(message, status);
    }
}

module.exports = { userError, ensureExists };
