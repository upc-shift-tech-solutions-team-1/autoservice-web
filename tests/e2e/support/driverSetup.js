import { Builder } from 'selenium-webdriver';

/**
 * Initializes and configures the Selenium WebDriver instance.
 * @returns {Promise<import('selenium-webdriver').WebDriver>}
 */
export const setupDriver = async () => {
    // Build Chrome WebDriver instance
    const driver = await new Builder().forBrowser('chrome').build();

    // Set default implicit wait timeout (10 seconds)
    await driver.manage().setTimeouts({ implicit: 10000 });

    return driver;
};