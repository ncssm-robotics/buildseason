---
name: testing-guide
description: >-
  Testing patterns with Vitest and Bun test runner.
  Use when writing tests, setting up test fixtures,
  deciding what to test, or debugging test failures.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bun:*)
---

# Testing Guide

Testing philosophy and patterns for BuildSeason.

## Philosophy

- **Test behavior, not implementation** - Verify what code does, not how
- **Fast feedback** - Unit tests in milliseconds, integration in seconds
- **Realistic data** - Use factories for realistic fixtures
- **Isolated tests** - Each test independent and repeatable

## Test Structure

```
src/
├── __tests__/           # Test utilities and setup
│   ├── setup.ts         # Global test setup
│   └── utils/           # Test helpers
│       ├── index.ts     # Exports
│       └── render.tsx   # React testing utilities
├── lib/
│   └── utils.test.ts    # Unit tests next to source
└── components/
    └── ui/
        └── button.test.tsx

convex/
├── lib/
│   └── permissions.test.ts  # Convex helper tests
└── vendors.test.ts          # Integration patterns
```

## Running Tests

```bash
bun run test             # Run tests in watch mode
bun run test:run         # Run all tests once
bun run test:coverage    # Run with coverage report
```

## Writing Tests

### Unit tests for pure functions

```typescript
import { describe, it, expect } from "vitest";
import { formatCurrency } from "./utils";

describe("formatCurrency", () => {
  it("formats cents to dollars", () => {
    expect(formatCurrency(1234)).toBe("$12.34");
  });
});
```

### React component tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("handles click events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Convex function testing

For Convex, we test in layers:

1. **Pure logic tests** - Extract and test business logic

```typescript
// convex/lib/permissions.test.ts
import { describe, it, expect } from "vitest";
import { hasRole } from "./permissions";

describe("hasRole", () => {
  it("admin has all roles", () => {
    expect(hasRole("admin", "student")).toBe(true);
  });
});
```

2. **API contract tests** - Document expected function signatures

```typescript
// convex/vendors.test.ts
describe("API contract", () => {
  it("create vendor requires teamId and name", () => {
    type CreateVendorArgs = {
      teamId: string;
      name: string;
      website?: string;
    };
    // Type checking ensures contract is maintained
    const args: CreateVendorArgs = {
      teamId: "team-123",
      name: "Test Vendor",
    };
    expect(args.teamId).toBeDefined();
  });
});
```

3. **Integration tests** - Use `convex-test` for full E2E testing (optional)

## What to Test

| Layer          | What to Test              | Example                           |
| -------------- | ------------------------- | --------------------------------- |
| Utils          | Pure functions            | `formatCurrency(1234)` → `$12.34` |
| Components     | Rendering, interactions   | Button click handler called       |
| Hooks          | State changes, effects    | useAuth returns user              |
| Convex helpers | Permission logic, helpers | `hasRole("admin", "student")`     |
| Convex funcs   | Contract, edge cases      | Required args, error conditions   |

## What NOT to Test

- shadcn/ui component internals
- Convex Auth internals
- Convex database internals
- Third-party API behavior
- Generated code (`routeTree.gen.ts`, `convex/_generated/`)

## Test Utilities

### Custom render with providers

```typescript
import { renderWithProviders, screen } from "@/__tests__/utils";

test("component with Convex", () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

### Global setup

`src/__tests__/setup.ts` provides:

- Jest DOM matchers (`toBeInTheDocument`, etc.)
- `window.matchMedia` mock
- `ResizeObserver` mock

## Anti-Patterns

- **Testing implementation details** - Don't test private functions
- **Brittle assertions** - Don't assert on exact error messages
- **Missing edge cases** - Test empty arrays, nulls, boundaries
- **Slow tests** - Mock external services
- **Testing Convex internals** - Trust the framework, test your logic
