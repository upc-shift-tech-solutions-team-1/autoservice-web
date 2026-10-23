/**
 * @file mechanic-workspace.bdd.spec.js
 * @description Vitest BDD runner for Mechanic bounded context.
 * Executes features/mechanic-workspace.feature using step definitions.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, afterEach, vi } from 'vitest';
import { createBddSuite } from './support/bdd-runner';
import { registerMechanicWorkspaceSteps } from './steps/mechanic-workspace.steps';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suite = createBddSuite();
registerMechanicWorkspaceSteps(suite);

const featureFilePath = path.resolve(__dirname, 'features/mechanic-workspace.feature');

suite.runFeature(featureFilePath, {
  beforeEach: () => {
    vi.restoreAllMocks();
  },
  afterEach: () => {
    vi.restoreAllMocks();
  }
});
