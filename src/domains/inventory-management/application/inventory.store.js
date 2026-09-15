import { defineStore } from 'pinia';
import { InventoryService } from '../infrastructure/inventory.service';
import { createInventoryItem } from '../domain/inventory-item.entity';

const getErrorMessage = (
    error,
    fallbackMessage = 'Ocurrió un error en el inventario.'
) =>
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    fallbackMessage;

export const useInventoryStore = defineStore('inventory', {
    state: () => ({
        items: [],
        loading: false,
        saving: false,
        deletingId: null,
        receivingId: null,
        error: null
    }),

    actions: {
        /**
         * Clears the last inventory operation error.
         */
        clearError() {
            this.error = null;
        },

        /**
         * Fetch all inventory items.
         *
         * @returns {Promise<Array>}
         */
        async fetchItems() {
            this.loading = true;
            this.error = null;

            try {
                const response =
                    await InventoryService.getAll();

                const inventoryData =
                    Array.isArray(response.data)
                        ? response.data
                        : [];

                this.items = inventoryData.map(item =>
                    createInventoryItem(item)
                );

                return this.items;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo cargar el inventario.'
                );

                console.error(
                    'Error cargando inventario:',
                    error
                );

                return [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Adds a new inventory catalog item.
         *
         * New items are created with zero physical stock.
         *
         * @param {Object} itemData
         * @returns {Promise<Object>}
         */
        async addItem(itemData) {
            this.saving = true;
            this.error = null;

            try {
                const normalizedItem =
                    createInventoryItem(itemData);

                const response =
                    await InventoryService.create(
                        normalizedItem
                    );

                const createdItem =
                    createInventoryItem(response.data);

                this.items.push(createdItem);

                return createdItem;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo crear el producto.'
                );

                console.error(
                    'Error creando producto de inventario:',
                    error
                );

                throw error;
            } finally {
                this.saving = false;
            }
        },

        /**
         * Updates catalog, technical and financial information.
         *
         * Physical stock is preserved by the backend.
         *
         * @param {string|number} id
         * @param {Object} itemData
         * @returns {Promise<Object>}
         */
        async updateItem(id, itemData) {
            this.saving = true;
            this.error = null;

            try {
                const normalizedItem =
                    createInventoryItem({
                        ...itemData,
                        id
                    });

                const response =
                    await InventoryService.update(
                        id,
                        normalizedItem
                    );

                const updatedItem =
                    createInventoryItem(
                        response.data || normalizedItem
                    );

                const index =
                    this.items.findIndex(
                        item =>
                            String(item.id) === String(id)
                    );

                if (index !== -1) {
                    this.items.splice(
                        index,
                        1,
                        updatedItem
                    );
                }

                return updatedItem;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo actualizar el producto.'
                );

                console.error(
                    'Error actualizando producto de inventario:',
                    error
                );

                throw error;
            } finally {
                this.saving = false;
            }
        },

        /**
         * Registers a provider receipt and updates physical stock.
         *
         * @param {string|number} id
         * @param {Object} receiptData
         * @returns {Promise<Object>}
         */
        async receiveStock(id, receiptData) {
            this.receivingId = id;
            this.error = null;

            try {
                const response =
                    await InventoryService.receiveStock(
                        id,
                        receiptData
                    );

                const receiptResult =
                    response.data || {};

                const updatedItem =
                    receiptResult.item
                        ? createInventoryItem(
                            receiptResult.item
                        )
                        : null;

                if (updatedItem) {
                    const index =
                        this.items.findIndex(
                            item =>
                                String(item.id) ===
                                String(id)
                        );

                    if (index !== -1) {
                        this.items.splice(
                            index,
                            1,
                            updatedItem
                        );
                    } else {
                        this.items.push(updatedItem);
                    }
                }

                return receiptResult;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo registrar la recepción del proveedor.'
                );

                console.error(
                    'Error registrando recepción de proveedor:',
                    error
                );

                throw error;
            } finally {
                this.receivingId = null;
            }
        },

        /**
         * Deletes an inventory item.
         *
         * @param {string|number} id
         * @returns {Promise<boolean>}
         */
        async deleteItem(id) {
            this.deletingId = id;
            this.error = null;

            try {
                await InventoryService.delete(id);

                this.items =
                    this.items.filter(
                        item =>
                            String(item.id) !== String(id)
                    );

                return true;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo eliminar el producto.'
                );

                console.error(
                    'Error eliminando producto de inventario:',
                    error
                );

                throw error;
            } finally {
                this.deletingId = null;
            }
        }
    }
});