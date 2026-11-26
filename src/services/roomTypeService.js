const roomTypeRepo = require('../data/roomTypeRepo');
const cleaningTaskTemplateRepo = require('../data/cleaningTaskTemplateRepo');
const { userError, ensureExists} = require('../utils/userError');

async function ensureNameIsFree(name, ownId = null) {
    const existing = await roomTypeRepo.findByName(name);
    if (existing && String(existing._id) !== String(ownId)) {
        throw userError(`Lokaletypen "${name}" findes allerede.`);
    }
}

async function listRoomTypes() {
    return roomTypeRepo.findAll();
}

async function createRoomType(name) {
    await ensureNameIsFree(name);
    return roomTypeRepo.create({ name });
}

async function renameRoomType(id, name) {
    ensureExists(await roomTypeRepo.findById(id), 'Lokaletypen findes ikke.');
    await ensureNameIsFree(name, id);
    return roomTypeRepo.rename(id, name);
}

// Fjern typen fra alle opgaver først, så ingen opgave peger på en slettet type
async function deleteRoomType(id) {
    ensureExists(await roomTypeRepo.findById(id), 'Lokaletypen findes ikke.');
    await cleaningTaskTemplateRepo.removeRoomTypeFromAll(id);
    return roomTypeRepo.remove(id);
}

module.exports = {
    listRoomTypes,
    createRoomType,
    renameRoomType,
    deleteRoomType,
};