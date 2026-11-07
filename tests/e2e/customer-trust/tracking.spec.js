import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { By, until } from 'selenium-webdriver';
import { setupDriver } from '../support/driverSetup';

describe('Anonymous customer tracking', () => {
    let driver;
    beforeAll(async () => { driver = await setupDriver(); }, 30000);
    afterAll(async () => { if (driver) await driver.quit(); });

    it('shows the public dates, delay reason, principal mechanic and backend total without login', async () => {
        await driver.get('http://localhost:5173/tracking');
        await driver.findElement(By.css('.search-form-layout input')).sendKeys('E2E-WO-001');
        await driver.findElement(By.css('.search-btn')).click();
        const reason = await driver.wait(until.elementLocated(By.css('[data-testid="tracking-delay-reason"]')), 10000);
        expect(await reason.getText()).toContain('Repuesto en traslado');
        expect(await driver.findElement(By.css('[data-testid="tracking-primary-mechanic-name"]')).getText()).toContain('Luis Mendoza');
        expect(await driver.findElement(By.css('[data-testid="tracking-cost-total"]')).getText()).toContain('150');
        expect(await driver.getCurrentUrl()).toContain('/tracking');
    }, 30000);

    it('keeps an unknown code on the search page without revealing an order', async () => {
        await driver.get('http://localhost:5173/tracking');
        await driver.findElement(By.css('.search-form-layout input')).sendKeys('UNKNOWN-E2E');
        await driver.findElement(By.css('.search-btn')).click();
        const message = await driver.wait(until.elementLocated(By.css('.search-card .p-message')), 10000);
        await driver.wait(until.elementIsVisible(message), 5000);
        await driver.wait(until.elementTextContains(message, 'No se encontró'), 5000);
        expect(await message.getText()).toContain('No se encontró');
        expect(await driver.findElements(By.css('.status-card'))).toHaveLength(0);
    }, 30000);
});
