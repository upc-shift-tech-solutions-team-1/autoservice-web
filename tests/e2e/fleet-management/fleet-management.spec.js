import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { By, until, Key } from 'selenium-webdriver';
import { setupDriver } from '../support/driverSetup.js';

describe('Fleet Management Context', () => {
    let driver;
    const BASE_URL = 'http://localhost:5173';

    // User provided credentials
    const ADMIN_EMAIL = 'deploytest20260915@autoservice.com';
    const ADMIN_PASSWORD = 'Test1234!';

    beforeAll(async () => {
        driver = await setupDriver();
        // Maximize the window to prevent hidden elements in responsive UI
        await driver.manage().window().maximize();
    }, 30000);

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    }, 30000);

    it('should login successfully as an administrator', async () => {
        await driver.get(`${BASE_URL}/login`);

        // Wait for inputs to be present
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 5000);
        const passwordInput = await driver.wait(until.elementLocated(By.css('.p-password-input')), 5000);
        const submitButton = await driver.wait(until.elementLocated(By.css('.p-button-primary[type="submit"]')), 5000);

        // Enter credentials
        await emailInput.sendKeys(ADMIN_EMAIL);
        await passwordInput.sendKeys(ADMIN_PASSWORD);
        await submitButton.click();

        // Wait for navigation to the main dashboard
        await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);

        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toBe(`${BASE_URL}/`);
    }, 30000);

    it('should navigate to the Fleet / Vehicles view and render summary metrics', async () => {
        // Navigate directly to the vehicles route
        await driver.get(`${BASE_URL}/vehicles`);

        // Wait for page header and title to render
        const titleElement = await driver.wait(until.elementLocated(By.css('.vehicle-header h1')), 5000);
        const titleText = await titleElement.getText();
        expect(titleText).toBeTruthy();

        // Validate summary metrics row
        const summaryRow = await driver.wait(until.elementLocated(By.css('.summary-row')), 5000);
        expect(await summaryRow.isDisplayed()).toBe(true);

        // Validate that add vehicle button exists
        const addVehicleBtn = await driver.wait(until.elementLocated(By.css('.add-button')), 5000);
        expect(await addVehicleBtn.isDisplayed()).toBe(true);
    }, 30000);

    it('should interact with vehicle filters and search input', async () => {
        // Locate search input in VehicleFilters component
        const searchInput = await driver.wait(
            until.elementLocated(By.css('.filter-search-box input, .vehicle-page input[type="text"]')),
            5000
        );
        expect(await searchInput.isDisplayed()).toBe(true);

        // Type search query to filter vehicles
        await searchInput.sendKeys('Toyota');
        await driver.sleep(400);

        // Clear search input
        await searchInput.sendKeys(Key.CONTROL, 'a');
        await searchInput.sendKeys(Key.BACK_SPACE);
    }, 30000);

    it('should open New Vehicle dialog, select customer, and fill registration form', async () => {
        // Click on the button to add a new vehicle
        const addVehicleBtn = await driver.findElement(By.css('.add-button'));
        await addVehicleBtn.click();

        // Wait for the modal dialog to appear
        const dialog = await driver.wait(until.elementLocated(By.css('.vehicle-dialog, .p-dialog')), 5000);
        expect(await dialog.isDisplayed()).toBe(true);

        // Select Customer from PrimeVue Select
        const customerSelect = await dialog.findElement(By.css('#customer, .field .p-select'));
        await customerSelect.click();
        await driver.sleep(500); // Wait for dropdown animation

        const customerOptions = await driver.wait(
            until.elementsLocated(By.css('.p-select-option, .p-dropdown-item')),
            5000
        );
        if (customerOptions.length > 0) {
            await customerOptions[0].click();
            await driver.sleep(500);
        }

        // Fill Vehicle Plate
        const plateInput = await dialog.findElement(By.id('plate'));
        await plateInput.sendKeys('ABC-789');

        // Select Vehicle Status
        const selects = await dialog.findElements(By.css('.p-select'));
        if (selects.length > 1) {
            await selects[1].click();
            await driver.sleep(500);
            const statusOptions = await driver.wait(
                until.elementsLocated(By.css('.p-select-option, .p-dropdown-item')),
                5000
            );
            if (statusOptions.length > 0) {
                await statusOptions[0].click();
                await driver.sleep(500);
            }
        }

        // Validate Save Button is present and visible
        const saveBtn = await dialog.findElement(By.css('.save-btn'));
        expect(await saveBtn.isDisplayed()).toBe(true);

        // Close dialog with cancel button to restore state
        const cancelBtn = await dialog.findElement(By.xpath(".//button[.//span[text()='Cancelar'] or text()='Cancelar']"));
        if (cancelBtn) {
            await cancelBtn.click();
            await driver.sleep(500);
        }
    }, 30000);
});
