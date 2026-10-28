import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useInventoryStore } from '../../../../src/domains/inventory-management/application/inventory.store';
import { InventoryService } from '../../../../src/domains/inventory-management/infrastructure/inventory.service';

vi.mock('../../../../src/domains/inventory-management/infrastructure/inventory.service', () => ({
    InventoryService: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        receiveStock: vi.fn(),
        delete: vi.fn()
    }
}));

describe('Inventory Store (Inventory Management Application)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const store = useInventoryStore();
        expect(store.items).toEqual([]);
        expect(store.loading).toBe(false);
        expect(store.saving).toBe(false);
        expect(store.deletingId).toBeNull();
        expect(store.receivingId).toBeNull();
        expect(store.error).toBeNull();
    });

    it('should fetch inventory items, normalize financial values, and populate store.items', async () => {
        const rawItems = [
            { id: 1, name: 'Filtro de Aceite', purchasePrice: 20, unitPrice: 35, stock: 10 },
            { id: 2, name: 'Bujía Iridium', purchasePrice: 15, unitPrice: 30, stock: 4 }
        ];
        InventoryService.getAll.mockResolvedValueOnce({ data: rawItems });

        const store = useInventoryStore();
        const result = await store.fetchItems();

        expect(InventoryService.getAll).toHaveBeenCalledTimes(1);
        expect(store.loading).toBe(false);
        expect(store.items).toHaveLength(2);
        expect(store.items[0].unitProfit).toBe(15);
        expect(store.items[0].marginPercentage).toBe(42.86);
        expect(result).toHaveLength(2);
    });

    it('should handle fetch errors gracefully and record error message in state', async () => {
        const error = { response: { data: { message: 'Fallo al conectar con el servidor' } } };
        InventoryService.getAll.mockRejectedValueOnce(error);

        const store = useInventoryStore();
        const result = await store.fetchItems();

        expect(store.loading).toBe(false);
        expect(store.error).toBe('Fallo al conectar con el servidor');
        expect(result).toEqual([]);
        expect(store.items).toEqual([]);
    });

    it('should add a new inventory item and append to store', async () => {
        const newItemData = {
            name: 'Pastillas de Freno Delanteras',
            category: 'SPARE_PART',
            purchasePrice: 80,
            unitPrice: 130,
            qualityTier: 'PREMIUM'
        };

        const createdPayload = {
            id: 10,
            ...newItemData,
            stock: 0,
            unitProfit: 50,
            marginPercentage: 38.46
        };

        InventoryService.create.mockResolvedValueOnce({ data: createdPayload });

        const store = useInventoryStore();
        const result = await store.addItem(newItemData);

        expect(InventoryService.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Pastillas de Freno Delanteras',
            purchasePrice: 80,
            unitPrice: 130
        }));
        expect(store.saving).toBe(false);
        expect(store.items).toHaveLength(1);
        expect(result.id).toBe(10);
    });

    it('should update an existing item and update in-place in state', async () => {
        const store = useInventoryStore();
        store.items = [
            { id: 5, name: 'Amortiguador Delantero', purchasePrice: 120, unitPrice: 180, stock: 6 }
        ];

        const updatePayload = {
            id: 5,
            name: 'Amortiguador Delantero Reforzado',
            purchasePrice: 130,
            unitPrice: 200,
            stock: 6
        };

        InventoryService.update.mockResolvedValueOnce({ data: updatePayload });

        const result = await store.updateItem(5, updatePayload);

        expect(InventoryService.update).toHaveBeenCalledWith(5, expect.objectContaining({
            name: 'Amortiguador Delantero Reforzado',
            unitPrice: 200
        }));
        expect(store.items[0].name).toBe('Amortiguador Delantero Reforzado');
        expect(store.items[0].unitPrice).toBe(200);
        expect(result.name).toBe('Amortiguador Delantero Reforzado');
    });

    it('should receive stock from provider and update physical stock of the item', async () => {
        const store = useInventoryStore();
        store.items = [
            { id: 8, name: 'Líquido de Frenos DOT4', stock: 2, minStock: 5 }
        ];

        const receiptData = {
            quantityReceived: 10,
            providerInvoiceNumber: 'INV-2026-88',
            unitPurchasePrice: 25
        };

        const receiptResponse = {
            item: {
                id: 8,
                name: 'Líquido de Frenos DOT4',
                stock: 12,
                minStock: 5,
                purchasePrice: 25
            }
        };

        InventoryService.receiveStock.mockResolvedValueOnce({ data: receiptResponse });

        const result = await store.receiveStock(8, receiptData);

        expect(InventoryService.receiveStock).toHaveBeenCalledWith(8, receiptData);
        expect(store.receivingId).toBeNull();
        expect(store.items[0].stock).toBe(12);
        expect(result).toBeDefined();
    });

    it('should delete an item and remove it from store.items', async () => {
        const store = useInventoryStore();
        store.items = [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
        ];

        InventoryService.delete.mockResolvedValueOnce({ data: { success: true } });

        await store.deleteItem(1);

        expect(InventoryService.delete).toHaveBeenCalledWith(1);
        expect(store.deletingId).toBeNull();
        expect(store.items).toHaveLength(1);
        expect(store.items[0].id).toBe(2);
    });

    it('should clear error using clearError action', () => {
        const store = useInventoryStore();
        store.error = 'Error temporal';

        store.clearError();

        expect(store.error).toBeNull();
    });
});
