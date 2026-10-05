# Customer tracking system test

These Selenium/TestNG tests exercise the customer tracking page against a running web app connected to the backend version that exposes the public tracking summary.

Set these environment variables before running the test:

- `VITE_API_URL`: API base URL used by Vite (for local verification, `http://localhost:5024/api/v1`).
- `TRACKING_BASE_URL`: base URL of the web application, without `/tracking` (for example, `http://localhost:5173`).
- `TRACKING_VALID_CODE`: a test tracking code that returns an order in the configured backend.

Run from the repository root with:

```bash
mvn -f tests/system/pom.xml test
```

The tests cover both customer flows on `/tracking`:

- A configured valid code displays its matching status, backend-calculated progress, estimated date, task details, cost breakdown, and stage history, without payment actions or a payment receipt.
- A generated unknown code displays the not-found message and no order details.

The valid-code scenario requires a test code in a local backend that includes `GET /api/v1/tracking/summary`. Start the backend on port `5024`, then start the web app on port `5173` with `VITE_API_URL` set to the local API base URL. The tests require Java 17, Maven, and Chrome. Selenium Manager resolves the matching ChromeDriver when they run.
