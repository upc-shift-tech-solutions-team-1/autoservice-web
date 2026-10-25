import path from 'node:path';
import { createBddSuite } from './support/bdd-runner';
import { registerTaskUpdateRecoverySteps } from './steps/task-update-recovery.steps';

vi.mock('../../src/shared/infrastructure/http-common', () => ({
    default: {
        patch: vi.fn()
    }
}));

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

const suite = createBddSuite();

registerTaskUpdateRecoverySteps(suite);

const featurePath = path.resolve(
    process.cwd(),
    'tests/bdd/features/task-update-recovery.feature'
);

suite.runFeature(featurePath);