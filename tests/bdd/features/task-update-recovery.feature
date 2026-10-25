Feature: Task update failure recovery
  As a workshop operator
  I want failed updates to preserve the current task information
  So that the application does not display changes rejected by the server

  Scenario: Server rejects starting a task awaiting approval
    Given a pending task is awaiting administrative approval
    When the server rejects the request to start the task
    Then the task remains pending with its original information
    And the server rejection message is available to the interface

  Scenario: Retry completing a task after a temporary failure
    Given an assigned task is in progress
    When the server fails to save the completion report
    Then the task remains in progress and saving is released
    When the operator retries completion and the server accepts
    Then the task is completed and submitted for administrative review
    And the completion request was sent twice without duplicating the task