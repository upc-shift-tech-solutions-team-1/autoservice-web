import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { By, until } from 'selenium-webdriver';
import { setupDriver } from '../support/driverSetup.js';

describe('Mechanic Context', () => {
    let driver;
    const BASE_URL = 'http://localhost:5173';

    beforeAll(async () => {
        // Initialize the WebDriver instance
        driver = await setupDriver();
    });

    afterAll(async () => {
        // Quit the driver and destroy the browser session
        if (driver) {
            await driver.quit();
        }
    });

    it('should navigate and render the mechanic dashboard view', async () => {
        // Navigate to the mechanic section (adjust route as needed)
        await driver.get(`${BASE_URL}`);

        // Wait for the main layout to render
        const mainContent = await driver.wait(
            until.elementLocated(By.css('body')),
            5000
        );

        expect(await mainContent.isDisplayed()).toBe(true);
    });
});