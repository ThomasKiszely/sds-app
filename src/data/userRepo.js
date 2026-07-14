const User = require('../models/User');

async function findByName(name) {
    return User.findOne({ name });
}

async function createUser(data) {
    const newUser = new User(data);
    return await newUser.save();
}

module.exports = {
    findByName,
    createUser
};
