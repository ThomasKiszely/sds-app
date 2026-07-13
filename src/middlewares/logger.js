const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const logger = new EventEmitter();
const crypto = require('crypto');

logger.on('log', async (message) => {
    try {
        const timestamp = new Date().toLocaleString('da-DK');
        const logMessage = `${timestamp}: Anmodning: ${message}\n`;

        const logDir = path.join(__dirname, 'logs');
        const date = new Date();
        const dateString = date.toISOString().split('T')[0]; // fx "2025-12-16"
        const logFile = path.join(logDir, `log_${dateString}.txt`);

        await fs.mkdir(logDir, { recursive: true });
        await fs.appendFile(logFile, logMessage);

        // ROTATION: behold kun 30 dage
        await rotateLogs(30);

        console.log(`Log Message Added: ${logMessage}`);
    } catch (error) {
        console.error('Fejl ved logning: ' + error.message);
    }
});

const SENSITIVE_FIELDS = [
    'password',
    'pwd',
    'token',
    'secret',
    'authorization',

];

const sanitizeBody = (body) => {
    if (!body || typeof body !== 'object') return body;

    // Hvis det er et array → sanitér hvert element
    if (Array.isArray(body)) {
        return body.map(item => sanitizeBody(item));
    }

    const sanitized = {};
//Object.entries er de key/value par, som er i objektet, fx name: Homer osv...
    for (const [key, value] of Object.entries(body)) {
        if (key.toLowerCase().includes("password") || SENSITIVE_FIELDS.includes(key.toLowerCase())) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            // Rekursiv sanitizing for at fjerne fx passwords længere inde i body
            sanitized[key] = sanitizeBody(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

async function rotateLogs(daysToKeep = 30) {
    const logDir = path.join(__dirname, 'logs');
    const files = await fs.readdir(logDir);

    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

    for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
            await fs.unlink(filePath);
            console.log(`Log rotation: Deleted old log file ${file}`);
        }
    }
}


const truncate = (str, max = 500) => {
    if (!str) return str;
    return str.length > max ? str.substring(0, max) + '... [TRUNCATED]' : str;
};

const log = (req, res, next) => {
    if (req.originalUrl === '/favicon.ico') return next();

    req.requestId = crypto.randomUUID();

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        const sanitized = sanitizeBody(req.body);
        let body = JSON.stringify(sanitized);
        body = truncate(body);

        const userAgent = req.headers['user-agent'] || 'unknown';
        const referer = req.headers['referer'] || req.headers['referrer'] || 'none';

        const hx = {
            request: req.headers['hx-request'] || false,
            target: req.headers['hx-target'] || null,
            trigger: req.headers['hx-trigger'] || null,
            currentUrl: req.headers['hx-current-url'] || null
        };

        logger.emit(
            'log',
            `${req.requestId} ${req.ip} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms `
            + `UA:${userAgent} REF:${referer} HX:${JSON.stringify(hx)} BODY:${body}`
        );

    });

    next();
};


module.exports = { logger, log };
