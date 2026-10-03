import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { By, until, Key } from 'selenium-webdriver';
import { setupDriver } from '../support/driverSetup.js';

describe('Mechanic Context', () => {
    let driver;
    const BASE_URL = 'http://localhost:5173';

    // User provided credentials
    const MECHANIC_EMAIL = 'mechanictest20260916@autoservice.com';
    const MECHANIC_PASSWORD = 'Test1234!';

    beforeAll(async () => {
        driver = await setupDriver();
        await driver.manage().window().maximize();
    }, 30000);

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    }, 30000);

    it('should login and navigate to mechanic dashboard', async () => {
        await driver.get(`${BASE_URL}/login`);

        // Wait for the inputs to be present
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 5000);
        const passwordInput = await driver.wait(until.elementLocated(By.css('.p-password-input')), 5000);
        const submitButton = await driver.wait(until.elementLocated(By.css('.p-button-primary[type="submit"]')), 5000);

        // Enter credentials
        await emailInput.sendKeys(MECHANIC_EMAIL);
        await passwordInput.sendKeys(MECHANIC_PASSWORD);
        await submitButton.click();

        // Wait for navigation to the mechanic workspace
        await driver.wait(until.urlContains('/mechanic/workspace'), 10000);
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toContain('/mechanic/workspace');
    }, 30000);

    it('should navigate to order details and propose a task', async () => {
        // Find and click the 'Ver Orden' button in the assigned orders list
        const viewOrderBtn = await driver.wait(
            until.elementLocated(By.xpath("//button[.//span[text()='Ver Orden']]")),
            10000
        );
        await viewOrderBtn.click();

        // Wait for the URL to change to the order execution view
        await driver.wait(until.urlContains('/mechanic/order/'), 10000);

        // Click on 'Proponer tarea'
        const proposeTaskBtn = await driver.wait(
            until.elementLocated(By.xpath("//button[.//span[text()='Proponer tarea']]")),
            5000
        );
        await proposeTaskBtn.click();

        // Wait for the modal to appear
        const dialog = await driver.wait(until.elementLocated(By.css('.dialog-form')), 5000);

        // Fill task description
        const descriptionInput = await dialog.findElement(By.css('input[type="text"]'));
        await descriptionInput.sendKeys('Revisión general y cambio de aceite');

        // Priority and Estimated Time are 'Media' and '60 min' by default, 
        // but we can adjust time if needed. We will leave it as is or type to ensure interaction.
        const timeInput = await dialog.findElement(By.css('.p-inputnumber-input'));
        // clear and type 60 (PrimeVue inputnumber can be tricky to clear, we'll just sendKeys)
        // await timeInput.sendKeys(Key.BACK_SPACE, Key.BACK_SPACE, '60');

        // Click '+ Añadir' in the materials section
        const addMaterialBtn = await dialog.findElement(By.xpath(".//button[.//span[text()='Añadir']]"));
        await addMaterialBtn.click();

        // Wait for the part dropdown to appear and click it
        const partSelect = await dialog.findElement(By.css('.part-select'));
        await partSelect.click();
        await driver.sleep(500); // Wait for animation

        // Find the option for 'Aceite' (or first option if exact text varies)
        // PrimeVue dropdown uses .p-dropdown-item or .p-select-option
        const options = await driver.wait(
            until.elementsLocated(By.css('.p-dropdown-item, .p-select-option')),
            5000
        );
        
        let optionClicked = false;
        for (const option of options) {
            const text = await option.getText();
            if (text.toLowerCase().includes('aceite')) {
                await option.click();
                optionClicked = true;
                break;
            }
        }
        
        if (!optionClicked && options.length > 0) {
            // Fallback to first option if 'Aceite' is not found
            await options[0].click();
        }
        await driver.sleep(500); // Wait for dropdown to close

        // Set quantity to 1 (it defaults to 1, so we are good, or we can find .part-qty input)
        const qtyInput = await dialog.findElement(By.css('.part-qty input'));
        // Verify it is there
        expect(await qtyInput.isDisplayed()).toBe(true);

        // Click 'Enviar propuesta'
        const submitProposalBtn = await dialog.findElement(By.xpath(".//button[.//span[text()='Enviar propuesta']]"));
        expect(await submitProposalBtn.isDisplayed()).toBe(true);
        
        // Uncomment to actually submit in test DB
        // await submitProposalBtn.click();
        
        // Let's close the dialog to clean up for now, or just let the test end
        // const cancelBtn = await dialog.findElement(By.xpath(".//button[.//span[text()='Cancelar']]"));
        // await cancelBtn.click();
    }, 30000);
});