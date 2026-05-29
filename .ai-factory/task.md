# TASK

## Epic 1. TypeScript types + interfaces
### Task 1.1 `src/lib/types.ts` — 데이터 모델 + RouteState 계약 정의
- Description:
  - SPEC에 정의된 데이터 모델 타입을 그대로 작성한다.
  - **RouteState 타입을 반드시 포함**해, 각 페이지에서 `location.state`를 안전하게 캐스팅할 수 있도록 한다.
- DoD:
  - `src/lib/types.ts`에 아래 export가 **모두 존재**해야 한다.
    - `export interface PolicyBlockAcknowledgement { ... }` (필드/리터럴 타입이 SPEC와 100% 일치)
    - `export interface LocalStorageHealth { ... }` (필드/리터럴 타입이 SPEC와 100% 일치)
    - `LocalStorageHealth["lastError"]`가 `"LS_UNAVAILABLE" | "LS_QUOTA_EXCEEDED" | "LS_PARSE_ERROR"` 유니온이어야 한다.
    - `export type RouteState = { "/": undefined; "*": unknown }` 가 존재해야 한다.
  - TypeScript 컴파일 에러가 0건이어야 한다. (pass/fail)
- Covers: [F1-AC1, F1-AC2, F1-AC3, F1-AC4, F1-AC5, F1-AC6, F1-AC7, F1-AC8, F1-AC9, F1-AC10, F1-AC11, F1-AC12, F2-AC1, F2-AC2, F2-AC3, F2-AC4, F2-AC5, F2-AC6]
- Files: [`src/lib/types.ts`]
- Depends on: [none]

**Risk Analysis (Epic 1)**
- Complexity: Low
- Risk factors: RouteState 누락/오타 시 페이지 작업에서 `location.state` 불일치로 연쇄 타입 오류 발생
- Mitigation: 가장 먼저 RouteState를 고정해 이후 모든 페이지 Task가 import 기반으로만 진행되게 함

---

## Epic 2. Data layer (storage helpers, state management)
### Task 2.1 `src/lib/storage/safeLocalStorage.ts` — localStorage 안전 래퍼
- Description:
  - `localStorage.getItem/setItem/removeItem`이 `SecurityError` 등으로 throw 가능한 환경을 대비해 **절대 throw하지 않는 래퍼**를 제공한다.
  - QuotaExceededError를 감지해 에러 코드를 분기한다.
  - 이 레이어에서는 **console.error를 호출하지 않는다**.
- DoD:
  - 아래 함수들이 구현되어 있어야 하며, 어떤 예외도 함수 밖으로 throw되면 **FAIL**이다.
    - `safeGetItem(key: string): { ok: true; value: string | null } | { ok: false; error: "LS_UNAVAILABLE" }`
    - `safeSetItem(key: string, value: string): { ok: true } | { ok: false; error: "LS_UNAVAILABLE" | "LS_QUOTA_EXCEEDED" }`
    - `safeRemoveItem(key: string): { ok: true } | { ok: false; error: "LS_UNAVAILABLE" }`
  - Quota 환경에서 `safeSetItem`은 `{ ok:false, error:"LS_QUOTA_EXCEEDED" }`를 반환해야 한다. (pass/fail)
  - `src/**`에 `console.error` 호출 코드가 새로 추가되면 **FAIL**이다. (정적 점검 기준)
  - 컴파일 에러 0건이어야 한다.
- Covers: [F1-AC6, F1-AC8, F1-AC12, F5-AC2]
- Files: [`src/lib/storage/safeLocalStorage.ts`]
- Depends on: [Task 1.1]

### Task 2.2 `src/lib/storage/policyAckStorage.ts` — PolicyBlockAcknowledgement CRUD
- Description:
  - `policyBlock.ack.v1`의 읽기/파싱/저장/삭제를 담당한다.
  - 파싱 실패 시 상위 레이어가 “손상 데이터”로 취급할 수 있도록 에러를 반환한다.
  - 저장 시 `createdAt 유지/재생성` 규칙을 정확히 구현한다.
  - 시간은 **`new Date().toISOString()`만 사용**한다.
