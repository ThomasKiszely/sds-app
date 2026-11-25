const userRoles = {
    admin: "admin",
    planner: "planner",
    cleaner: "cleaner",
    seller: "seller",
};

// Rollegrupper til adgangskontrol på ruter (bruges med requireRole(...gruppe))
const roleGroups = {
    // Tilbud, beregning, planer og kontrakter – indeholder priser
    sales: [userRoles.admin, userRoles.seller],
    // Kunder og lokationer – planner må se adresser
    customers: [userRoles.admin, userRoles.seller, userRoles.planner],
    // Medarbejdere, planlægning, opgaver og lokaler (læse)
    planning: [userRoles.admin, userRoles.planner],
};

module.exports = { userRoles, roleGroups };
