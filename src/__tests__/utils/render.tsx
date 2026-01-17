import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Create a mock Convex client for testing
// In real tests, you may want to use convex-test for more realistic mocking
const mockConvexClient = {
  // Minimal mock - extend as needed for your tests
} as unknown as ConvexReactClient;

interface WrapperProps {
  children: ReactNode;
}

/**
 * Custom render function that wraps components in necessary providers.
 * Use this instead of @testing-library/react's render for components
 * that depend on Convex or other app-level context.
 */
function AllProviders({ children }: WrapperProps) {
  return <ConvexProvider client={mockConvexClient}>{children}</ConvexProvider>;
}

/**
 * Render a React component with all app providers.
 *
 * @example
 * ```tsx
 * import { renderWithProviders, screen } from "@/__tests__/utils/render";
 *
 * test("renders component", () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText("Hello")).toBeInTheDocument();
 * });
 * ```
 */
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { renderWithProviders };
