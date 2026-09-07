const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const lookupLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: "For mange forespørgsler. Prøv igen senere.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator
});

module.exports = { lookupLimiter };
