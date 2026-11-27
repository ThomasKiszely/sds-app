const { icon } = require('./icons');
const { roleGroups } = require('./userRoles');

// Initialer til avatarer: "Anna Holm" -> "AH"
function initials(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0] ? parts[0][0] : '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
}

// Beløb i danske kroner: 23169 -> "23.169 kr."
function kr(value, decimals = 0) {
    const n = Number(value) || 0;
    return n.toLocaleString('da-DK', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }) + ' kr.';
}

const roleLabels = {
    admin: 'Admin',
    planner: 'Planner',
    seller: 'Salg',
    cleaner: 'Rengøring',
};

function roleLabel(role) {
    return roleLabels[role] || role || '';
}

// Salg (admin og seller) må se priser og oprette/ændre kunder, planer og tilbud.
// Samme gruppe som requireRole(...roleGroups.sales) på ruterne.
function canSell(user) {
    return Boolean(user) && roleGroups.sales.includes(user.role);
}

module.exports = { icon, initials, kr, roleLabel, canSell };
