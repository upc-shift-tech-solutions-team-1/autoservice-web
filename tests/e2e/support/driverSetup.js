import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

/**
 * Initializes and configures the Selenium WebDriver instance.
 * @returns {Promise<import('selenium-webdriver').WebDriver>}
 */
export const setupDriver = async () => {
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