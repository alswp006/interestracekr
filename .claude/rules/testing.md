# Testing Rules

## Basics
- Use vitest with jsdom environment
- Use @testing-library/react for component tests
- Test files in `src/__tests__/packet-{id}.test.ts`
- Run: `npx vitest run` (single run)
- Use `@/` alias for imports
- Test business logic and utility functions
- 3-5 focused tests covering happy path + edge cases
- Coverage not required for mini apps

## Setup (automatic)
`vitest.setup.ts` is auto-loaded before every test and provides:
- `localStorage.clear()` + `sessionStorage.clear()` in `beforeEach` (test isolation)
- `requestAnimationFrame` shim (jsdom doesn't have it natively)
- `vi.clearAllMocks()` + `vi.useRealTimers()` in `afterEach`

You do NOT need to add these yourself.

## MANDATORY: Use shared helpers (avoid mock duplication)

The template ships with shared helpers at `src/__tests__/__helpers__/`. Use them.

### Typical page test pattern
```typescript
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter, mockAppState } from "@/__tests__/__helpers__/test-utils";
import HomePage from "@/pages/Home";

mockAll();              // mocks TDS, @apps-in-toss, TossRewardAd, react-router
mockAppState({ input: { salary: 50000000 } });  // override as needed

describe("Home page", () => {
  it("AC-1: displays salary input", () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByLabelText(/연봉/)).toBeInTheDocument();
  });

  it("AC-2: navigates to result on calculate click", async () => {
    renderWithRouter(<HomePage />);
    screen.getByRole("button", { name: /계산/ }).click();
    expect(mockNavigate).toHaveBeenCalledWith("/result");
  });
});
```

### Typical pure function test pattern
```typescript
import { describe, it, expect } from "vitest";
import { convertToHourly } from "@/lib/calc";

describe("convertToHourly", () => {
  it("converts annual salary to hourly wage", () => {
    expect(convertToHourly(52000000, 40, 52)).toBe(25000);
  });

  it("returns 0 for invalid input", () => {
    expect(convertToHourly(0, 40, 52)).toBe(0);
  });
});
```

### Helper API reference

**`mocks.ts`** — pre-configured vi.mock() calls
- `mockTds()` — @toss/tds-mobile lightweight stand-ins
- `mockAppsInToss()` — @apps-in-toss/web-framework (generateHapticFeedback, useTossLogin, useTossAd, useTossPromotion, setItem/getItem, useTossPayment)
- `mockTossRewardAd()` — renders children directly (no ad gate in tests)
- `mockRouter()` — preserves actual router, stubs useNavigate/useLocation
- `mockAll()` — calls all of the above
- Exports: `mockNavigate`, `mockLocation`

**`test-utils.ts`** — runtime helpers
- `renderWithRouter(ui, routerOptions?, renderOptions?)` — wraps in MemoryRouter
- `mockAppState(overrides?)` — mocks both `@/state/AppStateContext` and `@/lib/store/AppStore`
- `advanceTimers(ms)` — for rAF/setTimeout-driven animations
- `seedLocalStorage(entries)` — pre-populate storage for a test
- `mockFetchOnce(response, options?)` — mock a single fetch call

## Testing specific scenarios

### RouteState (`location.state`) handling
When a page uses `location.state`, test BOTH cases:
```typescript
// Case 1: state exists (navigated from previous page)
renderWithRouter(<ResultPage />, {
  initialEntries: [{ pathname: "/result", state: { salary: 50000000 } }],
});

// Case 2: state is null (direct URL access, browser back+refresh)
renderWithRouter(<ResultPage />, {
  initialEntries: ["/result"],  // no state
});
// → page should redirect or render default state, never crash
```

### localStorage eviction (100-item limit, etc.)
```typescript
import { seedLocalStorage } from "@/__tests__/__helpers__/test-utils";

it("evicts oldest when exceeding 100 items", () => {
  // Seed 100 items
  const items = Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` }));
  seedLocalStorage({ calcs: items });

  // Add one more
  addCalc({ id: 100, value: "new" });

  const stored = JSON.parse(localStorage.getItem("calcs") ?? "[]");
  expect(stored.length).toBe(100);
  expect(stored[0].id).toBe(1);  // oldest (id=0) evicted
  expect(stored[99].id).toBe(100); // newest kept
});
```

### Animations / requestAnimationFrame
rAF is shimmed in `vitest.setup.ts`. For fine-grained control:
```typescript
import { advanceTimers } from "@/__tests__/__helpers__/test-utils";

it("animates count-up over 500ms", async () => {
  const updates: number[] = [];
  animateCountUp(0, 100, 500, (v) => updates.push(v));
  await advanceTimers(500);
  expect(updates.length).toBeGreaterThanOrEqual(3);
  expect(updates[updates.length - 1]).toBe(100);
});
```

### Codec / parser roundtrip
Any encode/decode pair MUST have both roundtrip and malformed-input tests:
```typescript
it("encode/decode roundtrip", () => {
  const data = { salary: 50000000, hours: 40 };
  expect(decode(encode(data))).toEqual(data);
});

it("decode handles malformed input without throwing", () => {
  expect(decode("not-base64-!@#")).toBeNull();  // or returns default
});
```

### AI 고지 (생성형 AI 사용 고지)
If the packet uses AI features (recommend, analyze, generate):
```typescript
it("displays AI notice on first use", () => {
  renderWithRouter(<ScanPage />);
  expect(screen.getByRole("alertdialog", { name: /AI/ })).toBeInTheDocument();
});

it("shows AI-generated label on results", () => {
  renderWithRouter(<ResultPage />, { initialEntries: [{ pathname: "/result", state: { ai: true } }] });
  expect(screen.getByText(/AI가 생성한/)).toBeInTheDocument();
});
```

## Legacy direct mocks (if you can't use helpers)

If you must mock inline (e.g., custom TDS component not covered):

### react-router-dom
```typescript
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
```

### TDS mock (use `mockTds()` helper instead)
See `src/__tests__/__helpers__/mocks.ts` for the full canonical version.

### AppState
The project uses one of these paths — check your actual file:
- `@/state/AppStateContext` → `useAppState()`
- `@/lib/store/AppStore` → `useAppStore()`

`mockAppState()` mocks both at once. If neither works, grep for the actual path:
```bash
grep -r "useAppState\|useAppStore" src/ --include="*.tsx"
```