- DoD:
  - 아래 함수들이 존재해야 한다.
    - `readPolicyAck(): { ok:true; value: PolicyBlockAcknowledgement | null } | { ok:false; error:"LS_UNAVAILABLE" | "LS_PARSE_ERROR" }`
      - 값이 `"NOT_JSON"`이면 `{ ok:false, error:"LS_PARSE_ERROR" }` 반환이어야 한다. (pass/fail)
    - `writeAcknowledgedPolicyAck(prev: PolicyBlockAcknowledgement | null | "CORRUPTED"): { ok:true; value: PolicyBlockAcknowledgement } | { ok:false; error:"LS_UNAVAILABLE" | "LS_QUOTA_EXCEEDED" }`
      - 반환 `value`에 F1-AC3 필드가 **모두 포함**되어야 한다. 누락 시 FAIL.
      - `prev`가 정상 ack 객체일 때만 `createdAt`을 유지하고, `null` 또는 `"CORRUPTED"`면 `createdAt`을 새로 생성해야 한다. 위반 시 FAIL.
      - `updatedAt`, `acknowledgedAt`은 호출 시각 ISO로 갱신되어야 한다.
      - `violationCategory`는 `"5. 금융 상품 중개/판매/광고"`로 고정되어야 한다.
    - `removePolicyAck(): { ok:true } | { ok:false; error:"LS_UNAVAILABLE" }`
  - 코드베이스(`src/**`)에 `"Temporal"` 문자열이 존재하면 **FAIL**이다. (정적 점검 기준)
  - 컴파일 에러 0건이어야 한다.
- Covers: [F1-AC3, F1-AC5, F1-AC6, F1-AC8, F1-AC12, F5-AC3]
- Files: [`src/lib/storage/policyAckStorage.ts`]
- Depends on: [Task 1.1, Task 2.1]

### Task 2.3 `src/lib/storage/localStorageHealthStorage.ts` — LocalStorageHealth CRUD + 무한 루프 방지
- Description:
  - `app.localStorageHealth.v1`의 읽기/저장을 제공한다.
  - **AC-9 핵심:** health 저장 자체가 QuotaExceededError를 내도 **예외 흡수 + 재시도 금지(함수 호출당 setItem 1회)** 를 보장한다.
- DoD:
  - 아래 함수들이 존재해야 한다.
    - `readLocalStorageHealth(): { ok:true; value: LocalStorageHealth | null } | { ok:false; error:"LS_UNAVAILABLE" | "LS_PARSE_ERROR" }`
    - `writeLocalStorageHealth(next: { isAvailable: boolean; lastError?: LocalStorageHealth["lastError"] }): { ok:true; value: LocalStorageHealth } | { ok:false; error:"LS_UNAVAILABLE" | "LS_QUOTA_EXCEEDED" }`
      - 기존 health가 정상 파싱되는 경우에만 `createdAt` 유지, 그 외에는 새로 생성되어야 한다. 위반 시 FAIL.
      - `updatedAt`, `checkedAt`은 호출 시각 ISO로 갱신되어야 한다.
      - **중요(pass/fail):** `writeLocalStorageHealth` 1회 호출 동안 `safeSetItem("app.localStorageHealth.v1", ...)`가 2회 이상 호출되면 FAIL이다.
      - `safeSetItem`이 Quota로 실패하면 `{ ok:false, error:"LS_QUOTA_EXCEEDED" }` 반환 후 추가 write 시도 0회여야 한다.
  - 컴파일 에러 0건이어야 한다.
- Covers: [F1-AC5, F1-AC6, F1-AC7, F1-AC8, F1-AC9, F1-AC12, F5-AC4]
- Files: [`src/lib/storage/localStorageHealthStorage.ts`]
- Depends on: [Task 1.1, Task 2.1]

