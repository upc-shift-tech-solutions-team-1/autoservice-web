Feature: Workshop operations and task management
  As a workshop administrator or mechanic
  I want to coordinate work orders, register verifiable tasks, and validate repairs
  So that the workshop maintains operational traceability and quality control

  # Based on US-24 (EP-05): Registrar tareas de mantenimiento verificables
  Scenario: Register a verifiable maintenance task for an active work order
    Given an active work order exists in the workshop
    When an administrator registers a new maintenance task with description "Cambio de pastillas de freno", mechanic id 10, and estimated time 60
    Then the task is associated with the work order
    And the task is saved with assigned mechanic 10 and estimated time 60 minutes
    And the task initial status is "PENDING"

  # Based on US-25 (EP-05): Consultar orden de trabajo con progreso de tareas
  Scenario: Consult work order with calculated task progress
    Given an active work order has 2 registered tasks
    When 1 of the 2 tasks is marked as completed
    Then the work order progress displays 50 percent
    And the work order displays 1 completed task out of 2 total tasks

  # Based on US-28 (EP-05): Validar reparación antes de entrega
  Scenario: Validate repair and quality checklist before vehicle delivery
    Given a work order has all its assigned tasks completed
    When the administrator completes the QA checklist with tasks completed, spare parts checked, diagnosis validated, cleaning done, and final test done
    Then the work order quality checklist is verified
    And the work order status is updated to "DELIVERED"

  # Based on WorkOrderTaskLifecycle / US-24: Regla de control de tareas no aprobadas
  Scenario: Unapproved task proposal cannot be started
    Given an active work order exists
    And a task proposal has admin review status "SUBMITTED" and is pending approval
    When an attempt is made to start the unapproved task
    Then the request is rejected and the task status remains "PENDING"
