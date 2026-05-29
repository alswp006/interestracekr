## Task: ErrorBoundary(흰 화면 방지)
런타임 예외로 흰 화면이 되는 것을 막기 위해 ErrorBoundary 컴포넌트를 추가한다. 에러 발생 시에도 외부 이동/로그인 유도 없이, TDS Paragraph.Text와 Button으로 재시도(페이지 새로고침이 아닌 상태 리셋 콜백) UI를 제공한다. console.error 출력은 추가하지 않는다.

## Acceptance Criteria


## Definition of Done


## Files to create/modify
src/lib/ErrorBoundary.tsx

## UX Quality (TDS 준수하며 품질 향상)
- .impeccable.md가 있으면 읽어서 사용자/브랜드 컨텍스트 파악 (TDS 미적 방향은 고정)
- 모든 비동기 작업에 로딩 상태 필수 (TDS 컴포넌트 활용)
- 모든 fetch에 에러 상태 필수 (AlertDialog 또는 인라인 에러 메시지)
- 목록이 비어있을 때 빈 상태 UI 필수 (아이콘 + 안내 문구 + CTA)
- Progressive Disclosure: 복잡한 정보는 단계적으로 공개, 첫 화면은 핵심만
- 터치 타겟 44px 이상 (TDS Button/ListRow는 기본 충족, 커스텀 요소 주의)
- 사용자 입력 텍스트는 오버플로 대비 (Paragraph.Text에 말줄임 또는 줄 제한)
- 금지: .claude/skills/ 폴더 내 스킬 파일 참조, Tailwind 클래스 추가, TDS 외 컴포넌트

IMPORTANT: Read `.ai-factory/shared-context.md` for shared types, existing codebase exports, and already-implemented packets. Do NOT duplicate what's listed there.

## BEFORE writing code (앱인토스 — 순서 엄수)
1. Read CLAUDE.md for ALL project rules (TDD protocol, code quality, verification gates, TDS rules)
2. Read `.ai-factory/tds-reference.txt` — 토스 공식 TDS LLM 문서 (컴포넌트 API/props 정확한 사용법)
3. Read `.ai-factory/tds-patterns.md` — 출시 미니앱 기반 8개 골든 패턴 (PageShell, Top+우측액션, FixedBottomCTA 등). 새 페이지는 가장 가까운 패턴을 변형하세요.
4. 이 패킷의 AC/DoD/UI 요구사항은 아래 프롬프트에 포함됨 — spec.md 전체를 읽을 필요 없음
5. If `.ai-factory/shared-context.md` exists, read it for shared types and existing codebase exports
6. Use Glob (`src/**/*.tsx`, `src/lib/**/*.ts`) to enumerate existing files BEFORE creating new ones — never assume a file doesn't exist
7. Use Grep (e.g. `"export function useXyz"`, `"<MyComponent"`) to check if a hook/component already exists. 추측 금지 — 검색 후 결정
8. Check existing files in src/lib/, src/hooks/, src/components/, src/pages/ — do NOT recreate
9. If `.ai-factory/sprint-contract.md` exists, read it — 이 패킷의 계약서 (만들 항목 + 검증 방법 + 금지 사항)
10. @apps-in-toss/web-framework는 imperative API만 제공: useTossLogin/useTossAd/useTossPayment 같은 훅은 SDK에 없음. 광고는 TossAds.attachBanner 또는 loadFullScreenAd, 결제는 createOneTimePurchaseOrder 직접 호출

CRITICAL: CLAUDE.md contains the TDD protocol, code quality rules, and verification gates — follow them strictly.
The test file `src/__tests__/packet-0000.test.ts` has been pre-written. Make ALL tests pass.

## TDS 핵심 규칙 (반드시 준수)
TDS 핵심 규칙 — 실제 @toss/tds-mobile@2.3.0 .d.ts에서 검증됨 (2026-04 갱신)
위반 시 tsc 에러 발생. 이 파일의 API가 다른 문서와 충돌하면 이 파일이 우선.

