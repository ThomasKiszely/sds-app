const { userError } = require('../utils/userError');

module.exports = function validateRoomType(req, res, next) {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!name) return next(userError('Lokaletypen skal have et navn.'));
    if(name.length > 50) return next(userError('Navnet må højst være 50 tegn'));

    req.body.name = name;
    next();
}
