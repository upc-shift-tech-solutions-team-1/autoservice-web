import { describe, it, expect } from 'vitest';
import { createTask } from '../../../../src/domains/workshop-operations/domain/task.entity';

describe('Task Entity (Workshop Operations Domain)', () => {
    describe('Default values and sanitization', () => {
        it('should initialize a task with safe default values when an empty object is provided', () => {
            const task = createTask({});

            expect(task.id).toBeNull();
            expect(task.workOrderId).toBeNull();
            expect(task.mechanicId).toBeNull();
            expect(task.description).toBe('');
            expect(task.status).toBe('PENDING');
            expect(task.priority).toBe('MEDIUM');
            expect(task.estimatedTime).toBe(0);
            expect(task.laborPrice).toBe(0);
            expect(task.laborCost).toBe(0);
            expect(task.materialsCost).toBe(0);
            expect(task.materialsPurchaseCost).toBe(0);
            expect(task.totalRevenue).toBe(0);
            expect(task.totalCost).toBe(0);
            expect(task.profit).toBe(0);
            expect(task.marginPercentage).toBe(0);
            expect(task.parts).toEqual([]);
        });

        it('should sanitize negative financial numbers and negative estimated time', () => {
            const task = createTask({
                laborPrice: -100,
                laborCost: -50,
                estimatedTime: -30
            });

            expect(task.laborPrice).toBe(0);
            expect(task.laborCost).toBe(0);
            expect(task.estimatedTime).toBe(0);
        });
    });

    describe('Financial calculations and business rules', () => {
        it('should correctly calculate totalRevenue, totalCost, profit and marginPercentage', () => {
            // Arrange
            const rawTask = {
                laborPrice: 120.0,
                laborCost: 40.0,
                materialsCost: 80.0,
                materialsPurchaseCost: 50.0
            };

            // Act
            const task = createTask(rawTask);

            // Assert
            // totalRevenue = 120 + 80 = 200
            expect(task.totalRevenue).toBe(200.0);
            // totalCost = 40 + 50 = 90
            expect(task.totalCost).toBe(90.0);
            // profit = 200 - 90 = 110
            expect(task.profit).toBe(110.0);
            // marginPercentage = (110 / 200) * 100 = 55%
            expect(task.marginPercentage).toBe(55.0);
        });

        it('should automatically compute materialsCost and materialsPurchaseCost from parts list', () => {
            // Arrange
            const rawTask = {
                laborPrice: 100.0,
                laborCost: 30.0,
                parts: [
                    {
                        name: 'Filtro de Aceite',
                        quantity: 2,
                        unitPrice: 25.0,     // 2 * 25 = 50 revenue
                        purchasePrice: 15.0  // 2 * 15 = 30 cost
                    },
                    {
                        name: 'Aceite Sintético 5W30',
                        quantity: 4,
                        unitPrice: 35.0,     // 4 * 35 = 140 revenue
                        purchasePrice: 20.0  // 4 * 20 = 80 cost
                    }
                ]
            };

            // Act
            const task = createTask(rawTask);

            // Assert
            // Total materials revenue: 50 + 140 = 190
            expect(task.materialsCost).toBe(190.0);
            // Total materials purchase cost: 30 + 80 = 110
            expect(task.materialsPurchaseCost).toBe(110.0);
            // Total revenue = 100 (labor) + 190 (materials) = 290
            expect(task.totalRevenue).toBe(290.0);
            // Total cost = 30 (labor cost) + 110 (parts purchase) = 140
            expect(task.totalCost).toBe(140.0);
            // Profit = 290 - 140 = 150
            expect(task.profit).toBe(150.0);
            // Margin = (150 / 290) * 100 = 51.72%
            expect(task.marginPercentage).toBe(51.72);
        });

        it('should handle zero total revenue without division by zero errors for margin percentage', () => {
            const task = createTask({
                laborPrice: 0,
                laborCost: 20,
                materialsCost: 0,
                materialsPurchaseCost: 10
            });

            expect(task.totalRevenue).toBe(0);
            expect(task.totalCost).toBe(30);
            expect(task.profit).toBe(-30);
            expect(task.marginPercentage).toBe(0);
        });
    });

    describe('Status and review aliases normalization', () => {
        it('should normalize legacy and Spanish task status aliases to standardized enums', () => {
            expect(createTask({ status: 'PENDIENTE' }).status).toBe('PENDING');
            expect(createTask({ status: 'EN_PROCESO' }).status).toBe('IN_PROGRESS');
            expect(createTask({ status: 'EN_EJECUCION' }).status).toBe('IN_PROGRESS');
            expect(createTask({ status: 'COMPLETADO' }).status).toBe('COMPLETED');
            expect(createTask({ status: 'COMPLETADA' }).status).toBe('COMPLETED');
            expect(createTask({ status: 'FINALIZADO' }).status).toBe('COMPLETED');
        });

        it('should normalize review status aliases to SUBMITTED, APPROVED or REJECTED', () => {
            expect(createTask({ adminReviewStatus: 'ENVIADO_AL_ADMINISTRADOR' }).adminReviewStatus).toBe('SUBMITTED');
            expect(createTask({ adminReviewStatus: 'PENDIENTE_DE_APROBACION' }).adminReviewStatus).toBe('SUBMITTED');
            expect(createTask({ adminReviewStatus: 'COTIZACION_APROBADA' }).adminReviewStatus).toBe('APPROVED');
            expect(createTask({ adminReviewStatus: 'APROBADA' }).adminReviewStatus).toBe('APPROVED');
            expect(createTask({ adminReviewStatus: 'RECHAZADA' }).adminReviewStatus).toBe('REJECTED');
        });
    });

    describe('Task parts normalization', () => {
        it('should normalize part properties with fallback for brand, quality and quantity minimum of 1', () => {
            const task = createTask({
                parts: [
                    {
                        name: ' Pastillas de Freno ',
                        quantity: 0, // Should fallback to at least 1
                        brand: '',
                        qualityTier: ''
                    }
                ]
            });

            const part = task.parts[0];
            expect(part.name).toBe('Pastillas de Freno');
            expect(part.quantity).toBe(1);
            expect(part.brand).toBe('GENERIC');
            expect(part.qualityTier).toBe('STANDARD');
        });
    });
});
