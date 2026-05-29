/**
 * Shared render + mock utilities for Toss Mini App tests.
 *
 * Usage:
 *   import { renderWithRouter, mockAppState } from "@/__tests__/__helpers__/test-utils";
 *
 *   it("renders home page", () => {
 *     renderWithRouter(<Home />);
 *   });
 */

import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { vi } from "vitest";

// ── Render with MemoryRouter ──
export function renderWithRouter(
  ui: ReactElement,
  routerOptions?: MemoryRouterProps,
  renderOptions?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) =>
      React.createElement(MemoryRouter, routerOptions, children),
    ...renderOptions,
  });
}

// ── AppStore / AppState mock factory ──
// Projects use either @/state/AppStateContext or @/lib/store/AppStore — try both.
// If the project's actual path differs, override with vi.mock in the test file.
export function mockAppState(overrides: Partial<AppStateMock> = {}) {
  const defaultState: AppStateMock = {
    input: {},
    applyPreset: vi.fn(),
    updateField: vi.fn(),
    setInput: vi.fn(),
    reset: vi.fn(),
    isLoading: false,
    error: null,
    ...overrides,
  };

  // Mock both common paths — whichever the project uses will be picked up
  vi.mock("@/state/AppStateContext", () => ({
    useAppState: () => defaultState,
    AppStateProvider: ({ children }: { children: React.ReactNode }) => children,
  }));

  vi.mock("@/lib/store/AppStore", () => ({
    useAppStore: () => defaultState,
    AppStoreProvider: ({ children }: { children: React.ReactNode }) => children,
  }));

  return defaultState;
}

export interface AppStateMock {
  input: Record<string, unknown>;
  applyPreset: ReturnType<typeof vi.fn>;
  updateField: ReturnType<typeof vi.fn>;
  setInput: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  isLoading: boolean;
  error: string | null;
}

// ── Fake timers helper for rAF-driven code (animations, countups) ──
export async function advanceTimers(ms: number) {
  vi.useFakeTimers();
  vi.advanceTimersByTime(ms);
  await vi.runAllTimersAsync();
  vi.useRealTimers();
}

// ── localStorage seeding helper ──
export function seedLocalStorage(entries: Record<string, unknown>) {
  for (const [key, value] of Object.entries(entries)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// ── fetch mock helper ──
export function mockFetchOnce(response: unknown, options?: { status?: number; ok?: boolean }) {
  const fetchMock = vi.fn().mockResolvedValueOnce({
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => response,
    text: async () => (typeof response === "string" ? response : JSON.stringify(response)),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}
