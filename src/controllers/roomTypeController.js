const roomTypeService = require('../services/roomTypeService');

async function renderList(res, toast = null) {
    const roomTypes = await roomTypeService.listRoomTypes();
    return res.render('roomTypes/list', { roomTypes, toast });
}

async function listRoomTypes(req, res, next) {
    try {
        return await renderList(res);
    } catch (err) {
        next(err);
    }
}

async function createRoomType(req, res, next) {
    try {
        await roomTypeService.createRoomType(req.body.name);
        return await renderList(res, 'Lokaletype oprettet.');
    } catch (err) {
        next(err);
    }
}

async function renameRoomType(req, res, next) {
    try {
        await roomTypeService.renameRoomType(req.params.id, req.body.name);
        return await renderList(res, 'Lokaletype omdøbt.');
    }  catch (err) {
        next(err);
    }
}

async function deleteRoomType(req, res, next) {
    try {
        await roomTypeService.deleteRoomType(req.params.id);
        return await renderList(res, 'Lokaletype slettet.');
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listRoomTypes,
    createRoomType,
    renameRoomType,
    deleteRoomType
}