### Task 2.4 `src/lib/state/policyBlockStore.tsx` — 상태 관리(Context + Hook)
- Description:
  - `/` 화면이 요구하는 로딩/ack 상태/저장소 오류 노출/액션(확인 저장, 초기화)을 제공한다.
  - **AC-7(첫 페인트 내 오류 문구)** 대응을 위해: mount 직전(초기 state initializer)에서 health를 동기적으로 읽어 `showStorageError` 초기값을 결정한다.
- DoD:
  - `PolicyBlockProvider`와 `usePolicyBlock()`이 export 되어야 한다.
  - `usePolicyBlock()`이 아래 값을 제공해야 한다.
    - `isLoading: boolean` (초기 ack read 완료 전 true)
    - `ack: PolicyBlockAcknowledgement | null`
    - `showStorageError: boolean`
    - `acknowledge(): Promise<{ ok:true } | { ok:false; reason:"LS_UNAVAILABLE" | "LS_QUOTA_EXCEEDED" | "LS_PARSE_ERROR" }>`
    - `resetAck(): Promise<{ ok:true } | { ok:false; reason:"LS_UNAVAILABLE" }>`
  - 초기 렌더에서 `readLocalStorageHealth()` 결과가
    - `lastError==="LS_UNAVAILABLE" && isAvailable===false`이면 `showStorageError`가 **초기값부터 true**여야 한다. (pass/fail)
    - `readLocalStorageHealth()`가 `LS_UNAVAILABLE`로 실패해도 `showStorageError`가 true가 되도록 처리되어야 한다. (pass/fail: false이면 FAIL)
  - ack 로드 로직:
    - `readPolicyAck()`가 `LS_PARSE_ERROR`면 `ack`는 `null`로 두되, 이후 `acknowledge()` 호출 시 `writeAcknowledgedPolicyAck("CORRUPTED")` 경로로 들어가야 한다. (createdAt 재생성 보장)
    - parse/unavailable 발생 시 `writeLocalStorageHealth({ ...lastError })`를 **1회 시도**해야 한다. (성공/실패 무관, throw 금지)
  - `src/**`에 `console.error` 호출이 새로 추가되면 FAIL.
  - 컴파일 에러 0건이어야 한다.
- Covers: [F1-AC4, F1-AC5, F1-AC6, F1-AC7, F1-AC8, F1-AC12, F5-AC2, F6-AC3, F6-AC4]
- Files: [`src/lib/state/policyBlockStore.tsx`]
- Depends on: [Task 2.2, Task 2.3]

**Risk Analysis (Epic 2)**
- Complexity: Medium
- Risk factors:
  - localStorage 예외(Quota/SecurityError/파싱 실패) 미흡 시 흰 화면/AC 실패
  - health 기록이 다시 Quota로 실패하며 재귀적으로 setItem 호출하는 무한 루프 위험(AC-9)
  - 손상 데이터의 `createdAt 유지/재생성` 규칙 실수로 AC-3/AC-5 실패
- Mitigation:
  - safeLocalStorage로 throw 제거 → 상위 레이어가 에러 코드 기반 분기만 수행
  - health storage에서 setItem 1회 규칙을 DoD로 고정
  - ack storage에 `"CORRUPTED"` 입력을 명시해 createdAt 재생성 테스트 가능하게 분리

---

## Epic 3. Core UI pages (`src/pages/`) — ONE page per task
### Task 3.1 Page: `src/pages/PolicyBlockHome.tsx` — 정책 위반 안내 랜딩(`/`)
- Description:
  - SPEC의 정책 위반 안내/차단 랜딩 화면을 TDS 컴포넌트로 구성한다.
  - 로딩/상세 다이얼로그/확인 저장 토스트/ack 상태 표시/저장소 오류 문구/배너 광고/초기화 BottomSheet를 구현한다.
  - **F0 준수:** 회원가입/로그인 UI 및 관련 문구/입력 폼을 절대 넣지 않는다.
  - RouteState 계약: `const _state = location.state as RouteState["/"];` 캐스팅만 하고 사용하지 않는다.
