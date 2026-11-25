const userService = require('../services/userService');
const { userRoles } = require('../utils/userRoles');
const { areas, areaLabels } = require('../utils/areas');
const { weekDays, weekDayLabels } = require('../utils/weekDays');

// Roller vist som kort i Opret-panelet (rækkefølge som i wireframen)
const roleChoices = [
    { value: userRoles.cleaner, title: 'Rengøring', text: 'Ser egne besøg og tjeklister' },
    { value: userRoles.seller, title: 'Salg', text: 'Laver tilbud ude hos kunden' },
    { value: userRoles.planner, title: 'Planner', text: 'Planlægger og opretter medarbejdere' },
    { value: userRoles.admin, title: 'Admin', text: 'Fuld adgang' },
];

// -----------------------------------------------------
// Liste over medarbejdere (admin og planner ser alle)
async function listEmployees(req, res, next) {
    try {
        const employees = await userService.getAllUsers();

        return res.render('employees/list', {
            employees,
            areaLabels,
            weekDayLabels,
        });
    } catch (error) {
        next(error);
    }
}

// -----------------------------------------------------
// Opret-panel (HTMX → #overlay)
function showCreateForm(req, res) {
    const actorRole = req.session.user.role;

    return res.render('employees/_createDrawer', {
        roles: roleChoices.filter(r => userService.canManage(actorRole, r.value)),
        areas: Object.values(areas),
        areaLabels,
        weekDays: Object.values(weekDays),
        weekDayLabels,
        isAdmin: actorRole === userRoles.admin,
    });
}

// -----------------------------------------------------
// Opret medarbejder (HTMX → #content)
async function createEmployee(req, res, next) {
    try {
        const { userName, fullName, role, phoneNumber, email, employment } = req.body;

        const result = await userService.createUser(
            { userName, fullName, role, phoneNumber, email, employment },
            req.session.user.role
        );

        return res.render('employees/created', {
            tempPassword: result.tempPassword,
            employee: result.user,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listEmployees,
    showCreateForm,
    createEmployee,
};
