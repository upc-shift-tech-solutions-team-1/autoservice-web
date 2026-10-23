/**
 * @file workshop-operations.bdd.spec.js
 * @description Vitest BDD runner for Workshop Operations bounded context.
 * Executes features/workshop-operations.feature using step definitions.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, afterEach, vi } from 'vitest';
import { createBddSuite } from './support/bdd-runner';
import { registerWorkshopOperationsSteps } from './steps/workshop-operations.steps';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suite = createBddSuite();
registerWorkshopOperationsSteps(suite);

const featureFilePath = path.resolve(__dirname, 'features/workshop-operations.feature');

suite.runFeature(featureFilePath, {
  beforeEach: () => {
    vi.restoreAllMocks();
  },
  afterEach: () => {
    vi.restoreAllMocks();
  }
});
