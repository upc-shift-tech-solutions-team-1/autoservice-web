/**
 * @file bdd-runner.js
 * @description Lightweight Gherkin parser and Step Definition runner for Vitest.
 * Executes BDD .feature specifications against domain logic, Pinia stores, and Vue components.
 */

import fs from 'node:fs';
import { describe, test, expect } from 'vitest';

/**
 * Parses a Gherkin .feature file into an AST of feature and scenarios.
 *
 * @param {string} filePath - Absolute or relative path to the .feature file.
 * @returns {{ title: string, description: string, scenarios: Array<{ title: string, steps: Array<{ keyword: string, text: string, raw: string, line: number }> }> }}
 */
export function parseFeatureFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  let featureTitle = '';
  let featureDescription = [];
  const scenarios = [];
  let currentScenario = null;
  let inFeatureHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    const lineNumber = i + 1;

    // Skip empty lines and comment lines
    if (!line || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('Feature:')) {
      featureTitle = line.replace('Feature:', '').trim();
      inFeatureHeader = true;
      continue;
    }

    if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
      inFeatureHeader = false;
      currentScenario = {
        title: line.replace(/^(Scenario:|Scenario Outline:)/, '').trim(),
        steps: []
      };
      scenarios.push(currentScenario);
      continue;
    }

    const stepMatch = line.match(/^(Given|When|Then|And|But)\s+(.*)$/);
    if (stepMatch && currentScenario) {
      currentScenario.steps.push({
        keyword: stepMatch[1],
        text: stepMatch[2].trim(),
        raw: line,
        line: lineNumber
      });
      continue;
    }

    if (inFeatureHeader) {
      featureDescription.push(line);
    }
  }

  return {
    title: featureTitle,
    description: featureDescription.join('\n'),
    scenarios
  };
}

/**
 * Converts a Cucumber-like expression into a RegExp.
 * E.g., 'an active work order has {int} registered tasks'
 * -> /^an active work order has (\d+) registered tasks$/
 *
 * @param {string|RegExp} pattern
 * @returns {RegExp}
 */
function toRegExp(pattern) {
  if (pattern instanceof RegExp) {
    return pattern;
  }

  // Escape special regex characters except for cucumber placeholder patterns
  let regexStr = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\{string\\\}/g, '"([^"]*)"')
    .replace(/\\\{int\\\}/g, '(-?\\d+)')
    .replace(/\\\{float\\\}/g, '(-?\\d+(?:\\.\\d+)?)')
    .replace(/\\\{word\\\}/g, '(\\w+)');

  return new RegExp(`^${regexStr}$`, 'i');
}

/**
 * Creates a BDD execution suite for a feature file.
 *
 * @returns {{
 *   Given: (pattern: string|RegExp, fn: Function) => void,
 *   When: (pattern: string|RegExp, fn: Function) => void,
 *   Then: (pattern: string|RegExp, fn: Function) => void,
 *   And: (pattern: string|RegExp, fn: Function) => void,
 *   runFeature: (featureFilePath: string, options?: { beforeEach?: Function, afterEach?: Function }) => void
 * }}
 */
export function createBddSuite() {
  const stepDefinitions = [];

  const registerStep = (keyword, pattern, fn) => {
    stepDefinitions.push({
      keyword,
      pattern: toRegExp(pattern),
      rawPattern: pattern,
      fn
    });
  };

  const Given = (pattern, fn) => registerStep('Given', pattern, fn);
  const When = (pattern, fn) => registerStep('When', pattern, fn);
  const Then = (pattern, fn) => registerStep('Then', pattern, fn);
  const And = (pattern, fn) => registerStep('And', pattern, fn);

  const findMatchingStep = (stepText) => {
    for (const stepDef of stepDefinitions) {
      const match = stepText.match(stepDef.pattern);
      if (match) {
        // Parse captured groups: numbers to int/float if appropriate
        const args = match.slice(1).map(arg => {
          if (/^-?\d+$/.test(arg)) return parseInt(arg, 10);
          if (/^-?\d+\.\d+$/.test(arg)) return parseFloat(arg);
          return arg;
        });
        return { stepDef, args };
      }
    }
    return null;
  };

  const runFeature = (featureFilePath, options = {}) => {
    const feature = parseFeatureFile(featureFilePath);

    describe(`Feature: ${feature.title}`, () => {
      for (const scenario of feature.scenarios) {
        test(`Scenario: ${scenario.title}`, async () => {
          if (options.beforeEach) {
            await options.beforeEach();
          }

          const context = {};

          for (const step of scenario.steps) {
            const match = findMatchingStep(step.text);
            if (!match) {
              throw new Error(
                `Undefined BDD Step at line ${step.line}: "${step.keyword} ${step.text}" in scenario "${scenario.title}"`
              );
            }

            try {
              await match.stepDef.fn(context, ...match.args);
            } catch (err) {
              const enhancedError = new Error(
                `Step failed: [${step.keyword} ${step.text}] (Line ${step.line})\nError: ${err.message}`
              );
              enhancedError.stack = err.stack;
              throw enhancedError;
            }
          }

          if (options.afterEach) {
            await options.afterEach(context);
          }
        });
      }
    });
  };

  return {
    Given,
    When,
    Then,
    And,
    runFeature
  };
}
