import { describe, it, expect, vi } from 'vitest';
const { calculateTaskPrice, calculateTotals } = require('../src/services/priceService');
const newPlanDraftService = require('../src/services/newPlanDraftService');
const { categoryTypes } = require('../src/utils/categoryEnum');
const { frequencies } = require('../src/utils/frequencyEnum');
const { days } = require('../src/utils/dayEnum');
const { units } = require('../src/utils/unitEnum');

describe('priceService - calculateTaskPrice', () => {
    it('beregner pris korrekt for ugentlig rengøring baseret på amount og dage', () => {
        const task = {
            amount: 50, // 50 m2
            durationPerUnit: 1.5, // 1.5 min pr m2 = 75 minutter
            frequency: frequencies.weekly,
            days: [days.monday, days.wednesday, days.friday], // 3 dage
            customPrice: null
        };
        const hourlyRate = 360; // 360 kr/time = 6 kr/minut

        // 75 minutter * 6 kr/min = 450 kr pr gang (basePrice)
        // 3 dage * 4.3 uger/md = multiplier 12.9
        // monthlyPrice = 450 * 12.9 = 5805 kr.
        const result = calculateTaskPrice(task, hourlyRate);
        expect(result.duration).toBe(75);
        expect(result.pricePerTime).toBe(450);
        expect(result.monthlyPrice).toBe(5805);
        expect(result.totalPrice).toBe(5805);
    });

    it('bruger amount (ikke quantity) til beregning', () => {
        const task = {
            amount: 20,
            durationPerUnit: 2,
            frequency: frequencies.monthly, // multiplier = 1 * 1 dag = 1
            days: [days.monday],
            customPrice: null
        };
        const hourlyRate = 300; // 5 kr/min

        // duration = 20 * 2 = 40 min
        // pricePerTime = 40 * 5 = 200 kr
        // monthlyPrice = 200 * 1 = 200 kr
        const result = calculateTaskPrice(task, hourlyRate);
        expect(result.duration).toBe(40);
        expect(result.monthlyPrice).toBe(200);
    });

    it('beregner customPrice korrekt', () => {
        const task = {
            amount: 1,
            durationPerUnit: 0,
            frequency: frequencies.weekly,
            days: [days.monday],
            customPrice: 500
        };
        const hourlyRate = 350;

        // customPrice = 500, multiplier = 4.3 * 1 = 4.3
        // monthlyPrice = 500 * 4.3 = 2150
        const result = calculateTaskPrice(task, hourlyRate);
        expect(result.basePrice).toBe(500);
        expect(result.monthlyPrice).toBe(2150);
    });
});

describe('priceService - calculateTotals', () => {
    it('beregner subtotal, rabat og miljøtillæg korrekt', () => {
        const tasks = [
            { monthlyPrice: 1000, pricePerTime: 0 },
            { monthlyPrice: 2000, pricePerTime: 0 }
        ];
        const totals = calculateTotals({
            tasks,
            discountPercent: 10,
            environmentalFeePercent: 5
        });

        expect(totals.subtotal).toBe(3000);
        expect(totals.discountAmount).toBe(300); // 3000 * 10%
        // afterDiscount = 2700
        expect(totals.environmentalFeeAmount).toBe(135); // 2700 * 5%
        expect(totals.total).toBe(2835); // 2700 + 135
    });
});

