const RoomType = require('../models/RoomType');
const { escapeRegExp } = require('../utils/escapeRegExp');

async function findAll() {
    return RoomType.find().sort({ name: 1 });
}

async function findById(id) {
    return RoomType.findById(id);
}

// "kontor" og "Kontor" counts as the same room
async function findByName(name) {
    return RoomType.findOne({ name: new RegExp(`^${escapeRegExp(name)}$`, 'i') });
}

async function create(data) {
    const newRoomType = new RoomType(data);
    return newRoomType.save();
}

async function rename(id, name) {
    return RoomType.findByIdAndUpdate(id, { name: name }, { new: true });
}

async function remove(id) {
    return RoomType.findByIdAndDelete(id);
}

module.exports = { findAll, findById, findByName, create, rename, remove };
