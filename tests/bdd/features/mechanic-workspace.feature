Feature: Mechanic workspace and technical diagnosis execution
  As a mechanic
  I want to register vehicle technical diagnoses, consult my assigned tasks, and update their progress
  So that repairs are properly documented and synchronized with the workshop in real time

  # Based on US-23 (EP-05): Registrar diagnóstico técnico del vehículo
  Scenario: Register vehicle technical diagnosis and propose maintenance tasks
    Given a work order is assigned to mechanic 10 for technical inspection
    When the mechanic registers a technical diagnosis "Desgaste severo en pastillas y fuga leve en amortiguador"
    Then the diagnosis is recorded for the work order
    And the mechanic proposes a task linked to the diagnosis with priority "HIGH"

  # Based on US-32 (EP-06): Consultar y actualizar tareas asignadas desde workspace
  Scenario: Mechanic consults assigned tasks and starts execution
    Given the mechanic with id 10 has assigned tasks in the workspace
    When the mechanic accesses the workspace and starts the assigned task
    Then the task status changes to "IN_PROGRESS"
    And the task remains associated with the same work order and vehicle

  # Based on US-32 (EP-06) & EP-05: Completar tarea con observaciones técnicas
  Scenario: Mechanic completes an in-progress task with technical observations
    Given an approved task is in progress by mechanic 10
    When the mechanic marks the task as completed with observation "Discos rectificados y pastillas cerámicas instaladas"
    Then the task status is updated to "COMPLETED"
    And the completed task reflects the observation and completion timestamp
