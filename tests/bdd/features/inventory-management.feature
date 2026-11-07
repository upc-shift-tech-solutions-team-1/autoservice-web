Feature: Inventory Management and Stock Replenishment
  As a workshop warehouse manager
  I want to register spare parts, calculate financial margins, and replenish stock from suppliers
  So that the workshop always has profitable and available parts for vehicle maintenance

  Scenario: Register a new spare part in the inventory catalog
    Given the inventory system is initialized
    When a warehouse manager registers a new part with name "Pastillas de Freno Brembo", purchase price 80, and sale price 140
    Then the part is added to the inventory catalog
    And the unit profit is calculated as 60 and margin percentage is calculated as 42.86 percent

  Scenario: Replenish stock through provider receipt
    Given an inventory item "Filtro de Aire" exists with current stock 4 and min stock 5
    When a provider delivery is received with quantity 10 and invoice "FAC-9912"
    Then the item physical stock increases to 14
    And the item stock status is updated to available
