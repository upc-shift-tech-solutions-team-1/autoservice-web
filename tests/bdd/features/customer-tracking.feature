Feature: Customer tracks a work order using its public tracking code
  As a customer
  I want to search for my service using its tracking code
  So that I can see its progress without seeing another customer's order

  Scenario: Customer views the public tracking summary for a valid code
    Given the customer opens the public tracking page
    When the customer submits a valid tracking code
    Then the associated order status and backend-calculated service progress are displayed
    And the estimated delivery date and service history are displayed
    And the task details and customer-facing cost breakdown are displayed
    And no payment action or payment receipt is offered
    And details from unrelated orders are not displayed

  Scenario: Customer receives clear feedback for an unknown code
    Given the customer opens the public tracking page
    When the customer submits a code that does not exist
    Then the page displays the tracking code not found message
    And no order details are displayed
