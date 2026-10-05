package system;

import java.time.Duration;
import java.util.UUID;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class CustomerTrackingSystemTest {
    private WebDriver driver;
    private String baseUrl;

    @BeforeMethod
    public void setUp() {
        baseUrl = requiredEnvironmentVariable("TRACKING_BASE_URL").replaceAll("/+$", "");
        driver = new ChromeDriver();
    }

    @AfterMethod(alwaysRun = true)
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void customerCanViewProgressForTheirTrackingCode() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
        String trackingCode = requiredEnvironmentVariable("TRACKING_VALID_CODE");

        driver.get(baseUrl + "/tracking");

        WebElement trackingInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector(".search-form-layout input")));
        trackingInput.sendKeys(trackingCode);
        driver.findElement(By.cssSelector(".search-btn")).click();

        WebElement statusCard = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".status-card")));
        WebElement progress = driver.findElement(By.cssSelector("[data-testid='tracking-progress-value']"));
        WebElement estimatedDate = driver.findElement(By.cssSelector("[data-testid='tracking-estimated-date']"));
        WebElement history = driver.findElement(By.cssSelector("[data-testid='tracking-history']"));
        WebElement costs = driver.findElement(By.cssSelector("[data-testid='tracking-costs']"));
        WebElement tasksCard = driver.findElement(By.cssSelector(".tasks-card"));

        Assert.assertFalse(statusCard.getText().isBlank(), "The order status should be visible.");
        Assert.assertTrue(progress.isDisplayed(), "The backend progress percentage should be visible.");
        Assert.assertTrue(progress.getText().matches("\\d+(\\.\\d+)?%"),
                "The displayed progress should be a percentage from the tracking summary.");
        Assert.assertTrue(estimatedDate.isDisplayed(), "The estimated delivery date should be visible.");
        Assert.assertFalse(estimatedDate.getText().isBlank(), "The estimated date label should have a value or fallback.");
        Assert.assertTrue(history.isDisplayed(), "The history timeline or its empty state should be visible.");
        Assert.assertTrue(costs.isDisplayed(), "The labor and materials cost breakdown should be visible.");
        Assert.assertTrue(tasksCard.isDisplayed(), "The order's service tasks should be visible.");
        Assert.assertTrue(driver.findElements(By.cssSelector(".payment-dialog, .payment-trigger-btn, .only-print")).isEmpty(),
                "The tracking page should not offer simulated payment or a payment receipt.");
        Assert.assertTrue(driver.findElements(By.cssSelector(".search-card")).isEmpty(),
                "The search form should be replaced by the matching order details.");
    }

    @Test
    public void customerReceivesNotFoundMessageForUnknownTrackingCode() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
        String unknownTrackingCode = "UNKNOWN-" + UUID.randomUUID();

        driver.get(baseUrl + "/tracking");

        WebElement trackingInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector(".search-form-layout input")));
        trackingInput.sendKeys(unknownTrackingCode);
        driver.findElement(By.cssSelector(".search-btn")).click();

        WebElement errorMessage = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector(".search-card .p-message")));
        Assert.assertTrue(errorMessage.getText().contains("No se encontró ninguna orden con este código"),
                "The page should explain that the tracking code was not found.");
        Assert.assertTrue(driver.findElement(By.cssSelector(".search-card")).isDisplayed(),
                "The tracking search should remain available after an unknown code.");
        Assert.assertTrue(driver.findElements(By.cssSelector(".status-card, .history-card, .tasks-card, [data-testid='tracking-costs']")).isEmpty(),
                "Order details should not be displayed for an unknown tracking code.");
    }

    private String requiredEnvironmentVariable(String name) {
        String value = System.getenv(name);
        Assert.assertNotNull(value, "Set the " + name + " environment variable before running this test.");
        Assert.assertFalse(value.isBlank(), "The " + name + " environment variable cannot be blank.");
        return value;
    }
}
