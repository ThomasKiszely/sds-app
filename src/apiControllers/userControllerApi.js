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
        const deactivated = await userService.deactivateUser(id);

        return res.status(200).json({
            success: true,
            message: "Bruger deaktiveret",
            deactivated
        });
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

async function listUsers(req, res, next) {
    try {
        const users = await userService.getAllUsers();

        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        next(error);
    }
}

async function changePassword(req, res, next) {
    try {
        const userId = req.session.user.id;
        const { password, repeated } = req.body;

        const updated = await userService.updatePassword(userId, password, repeated);

        req.session.user.mustChangePassword = false;

        return res.status(200).json({
            success: true,
            message: "Kodeord opdateret",
            user: updated
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

async function resetPassword(req, res, next) {
    try {
        const { id } = req.params;
        const result = await userService.resetPassword(id);

        return res.status(200).json({
            success: true,
            message: "Kodeord nulstillet",
            tempPassword: result.tempPassword,
            user: result.user
        });

    } catch (error) {
        next(error);
    }
}

async function getUserById(req, res, next) {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        next(error);
    }
}

async function updateUser(req, res, next) {
    try {
        const { id } = req.params;
        const { fullName, role } = req.body;
        const { adminId } = req.user.id;

        const updated = await userService.updateUser(id, { fullName, role }, adminId);

        return res.status(200).json({
            success: true,
            message: "Bruger opdateret",
            user: updated
        });

    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { userName, password } = req.body;
        const result = await userService.login(userName, password);

        req.session.user = result.user;

        return res.status(200).json({
            success: true,
            mustChangePassword: result.user.mustChangePassword
        });

    } catch (error) {
        return res.status(401).json({
            success: false,
            error: "Forkert brugernavn eller adgangskode"
        });
    }
}

async function logout(req, res, next) {
    try {
        req.session.destroy(err => {
            if (err) {
                return next(new Error("Kunne ikke logge ud - prøv igen"));
            }

            res.clearCookie('connect.sid');

            return res.status(200).json({
                success: true,
                message: "Du er nu logget ud"
            });
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    createUser,
    changePassword,
    deactivateUser,
    reactivateUser,
    listUsers,
    resetPassword,
    getUserById,
    updateUser,
    login,
    logout
};
