import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTaskStore } from '../../src/domains/workshop-operations/application/task.store';
import { useWorkOrderStore } from '../../src/domains/workshop-operations/application/work-order.store';
import { useInventoryStore } from '../../src/domains/inventory-management/application/inventory.store';
import http from '../../src/shared/infrastructure/http-common';

vi.mock('../../src/shared/infrastructure/http-common', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn()
    }
}));

describe('Workshop-Operations & Inventory Integration', () => {
    let pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should integrate inventory catalog prices into task cost calculation and auto-update work order totals', async () => {
        // Arrange: 1. Setup inventory catalog with items and stock
        const inventoryStore = useInventoryStore();
        inventoryStore.items = [
            {
                id: 1,
                name: 'Amortiguador Delantero Monroe',
                unitPrice: 220.0,    // Customer sale price
                purchasePrice: 140.0, // Workshop purchase cost
                brand: 'Monroe',
                qualityTier: 'PREMIUM',
                stock: 8
            },
            {
                id: 2,
                name: 'Líquido de Frenos DOT 4',
                unitPrice: 35.0,
                purchasePrice: 18.0,
                brand: 'Brembo',
                qualityTier: 'STANDARD',
                stock: 15
            }
        ];

        // 2. Setup a PENDING work order in workshop operations
        const workOrderStore = useWorkOrderStore();
        workOrderStore.workOrders = [
            {
                id: 300,
                description: 'Reparación de suspensión delantera',
                status: 'PENDING',
                price: 0,
                estimatedDate: '2026-11-01',
                qaChecklist: { tasksCompleted: false }
            }
        ];

        const taskStore = useTaskStore();

        // 3. Mock API response for creating task with inventory parts
        const requestedParts = [
            {
                inventoryItemId: 1,
                name: inventoryStore.items[0].name,
                unitPrice: inventoryStore.items[0].unitPrice,
                purchasePrice: inventoryStore.items[0].purchasePrice,
                quantity: 2, // 2 * 220 = 440 revenue, 2 * 140 = 280 cost
                brand: inventoryStore.items[0].brand,
                qualityTier: inventoryStore.items[0].qualityTier
            },
            {
                inventoryItemId: 2,
                name: inventoryStore.items[1].name,
                unitPrice: inventoryStore.items[1].unitPrice,
                purchasePrice: inventoryStore.items[1].purchasePrice,
                quantity: 1, // 1 * 35 = 35 revenue, 1 * 18 = 18 cost
                brand: inventoryStore.items[1].brand,
                qualityTier: inventoryStore.items[1].qualityTier
            }
        ];

        http.post.mockResolvedValueOnce({
            data: {
                id: 88,
                workOrderId: 300,
                description: 'Instalación de amortiguadores y purga',
                status: 'PENDING',
                laborPrice: 150.0,
                laborCost: 60.0,
                parts: requestedParts
            }
        });

        // Act 1: Add task to order with selected inventory materials
        const createdTask = await taskStore.addTask({
            workOrderId: 300,
            description: 'Instalación de amortiguadores y purga',
            laborPrice: 150.0,
            laborCost: 60.0,
            parts: requestedParts
        });

        // Assert 1: Materials revenue and costs calculated automatically from inventory values
        // Materials revenue: 440 + 35 = 475
        expect(createdTask.materialsCost).toBe(475.0);
        // Materials purchase cost: 280 + 18 = 298
        expect(createdTask.materialsPurchaseCost).toBe(298.0);
        // Total task revenue: 150 (labor) + 475 (materials) = 625
        expect(createdTask.totalRevenue).toBe(625.0);
        // Total cost: 60 (labor) + 298 (materials) = 358
        expect(createdTask.totalCost).toBe(358.0);
        // Estimated profit: 625 - 358 = 267
        expect(createdTask.profit).toBe(267.0);

        // Act 2: Propagate total revenue to the work order auto price updater
        http.put.mockResolvedValueOnce({
            data: {
                id: 300,
                description: 'Reparación de suspensión delantera',
                status: 'IN_PROGRESS',
                price: createdTask.totalRevenue,
                estimatedDate: '2026-11-01',
                tasksCompleted: false
            }
        });

        await workOrderStore.updateOrderAutoPrice(300, createdTask.totalRevenue);

        // Assert 2: Work order automatically transitioned from PENDING to IN_PROGRESS and registered full price
        expect(http.put).toHaveBeenCalledWith('/workorders/300', expect.objectContaining({
            status: 'IN_PROGRESS',
            price: 625.0
        }));
        expect(workOrderStore.workOrders[0].status).toBe('IN_PROGRESS');
        expect(workOrderStore.workOrders[0].price).toBe(625.0);
    });
});
