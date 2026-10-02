import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { By, until } from 'selenium-webdriver';
import { setupDriver } from '../support/driverSetup.js';

describe('Workshop Operations Context', () => {
    let driver;
    const BASE_URL = 'http://localhost:5173';

    beforeAll(async () => {
        // Launch the browser before running tests
        driver = await setupDriver();
    });

    afterAll(async () => {
        // Close browser session after all tests finish
        if (driver) {
            await driver.quit();
        }
    });

    it('should load the workshop operations view successfully', async () => {
        // Navigate to the target route
        await driver.get(BASE_URL);

        // Wait until the root application container or body is ready
        const bodyElement = await driver.wait(
            until.elementLocated(By.css('body')),
            5000
        );

        // Assert that the page container is displayed
        const isDisplayed = await bodyElement.isDisplayed();
        expect(isDisplayed).toBe(true);

        // Assert the current URL
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toContain('localhost');
    });
});