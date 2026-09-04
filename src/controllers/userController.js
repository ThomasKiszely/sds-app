const userService = require("../services/userService");

// -----------------------------------------------------
// Opret bruger (HTMX)
async function createUser(req, res, next) {
    try {
        const { userName, fullName, role, position, phoneNumber, email, address } = req.body;

        const result = await userService.createUser({
            userName,
            fullName,
            role,
            position,
            phoneNumber,
            email,
            address
        });

        return res.render('admin/users/created', {
            tempPassword: result.tempPassword,
            user: result.user,
            sessionUserId: req.session.user.id
        });

    } catch (error) {
        next(error);
    }
}


// -----------------------------------------------------
// Deaktivér bruger (HTMX)
async function deactivateUser(req, res, next) {
    try {
        const { id } = req.params;

        await userService.deactivateUser(id);

        const users = await userService.getAllUsers();

        res.setHeader("HX-Trigger", JSON.stringify({
            toast: "Bruger deaktiveret"
        }));

        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({
            toast: error.message
        }));

        const users = await userService.getAllUsers();

        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });
    }
}

// -----------------------------------------------------
// Genaktivér bruger (HTMX)
async function reactivateUser(req, res, next) {
    try {
        const { id } = req.params;

        await userService.reactivateUser(id);

        const users = await userService.getAllUsers();

        res.setHeader("HX-Trigger", JSON.stringify({
            toast: "Bruger genaktiveret"
        }));

        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({
            toast: error.message
        }));

        const users = await userService.getAllUsers();

        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });
    }
}

// -----------------------------------------------------
// Liste brugere (HTMX)
async function listUsers(req, res, next) {
    try {
        const users = await userService.getAllUsers();

        return res.render('admin/users', {
            users,
            sessionUserId: req.session.user.id
        });

    } catch (error) {
        next(error);
    }
}

// -----------------------------------------------------
// Skift eget password (full page)
async function changePassword(req, res, next) {
    try {
        const userId = req.session.user.id;
        const { password, repeated } = req.body;

        const updated = await userService.updatePassword(userId, password, repeated);

        req.session.user.mustChangePassword = false;

        return res.redirect('/');

    } catch (error) {
        if (req.headers.referer.includes('/change-password')) {
            return res.status(400).render('changePassword', {
                user: req.session.user,
                error: error.message
            });
        }

        req.session.formError = error.message;
        req.session.loadMe = true;
        return res.redirect('/');
    }
}

// -----------------------------------------------------
// Nulstil password (HTMX)
async function resetPassword(req, res, next) {
    try {
        const { id } = req.params;

        const result = await userService.resetPassword(id);

        return res.render('admin/resetPasswordResult', {
            tempPassword: result.tempPassword,
            sessionUserId: req.session.user.id
        });

    } catch (error) {
        next(error);
    }
}

// -----------------------------------------------------
// Hent bruger (API)
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
        const { fullName, role, position, phoneNumber, email, address } = req.body;
        const adminId = req.session.user.id;

        await userService.updateUser(
            id,
            { fullName, role, position, phoneNumber, email, address },
            adminId
        );

        // Hent alle brugere igen, så listen er opdateret
        const users = await userService.getAllUsers();

        // Send toast til HTMX
        res.setHeader("HX-Trigger", JSON.stringify({
            toast: "Bruger opdateret"
        }));

        // Returnér HTML til hx-target
        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });

    } catch (error) {

        // Send fejl-toast
        res.setHeader("HX-Trigger", JSON.stringify({
            toast: error.message
        }));

        // Vis listen igen
        const users = await userService.getAllUsers();

        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });
    }
}



// -----------------------------------------------------
// Login (full page)
async function login(req, res, next) {
    try {
        const { userName, password } = req.body;

        const result = await userService.login(userName, password);

        req.session.user = result.user;

        if (result.user.mustChangePassword) {
            return res.redirect('/change-password');
        }

        return res.redirect('/');

    } catch (error) {
        return res.status(401).render('login', {
            error: "Forkert brugernavn eller adgangskode"
        });
    }
}

// -----------------------------------------------------
// Logout (HTMX)
async function logout(req, res, next) {
    try {
        req.session.destroy(err => {
            if (err) {
                return next(new Error("Kunne ikke logge ud - prøv igen"));
            }

            res.clearCookie('connect.sid');

            res.setHeader("HX-Redirect", "/login");
            return res.status(200).end();
        });

    } catch (error) {
        next(error);
    }
}

// -----------------------------------------------------
// Opdater rolle (HTMX)
async function updateUserRole(req, res, next) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        await userService.updateUser(id, { role }, req.session.user.id);

        const users = await userService.getAllUsers();

        res.setHeader("HX-Trigger", JSON.stringify({
            toast: "Rolle opdateret"
        }));

        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({
            toast: error.message
        }));

        const users = await userService.getAllUsers();

        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });
    }
}

async function editUser(req, res, next) {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);

        return res.render("admin/users/edit", {
            user,
            sessionUserId: req.session.user.id
        });

    } catch (error) {
        next(error);
    }
}

async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;

        await userService.deleteUser(id);

        const users = await userService.getAllUsers();

        res.setHeader("HX-Trigger", JSON.stringify({
            toast: "Bruger slettet permanent"
        }));

        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });

    } catch (error) {
        res.setHeader("HX-Trigger", JSON.stringify({
            toast: error.message
        }));

        const users = await userService.getAllUsers();

        return res.render("admin/users", {
            users,
            sessionUserId: req.session.user.id
        });
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
    logout,
    updateUserRole,
    editUser,
    deleteUser
};
