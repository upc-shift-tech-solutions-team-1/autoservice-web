import { Builder, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// Re-locate elements replaced by Vue while asynchronous data arrives.
export const interactWhenReady = (driver, locator, action) => driver.wait(async () => {
    try {
        const element = await driver.findElement(locator);
        if (!(await element.isDisplayed()) || !(await element.isEnabled())) return false;
        await action(element);
        return true;
    } catch (error) {
        if (['StaleElementReferenceError', 'ElementClickInterceptedError', 'NoSuchElementError'].includes(error.name)) return false;
        throw error;
    }
}, 10000);

export const clickWhenReady = (driver, locator) => interactWhenReady(driver, locator, element => element.click());
export const clearWhenReady = (driver, locator) => interactWhenReady(driver, locator,
    element => element.sendKeys(Key.CONTROL, 'a', Key.NULL, Key.BACK_SPACE));

/**
 * Initializes and configures the Selenium WebDriver instance.
 * @returns {Promise<import('selenium-webdriver').WebDriver>}
 */
export const setupDriver = async () => {
    if (process.env.VITE_API_URL !== 'http://127.0.0.1:4001/api/v1') {
        throw new Error('Selenium requires the isolated local mock API; production writes are forbidden.');
    }
    const identity = await fetch('http://127.0.0.1:4001/health').then(response => response.json());
    if (identity.environment !== 'e2e-mock') throw new Error('Unexpected E2E API environment');
    // Configuramos opciones de Chrome
    const options = new chrome.Options();
    
    // Si estamos en entorno de CI (como GitHub Actions), ejecutamos en modo headless (sin interfaz gráfica)
    if (process.env.CI) {
        options.addArguments('--headless=new');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
    }

    // Build Chrome WebDriver instance
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    // Set default implicit wait timeout (10 seconds)
    await driver.manage().setTimeouts({ implicit: 10000 });

    return driver;
};
