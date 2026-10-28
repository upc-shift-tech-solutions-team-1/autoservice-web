Feature: Fleet Management and Vehicle Tracking
  As a workshop administrator
  I want to register, query, and track vehicles in the fleet
  So that customer vehicles are accurately managed throughout their workshop lifecycle

  Scenario: Register a new vehicle in the fleet
    Given the fleet management system is initialized
    When an administrator registers a vehicle with plate "ABC-1234", brand "Toyota", model "Corolla", year "2023", and customer id 10
    Then the vehicle is added to the fleet
    And the vehicle has plate "ABC-1234" and brand "Toyota"

  Scenario: Filter and query vehicles by workshop status
    Given the workshop has vehicles with statuses "IN_WORKSHOP", "READY", and "DELIVERED"
    When an administrator queries the vehicles in the fleet
    Then the fleet contains 3 vehicles
    And the vehicle with plate "DEF-5678" has status "READY"

  Scenario: Update vehicle details in the fleet
    Given a vehicle with id 1 exists in the fleet with plate "ABC-1234" and status "IN_WORKSHOP"
    When the vehicle status is updated to "READY"
    Then the vehicle status in the fleet is "READY"
