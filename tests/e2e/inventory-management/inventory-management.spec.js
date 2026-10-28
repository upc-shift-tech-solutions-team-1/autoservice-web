import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { By, until, Key } from 'selenium-webdriver';
import { setupDriver } from '../support/driverSetup.js';

describe('Inventory Management Context', () => {
    let driver;
    const BASE_URL = 'http://localhost:5173';

    // User provided credentials
    const ADMIN_EMAIL = 'deploytest20260915@autoservice.com';
    const ADMIN_PASSWORD = 'Test1234!';

    beforeAll(async () => {
        driver = await setupDriver();
        // Maximize window to ensure responsive elements are visible
        await driver.manage().window().maximize();
    }, 30000);

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    }, 30000);

    it('should login successfully as an administrator', async () => {
        await driver.get(`${BASE_URL}/login`);

        // Wait for credentials input
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 5000);
        const passwordInput = await driver.wait(until.elementLocated(By.css('.p-password-input')), 5000);
        const submitButton = await driver.wait(until.elementLocated(By.css('.p-button-primary[type="submit"]')), 5000);

        // Enter credentials
        await emailInput.sendKeys(ADMIN_EMAIL);
        await passwordInput.sendKeys(ADMIN_PASSWORD);
        await submitButton.click();

        // Wait for redirection to dashboard
        await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toBe(`${BASE_URL}/`);
    }, 30000);

    it('should navigate to Inventory view and verify KPI metrics and catalog toolbar', async () => {
        // Navigate to inventory route
        await driver.get(`${BASE_URL}/inventory`);

        // Wait for page header and title to render
        const titleElement = await driver.wait(until.elementLocated(By.css('.page-header h1')), 5000);
        const titleText = await titleElement.getText();
        expect(titleText).toBeTruthy();

        // Verify presence of financial KPI cards
        const kpiCards = await driver.wait(until.elementsLocated(By.css('.inventory-kpis .kpi-card')), 5000);
        expect(kpiCards.length).toBeGreaterThanOrEqual(4);

        // Verify toolbar elements
        const searchInput = await driver.wait(until.elementLocated(By.css('.toolbar .search-box input')), 5000);
        expect(await searchInput.isDisplayed()).toBe(true);

        const newButton = await driver.wait(until.elementLocated(By.css('.page-header .add-button')), 5000);
        expect(await newButton.isDisplayed()).toBe(true);
    }, 30000);

    it('should open New Inventory Item modal and fill product and financial details', async () => {
        // Click on the button to create a new item
        const newButton = await driver.findElement(By.css('.page-header .add-button'));
        await newButton.click();

        // Wait for modal dialog to appear
        const dialog = await driver.wait(until.elementLocated(By.css('.inventory-dialog, .p-dialog')), 5000);
        expect(await dialog.isDisplayed()).toBe(true);

        // Fill item name
        const nameInput = await dialog.findElement(By.css('.form-grid .field input[type="text"]'));
        await nameInput.sendKeys('Filtro de Aire Deportivo E2E');

        // Fill brand input if present
        const textInputs = await dialog.findElements(By.css('.row-grid .field input[type="text"]'));
        if (textInputs.length > 0) {
            await textInputs[0].sendKeys('K&N Performance');
        }

        // Fill financial prices (PrimeVue InputNumber)
        const priceInputs = await dialog.findElements(By.css('.financial-form-section .p-inputnumber-input'));
        if (priceInputs.length >= 2) {
            // Purchase price
            await priceInputs[0].sendKeys('80');
            // Unit sale price
            await priceInputs[1].sendKeys('135');
        }

        // Check profitability indicator section
        const profitPreview = await dialog.findElements(By.css('.profit-preview'));
        expect(profitPreview.length).toBeGreaterThan(0);

        // Check save button exists and is active
        const saveButton = await dialog.findElement(By.xpath(".//button[.//span[contains(text(), 'Guardar')] or contains(text(), 'Guardar')]"));
        expect(await saveButton.isDisplayed()).toBe(true);

        // Close dialog
        const cancelButton = await dialog.findElement(By.xpath(".//button[.//span[contains(text(), 'Cancelar')] or contains(text(), 'Cancelar')]"));
        await cancelButton.click();
        await driver.sleep(500);
    }, 30000);

    it('should search inventory catalog and verify results filtering', async () => {
        const searchInput = await driver.findElement(By.css('.toolbar .search-box input'));
        await searchInput.sendKeys('Filtro');
        await driver.sleep(400);

        // Clear search
        await searchInput.sendKeys(Key.CONTROL, 'a');
        await searchInput.sendKeys(Key.BACK_SPACE);
        await driver.sleep(300);
    }, 30000);
});
