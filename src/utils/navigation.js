const { userRoles } = require('./userRoles');

/**
 * Menupunkter i sidebaren.
 *
 * href:    siden der hentes ind i #content
 * match:   sti-præfikser, der markerer punktet som aktivt
 * preview: siden viser kun eksempeldata (ikke bygget endnu)
 * tab:     vises også i fanebjælken på mobil
 */
const salesItems = [
    { label: 'Hurtig beregning', tabLabel: 'Tilbud', icon: 'calculator', href: '/newPlanDraft/summary', match: ['/newPlanDraft', '/newPlan/'], tab: true },
    { label: 'Kunder', icon: 'building-2', href: '/customers', match: ['/customers', '/locations', '/cleaningPlans', '/offers', '/contracts', '/preview/customer-group'], tab: true },
];

const adminSections = [
    {
        items: [
            { label: 'Planlægning', icon: 'calendar-days', href: '/preview/planning', match: ['/preview/planning'], preview: true, tab: true },
            ...salesItems,
            { label: 'Fakturaer', icon: 'file-text', href: '/preview/invoices', match: ['/preview/invoices'], preview: true },
            { label: 'Medarbejdere', icon: 'users', href: '/preview/employees', match: ['/preview/employees'], preview: true },
        ],
    },
    {
        items: [
            { label: 'Opgaver', icon: 'list-checks', href: '/cleaningTaskTemplates/page', match: ['/cleaningTaskTemplates'] },
            { label: 'Lokaler', icon: 'door-open', href: '/roomTemplates/page', match: ['/roomTemplates'] },
            { label: 'Admin', icon: 'settings', href: '/admin', match: ['/admin', '/users'] },
        ],
    },
    {
        title: 'Rengøring',
        preview: true,
        items: [
            { label: 'I dag', icon: 'sun', href: '/preview/cleaning/today', match: ['/preview/cleaning/today', '/preview/cleaning/finish', '/preview/cleaning/sick'] },
            { label: 'Min uge', icon: 'calendar-days', href: '/preview/cleaning/week', match: ['/preview/cleaning/week'] },
            { label: 'Fri', icon: 'plane', href: '/preview/cleaning/time-off', match: ['/preview/cleaning/time-off'] },
        ],
    },
];

const salesSections = [{ items: salesItems }];

function navigationFor(user) {
    return user && user.role === userRoles.admin ? adminSections : salesSections;
}

function tabItemsFor(user) {
    return navigationFor(user).flatMap(section => section.items).filter(item => item.tab);
}

module.exports = { navigationFor, tabItemsFor };
