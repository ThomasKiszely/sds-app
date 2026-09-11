const roomTemplateRepo = require("../data/roomTemplateRepo");
const { userError } = require("../utils/userError");

async function createRoomTemplate({ name, defaultSize, bundleType }) {
    const existing = await roomTemplateRepo.findByName(name);
    if (existing) {
        throw userError("Et rum-template med dette navn findes allerede.");
    }

    const size = Number(defaultSize);

    return roomTemplateRepo.create({
        name,
        defaultSize: size,
        bundleType,
    });
}

async function getAllRoomTemplates() {
    return roomTemplateRepo.findAll();
}

async function getRoomTemplateById(id) {
    const template = await roomTemplateRepo.findById(id);
    if (!template) throw userError("Rum-template findes ikke.");
    return template;
}

async function updateRoomTemplate(id, { name, defaultSize, bundleType }) {
    const existing = await roomTemplateRepo.findByName(name);

    if (existing && existing._id.toString() !== id) {
        throw userError("Et rum-template med dette navn findes allerede.");
    }

    return roomTemplateRepo.update(id, {
        name,
        defaultSize: Number(defaultSize),
        bundleType
    });
}

async function deleteRoomTemplate(id) {
    const template = await roomTemplateRepo.findById(id);
    if (!template) throw userError("Rum-template findes ikke.");
    return roomTemplateRepo.remove(id);
}

module.exports = {
    createRoomTemplate,
    getAllRoomTemplates,
    getRoomTemplateById,
    updateRoomTemplate,
    deleteRoomTemplate
};
