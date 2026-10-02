import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { By, until, Key } from 'selenium-webdriver';
import { setupDriver } from '../support/driverSetup.js';

describe('Workshop Operations Context', () => {
    let driver;
    const BASE_URL = 'http://localhost:5173';

    // User provided credentials
    const ADMIN_EMAIL = 'deploytest20260915@autoservice.com';
    const ADMIN_PASSWORD = 'Test1234!';

    beforeAll(async () => {
        driver = await setupDriver();
        // Maximize the window to prevent hidden elements in responsive UI
        await driver.manage().window().maximize();
    });

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    it('should login successfully as an administrator', async () => {
        await driver.get(`${BASE_URL}/login`);

        // Wait for the inputs to be present
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 5000);
        // The PrimeVue Password component hides the input inside a div, so we search by class
        const passwordInput = await driver.wait(until.elementLocated(By.css('.p-password-input')), 5000);
        const submitButton = await driver.wait(until.elementLocated(By.css('.p-button-primary[type="submit"]')), 5000);

        // Enter credentials
        await emailInput.sendKeys(ADMIN_EMAIL);
        await passwordInput.sendKeys(ADMIN_PASSWORD);
        await submitButton.click();

        // Wait for navigation to the main dashboard (or admin layout)
        await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);
        
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toBe(`${BASE_URL}/`);
    }, 30000);

    it('should navigate to the Work Orders view', async () => {
        // Navigate directly to the work orders route
        await driver.get(`${BASE_URL}/work-orders`);

        // Wait for the page title to render
        const titleElement = await driver.wait(until.elementLocated(By.css('h1')), 5000);
        const titleText = await titleElement.getText();
        
        // The title should be Órdenes de trabajo
        expect(titleText).toBeTruthy();

        // Validate that the new order button exists
        const newOrderBtn = await driver.wait(until.elementLocated(By.css('.add-button')), 5000);
        expect(await newOrderBtn.isDisplayed()).toBe(true);
    }, 30000);

    it('should navigate to Create Work Order form and fill it', async () => {
        // Click on the button to create a new order
        const newOrderBtn = await driver.findElement(By.css('.add-button'));
        await newOrderBtn.click();

        // Wait for the URL to change
        await driver.wait(until.urlContains('/work-orders/new'), 5000);

        // Wait for the form view to load
        await driver.wait(until.elementLocated(By.css('.create-wo-container')), 5000);

        // Interact with the form elements (PrimeVue Select, DatePicker, Textarea)
        // 1. Vehicle
        const selects = await driver.findElements(By.css('.p-select'));
        if (selects.length >= 2) {
            // Open the Vehicle dropdown
            await selects[0].click();
            await driver.sleep(500); // Wait for animation
            const vehicleOptions = await driver.wait(until.elementsLocated(By.css('.p-select-option')), 5000);
            await vehicleOptions[0].click();
            await driver.sleep(500); // Wait for the first dropdown to close

            // 2. Mechanic
            await selects[1].click();
            await driver.sleep(500); // Wait for animation
            const mechanicOptions = await driver.wait(until.elementsLocated(By.css('.p-select-option')), 5000);
            await mechanicOptions[0].click();
            await driver.sleep(500); // Wait for it to close
        }

        // 3. Date (PrimeVue DatePicker is an input)
        const dateInput = await driver.wait(until.elementLocated(By.css('.p-datepicker-input')), 5000);
        // Type a date (assuming dd/mm/yy format or sending enter)
        // Note: Sending keys to datepickers can be tricky, sending current date + 1 day or manual click
        await dateInput.sendKeys('14/10/2026', Key.ENTER);

        // 4. Problem Description
        const textarea = await driver.wait(until.elementLocated(By.css('textarea')), 5000);
        await textarea.sendKeys('Ruido extraño en el motor durante la aceleración. E2E Test.');

        // 5. Click on Create Order
        const createBtn = await driver.wait(until.elementLocated(By.css('.primary-btn')), 5000);
        expect(await createBtn.isDisplayed()).toBe(true);
        // Uncomment to save the order in the test database
        // await createBtn.click();
        // await driver.wait(until.urlIs(`${BASE_URL}/work-orders`), 5000);
    }, 30000);
});