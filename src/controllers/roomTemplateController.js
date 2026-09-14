const roomTemplateService = require("../services/roomTemplateService");
const cleaningTaskTemplateService = require("../services/cleaningTaskTemplateService");

async function showCreateForm(req, res) {
    const cleaningTaskTemplates = await cleaningTaskTemplateService.listTemplates();

    res.render("roomTemplates/create", {
        error: null,
        formData: {},
        cleaningTaskTemplates
    });
}


async function createRoomTemplate(req, res) {
    try {
        const { name, defaultSize, bundleType, daily, floor, inventory } = req.body;

        await roomTemplateService.createRoomTemplate({
            name,
            defaultSize,
            bundleType,
            taskTemplateId: {
                daily,
                floor,
                inventory
            }
        });

        const roomTemplates = await roomTemplateService.getAllRoomTemplates();

        return res.render("roomTemplates/page", {
            roomTemplates,
            toast: "Rum-template oprettet!"
        });

    } catch (error) {
        console.error("Error creating room template:", error);

        const safeMessage = error.isUserError
            ? error.message
            : "Der skete en fejl.";

        const cleaningTaskTemplates = await cleaningTaskTemplateService.listTemplates();

        return res.status(400).render("roomTemplates/create", {
            error: safeMessage,
            formData: req.body,
            cleaningTaskTemplates
        });
    }
}


async function showRoomTemplatePage(req, res) {
    try {
        const roomTemplates = await roomTemplateService.getAllRoomTemplates();

        return res.render("roomTemplates/page", {
            roomTemplates,
            toast: null
        });

    } catch (error) {
        console.error("Error loading room templates:", error);

        return res.status(500).render("roomTemplates/page", {
            roomTemplates: [],
            error: "Noget gik galt – prøv igen."
        });
    }
}
async function showEditForm(req, res) {
    try {
        const template = await roomTemplateService.getRoomTemplateById(req.params.id);
        const cleaningTaskTemplates = await cleaningTaskTemplateService.listTemplates();

        return res.render("roomTemplates/edit", {
            template,
            cleaningTaskTemplates,
            error: null
        });

    } catch (error) {
        console.error("FEJL I showEditForm:", error);

        const safeMessage = error.isUserError
            ? error.message
            : "Noget gik galt – prøv igen.";

        return res.status(400).render("roomTemplates/page", {
            roomTemplates: await roomTemplateService.getAllRoomTemplates(),
            error: safeMessage,
            toast: null
        });
    }
}

async function updateRoomTemplate(req, res) {
    try {
        const { name, defaultSize, bundleType, daily, floor, inventory } = req.body;

        await roomTemplateService.updateRoomTemplate(req.params.id, {
            name,
            defaultSize,
            bundleType,
            taskTemplateId: {
                daily,
                floor,
                inventory
            }
        });

        const roomTemplates = await roomTemplateService.getAllRoomTemplates();

        return res.render("roomTemplates/page", {
            roomTemplates,
            toast: "Rum-template opdateret!"
        });

    } catch (error) {
        const safeMessage = error.isUserError
            ? error.message
            : "Noget gik galt – prøv igen.";

        const cleaningTaskTemplates = await cleaningTaskTemplateService.listTemplates();

        return res.status(400).render("roomTemplates/edit", {
            template: { _id: req.params.id, ...req.body },
            error: safeMessage,
            cleaningTaskTemplates
        });
    }
}


async function deleteRoomTemplate(req, res) {
    try {
        await roomTemplateService.deleteRoomTemplate(req.params.id);

        const roomTemplates = await roomTemplateService.getAllRoomTemplates();

        return res.render("roomTemplates/page", {
            roomTemplates,
            toast: "Rum-template slettet!"
        });

    } catch (error) {
        const safeMessage = error.isUserError
            ? error.message
            : "Noget gik galt – prøv igen.";

        const roomTemplates = await roomTemplateService.getAllRoomTemplates();

        return res.status(400).render("roomTemplates/page", {
            roomTemplates,
            error: safeMessage,
            toast: null
        });
    }
}

module.exports = {
    showCreateForm,
    createRoomTemplate,
    showRoomTemplatePage,
    showEditForm,
    deleteRoomTemplate,
    updateRoomTemplate
};
