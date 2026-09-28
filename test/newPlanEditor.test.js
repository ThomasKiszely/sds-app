import { describe, it, expect, vi, beforeEach } from 'vitest';
const newPlanService = require('../src/services/newPlanService');
const cleaningPlanService = require('../src/services/cleaningPlanService');
const cleaningTaskRepo = require('../src/data/cleaningTaskRepo');
const customerService = require('../src/services/customerService');
const locationService = require('../src/services/locationService');
const systemSettingsService = require('../src/services/systemSettingsService');
const roomTemplateService = require('../src/services/roomTemplateService');
const cleaningTaskTemplateService = require('../src/services/cleaningTaskTemplateService');
const cleaningTaskTemplateRepo = require('../src/data/cleaningTaskTemplateRepo');
const cleaningPlanRepo = require('../src/data/cleaningPlanRepo');
const cleaningTaskService = require('../src/services/cleaningTaskService');

describe('newPlanService - buildExistingPlanViewModel', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('bygger view-modellen for en eksisterende rengøringsplan i DB korrekt', async () => {
        const mockPlanId = '65f01234567890abcdef1234';
        const mockPlan = {
            _id: mockPlanId,
            name: 'Hovedkontor Rengøring',
            customerId: '65f01234567890abcdef0001',
            locationId: '65f01234567890abcdef0002',
            hourlyRate: 360,
            discountPercent: 10,
            environmentalFeePercent: 5,
            roomNotes: [
                { roomName: 'Kontor 1', notes: ['Nøgle i receptionen'] }
            ]
        };

        const mockTasks = [
            {
                _id: 'task-1',
                planId: mockPlanId,
                name: 'Daglig rengøring',
                category: 'daily',
                unit: 'm2',
                amount: 50,
                durationPerUnit: 1.5,
                frequency: 'weekly',
                days: ['monday', 'wednesday', 'friday'],
                roomName: 'Kontor 1'
            },
            {
                _id: 'task-2',
                planId: mockPlanId,
                name: 'Håndsæbe',
                category: 'consumables',
                unit: 'stk',
                amount: 2,
                durationPerUnit: 0,
                frequency: 'none',
                days: [],
                roomName: '',
                customPrice: 45
            }
        ];

        vi.spyOn(cleaningPlanService, 'findCleaningPlanById').mockResolvedValue(mockPlan);
        vi.spyOn(cleaningTaskRepo, 'findByPlanId').mockResolvedValue(mockTasks);
        vi.spyOn(customerService, 'getCustomerById').mockResolvedValue({ _id: mockPlan.customerId, name: 'Test Kunde' });
        vi.spyOn(locationService, 'getLocationById').mockResolvedValue({ _id: mockPlan.locationId, name: 'Hovedbygning' });
        vi.spyOn(systemSettingsService, 'getSettings').mockResolvedValue({ hourlyRate: 350, environmentalFee: 4 });
        vi.spyOn(roomTemplateService, 'getAllRoomTemplates').mockResolvedValue([]);
        vi.spyOn(cleaningTaskTemplateService, 'listTemplates').mockResolvedValue([]);

        const vm = await newPlanService.buildExistingPlanViewModel(mockPlanId);

        expect(vm.baseUrl).toBe(`/newPlan/${mockPlanId}`);
        expect(vm.isEditing).toBe(true);
        expect(vm.planId).toBe(mockPlanId);
        expect(vm.customer.name).toBe('Test Kunde');
        expect(vm.roomsList.length).toBe(1);
        expect(vm.roomsList[0].name).toBe('Kontor 1');
        expect(vm.roomsList[0].tasks.length).toBe(1);
        expect(vm.generalTasks.length).toBe(1);
        expect(vm.generalTasks[0].name).toBe('Håndsæbe');
        expect(vm.discountPercent).toBe(10);
        expect(vm.environmentalFeePercent).toBe(5);
        expect(vm.subtotal).toBeGreaterThan(0);
        expect(vm.finalTotal).toBeGreaterThan(0);
    });

    it('addRoomToPlan opretter rum og kalder recalculatePlanTotal', async () => {
        const mockPlanId = '65f01234567890abcdef1234';
        vi.spyOn(cleaningPlanService, 'findCleaningPlanById').mockResolvedValue({ _id: mockPlanId, roomNotes: [] });
        vi.spyOn(cleaningTaskRepo, 'findByPlanId').mockResolvedValue([]);
        vi.spyOn(cleaningPlanRepo, 'updateById').mockResolvedValue({});
        const recalcSpy = vi.spyOn(cleaningPlanService, 'recalculatePlanTotal').mockResolvedValue({});

        const res = await newPlanService.addRoomToPlan(mockPlanId, { templateId: null, name: 'Mødelokale', size: 30 });
        expect(res.roomName).toBe('Mødelokale 1');
        expect(res.size).toBe(30);
        expect(recalcSpy).toHaveBeenCalledWith(mockPlanId);
    });

    it('removeRoomFromPlan sletter opgaver for lokalet og opdaterer roomNotes', async () => {
        const mockPlanId = '65f01234567890abcdef1234';
        const mockTasks = [
            { _id: 't-1', roomName: 'Mødelokale 1' },
            { _id: 't-2', roomName: 'Andet rum' }
        ];
        vi.spyOn(cleaningTaskRepo, 'findByPlanId').mockResolvedValue(mockTasks);
        const deleteSpy = vi.spyOn(cleaningTaskRepo, 'deleteById').mockResolvedValue({});
        vi.spyOn(cleaningPlanRepo, 'findById').mockResolvedValue({ _id: mockPlanId, roomNotes: [{ roomName: 'Mødelokale 1' }] });
        const updatePlanSpy = vi.spyOn(cleaningPlanRepo, 'updateById').mockResolvedValue({});
        const recalcSpy = vi.spyOn(cleaningPlanService, 'recalculatePlanTotal').mockResolvedValue({});

        await newPlanService.removeRoomFromPlan(mockPlanId, 'Mødelokale 1');

        expect(deleteSpy).toHaveBeenCalledWith('t-1');
        expect(deleteSpy).not.toHaveBeenCalledWith('t-2');
        expect(updatePlanSpy).toHaveBeenCalledWith(mockPlanId, { roomNotes: [] });
        expect(recalcSpy).toHaveBeenCalledWith(mockPlanId);
    });

    it('addTaskToPlan opretter en ny opgave i databasen og genberegner', async () => {
        const mockPlanId = '65f01234567890abcdef1234';
        vi.spyOn(cleaningTaskTemplateRepo, 'findTemplateById').mockResolvedValue({
            _id: 'tpl-1',
            name: 'Støvsugning',
            category: 'floor',
            unit: 'm2',
            durationPerUnit: 1.0,
            frequency: 'weekly'
        });
        vi.spyOn(cleaningTaskRepo, 'findByPlanId').mockResolvedValue([
            { roomName: 'Kontor 1', amount: 45, days: ['monday', 'friday'], category: 'daily' }
        ]);
        const createTaskSpy = vi.spyOn(cleaningTaskService, 'createCleaningTask').mockResolvedValue({});
        const recalcSpy = vi.spyOn(cleaningPlanService, 'recalculatePlanTotal').mockResolvedValue({});

        await newPlanService.addTaskToPlan(mockPlanId, { templateId: 'tpl-1', roomName: 'Kontor 1' });

        expect(createTaskSpy).toHaveBeenCalledWith(mockPlanId, expect.objectContaining({
            name: 'Støvsugning',
            category: 'floor',
            amount: 45,
            roomName: 'Kontor 1'
        }));
        expect(recalcSpy).toHaveBeenCalledWith(mockPlanId);
    });

    it('updateTaskInPlan opdaterer opgaven og genberegner', async () => {
        const mockPlanId = '65f01234567890abcdef1234';
        const updateSpy = vi.spyOn(cleaningTaskService, 'updateCleaningTask').mockResolvedValue({});
        const recalcSpy = vi.spyOn(cleaningPlanService, 'recalculatePlanTotal').mockResolvedValue({});

        await newPlanService.updateTaskInPlan(mockPlanId, {
            taskId: 't-1',
            amount: 75,
            frequency: 'biweekly'
        });

        expect(updateSpy).toHaveBeenCalledWith('t-1', { amount: 75, frequency: 'biweekly' });
        expect(recalcSpy).toHaveBeenCalledWith(mockPlanId);
    });

    it('addDayToRoomInPlan tilføjer dag til alle opgaver i lokalet', async () => {
        const mockPlanId = '65f01234567890abcdef1234';
        vi.spyOn(cleaningTaskRepo, 'findByPlanId').mockResolvedValue([
            { _id: 't-1', roomName: 'Kontor 1', days: ['monday'] }
        ]);
        const updateTaskSpy = vi.spyOn(cleaningTaskRepo, 'updateById').mockResolvedValue({});
        const recalcSpy = vi.spyOn(cleaningPlanService, 'recalculatePlanTotal').mockResolvedValue({});

        await newPlanService.addDayToRoomInPlan(mockPlanId, { roomName: 'Kontor 1', day: 'wednesday' });

        expect(updateTaskSpy).toHaveBeenCalledWith('t-1', { days: ['monday', 'wednesday'] });
        expect(recalcSpy).toHaveBeenCalledWith(mockPlanId);
    });

    it('setDaysForRoomInPlan erstatter dagene for alle opgaver i lokalet', async () => {
        const mockPlanId = '65f01234567890abcdef1234';
        vi.spyOn(cleaningTaskRepo, 'findByPlanId').mockResolvedValue([
            { _id: 't-1', roomName: 'Kontor 1', days: ['monday', 'friday'] }
        ]);
        const updateTaskSpy = vi.spyOn(cleaningTaskRepo, 'updateById').mockResolvedValue({});
        const recalcSpy = vi.spyOn(cleaningPlanService, 'recalculatePlanTotal').mockResolvedValue({});

        await newPlanService.setDaysForRoomInPlan(mockPlanId, { roomName: 'Kontor 1', days: ['tuesday', 'thursday'] });

        expect(updateTaskSpy).toHaveBeenCalledWith('t-1', { days: ['tuesday', 'thursday'] });
        expect(recalcSpy).toHaveBeenCalledWith(mockPlanId);
    });

    it('saveSummaryAdjustmentsInPlan opdaterer planens overordnede rabat og tillæg', async () => {
        const mockPlanId = '65f01234567890abcdef1234';
        vi.spyOn(cleaningPlanRepo, 'findById').mockResolvedValue({ _id: mockPlanId });
        const updatePlanSpy = vi.spyOn(cleaningPlanRepo, 'updateById').mockResolvedValue({});
        const recalcSpy = vi.spyOn(cleaningPlanService, 'recalculatePlanTotal').mockResolvedValue({});

        await newPlanService.saveSummaryAdjustmentsInPlan(mockPlanId, {
            discountPercent: 15,
            environmentalFeePercent: 6,
            paymentTerms: 'netto14',
            terminationNotice: 'month1'
        });

        expect(updatePlanSpy).toHaveBeenCalledWith(mockPlanId, {
            discountPercent: 15,
            environmentalFeePercent: 6,
            paymentTerms: 'netto14',
            terminationNotice: 'month1'
        });
        expect(recalcSpy).toHaveBeenCalledWith(mockPlanId);
    });
});
