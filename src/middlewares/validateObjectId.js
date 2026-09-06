function validateObjectId(paramName) {
    return function (req, res, next) {
        const id = req.params[paramName];

        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return next({
                isUserError: true,
                message: `Ugyldigt ID: ${paramName}`
            });
        }

        next();
    };
}

module.exports = { validateObjectId };
