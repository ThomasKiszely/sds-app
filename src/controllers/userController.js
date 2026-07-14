const userService = require("../services/userService");

async function createUser(req, res, next) {
    try {
        const { name, role } = req.body;

        const result = await userService.createUser(name, role);

        res.json({
            success: true,
            message: "Bruger oprettet",
            tempPassword: result.tempPassword,
            user: result.user
        });

    } catch (error) {
        next(error);
    }
}

module.exports = { createUser };