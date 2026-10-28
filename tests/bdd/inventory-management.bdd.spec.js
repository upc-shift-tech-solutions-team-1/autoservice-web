/**
 * @file inventory-management.bdd.spec.js
 * @description Vitest BDD runner for Inventory Management bounded context.
 * Executes features/inventory-management.feature using step definitions.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, afterEach, vi } from 'vitest';
import { createBddSuite } from './support/bdd-runner';
import { registerInventoryManagementSteps } from './steps/inventory-management.steps';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suite = createBddSuite();
registerInventoryManagementSteps(suite);

const featureFilePath = path.resolve(__dirname, 'features/inventory-management.feature');

suite.runFeature(featureFilePath, {
    beforeEach: () => {
        vi.restoreAllMocks();
    },
    afterEach: () => {
        vi.restoreAllMocks();
    }
});
