const RoomTemplate = require("../models/RoomTemplate");

async function findByName(name) {
    return RoomTemplate.findOne({ name });
}

async function create(data) {
    const template = new RoomTemplate(data);
    return template.save();
}
async function findAll() {
    return RoomTemplate.find().sort({ name: 1 });
}

async function findById(id) {
    return RoomTemplate.findById(id);
}

async function update(id, data) {
    return RoomTemplate.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return RoomTemplate.findByIdAndDelete(id);
}


module.exports = {
    findByName,
    create,
    findAll,
    findById,
    update,
    remove,
};
