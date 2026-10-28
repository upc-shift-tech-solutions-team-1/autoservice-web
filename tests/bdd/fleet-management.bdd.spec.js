/**
 * @file fleet-management.bdd.spec.js
 * @description Vitest BDD runner for Fleet Management bounded context.
 * Executes features/fleet-management.feature using step definitions.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, afterEach, vi } from 'vitest';
import { createBddSuite } from './support/bdd-runner';
import { registerFleetManagementSteps } from './steps/fleet-management.steps';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suite = createBddSuite();
registerFleetManagementSteps(suite);

const featureFilePath = path.resolve(__dirname, 'features/fleet-management.feature');

suite.runFeature(featureFilePath, {
    beforeEach: () => {
        vi.restoreAllMocks();
    },
    afterEach: () => {
        vi.restoreAllMocks();
    }
});