📘 새 페이지 작성 시: tds-patterns.md를 먼저 확인 (실제 출시 미니앱 기반 8개 골든 패턴).
   - PageShell, Top+우측액션, StatusPanel, 라디오 다이얼로그,
     인터랙티브 그리드(햅틱), FixedBottomCTA, Portal 오버레이, 버튼 스택
   가까운 패턴이 있으면 새로 만들지 말고 그것을 변형하세요.

=== 스타일 규칙 ===
1. style={{}}에 margin/padding/fontSize/fontWeight 사용 금지 → TDS 컴포넌트 내장 스타일 사용
2. HEX 색상 하드코딩 금지 → var(--tds-color-*) 또는 var(--adaptive*) CSS 변수 사용
3. 커스텀 CSS는 flex/grid 레이아웃에만 허용 (외부 컨테이너 padding/gap OK)

=== Provider 셋업 (main.tsx) ===
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
<TDSMobileAITProvider>{children}</TDSMobileAITProvider>
- 내부적으로 TDSMobileProvider + GlobalCSSVariables + SafeAreaInsets 통합
- userAgent 자동 파싱, 브랜드 컬러는 granite.config.ts에서 자동
- ⚠️ colorPreference: 'light' 강제 (다크모드 비활성). 다크모드 필요 시 TDSMobileProvider 직접 사용
- CSS import 불필요 (emotion Global로 자동 주입)

=== 컴포넌트별 필수 API (Required props 반드시 포함) ===

Top (상단 내비게이션):
  - title: ReactNode (REQUIRED!)
  - 사용법: <Top title={<Top.TitleParagraph>제목</Top.TitleParagraph>} />
  - ❌ 잘못된 사용: <Top><Top.TitleParagraph>제목</Top.TitleParagraph></Top>
  - 선택: right?, upper?, lower?, subtitleTop?, subtitleBottom?
  - right에 IconButton 자주 사용: right={<IconButton aria-label="..." name="..." onClick={...} />}

Button:
  - variant: 'fill' | 'weak' (ONLY 이 2개)
  - ❌ 잘못된 값: 'primary', 'secondary', 'ghost', 'outline' — 존재하지 않음
  - 선택: color?, size?, disabled?, onClick

TextField:
  - variant: 'box' | 'line' | 'big' | 'hero' (REQUIRED!)
  - ❌ variant 없이 사용하면 tsc 에러
  - 선택: label?, help? (NOT helperText), hasError?, suffix?, inputMode?, value, onChange

Tab:
  - onChange: (index: number, key?: string | number) => void (REQUIRED!)
  - Tab.Item: selected: boolean (REQUIRED!), ❌ value prop 없음
  - 사용법: <Tab onChange={(i) => setIdx(i)}><Tab.Item selected={idx===0}>탭1</Tab.Item></Tab>

ListRow:
  - ❌ padding prop 없음 — 존재하지 않는 prop
  - ❌ texts prop 없음 — contents prop 사용 (이전 문서 오류 정정)
  - 핵심 props: contents?, left?, right?, border?, onClick?
  - 사용법:
    <ListRow
      contents={<ListRow.Texts type="2RowTypeA" top="제목" bottom="설명" />}
      left={<Checkbox.Line checked={x} onChange={...} />}
      right={<Switch checked={y} onChange={...} />}
    />

  ListRow.Texts (type prop REQUIRED — 21개 변형 존재):
    1줄형: type="1RowTypeA" | "1RowTypeB" | "1RowTypeC" + top
    2줄형: type="2RowTypeA" | "2RowTypeB" | ... | "2RowTypeF" + top + bottom
    3줄형: type="3RowTypeA" | "3RowTypeB" | ... | "3RowType

## TDS Layer 1 패턴 라이브러리 (새 페이지는 이 패턴들 변형)
# TDS Layer 1 Pattern Library

실제 출시 토스 미니앱(`with-contacts-viral`)에서 추출한 재사용 가능한 8개 UI/UX 패턴.

