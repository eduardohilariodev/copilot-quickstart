---
name: test-diagnoser
description: >
  Analyze failing test output to identify root causes and suggest minimal
  fixes without rewriting large code sections. Use when a test run produces
  failures or when diagnosing why tests fail from error output.
version: 1.0.0
portability: standalone
allowed-tools: Bash Read
---

# test-diagnoser

## Description

Analyze failing test output to identify root causes and suggest minimal fixes without rewriting large code sections.

## When to Use This Skill

This skill activates when:
- A test run produces failures
- User shares error output and asks why tests fail

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| test_output | string | yes | Full test runner output with failures |
| source_files | string | no | Relevant source files for context |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| diagnosis | markdown | Root cause analysis with classified failure type and minimal fix suggestion |
| fix_diff | string | Proposed code patch that resolves the failure (if determinable) |

## Tools Required

- File system (read source and test files)
- Test runner CLI

## Behavior

### Steps

1. Parse test output to extract:
   - Which tests failed (file, describe block, test name)
   - Error type (assertion, type, runtime, timeout)
   - Expected vs actual values
   - Stack trace pointing to failing line
2. For each failure, classify the cause:
   - **Assertion mismatch**: logic bug in code or outdated test expectation
   - **Type error**: interface changed, import broken, missing dependency
   - **Runtime error**: null access, missing env var, uncaught exception
   - **Timeout**: async not awaited, infinite loop, slow external call
   - **Flaky**: race condition, time-dependent, order-dependent
3. Read the failing test and the code it tests.
4. Propose the **minimal change** to fix:
   - If test expectation is outdated → update test
   - If code has a bug → fix the bug (show diff)
   - If mock is stale → update mock to match current interface
   - If flaky → suggest isolation strategy
5. Verify proposed fix by re-running the specific failing test.

### Constraints

- Always suggest the smallest change that fixes the issue
- Never rewrite entire test files — patch specific assertions
- Distinguish between "test is wrong" and "code is wrong"
- If uncertain, present both possibilities and let user decide

### Error Handling

- If test output is truncated: ask for full output or re-run with verbose flag
- If root cause is environmental: suggest env setup steps rather than code changes