- DoD:
  - `Top` 타이틀이 정확히 **“서비스 이용 안내”** 여야 한다. 아니면 FAIL.
  - 로딩 상태:
    - `isLoading===true` 동안 `Paragraph.Text`로 **“불러오는 중…”** 이 렌더 트리에 존재해야 한다. 아니면 FAIL.
  - 기본 본문:
    - `Paragraph.Text`에 **“금융상품 금리 비교/순위/추천은 오픈 정책상 등록이 불가합니다.”** 문구가 포함되어야 한다. 아니면 FAIL.
  - “자세히 보기”:
    - 버튼 라벨이 **“자세히 보기”** 인 `Button`이 존재해야 한다.
    - 탭 시 `AlertDialog`가 열리고,
      - 제목에 **“서비스 오픈 정책 위반”** 포함 (없으면 FAIL)
      - 본문에 **“위반 카테고리: 5. 금융 상품 중개/판매/광고”** 포함 (없으면 FAIL)
  - “확인”:
    - 버튼 라벨이 **“확인”** 인 `Button`이 존재해야 한다.
    - 탭 후 **navigate/라우팅 이동을 호출하지 않아** `location.pathname`이 `/`에서 바뀌면 FAIL. (F1-AC10)
    - 성공 시 `Toast` **“확인했어요”** 가 표시되고, **2초** duration이어야 한다. (duration이 2초가 아니면 FAIL)
    - 실패 분기:
      - Quota 실패면 `Toast` **“저장 공간이 부족해요. 다시 시도해주세요.”** 2초 (아니면 FAIL)
      - LS_UNAVAILABLE 실패면 `Toast` **“저장소 접근 오류로 확인 상태를 저장할 수 없어요.”** 2초 (아니면 FAIL)
  - 이미 확인한 상태:
    - `ack?.hasAcknowledged===true`일 때, 화면 렌더 트리에 **“이미 확인했어요”** 문자열이 1개 이상 존재해야 한다. 없으면 FAIL.
  - 저장소 오류 문구:
    - `showStorageError===true`이면 본문 하단에 `Paragraph.Text`로 **“저장소 접근 오류로 확인 상태를 저장할 수 없어요.”** 가 렌더되어야 한다. 아니면 FAIL.
  - 초기화 진입점(F6):
    - 타이틀이 **“확인 상태 초기화”** 인 `ListRow`가 **정확히 1개** 존재해야 한다. 아니면 FAIL.
    - 탭 시 `BottomSheet`가 열리고,
      - `Paragraph.Text`로 **“이 기기에서 저장된 확인 기록이 삭제돼요.”** 가 존재해야 한다. 없으면 FAIL.
      - `Button` “취소” 1개 + “초기화” 1개가 존재해야 한다. 총 2개 아니면 FAIL.
    - “초기화” 성공 시:
      - `localStorage.getItem("policyBlock.ack.v1")`가 `null`이어야 한다. 아니면 FAIL.
      - `Toast` **“초기화했어요”** 2초가 표시되어야 한다. 아니면 FAIL.
      - 같은 세션에서 화면 렌더 트리에 “이미 확인했어요”가 남아 있으면 FAIL.
    - “초기화” 실패 시:
      - 크래시 없이 `Toast` **“초기화에 실패했어요”** 2초가 표시되어야 한다. 아니면 FAIL.
  - 배너 광고(F4):
    - 본문(Paragraph.Text) 아래 & 버튼 영역 위에 `<AdSlot />`이 **정확히 1개** 렌더되어야 한다. 아니면 FAIL.
    - `<AdSlot />` 하단 경계와 “확인” 버튼 상단 경계 사이에 `Spacing`이 존재해야 하며, `size={8}` 이상이어야 한다. 아니면 FAIL.
    - `PolicyBlockHome.tsx`에서 `<AdSlot />` JSX에 `onClick` prop이 1건이라도 있으면 FAIL. (코드 기준)
  - F0 금지사항:
    - 렌더 트리에 `TextField`가 **0개**여야 한다. 1개 이상이면 FAIL.
    - 화면 내 텍스트에 “회원가입”, “가입”, “로그인”, “비밀번호”, “이메일” 문자열이 1개라도 포함되면 FAIL.
  - 컴파일 에러 0건이어야 한다.
