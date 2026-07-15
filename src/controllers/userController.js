const userService = require("../services/userService");

async function createUser(req, res, next) {
    try {
        const { userName, fullName, role } = req.body;

        const result = await userService.createUser(userName, fullName, role);

        return res.status(201).json({
            success: true,
            message: "Bruger oprettet",
            tempPassword: result.tempPassword,
            user: result.user
        });

    } catch (error) {
        next(error);
    }
}

async function deactivateUser(req, res, next) {
    try {
        const { id } = req.params;

        const result = await userService.deactivateUser(id);

        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

async function reactivateUser(req, res, next) {
    try {
        const { id } = req.params;
        const user = await userService.reactivateUser(id);

        return res.status(200).json({
            success: true,
            message: "Bruger genaktiveret",
            user
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createUser,
    deactivateUser,
    reactivateUser,
};