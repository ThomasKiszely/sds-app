import { describe, it, expect } from 'vitest';
const { calculateTaskMonthlyPrice } = require('../src/utils/priceUtil');
const { frequencies } = require('../src/utils/frequencyEnum');
const { days } = require('../src/utils/dayEnum');

describe('priceUtil - calculateTaskMonthlyPrice', () => {
    it('beregner månedlig pris baseret på amount, duration og frekvens', () => {
        const task = {
            amount: 100,
            durationPerUnit: 1, // 100 minutter
            frequency: frequencies.weekly,
            days: [days.monday, days.friday], // 2 dage
            customPrice: null
        };
        const hourlyRate = 300; // 5 kr/min -> pricePerTime = 500 kr
        // 500 * 4.3 * 2 = 4300 kr
        const result = calculateTaskMonthlyPrice(task, hourlyRate);
        expect(result.pricePerTime).toBe(500);
        expect(result.monthlyPrice).toBe(4300);
    });

    it('håndterer customPrice', () => {
        const task = {
            amount: 1,
            durationPerUnit: 0,
            frequency: frequencies.weekly,
            days: [days.monday],
            customPrice: 250
        };
        const result = calculateTaskMonthlyPrice(task, 350);
        expect(result.pricePerTime).toBe(250);
        expect(result.monthlyPrice).toBe(250 * 4.3);
    });
});