이 파일은 AI 코딩 에이전트가 새 페이지를 설계할 때 **레퍼런스로 우선 참조**해야 합니다. 패턴이 맞지 않으면 새로 만들지 말고 가장 가까운 패턴을 변형하세요. tds-essential.txt와 충돌 시 tds-essential.txt가 우선 (검증된 d.ts 기반).

---

## Pattern 1 — 페이지 SafeArea 래퍼

**언제**: 모든 페이지의 최상위 컨테이너로. TDSMobileAITProvider가 자동으로 `--toss-safe-area-*` CSS 변수를 주입하지만, 페이지마다 일관된 outer padding을 원할 때 한 번 더 감싸는 패턴.

```tsx
import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        paddingTop: 'calc(var(--toss-safe-area-top) + 16px)',
        paddingBottom: 'calc(var(--toss-safe-area-bottom) + 16px)',
        backgroundColor: 'var(--adaptiveBackground)',
      }}
    >
      {children}
    </div>
  );
}
```

**핵심**: `100dvh` (NOT `100vh`), `calc(var(--toss-safe-area-*) + N)` 패턴.

---

## Pattern 2 — Top + 우측 액션 (BottomSheet 트리거)

**언제**: 페이지 헤더 우측에 설정/필터/메뉴 같은 보조 액션이 필요할 때. AlertDialog가 아닌 BottomSheet 권장 (모바일 UX).

```tsx
import { Top, IconButton, BottomSheet } from '@toss/tds-mobile';
import { useState } from 'react';

export function HeaderWithSettings() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Top
        title={<Top.TitleParagraph>PAGE_TITLE</Top.TitleParagraph>}
        right={
          <IconButton
            aria-label="설정"
            name="iconSettingRegular"
            onClick={() => setOpen(true)}
          />
        }
      />
      <BottomSheet open={open} onClose={() => setOpen(false)} title="설정">
        {/* content */}
      </BottomSheet>
    </>
  );
}
```

**핵심**: Top의 `right` prop, IconButton의 `aria-label` 필수 (접근성), BottomSheet의 `open + onClose` 직접 관리.

---

## Pattern 3 — 상태 요약 패널 (아이콘 + 값)

**언제**: 페이지 상단에 핵심 지표 2~3개를 가로로 나열할 때 (스코어, 잔여 횟수, 진행률 등).

```tsx
import { Asset, Paragraph } from '@toss/tds-mobile';

interface StatusPanelProps {
  items: Array<{ icon: string; label: string; value: string | number }>;
}

export function StatusPanel({ items }: StatusPanelProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        padding: '12px 16px',
        backgroundColor: 'var(--adaptiveLayeredBackground)',
        borderRadius: 12,
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Asset.ContentIcon name={item.icon} alt={item.label} style={{ width: 24, height: 24 }} />
          <Paragraph.Text typography="t5">{item.value}</Paragraph.Text>
        </div>
      ))}
    </div>
  );
}
```

**핵심**: `Asset.ContentIcon` (CDN 아이콘), 24px 표준, `var(--adaptiveLayeredBackground)` 카드 색상.

---

## Pattern 4 — 라디오 선택 다이얼로그

**언제**: 사용자가 옵션 N개 중 하나를 골라야 할 때. AlertDialog 대신 useDialog 사용 (declarative).

```tsx
import { useDialog, Checkbox, Paragraph, Spacing } from '@toss/tds-mobile';
import { useState } from 'react';

interface Option { value: string; label: string }

export function useOptionPicker(options: Option[], initial: string) {
  const dialog = useDialog();
  const [selected, setSelected] = useState(initial);

  const open = async () => {
    const ok = await dialog.openConfirm({
      title: '옵션을 선택해주세요',
      description: (
        <div>
          {options.map((opt) => (
            <Checkbox.Circle
              key={opt.value}
              inputType="radio"
              checked={selected === opt.value}
              onChange={() => setSelected(opt.value)}
            >
              {opt.label}
            </Checkbox.Circle>
          ))}
        </div>
      ),
      confirmButton: '확인',
      cancelButton: '취소',
    });
    return ok ? selected : null;
  };

  return { open, selected };
}
```

