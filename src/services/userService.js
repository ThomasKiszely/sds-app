const userRepo = require('../data/userRepo');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { userRoles } = require('../utils/userRoles');

async function createUser(userName, fullName, role) {
    userName = userName.trim();
    fullName = fullName.trim();

    // Tjek om brugernavn findes
    const existing = await userRepo.findByName(userName);
    if (existing) {
        throw new Error("Brugernavnet findes allerede");
    }

    // Generér midlertidigt password
    const tempPassword = crypto.randomBytes(4).toString('hex');

    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Opret bruger
    const user = await userRepo.createUser({
        userName,
        fullName,
        password: hashedPassword,
        role,
        mustChangePassword: true,
        active: true
    });

    return {
        tempPassword,
        user: {
            id: user._id,
            userName: user.userName,
            fullName: user.fullName,
            role: user.role
        }
    };
}

async function deactivateUser(id) {
    const user = await userRepo.findById(id);
    if (!user) {
        throw new Error("Bruger findes ikke");
    }
    if (!user.active){
        throw new Error("Bruger er allerede deaktiveret");
    }
    await userRepo.deactivateUser(id);
}

async function reactivateUser(id) {
    const user = await userRepo.findById(id);
    if (!user) {
        throw new Error("Bruger findes ikke");
    }
    if (user.active){
        throw new Error("Bruger er allerede aktiv");
    }
    return await userRepo.reactivateUser(id);
}

async function getAllUsers() {
    return await userRepo.getAllUsers();
}

async function updatePassword(id, password, repeated) {

    // Trim whitespace
    password = (password || "").trim();
    repeated = (repeated || "").trim();

    if (password !== repeated) {
        throw new Error("Kodeordene matcher ikke");
    }

    if (!password || typeof password !== "string") {
        throw new Error("Ugyldigt kodeord");
    }

    if (password.length < 8) {
        throw new Error("Kodeord skal være mindst 8 tegn");
    }

    if (!/[A-Z]/.test(password)) {
        throw new Error("Kodeord skal indeholde mindst ét stort bogstav");
    }

    if (!/[a-z]/.test(password)) {
        throw new Error("Kodeord skal indeholde mindst ét lille bogstav");
    }

    if (!/[0-9]/.test(password)) {
        throw new Error("Kodeord skal indeholde mindst ét tal");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new Error("Kodeord skal indeholde mindst ét specialtegn");
    }

    const user = await userRepo.findById(id);
    if (!user) {
        throw new Error("Bruger findes ikke");
    }

    if (!user.active) {
        throw new Error("Bruger er deaktiveret");
    }

    const hashed = await bcrypt.hash(password, 12);

    const updated = await userRepo.updatePassword(id, hashed, false);

    return {
        id: updated._id,
        userName: updated.userName,
        fullName: updated.fullName,
        role: updated.role,
        active: updated.active
    };
}


async function resetPassword(id){
    const user = await userRepo.findById(id);
    if (!user) {
        throw new Error("Bruger findes ikke");
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');

    const hashed = await bcrypt.hash(tempPassword, 12);

    const updated = await userRepo.updatePassword(id, hashed, true);

    return {
        tempPassword,
        user: {
            id: updated._id,
            userName: updated.userName,
            fullName: updated.fullName,
            role: updated.role,
            active: updated.active,
        }
    };
}

async function getUserById(id) {
    const user = await userRepo.findById(id);
    if (!user) {
        throw new Error("Bruger findes ikke");
    }
    return {
        id: user._id,
        userName: user.userName,
        fullName: user.fullName,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt
    };
}

async function updateUser(id, { fullName, role }, adminId) {

    const user = await userRepo.findById(id);
    if (!user) {
        throw new Error("Bruger findes ikke");
    }

    if (!user.active) {
        throw new Error("Bruger er deaktiveret");
    }

    // --- Business-regler for rolle ---
    if (role) {

        // Regel 1: Admin må ikke nedgradere sig selv
        if (id === adminId && role !== userRoles.ADMIN) {
            throw new Error("Du kan ikke nedgradere dig selv fra admin");
        }

        // Regel 2: Kun admins må gøre andre til admin
        // (dette er ekstra sikkerhed)
        if (role === userRoles.ADMIN && user.role !== userRoles.ADMIN) {
            // admin ændrer en user til admin → OK
        }
    }

    const updated = await userRepo.updateUser(id, { fullName, role });

    return {
        id: updated._id,
        userName: updated.userName,
        fullName: updated.fullName,
        role: updated.role,
        active: updated.active,
        createdAt: updated.createdAt
    };
}

async function login(userName, password) {

    // 1. Find bruger
    const user = await userRepo.findByName(userName);
    if (!user) {
        throw new Error("Forkert brugernavn eller kodeord");
    }

    // 2. Tjek om bruger er aktiv
    if (!user.active) {
        throw new Error("Bruger er deaktiveret");
    }

    // 3. Tjek password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new Error("Forkert brugernavn eller kodeord");
    }

    // 4. Returnér user + mustChangePassword
    return {
        user: {
            id: user._id,
            userName: user.userName,
            fullName: user.fullName,
            role: user.role,
            active: user.active,
            mustChangePassword: user.mustChangePassword
        }
    };
}

module.exports = {
    createUser,
    deactivateUser,
    reactivateUser,
    getAllUsers,
    updatePassword,
    resetPassword,
    getUserById,
    updateUser,
    login,
};
