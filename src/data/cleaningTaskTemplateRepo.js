const CleaningTaskTemplate = require('../models/CleaningTaskTemplate');
require('../models/RoomType');
const { escapeRegExp } = require('../utils/escapeRegExp');
const { categoryTypes } = require('../utils/categoryEnum');
// CREATE
async function createTemplate(data) {
    return CleaningTaskTemplate.create(data);
}

// LIST ACTIVE
async function listTemplates(search = "", roomType = null, filter = "all") {
    const query = { isActive: true };

    if(filter === "consumables") {
        query.category = categoryTypes.consumables;
    } else if (filter === "tasks") {
        query.category = { $ne: categoryTypes.consumables };
    }

    if (search) {
        const regex = new RegExp(escapeRegExp(search), "i");
        query.$or = [
            { name: regex },
            { category: regex },
            { description: regex }
        ];
    }
    if (roomType) {
        query.roomTypes = roomType;
    }
    return CleaningTaskTemplate.find(query).populate('roomTypes').sort({ name: 1 });
}

// LIST DELETED
async function listDeletedTemplates(filter = "all") {
    const query = { isActive: false };

    if(filter === "consumables") {
        query.category = categoryTypes.consumables;
    } else if (filter === "tasks") {
        query.category = { $ne: categoryTypes.consumables };
    }
    return CleaningTaskTemplate.find(query).sort({ name: 1 });
}

// FIND BY ID
async function findTemplateById(id) {
    return CleaningTaskTemplate.findById(id);
}

async function findTemplatesByIds(ids){
    return CleaningTaskTemplate.find({ _id: { $in: ids } });
}

// UPDATE
async function updateTemplate(id, data) {
    return CleaningTaskTemplate.findByIdAndUpdate(
        id,
        {
            ...data,
            updatedAt: new Date()
        },
        { new: true }
    );
}

// SOFT DELETE
async function softDeleteTemplate(id) {
    return CleaningTaskTemplate.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
    );
}

// REACTIVATE
async function reactivateTemplate(id) {
    return CleaningTaskTemplate.findByIdAndUpdate(
        id,
        { isActive: true, updatedAt: new Date() },
        { new: true }
    );
}

// FIND BY CATEGORY
async function findByCategory(category) {
    return CleaningTaskTemplate.find({
        category,
        isActive: true
    })
        .sort({ name: 1 });
}

async function removeRoomTypeFromAll(roomTypeId) {
    return CleaningTaskTemplate.updateMany(
        { roomTypes: roomTypeId },
        { $pull: { roomTypes: roomTypeId } }
    );
}

module.exports = {
    createTemplate,
    listTemplates,
    listDeletedTemplates,
    findTemplateById,
    findTemplatesByIds,
    updateTemplate,
    softDeleteTemplate,
    reactivateTemplate,
    findByCategory,
    removeRoomTypeFromAll
};
