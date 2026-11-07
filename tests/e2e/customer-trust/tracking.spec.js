import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { By } from 'selenium-webdriver';
import { setupDriver } from '../support/driverSetup';

describe('Anonymous customer tracking', () => {
    let driver;

    // Presence in the DOM does not imply that Vue's entrance animation
    // has finished or that Selenium can read the rendered text yet.
    const visibleText = (selector, expected) => driver.wait(async () => {
        try {
            const element = await driver.findElement(By.css(selector));
            if (!(await element.isDisplayed())) return false;
            await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", element);
            const text = await element.getText();
            return text.includes(expected) ? text : false;
        } catch (error) {
            if (['StaleElementReferenceError', 'NoSuchElementError'].includes(error.name)) return false;
            throw error;
        }
    }, 10000, `Expected visible text "${expected}" in ${selector}`);

    beforeAll(async () => { driver = await setupDriver(); }, 30000);
    afterAll(async () => { if (driver) await driver.quit(); });

    it('shows the public dates, delay reason, principal mechanic and backend total without login', async () => {
        await driver.get('http://localhost:5173/tracking');
        await driver.findElement(By.css('.search-form-layout input')).sendKeys('E2E-WO-001');
        await driver.findElement(By.css('.search-btn')).click();
        expect(await visibleText('[data-testid="tracking-delay-reason"]', 'Repuesto en traslado')).toContain('Repuesto en traslado');
        expect(await visibleText('[data-testid="tracking-primary-mechanic-name"]', 'Luis Mendoza')).toContain('Luis Mendoza');
        expect(await visibleText('[data-testid="tracking-cost-total"]', '150')).toContain('150');
        expect(await driver.getCurrentUrl()).toContain('/tracking');
    }, 30000);

    it('keeps an unknown code on the search page without revealing an order', async () => {
        await driver.get('http://localhost:5173/tracking');
        await driver.findElement(By.css('.search-form-layout input')).sendKeys('UNKNOWN-E2E');
        await driver.findElement(By.css('.search-btn')).click();
        expect(await visibleText('.search-card .p-message', 'No se encontró')).toContain('No se encontró');
        expect(await driver.findElements(By.css('.status-card'))).toHaveLength(0);
    }, 30000);
});
