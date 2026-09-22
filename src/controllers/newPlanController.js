// controllers/newPlanController.js

const newPlanService = require("../services/newPlanService");

/**
 * GET /newPlan/:planId/editor (og /newPlan/:planId/summary)
 * Viser editoren for en eksisterende rengøringsplan gemt i DB
 */
async function showEditor(req, res, next) {
    try {
        const planId = req.params.planId;
        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/addRoom
 */
async function addRoom(req, res, next) {
    try {
        const planId = req.params.planId;
        const { templateId, name, size } = req.body;

        await newPlanService.addRoomToPlan(planId, { templateId, name, size });

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/removeRoom
 */
async function removeRoom(req, res, next) {
    try {
        const planId = req.params.planId;
        const { roomName } = req.body;

        await newPlanService.removeRoomFromPlan(planId, roomName);

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/updateRoom
 */
async function updateRoom(req, res, next) {
    try {
        const planId = req.params.planId;
        const { oldRoomName, newRoomName, size } = req.body;

        await newPlanService.updateRoomInPlan(planId, { oldRoomName, newRoomName, size });

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/reorderRooms
 */
async function reorderRooms(req, res, next) {
    try {
        const planId = req.params.planId;
        const { order } = req.body;

        await newPlanService.reorderRoomsInPlan(planId, order);

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/addTask
 */
async function addTask(req, res, next) {
    try {
        const planId = req.params.planId;
        const { templateId, roomName } = req.body;

        await newPlanService.addTaskToPlan(planId, { templateId, roomName });

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/removeTask
 */
async function removeTask(req, res, next) {
    try {
        const planId = req.params.planId;
        const { taskId, taskIndex } = req.body;

        await newPlanService.removeTaskFromPlan(planId, { taskId, taskIndex });

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/updateTask
 */
async function updateTask(req, res, next) {
    try {
        const planId = req.params.planId;
        const { taskId, taskIndex, amount, frequency, durationPerUnit, customPrice } = req.body;

        await newPlanService.updateTaskInPlan(planId, { taskId, taskIndex, amount, frequency, durationPerUnit, customPrice });

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/addDayToRoom
 */
async function addDayToRoom(req, res, next) {
    try {
        const planId = req.params.planId;
        const { roomName, day } = req.body;

        await newPlanService.addDayToRoomInPlan(planId, { roomName, day });

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/setDaysForRoom
 */
async function setDaysForRoom(req, res, next) {
    try {
        const planId = req.params.planId;
        const { roomName, days } = req.body;

        await newPlanService.setDaysForRoomInPlan(planId, { roomName, days });

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/addDay
 */
async function addDay(req, res, next) {
    try {
        const planId = req.params.planId;
        const { taskId, taskIndex, templateId, roomName, day } = req.body;

        await newPlanService.addDayToTaskInPlan(planId, { taskId, taskIndex, templateId, roomName, day });

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/removeDay
 */
async function removeDay(req, res, next) {
    try {
        const planId = req.params.planId;
        const { taskId, taskIndex, templateId, roomName, day } = req.body;

        await newPlanService.removeDayFromPlan(planId, { taskId, taskIndex, templateId, roomName, day });

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/saveSummaryAdjustments
 */
async function saveSummaryAdjustments(req, res, next) {
    try {
        const planId = req.params.planId;
        await newPlanService.saveSummaryAdjustmentsInPlan(planId, req.body);

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /newPlan/:planId/updateRoomNotes
 */
async function updateRoomNotes(req, res, next) {
    try {
        const planId = req.params.planId;
        const { roomName, notes } = req.body;

        await newPlanService.updateRoomNotesInPlan(planId, roomName, notes);

        const vm = await newPlanService.buildExistingPlanViewModel(planId);
        return res.render("newPlanDraft/summary", vm);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    showEditor,
    addRoom,
    removeRoom,
    updateRoom,
    reorderRooms,
    addTask,
    removeTask,
    updateTask,
    addDayToRoom,
    setDaysForRoom,
    addDay,
    removeDay,
    saveSummaryAdjustments,
    updateRoomNotes
};
