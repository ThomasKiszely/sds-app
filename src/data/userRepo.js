const User = require('../models/User');

async function findByName(userName) {
    return User.findOne({ userName });
}

async function findById(id) {
    return User.findById(id);
}

async function createUser(data) {
    const newUser = new User(data);
    return await newUser.save();
}

async function deactivateUser(id) {
    return User.findByIdAndUpdate(
        id,
        { active: false },
        { new: true, runValidators: true }
    );
}

async function reactivateUser(id) {
    return User.findByIdAndUpdate(
        id,
        { active: true },
        { new: true, runValidators: true}
    );
}

module.exports = {
    findById,
    findByName,
    createUser,
    deactivateUser,
    reactivateUser
};