**핵심**: `Checkbox.Circle` + `inputType="radio"` (실제 검증됨), `useDialog().openConfirm()` boolean 반환.

---

## Pattern 5 — 인터랙티브 그리드 (햅틱 피드백)

**언제**: 셀/타일 그리드에서 각 탭마다 햅틱 피드백을 주고 싶을 때 (게임, 선택 UI 등).

```

## Shared Types Contract (src/lib/types.ts — IMPORT these, do NOT redefine)
```typescript
// Domain types — add your app-specific types here
export {};

```

## Available exports from existing files (IMPORT, do NOT recreate)
// src/App.tsx
export default function App() {

// src/components/AdSlot.tsx
export function AdSlot({ adGroupId, className, variant, theme }: AdSlotProps) {

// src/components/TossRewardAd.tsx
export function TossRewardAd({

// src/lib/storage.ts
export function getItem<T>(key: string): T | null {
export function setItem<T>(key: string, value: T): void {
export function removeItem(key: string): void {

// src/lib/types.ts
export {};

// src/lib/utils.ts
export function cn(...classes: (string | boolean | undefined | null)[]): string {
export function formatNumber(n: number): string {
export function formatCurrency(n: number, currency = 'KRW'): string {

## TDD Workflow (MANDATORY — follow this order)

You MUST follow Test-Driven Development for this packet. Do NOT skip the red phase.

### Step 1: Write Tests FIRST (Red Phase)
Create `src/__tests__/packet-0014.test.ts` with tests for the Acceptance Criteria above.
- Each AC = at least 1 test (name them "AC-1: should ...")
- Write 4-8 focused tests total
- Tests must describe expected behavior with concrete values (not just "truthy")
- Error cases included (invalid input, missing data, etc.)
- Do NOT write any source code yet
- Commit: `git add src/__tests__/packet-0014.test.ts && git commit -m "test: TDD red phase — packet 0014"`

### Step 2: Verify Red (tests should FAIL)
```bash
pnpm test src/__tests__/packet-0014.test.ts
```
Tests MUST fail (source doesn't exist yet). This is intentional.

### Step 3: Implement to Pass (Green Phase)
Now write the source code in the files listed above. Goal: make ALL tests pass.

**절대 원칙: 테스트는 명세다. 테스트를 건드리지 말고 구현을 완성하라.**
- 테스트가 expect하는 값/동작을 소스 코드에서 실제로 구현하라
- 테스트를 수정해서 통과시키는 것은 버그를 숨기는 행위다 → 절대 금지
- 허용되는 테스트 수정: import 경로 오류, mock 구조 불일치만
- 금지: assertion 값 변경, 테스트 케이스 삭제, 조건 완화
- 구현이 어려우면 계속 구현하라 — 테스트를 약하게 만들지 마라
- Commit: `git add <source files> && git commit -m "feat: implement packet 0014"`

### Step 4: Verify Green
```bash
pnpm test src/__tests__/packet-0014.test.ts
```
All tests must pass with the ORIGINAL assertions. If any fail, fix the CODE (not the test).

## Quality Gates (MANDATORY — run before finishing)

After implementing all code, you MUST complete this quality loop. Do NOT finish until all gates pass.

### Gate 1: TypeScript Check
```bash
pnpm typecheck   # or: npx tsc --noEmit
```
If errors exist → fix ALL of them → re-run. Repeat until 0 errors.

### Gate 2: Tests
```bash
pnpm test
```
If tests fail → fix the code (NOT the tests) → re-run. Repeat until all pass.

### Gate 3: Build Verification
```bash
pnpm build   # or: npx next build
```
If build fails → fix the error → re-run.

### Gate 4: Self-Review Checklist
Before finishing, verify:
- [ ] No duplicate code — checked existing exports before creating new functions
- [ ] All imports resolve to real files (no phantom imports)
- [ ] Types match src/lib/types.ts — no inline re-definitions
- [ ] No hardcoded test data left in source files
- [ ] CLAUDE.md rules followed (check the file)

**If any gate fails, fix and re-run. Do NOT finish with known errors.**