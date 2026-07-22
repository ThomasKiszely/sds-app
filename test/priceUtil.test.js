
import { describe, it, expect } from 'vitest';
const {
    getFrequencyMultiplier,
    calculateUnitPrice,
    adjustForCategory,
    calculateTaskTotalPrice
} = require('../src/utils/priceUtil');

const { frequency } = require('../src/utils/frequencyEnum');
const { units } = require('../src/utils/unitEnum');
const { categoryTypes } = require('../src/utils/categoryEnum');

//
// ─────────────────────────────────────────────
//  getFrequencyMultiplier
// ─────────────────────────────────────────────
//
describe('getFrequencyMultiplier', () => {
    it('returnerer korrekt multiplier for kendte frekvenser', () => {
        expect(getFrequencyMultiplier(frequency.daily)).toBe(21);
        expect(getFrequencyMultiplier(frequency.weekly)).toBe(4.33);
        expect(getFrequencyMultiplier(frequency.biweekly)).toBe(2.165);
        expect(getFrequencyMultiplier(frequency.monthly)).toBe(1);
        expect(getFrequencyMultiplier(frequency.bimonthly)).toBe(0.5);
        expect(getFrequencyMultiplier(frequency.quarterly)).toBeCloseTo(1 / 3);
        expect(getFrequencyMultiplier(frequency.semiannual)).toBeCloseTo(1 / 6);
        expect(getFrequencyMultiplier(frequency.annual)).toBeCloseTo(1 / 12);
    });

    it('fallback: returnerer 1 for ukendt frekvens', () => {
        expect(getFrequencyMultiplier('ukendt')).toBe(1);
    });
});

//
// ─────────────────────────────────────────────
//  calculateUnitPrice
// ─────────────────────────────────────────────
//
describe('calculateUnitPrice', () => {
    it('units.none: returnerer bare price', () => {
        expect(
            calculateUnitPrice({ unit: units.none, price: 100 })
        ).toBe(100);
    });

    it('units.m2: amount * price', () => {
        expect(
            calculateUnitPrice({ unit: units.m2, price: 10, amount: 5 })
        ).toBe(50);
    });

    it('units.lbm: amount * price', () => {
        expect(
            calculateUnitPrice({ unit: units.lbm, price: 20, amount: 3 })
        ).toBe(60);
    });

    it('units.pcs: quantity * price', () => {
        expect(
            calculateUnitPrice({ unit: units.pcs, price: 8, quantity: 4 })
        ).toBe(32);
    });

    it('fallback: ukendt unit returnerer price', () => {
        expect(
            calculateUnitPrice({ unit: 'ukendt', price: 77 })
        ).toBe(77);
    });
});

//
// ─────────────────────────────────────────────
//  adjustForCategory
// ─────────────────────────────────────────────
//
describe('adjustForCategory', () => {
    it('windows/extra/special: returnerer basePrice uændret', () => {
        const basePrice = 100;
        const freq = 21;

        expect(
            adjustForCategory({ category: categoryTypes.windows, basePrice, frequencyMultiplier: freq })
        ).toBe(100);

        expect(
            adjustForCategory({ category: categoryTypes.extra, basePrice, frequencyMultiplier: freq })
        ).toBe(100);

        expect(
            adjustForCategory({ category: categoryTypes.special, basePrice, frequencyMultiplier: freq })
        ).toBe(100);
    });

    it('consumable: fast pris pr. måned (basePrice * 1)', () => {
        expect(
            adjustForCategory({
                category: categoryTypes.consumable,
                basePrice: 50,
                frequencyMultiplier: 21
            })
        ).toBe(50);
    });

    it('daily: basePrice * frequencyMultiplier', () => {
        expect(
            adjustForCategory({
                category: categoryTypes.daily,
                basePrice: 10,
                frequencyMultiplier: 21
            })
        ).toBe(210);
    });

    it('fallback: ukendt kategori → basePrice * frequencyMultiplier', () => {
        expect(
            adjustForCategory({
                category: 'ukendt',
                basePrice: 10,
                frequencyMultiplier: 21
            })
        ).toBe(210);
    });
});

//
// ─────────────────────────────────────────────
//  calculateTaskTotalPrice (integration test)
// ─────────────────────────────────────────────
//
describe('calculateTaskTotalPrice', () => {
    it('beregner korrekt totalpris for daglig drift med m2', () => {
        const result = calculateTaskTotalPrice({
            unit: units.m2,
            category: categoryTypes.daily,
            price: 10,
            amount: 5,
            quantity: 0,
            frequency: frequency.daily
        });

        // basePrice = 5 * 10 = 50
        // freqMultiplier = 21
        // final = 50 * 21 = 1050
        expect(result).toBe(1050);
    });

    it('beregner korrekt pris for pcs + windows (ingen freq)', () => {
        const result = calculateTaskTotalPrice({
            unit: units.pcs,
            category: categoryTypes.windows,
            price: 100,
            amount: 0,
            quantity: 2,
            frequency: frequency.weekly
        });

        // basePrice = 2 * 100 = 200
        // windows → ingen multiplier
        expect(result).toBe(200);
    });

    it('fallbacks fungerer (ukendt unit + ukendt kategori + ukendt freq)', () => {
        const result = calculateTaskTotalPrice({
            unit: 'ukendt',
            category: 'ukendt',
            price: 100,
            amount: 999,
            quantity: 999,
            frequency: 'ukendt'
        });

        // unit fallback → price = 100
        // freq fallback → multiplier = 1
        // category fallback → basePrice * multiplier = 100 * 1
        expect(result).toBe(100);
    });

    it('runder til 2 decimaler', () => {
        const result = calculateTaskTotalPrice({
            unit: units.m2,
            category: categoryTypes.daily,
            price: 3.333,
            amount: 1,
            quantity: 0,
            frequency: frequency.weekly
        });

        // basePrice = 3.333
        // freqMultiplier = 4.33
        // final = 3.333 * 4.33 = 14.42 (≈ 14.419)
        const expected = Number((3.333 * 4.33).toFixed(2));
        expect(result).toBe(expected);
    });
});
