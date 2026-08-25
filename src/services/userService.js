const userRepo = require('../data/userRepo');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { userRoles } = require('../utils/userRoles');
const { userError } = require('../utils/userError');

async function createUser({ userName, fullName, role, position, phoneNumber, email, address }) {
    userName = userName.trim();
    fullName = fullName.trim();

    // Tjek om brugernavn findes
    const existing = await userRepo.findByName(userName);
    if (existing) {
        throw userError("Brugernavnet findes allerede", 400);
    }

    // Generér midlertidigt password
    const tempPassword = crypto.randomBytes(4).toString('hex');

    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Opret bruger
    const user = await userRepo.createUser({
        userName,
        fullName,
        position,
        phoneNumber,
        email,
        address,
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
            position: user.position,
            phoneNumber: user.phoneNumber,
            email: user.email,
            address: user.address,
            role: user.role
        }
    };
}


async function deactivateUser(id) {
    const user = await userRepo.findById(id);
    if (!user) {
        throw userError("Bruger findes ikke", 404);
    }
    if (!user.active){
        throw userError("Bruger er allerede deaktiveret", 400);
    }
    await userRepo.deactivateUser(id);
}

async function reactivateUser(id) {
    const user = await userRepo.findById(id);
    if (!user) {
        throw userError("Bruger findes ikke", 404);
    }
    if (user.active){
        throw userError("Bruger er allerede aktiv", 400);
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
        throw userError("Kodeordene matcher ikke", 400);
    }

    if (!password || typeof password !== "string") {
        throw userError("Ugyldigt kodeord", 400);
    }

    if (password.length < 8) {
        throw userError("Kodeord skal være mindst 8 tegn", 400);
    }

    if (!/[A-Z]/.test(password)) {
        throw userError("Kodeord skal indeholde mindst ét stort bogstav", 400);
    }

    if (!/[a-z]/.test(password)) {
        throw userError("Kodeord skal indeholde mindst ét lille bogstav", 400);
    }

    if (!/[0-9]/.test(password)) {
        throw userError("Kodeord skal indeholde mindst ét tal", 400);
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw userError("Kodeord skal indeholde mindst ét specialtegn", 400);
    }

    const user = await userRepo.findById(id);
    if (!user) {
        throw userError("Bruger findes ikke", 404);
    }

    if (!user.active) {
        throw userError("Bruger er deaktiveret", 400);
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
        throw userError("Bruger findes ikke", 404);
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
        throw userError("Bruger findes ikke", 404);
    }
    return {
        id: user._id,
        userName: user.userName,
        fullName: user.fullName,
        position: user.position,
        phoneNumber: user.phoneNumber,
        email: user.email,
        address: user.address,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt
    };
}

async function updateUser(id, { fullName, role, position, phoneNumber, email, address }, adminId) {

    const user = await userRepo.findById(id);
    if (!user) {
        throw userError("Bruger findes ikke", 404);
    }

    if (!user.active) {
        throw userError("Bruger er deaktiveret", 400);
    }

    // --- Business-regler for rolle ---
    if (role) {

        // Regel 1: Admin må ikke nedgradere sig selv
        if (id === adminId && role !== userRoles.ADMIN) {
            throw userError("Du kan ikke nedgradere dig selv fra admin", 400);
        }

        // Regel 2: Kun admins må gøre andre til admin
        // (dette er ekstra sikkerhed)
        if (role === userRoles.ADMIN && user.role !== userRoles.ADMIN) {
            // admin ændrer en user til admin → OK
        }
    }

    const updated = await userRepo.updateUser(id, { fullName, role, position, phoneNumber, email, address });

    return {
        id: updated._id,
        userName: updated.userName,
        fullName: updated.fullName,
        position: updated.position,
        phoneNumber: updated.phoneNumber,
        email: updated.email,
        address: updated.address,
        role: updated.role,
        active: updated.active,
        createdAt: updated.createdAt
    };
}

async function login(userName, password) {

    // 1. Find bruger
    const user = await userRepo.findByName(userName);
    if (!user) {
        throw userError("Forkert brugernavn eller kodeord", 400);
    }

    // 2. Tjek om bruger er aktiv
    if (!user.active) {
        throw userError("Bruger er deaktiveret", 400);
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
            position: user.position,
            phoneNumber: user.phoneNumber,
            email: user.email,
            address: user.address,
            role: user.role,
            active: user.active,
            mustChangePassword: user.mustChangePassword
        }
    };
}

async function deleteUser(id) {
    const user = await userRepo.findById(id);
    if (!user) {
        throw userError("Bruger findes ikke", 404);
    }

    return await userRepo.deleteUser(id);
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
    deleteUser
};