- Covers:
  - [F0-AC1]
  - [F1-AC1, F1-AC2, F1-AC3, F1-AC4, F1-AC5, F1-AC6, F1-AC7, F1-AC8, F1-AC10, F1-AC11, F1-AC12]
  - [F4-AC1, F4-AC2, F4-AC3, F4-AC4]
  - [F6-AC1, F6-AC2, F6-AC3, F6-AC4]
- Files: [`src/pages/PolicyBlockHome.tsx`]
- Depends on: [Task 1.1, Task 2.4]

### Task 3.2 Page: `src/pages/NotFoundRedirect.tsx` — catch-all(`*`) 홈 리다이렉트
- Description:
  - 정의되지 않은 모든 경로를 `/`로 통일한다.
  - Router context가 없으면 `Navigate` 렌더링을 시도하지 않고, 흰 화면 대신 안내 문구를 보여준다.
  - RouteState 계약: `const _state = location.state as RouteState["*"];` 캐스팅만 하고 사용하지 않는다.
- DoD:
  - 정상 Router context (`useInRouterContext()===true`)일 때:
    - 렌더 트리에 `Paragraph.Text`로 **“안내 화면으로 이동 중…”** 이 존재해야 한다. 없으면 FAIL.
    - `<Navigate to="/" replace />`를 렌더링해야 한다. 없으면 FAIL.
    - (AC-6 대응) `setTimeout(1000ms)` 후에도 `location.pathname !== "/"`이면 `navigate("/", { replace: true })`를 **정확히 1회** 호출해야 한다.
      - 2회 이상 호출되면 FAIL. (무한 루프 방지 정량 조건)
  - Router context 없음 (`useInRouterContext()===false`)일 때:
    - 런타임 예외로 흰 화면이 되면 FAIL.
    - 렌더 트리에 `Paragraph.Text`로 **“서비스 이용 안내는 \`/\`에서 확인할 수 있어요. 앱을 다시 실행해주세요.”** 가 존재해야 한다. 없으면 FAIL.
    - 이 분기에서 `<Navigate>`를 렌더링하려고 시도하면 FAIL. (조건부 렌더로 회피)
  - 쿼리스트링이 길거나 `location.state`가 어떤 값이든 TypeError 없이 동작해야 한다. (state 접근/파싱 금지)
  - 컴파일 에러 0건이어야 한다.
- Covers: [F2-AC1, F2-AC2, F2-AC3, F2-AC4, F2-AC5, F2-AC6]
- Files: [`src/pages/NotFoundRedirect.tsx`]
- Depends on: [Task 1.1]

**Risk Analysis (Epic 3)**
- Complexity: Medium
- Risk factors:
  - TDS 간격 규칙 위반(Spacing 미사용/임의 margin)로 검수 반려
  - AlertDialog/BottomSheet/Toast 상태 제어 실수로 문구 AC 불일치
  - AdSlot 주변 간격/겹침 이슈로 F4 AC 실패
- Mitigation:
  - 페이지를 1 task = 1 page로 분리해 UI 복잡도 제한
  - 간격 기준을 DoD에서 `Spacing size={8}` 등 정량으로 고정

---

## Epic 4. Integration + polish (routing wiring, guards, static checks)
### Task 4.1 `src/lib/externalNavigation.tsx` — 외부 이동 차단 유틸(런타임 가드)
- Description:
  - 개발 실수로 외부 URL 버튼이 추가되더라도, 외부 이동을 수행하지 않고 `AlertDialog`만 띄우는 `openExternalUrl(url)`을 제공한다.
  - 구현 파일 내에 `window.open`, `window.location.href` 참조가 **절대 존재하면 안 됨**.
- DoD:
  - 아래가 구현되어야 한다.
    - `ExternalNavigationProvider` (내부에 `AlertDialog`를 렌더링할 수 있어야 함)
    - `useExternalNavigation()` → `{ openExternalUrl(url: string): void }` 반환
  - `openExternalUrl("https://example.com")` 호출 시:
    - `AlertDialog` 제목에 **“외부 링크는 열 수 없어요”** 가 포함되어야 한다. 없으면 FAIL.
    - 본문에 **“앱 안에서만 이용할 수 있어요.”** 가 포함되어야 한다. 없으면 FAIL.
  - `src/lib/externalNavigation.tsx` 파일에서 아래 토큰 검색 결과가 0건이어야 한다. (정적 pass/fail)
    - `window.open`
    - `window.location.href`
  - 컴파일 에러 0건이어야 한다.
- Covers: [F3-AC3]
- Files: [`src/lib/externalNavigation.tsx`]
- Depends on: [none]

### Task 4.2 `src/App.tsx` — 라우팅 고정 + Provider 조립(딱 2개 라우트)
- Description:
  - 라우트를 `/`와 `*`만 노출하도록 고정한다.
  - `PolicyBlockProvider`, `ExternalNavigationProvider`를 라우트 상단에 1회씩 감싼다.
- DoD:
  - `src/App.tsx`의 라우팅이 아래 의미를 만족해야 한다. 아니면 FAIL.
    - `path="/"` → `<PolicyBlockHome />`
    - `path="*"` → `<NotFoundRedirect />`
  - 위 2개 외 라우트가 1개라도 추가되면 FAIL.
  - `PolicyBlockProvider`가 라우트 트리를 감싸 `PolicyBlockHome`에서 `usePolicyBlock()` 사용이 가능해야 한다. 불가하면 FAIL.
  - `ExternalNavigationProvider`가 앱 트리를 감싸 `useExternalNavigation()`이 사용 가능해야 한다. 불가하면 FAIL.
  - 컴파일 에러 0건이어야 한다.
- Covers: [F2-AC1]
- Files: [`src/App.tsx`]
- Depends on: [Task 3.1, Task 3.2, Task 2.4, Task 4.1]

### Task 4.3 `src/lib/ErrorBoundary.tsx` + `src/main.tsx` — 흰 화면 방지(ErrorBoundary)
- Description:
  - 예기치 못한 런타임 에러 시 흰 화면 대신 최소 안내 UI를 렌더링하는 ErrorBoundary를 추가한다.
  - ErrorBoundary 구현 및 폴백 UI에서 **console.error를 직접 호출하지 않는다**.
- DoD:
  - `src/lib/ErrorBoundary.tsx`에 React ErrorBoundary 컴포넌트가 존재해야 한다.
    - 에러 발생 시 fallback으로 `Paragraph.Text`에 **“일시적인 오류가 발생했어요.”** 문자열이 포함되어 렌더되어야 한다. 없으면 FAIL.
  - `src/main.tsx`에서 `<ErrorBoundary>`가 `<App />`를 감싸도록 연결되어야 한다. (감싸지 않으면 FAIL)
  - `src/**`에 `console.error(` 호출이 새로 추가되면 FAIL.
  - 컴파일 에러 0건이어야 한다.
- Covers: [F5-AC1]
- Files: [`src/lib/ErrorBoundary.tsx`, `src/main.tsx`]
- Depends on: [Task 4.2]

### Task 4.4 `scripts/static-check.mjs` + `package.json` — 정적 점검 스크립트(금지 토큰/의존성)
- Description:
  - SPEC의 “정적 점검” AC들을 수동/CI에서 재현 가능하도록, `src/**` 토큰 스캔 및 `package.json` 의존성 체크 스크립트를 추가한다.
- DoD:
  - `scripts/static-check.mjs` 파일이 존재해야 한다.
  - `package.json`에 `static:check` 스크립트가 추가되어 `npm run static:check`로 실행 가능해야 한다.
  - 스크립트가 `src/**`를 스캔해 아래 패턴이 1건 이상이면 **exit code 1**로 종료해야 한다. (pass/fail)
    - `\bwindow\.location\.href\s*=`  (F3-AC1)
    - `\bwindow\.open\s*\(`           (F3-AC2)
    - `getIsTossLoginIntegratedService\(` (F0-AC2)
    - `Temporal` (F5-AC3)
  - 스크립트가 `package.json`의 dependencies/devDependencies에 아래 패키지가 존재하면 **exit code 1**로 종료해야 한다. (pass/fail)
    - `amplitude-js`
    - `@amplitude/analytics-browser`
    - `react-ga`
  - 스크립트는 성공 조건에서는 exit code 0이어야 한다.
- Covers: [F0-AC2, F3-AC1, F3-AC2, F3-AC4, F5-AC3]
- Files: [`scripts/static-check.mjs`, `package.json`]
- Depends on: [none]

**Risk Analysis (Epic 4)**
- Complexity: Low ~ Medium
- Risk factors:
  - 라우트가 늘어나거나 외부 이동 코드가 유입되면 검수 반려 리스크 증가
  - “정적 점검” AC를 수동으로만 확인하면 누락될 수 있음
- Mitigation:
  - App 라우트를 `/`, `*`로 고정하는 Task를 분리해 변경 폭 최소화
  - static-check 스크립트로 금지 토큰/의존성을 자동 검출

---

## AC Coverage
- Total ACs in SPEC: 36
- Covered by tasks: 36
- Uncovered: 0
- Coverage map:
  - F0-AC1: Task 3.1
  - F0-AC2: Task 4.4
  - F1-AC1: Task 3.1
  - F1-AC2: Task 3.1
  - F1-AC3: Task 2.2, Task 3.1
  - F1-AC4: Task 2.4, Task 3.1
  - F1-AC5: Task 2.2, Task 2.3, Task 2.4, Task 3.1
  - F1-AC6: Task 2.1, Task 2.2, Task 2.3, Task 3.1
  - F1-AC7: Task 2.3, Task 2.4, Task 3.1
  - F1-AC8: Task 2.1, Task 2.3, Task 2.4, Task 3.1
  - F1-AC9: Task 2.3
  - F1-AC10: Task 3.1
  - F1-AC11: Task 3.1
  - F1-AC12: Task 2.1, Task 2.3, Task 2.4, Task 3.1
  - F2-AC1: Task 3.2, Task 4.2
  - F2-AC2: Task 3.2
  - F2-AC3: Task 3.2
  - F2-AC4: Task 3.2
  - F2-AC5: Task 3.2
  - F2-AC6: Task 3.2
  - F3-AC1: Task 4.4
  - F3-AC2: Task 4.4
  - F3-AC3: Task 4.1
  - F3-AC4: Task 4.4
  - F4-AC1: Task 3.1
  - F4-AC2: Task 3.1
  - F4-AC3: Task 3.1
  - F4-AC4: Task 3.1
  - F5-AC1: Task 4.3
  - F5-AC2: Task 2.1, Task 2.4, Task 3.1
  - F5-AC3: Task 2.2, Task 4.4
  - F5-AC4: Task 2.3, Task 2.4
  - F6-AC1: Task 3.1
  - F6-AC2: Task 3.1
  - F6-AC3: Task 2.4, Task 3.1
  - F6-AC4: Task 2.4, Task 3.1