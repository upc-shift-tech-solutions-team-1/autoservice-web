import { expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useInventoryStore } from '../../../src/domains/inventory-management/application/inventory.store';
import { InventoryService } from '../../../src/domains/inventory-management/infrastructure/inventory.service';
import { createInventoryItem } from '../../../src/domains/inventory-management/domain/inventory-item.entity';

/**
 * Registers step definitions for the Inventory Management BDD suite.
 *
 * @param {ReturnType<import('../support/bdd-runner').createBddSuite>} suite
 */
export function registerInventoryManagementSteps({ Given, When, Then, And }) {
    // ── SCENARIO 1: Register a new spare part in the inventory catalog ──

    Given('the inventory system is initialized', async (context) => {
        setActivePinia(createPinia());
        context.inventoryStore = useInventoryStore();
        vi.spyOn(InventoryService, 'create').mockReset();
        vi.spyOn(InventoryService, 'getAll').mockReset();
        vi.spyOn(InventoryService, 'receiveStock').mockReset();
    });

    When(
        'a warehouse manager registers a new part with name {string}, purchase price {float}, and sale price {float}',
        async (context, name, purchasePrice, salePrice) => {
            const normalizedEntity = createInventoryItem({
                id: 50,
                name,
                purchasePrice,
                unitPrice: salePrice
            });

            vi.spyOn(InventoryService, 'create').mockResolvedValueOnce({
                data: normalizedEntity
            });

            context.createdItem = await context.inventoryStore.addItem({
                name,
                purchasePrice,
                unitPrice: salePrice
            });
        }
    );

    Then('the part is added to the inventory catalog', async (context) => {
        expect(context.createdItem).toBeDefined();
        expect(context.inventoryStore.items).toHaveLength(1);
        expect(context.inventoryStore.items[0].name).toBe('Pastillas de Freno Brembo');
    });

    And(
        'the unit profit is calculated as {float} and margin percentage is calculated as {float} percent',
        async (context, expectedProfit, expectedMargin) => {
            expect(context.createdItem.unitProfit).toBe(expectedProfit);
            expect(context.createdItem.marginPercentage).toBe(expectedMargin);
        }
    );

    // ── SCENARIO 2: Replenish stock through provider receipt ──

    Given(
        'an inventory item {string} exists with current stock {int} and min stock {int}',
        async (context, name, stock, minStock) => {
            setActivePinia(createPinia());
            context.inventoryStore = useInventoryStore();

            context.targetItem = createInventoryItem({
                id: 20,
                name,
                stock,
                minStock,
                purchasePrice: 25,
                unitPrice: 45
            });

            context.inventoryStore.items = [context.targetItem];
        }
    );

    When(
        'a provider delivery is received with quantity {int} and invoice {string}',
        async (context, quantityReceived, invoiceNumber) => {
            const updatedStock = context.targetItem.stock + quantityReceived;
            const updatedItem = createInventoryItem({
                ...context.targetItem,
                stock: updatedStock
            });

            vi.spyOn(InventoryService, 'receiveStock').mockResolvedValueOnce({
                data: {
                    item: updatedItem
                }
            });

            await context.inventoryStore.receiveStock(context.targetItem.id, {
                quantityReceived,
                providerInvoiceNumber: invoiceNumber
            });
        }
    );

    Then('the item physical stock increases to {int}', async (context, expectedStock) => {
        const item = context.inventoryStore.items.find(i => i.id === context.targetItem.id);
        expect(item.stock).toBe(expectedStock);
    });

    And('the item stock status is updated to available', async (context) => {
        const item = context.inventoryStore.items.find(i => i.id === context.targetItem.id);
        expect(item.stock).toBeGreaterThan(item.minStock);
    });
}
