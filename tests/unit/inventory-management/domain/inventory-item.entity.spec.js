import { describe, it, expect } from 'vitest';
import { createInventoryItem } from '../../../../src/domains/inventory-management/domain/inventory-item.entity';

describe('InventoryItem Entity (Inventory Management Domain)', () => {
    it('should create an inventory item with normalized default values when no data is provided', () => {
        const item = createInventoryItem();

        expect(item).toBeDefined();
        expect(item).toEqual({
            id: null,
            sku: null,
            name: '',
            category: 'SPARE_PART',
            brand: 'GENERIC',
            purchasePrice: 0,
            unitPrice: 0,
            unitProfit: 0,
            marginPercentage: 0,
            qualityTier: 'STANDARD',
            specification: '',
            presentation: '',
            unitMeasure: 'UNIT',
            stock: 0,
            minStock: 5,
            image: ''
        });
    });

    it('should automatically calculate unitProfit and marginPercentage from purchasePrice and unitPrice', () => {
        const item = createInventoryItem({
            purchasePrice: 75.50,
            unitPrice: 120.00
        });

        // unitProfit = 120 - 75.50 = 44.5
        // marginPercentage = (44.5 / 120) * 100 = 37.0833... -> rounded to 37.08
        expect(item.purchasePrice).toBe(75.5);
        expect(item.unitPrice).toBe(120);
        expect(item.unitProfit).toBe(44.5);
        expect(item.marginPercentage).toBe(37.08);
    });

    it('should return marginPercentage of 0 when unitPrice is 0', () => {
        const item = createInventoryItem({
            purchasePrice: 50,
            unitPrice: 0
        });

        expect(item.unitProfit).toBe(-50);
        expect(item.marginPercentage).toBe(0);
    });

    it('should normalize and validate qualityTier values correctly', () => {
        const economyItem = createInventoryItem({ qualityTier: 'economy' });
        expect(economyItem.qualityTier).toBe('ECONOMY');

        const premiumItem = createInventoryItem({ qualityTier: 'PREMIUM' });
        expect(premiumItem.qualityTier).toBe('PREMIUM');

        const standardItem = createInventoryItem({ qualityTier: 'STANDARD' });
        expect(standardItem.qualityTier).toBe('STANDARD');

        const invalidItem = createInventoryItem({ qualityTier: 'SUPER_DELUXE' });
        expect(invalidItem.qualityTier).toBe('STANDARD');
    });

    it('should support imageUrl fallback when image property is not provided', () => {
        const item = createInventoryItem({
            name: 'Filtro de Aceite',
            imageUrl: 'https://example.com/filter.png'
        });

        expect(item.image).toBe('https://example.com/filter.png');
    });

    it('should preserve explicit unitProfit and marginPercentage if provided', () => {
        const item = createInventoryItem({
            purchasePrice: 100,
            unitPrice: 150,
            unitProfit: 40,
            marginPercentage: 26.67
        });

        expect(item.unitProfit).toBe(40);
        expect(item.marginPercentage).toBe(26.67);
    });
});
