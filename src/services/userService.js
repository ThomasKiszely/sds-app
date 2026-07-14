const userRepo = require('../data/userRepo');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function createUser(name, role) {
    // Tjek om brugernavn findes
    const existing = await userRepo.findByName(name);
    if (existing) {
        throw new Error("Brugernavnet findes allerede");
    }

    // Generér midlertidigt password
    const tempPassword = crypto.randomBytes(4).toString('hex');

    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Opret bruger
    const user = await userRepo.createUser({
        name,
        password: hashedPassword,
        role,
        mustChangePassword: true,
        active: true
    });

    return {
        tempPassword,
        user: {
            id: user._id,
            name: user.name,
            role: user.role
        }
    };
}

module.exports = { createUser };
