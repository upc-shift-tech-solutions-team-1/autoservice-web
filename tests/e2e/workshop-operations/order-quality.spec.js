import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { By, until } from 'selenium-webdriver';
import { setupDriver } from '../support/driverSetup';

describe('Workshop repair quality and delivery', () => {
    let driver;

    const checkQualityField = async (field) => {
        await driver.wait(async () => {
            try {
                const input = await driver.findElement(By.id(`quality-${field}`));
                if (await input.isSelected()) return true;
                if (!(await input.isEnabled())) return false;

                // Click the component root: the transparent native input overlays
                // its sibling visual box, which Selenium treats as an intercepted click.
                const checkbox = await input.findElement(By.xpath('..'));
                await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", checkbox);
                if (!(await checkbox.isDisplayed())) return false;
                await checkbox.click();
                return await input.isSelected();
            } catch (error) {
                if (['StaleElementReferenceError', 'ElementClickInterceptedError', 'ElementNotInteractableError', 'NoSuchElementError'].includes(error.name)) return false;
                throw error;
            }
        }, 10000, `The quality checkbox ${field} could not be selected`);
    };

    beforeAll(async () => {
        driver = await setupDriver();
        await driver.manage().window().setRect({ width: 1280, height: 900 });
        await driver.get('http://localhost:5173/login');
        await driver.findElement(By.id('email')).sendKeys('admin.e2e@example.test');
        await driver.findElement(By.css('.p-password-input')).sendKeys('e2e-only-password');
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.wait(until.urlIs('http://localhost:5173/'), 10000);
    }, 30000);
    afterAll(async () => { if (driver) await driver.quit(); });

    it('requires a delay reason and all quality checks before finishing and delivering', async () => {
        await driver.get('http://localhost:5173/work-orders/2');
        const date = await driver.wait(until.elementLocated(By.css('#estimated-delivery-date')), 10000);
        await driver.executeScript("arguments[0].value='2026-12-20';arguments[0].dispatchEvent(new Event('input',{bubbles:true}));", date);
        const reason = await driver.wait(until.elementLocated(By.css('#estimated-date-delay-reason')), 5000);
        await reason.sendKeys('Repuesto solicitado en traslado');
        await driver.findElement(By.css('.estimated-date-form button')).click();
        await driver.wait(until.elementLocated(By.css('[data-testid="work-order-estimated-date-success"]')), 5000);
        let saved = await fetch(`${process.env.VITE_API_URL}/workorders`).then(r => r.json());
        expect(saved.find(order => order.id === 2).estimatedDate).toBe('2026-12-20');
        const finish = await driver.findElement(By.css('[data-testid="finish-work-order"]'));
        expect(await finish.isEnabled()).toBe(false);
        for (const field of ['tasksCompleted', 'sparePartsChecked', 'diagnosisValidated', 'cleaningDone', 'finalTestDone']) {
            await checkQualityField(field);
        }
        await driver.wait(until.elementIsEnabled(finish), 5000);
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", finish);
        await finish.click();
        const deliver = await driver.wait(until.elementLocated(By.xpath("//button[.//span[text()='Entregar vehículo']]")), 5000);
        saved = await fetch(`${process.env.VITE_API_URL}/workorders`).then(r => r.json());
        expect(saved.find(order => order.id === 2).status).toBe('FINISHED');
        for (const field of ['tasksCompleted', 'sparePartsChecked', 'diagnosisValidated', 'cleaningDone', 'finalTestDone']) {
            expect(saved.find(order => order.id === 2)[field]).toBe(true);
        }
        await deliver.click();
        await driver.wait(until.stalenessOf(deliver), 5000);
        saved = await fetch(`${process.env.VITE_API_URL}/workorders`).then(r => r.json());
        expect(saved.find(order => order.id === 2).status).toBe('DELIVERED');
    }, 30000);
});