describe('newPlanDraftService - draft manipulation', () => {
    it('initDraft opretter et tomt draft med korrekte standardværdier', () => {
        const draft = newPlanDraftService.initDraft({ hourlyRate: 400, environmentalFee: 4.5 });
        expect(draft.rooms).toEqual([]);
        expect(draft.tasks).toEqual([]);
        expect(draft.hourlyRate).toBe(400);
        expect(draft.environment.environmentalFeePercent).toBe(4.5);
    });

    it('addRoomToDraft tilføjer et tomt rum og beregner unikt navn', async () => {
        const draft = newPlanDraftService.initDraft({ hourlyRate: 350, environmentalFee: 4 });
        await newPlanDraftService.addRoomToDraft(draft, null, 'Kontor', 35);

        expect(draft.rooms.length).toBe(1);
        expect(draft.rooms[0].name).toBe('Kontor 1');
        expect(draft.rooms[0].size).toBe(35);

        await newPlanDraftService.addRoomToDraft(draft, null, 'Kontor', 50);
        expect(draft.rooms.length).toBe(2);
        expect(draft.rooms[1].name).toBe('Kontor 2');
        expect(draft.rooms[1].size).toBe(50);
    });

    it('updateRoomInDraft opdaterer lokalenavn og størrelse samt synkroniserer opgaver', () => {
        const draft = newPlanDraftService.initDraft({ hourlyRate: 360, environmentalFee: 4 });
        draft.rooms = [{ name: 'Kontor 1', baseName: 'Kontor', size: 25 }];
        draft.tasks = [{
            roomName: 'Kontor 1',
            category: categoryTypes.daily,
            amount: 25,
            durationPerUnit: 1,
            frequency: frequencies.weekly,
            days: [days.monday]
        }];

        newPlanDraftService.updateRoomInDraft(draft, 'Kontor 1', 'Hovedkontor', 40);

        expect(draft.rooms[0].name).toBe('Hovedkontor');
        expect(draft.rooms[0].size).toBe(40);
        expect(draft.tasks[0].roomName).toBe('Hovedkontor');
        expect(draft.tasks[0].amount).toBe(40);
        expect(draft.tasks[0].monthlyPrice).toBeGreaterThan(0);
    });

    it('removeRoomFromDraft fjerner rum og tilhørende opgaver', () => {
        const draft = newPlanDraftService.initDraft({ hourlyRate: 350, environmentalFee: 4 });
        draft.rooms = [{ name: 'Kontor 1', size: 25 }, { name: 'Mødelokale', size: 30 }];
        draft.tasks = [
            { roomName: 'Kontor 1', name: 'Støvsugning' },
            { roomName: 'Mødelokale', name: 'Aftørring' }
        ];

        newPlanDraftService.removeRoomFromDraft(draft, 'Kontor 1');

        expect(draft.rooms.length).toBe(1);
        expect(draft.rooms[0].name).toBe('Mødelokale');
        expect(draft.tasks.length).toBe(1);
        expect(draft.tasks[0].roomName).toBe('Mødelokale');
    });

    it('reorderRoomsInDraft sorterer rum efter given rækkefølge', () => {
        const draft = newPlanDraftService.initDraft({ hourlyRate: 350, environmentalFee: 4 });
        draft.rooms = [{ name: 'Rum A' }, { name: 'Rum B' }, { name: 'Rum C' }];

        newPlanDraftService.reorderRoomsInDraft(draft, ['Rum C', 'Rum A', 'Rum B']);

        expect(draft.rooms[0].name).toBe('Rum C');
        expect(draft.rooms[1].name).toBe('Rum A');
        expect(draft.rooms[2].name).toBe('Rum B');
    });

    it('addDayToDraft og removeDayFromDraft tilføjer og fjerner ugedage', () => {
        const draft = newPlanDraftService.initDraft({ hourlyRate: 360, environmentalFee: 4 });
        draft.rooms = [{ name: 'Kontor 1', size: 20 }];
        draft.tasks = [{
            roomName: 'Kontor 1',
            templateId: 'tpl-1',
            category: categoryTypes.daily,
            amount: 20,
            durationPerUnit: 1,
            frequency: frequencies.weekly,
            days: [days.monday]
        }];

        newPlanDraftService.addDayToDraft(draft, 'Kontor 1', 'tpl-1', days.wednesday);
        expect(draft.tasks[0].days).toEqual([days.monday, days.wednesday]);

        newPlanDraftService.removeDayFromDraft(draft, 'Kontor 1', 'tpl-1', days.monday);
        expect(draft.tasks[0].days).toEqual([days.wednesday]);
    });

    it('updateTaskInDraft opdaterer frekvens og mængde', () => {
        const draft = newPlanDraftService.initDraft({ hourlyRate: 360, environmentalFee: 4 });
        draft.tasks = [{
            roomName: 'Kontor 1',
            templateId: 'tpl-1',
            category: categoryTypes.daily,
            amount: 20,
            durationPerUnit: 1,
            frequency: frequencies.weekly,
            days: [days.monday]
        }];

        newPlanDraftService.updateTaskInDraft(draft, {
            roomName: 'Kontor 1',
            templateId: 'tpl-1',
            frequency: frequencies.biweekly,
            amount: 50
        });

        expect(draft.tasks[0].frequency).toBe(frequencies.biweekly);
        expect(draft.tasks[0].amount).toBe(50);
    });

    it('håndterer opgaver tilføjet direkte til planen uden lokale', () => {
        const draft = newPlanDraftService.initDraft({ hourlyRate: 360, environmentalFee: 4 });
        draft.tasks = [
            {
                roomName: '',
                templateId: 'tpl-general-1',
                name: 'Vinduespudsning',
                category: categoryTypes.windows,
                amount: 1,
                durationPerUnit: 30,
                frequency: frequencies.monthly,
                days: [days.friday]
            }
        ];

        newPlanDraftService.priceAllTasks(draft);
        expect(draft.tasks[0].roomName).toBe('');
        expect(draft.tasks[0].monthlyPrice).toBeGreaterThan(0);

        newPlanDraftService.addDayToDraft(draft, '', 'tpl-general-1', days.monday, 0);
        expect(draft.tasks[0].days).toEqual([days.friday, days.monday]);

        newPlanDraftService.removeDayFromDraft(draft, '', 'tpl-general-1', days.friday, 0);
        expect(draft.tasks[0].days).toEqual([days.monday]);
    });

    it('updateAdjustments opdaterer rabat, drift- og miljøtillæg samt betalingsbetingelser', () => {
        const draft = newPlanDraftService.initDraft({ hourlyRate: 350, environmentalFee: 4 });
        newPlanDraftService.updateAdjustments(draft, {
            discountPercent: '10',
            environmentalFeePercent: '5.5',
            paymentTerms: 'net14',
            terminationNotice: 'currentMonthPlus1'
        }, { environmentalFee: 4 });

        expect(draft.discounts.discountPercent).toBe(10);
        expect(draft.environment.environmentalFeePercent).toBe(5.5);
        expect(draft.operations.paymentTerms).toBe('net14');
        expect(draft.operations.terminationNotice).toBe('currentMonthPlus1');
    });

    it('customerLocations initialiserer draft i session hvis req.session.planDraft ikke findes', async () => {
        const newPlanDraftController = require('../src/controllers/newPlanDraftController');
        const customerService = require('../src/services/customerService');
        const locationService = require('../src/services/locationService');
        const systemSettingsService = require('../src/services/systemSettingsService');

        vi.spyOn(customerService, 'getCustomerById').mockResolvedValue({ _id: 'cust-1', customerName: 'Firma A' });
        vi.spyOn(locationService, 'getLocationsForCustomer').mockResolvedValue([{ _id: 'loc-1', name: 'Afd 1' }]);
        vi.spyOn(systemSettingsService, 'getSettings').mockResolvedValue({ hourlyRate: 360, environmentalFee: 4 });

        const req = {
            query: { customerId: 'cust-1' },
            session: {}
        };
        let renderedView = null;
        let renderedData = null;
        const res = {
            render: (view, data) => {
                renderedView = view;
                renderedData = data;
            }
        };

        await newPlanDraftController.customerLocations(req, res);

        expect(renderedView).toBe('newPlanDraft/_locationSelect');
        expect(req.session.planDraft).toBeDefined();
        expect(req.session.planDraft.customerId).toBe('cust-1');
        expect(req.session.planDraft.locationId).toBe('loc-1');
        expect(renderedData.selectedCustomerName).toBe('Firma A');
    });
});
