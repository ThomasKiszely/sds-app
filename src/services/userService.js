const userRepo = require('../data/userRepo');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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

module.exports = { createUser, deactivateUser, reactivateUser };
