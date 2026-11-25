const { userRoles } = require('./userRoles');

/**
 * Menupunkter i sidebaren.
 *
 * href:    siden der hentes ind i #content
 * match:   sti-præfikser, der markerer punktet som aktivt
 * preview: siden viser kun eksempeldata (ikke bygget endnu)
 * tab:     vises også i fanebjælken på mobil
 *
 * Menuen skjuler kun links. Adgangen håndhæves på serveren med requireRole.
 */

// --- Fælles menupunkter ---
const planning = { label: 'Planlægning', icon: 'calendar-days', href: '/preview/planning', match: ['/preview/planning'], preview: true, tab: true };
const quickCalc = { label: 'Hurtig beregning', tabLabel: 'Tilbud', icon: 'calculator', href: '/newPlanDraft/summary', match: ['/newPlanDraft', '/newPlan/'], tab: true };
const customers = { label: 'Kunder', icon: 'building-2', href: '/customers', match: ['/customers', '/locations', '/cleaningPlans', '/offers', '/contracts', '/preview/customer-group'], tab: true };
const customerAddresses = { label: 'Kunder (kun adresser)', tabLabel: 'Kunder', icon: 'building-2', href: '/customers', match: ['/customers', '/locations'], tab: true };
const employees = { label: 'Medarbejdere', icon: 'users', href: '/employees', match: ['/employees'], tab: true };
const invoices = { label: 'Fakturaer', icon: 'file-text', href: '/preview/invoices', match: ['/preview/invoices'], preview: true };
const tasks = { label: 'Opgaver', icon: 'list-checks', href: '/cleaningTaskTemplates/page', match: ['/cleaningTaskTemplates'] };
const rooms = { label: 'Lokaler', icon: 'door-open', href: '/roomTemplates/page', match: ['/roomTemplates', '/roomTypes'] };
const admin = { label: 'Admin', icon: 'settings', href: '/admin', match: ['/admin', '/users'] };

const cleaningPreview = {
    title: 'Rengøring',
    preview: true,
    items: [
        { label: 'I dag', icon: 'sun', href: '/preview/cleaning/today', match: ['/preview/cleaning/today', '/preview/cleaning/finish', '/preview/cleaning/sick'] },
        { label: 'Min uge', icon: 'calendar-days', href: '/preview/cleaning/week', match: ['/preview/cleaning/week'] },
        { label: 'Fri', icon: 'plane', href: '/preview/cleaning/time-off', match: ['/preview/cleaning/time-off'] },
    ],
};

// --- Menu pr. rolle ---
const sectionsByRole = {
    [userRoles.admin]: [
        // Admin har allerede fire faner på mobil, så Medarbejdere ligger under "Menu"
        { items: [planning, quickCalc, customers, invoices, { ...employees, tab: false }] },
        { items: [tasks, rooms, admin] },
        cleaningPreview,
    ],
    [userRoles.planner]: [
        { items: [planning, customerAddresses, employees] },
        { items: [tasks, rooms] },
    ],
    [userRoles.seller]: [
        { items: [quickCalc, customers] },
    ],
    // Rengøringssiderne er endnu kun preview (admin). Cleaner får sin menu i en senere branch.
    [userRoles.cleaner]: [],
};

function navigationFor(user) {
    return (user && sectionsByRole[user.role]) || [];
}

function tabItemsFor(user) {
    return navigationFor(user).flatMap(section => section.items).filter(item => item.tab);
}

module.exports = { navigationFor, tabItemsFor };
