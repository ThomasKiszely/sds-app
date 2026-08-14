const User = require('../models/User');

async function findByName(userName) {
    return User.findOne({ userName });
}

async function findById(id) {
    return User.findById(id, { password: 0 });
}

async function createUser(data) {
    const newUser = new User(data);
    return await newUser.save();
}

async function deactivateUser(id) {
    return User.findByIdAndUpdate(
        id,
        { active: false },
        { returnDocument: 'after', runValidators: true }
    );
}

async function reactivateUser(id) {
    return User.findByIdAndUpdate(
        id,
        { active: true },
        { returnDocument: 'after', runValidators: true}
    );
}

async function getAllUsers() {
    return User.find({}, { password: 0, mustChangePassword: 0}).sort({ createdAt: -1 });
}

async function updatePassword(id, hashedPassword, mustChange = false) {
    return User.findByIdAndUpdate(
        id,
        { password: hashedPassword, mustChangePassword: mustChange },
        { returnDocument: 'after', runValidators: true }
    );
}

async function updateUser(id, changes) {
    return User.findByIdAndUpdate(
        id,
        changes,
        { returnDocument: 'after', runValidators: true }
    );
}


module.exports = {
    findById,
    findByName,
    createUser,
    deactivateUser,
    reactivateUser,
    getAllUsers,
    updatePassword,
    updateUser
};
