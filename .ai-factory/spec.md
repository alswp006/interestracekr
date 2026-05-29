# SPEC (UPDATED — gaps fixed, 기존 내용 유지)

## Common Principles
- 본 SPEC의 PRD 진실 조건: 제공된 PRD는 **“금융상품(정기예금·CMA·파킹통장 등) 금리 비교/순위/조합 추천” 기능이 토스 미니앱 오픈 정책 위반 소지가 높아 등록 불가**라고 명시한다. 따라서 MVP는 **해당 기능을 구현하지 않고**, 앱 내에서 **오픈 정책 위반 안내 및 기능 차단**만 제공한다.
- **회원가입/로그인(사인업) 관련 원칙(명시 보강)**
  - Toss 앱 컨테이너는 사용자 세션을 자동 제공하며, 본 MVP는 **회원가입/로그인 화면, 입력 폼(이메일/비밀번호/전화번호), 프로필 생성 기능을 제공하지 않는다.**
  - 본 MVP는 사용자 식별자/계정 데이터 모델을 저장하지 않는다(로컬에 userId 등 저장 금지).
- 기술/제약
  - Frontend: Vite + React + TypeScript
  - UI: `@toss/tds-mobile` 컴포넌트만 사용(여백은 `Spacing`만 사용, HEX 색상 하드코딩 금지)
  - Routing: `react-router-dom`
  - Persistence: `localStorage`(총 5MB 이하)
  - 서버/외부 API 호출 없음(따라서 CORS 이슈 없음)
  - Toss 세션 로그인/인증 플로우 추가 구현 없음
  - 외부 로깅(Amplitude/GA 등) 금지
- 토스 검수 필수 준수
  - [W] `window.location.href`, `window.open`으로 외부 도메인 이동을 유발하는 UI/코드 금지
  - [W] “앱 설치/다운로드 유도” 문구/배너/링크 금지
  - [U] 프로덕션 빌드에서 `console.error` 출력 0건
  - [U] Android 7+, iOS 16+ 호환(최신 전용 Web API 의존 금지)

---

## Data Models

### PolicyBlockAcknowledgement — fields, types, constraints
```ts
export interface PolicyBlockAcknowledgement {
  /** 엔티티 식별자. localStorage key 기반 고정값 사용 */
  id: "policyBlock.ack.v1";
  /** 최초 생성 시각(ISO). 예: "2026-05-29T12:34:56.000Z" */
  createdAt: string;
  /** 마지막 갱신 시각(ISO). "확인" 버튼 재탭 시 갱신 */
  updatedAt: string;

  /** 고지/차단 화면을 사용자가 확인했는지 */
  hasAcknowledged: boolean; // default false
  /** 사용자가 확인을 수행한 시각(ISO) */
  acknowledgedAt?: string;

  /** PRD에 명시된 위반 카테고리 문자열 */
  violationCategory: "5. 금융 상품 중개/판매/광고";
}
```
- localStorage
  - Key: `policyBlock.ack.v1`
  - Shape: `PolicyBlockAcknowledgement` (JSON stringify)
- Size estimation
  - 1 record(약 220~450 bytes) × 1 = < 1KB

### LocalStorageHealth — fields, types, constraints
```ts
export interface LocalStorageHealth {
  /** 엔티티 식별자. localStorage key 기반 고정값 사용 */
  id: "app.localStorageHealth.v1";
  /** 최초 생성 시각(ISO) */
  createdAt: string;
  /** 마지막 갱신 시각(ISO). health가 기록될 때마다 갱신 */
  updatedAt: string;

  /** localStorage read/write 가능 여부 */
  isAvailable: boolean;
  /** 마지막 체크 시각 ISO */
  checkedAt: string; // ISO
  /** 오류가 있으면 고정된 에러 코드 문자열 */
  lastError?: "LS_UNAVAILABLE" | "LS_QUOTA_EXCEEDED" | "LS_PARSE_ERROR";
}
```
- localStorage
  - Key: `app.localStorageHealth.v1`
  - Shape: `LocalStorageHealth`
- Size estimation
  - 1 record < 1KB
- **Constraint (Quota/무한 루프 방지)**  
  - `app.localStorageHealth.v1`에 health를 기록하려는 `localStorage.setItem` 자체가 `QuotaExceededError`를 throw하는 경우, **해당 예외는 앱에서 흡수(silent swallow)하고 추가적인 재시도/추가 write를 수행하지 않는다.**(health 기록 실패를 다시 health로 기록하려는 루프 금지)

---

## Feature List

### F0. 회원가입/로그인(사인업) 미제공(명시적 스코프 고정)
- Description: 사용자 여정에서 “가입/로그인”을 기대할 수 있으나, 본 MVP는 Toss 세션 컨텍스트를 전제로 하며 별도 사인업/로그인 UI 및 유저 계정 모델을 제공하지 않는다.
- Data: 없음
- API: 없음 (인증 관련 API 호출 금지)
- Requirements:
  - Screen Definitions:
    - 적용 범위: 전체 앱
    - TDS components used:
      - (금지 요구사항 성격) `TextField`를 이메일/비밀번호/전화번호 입력 용도로 사용하지 않음
  - Touch interactions: 없음
  - Navigation state contract: 없음
- **AC-1 [U][P0]: Scenario: 앱 내에 회원가입/로그인 입력 폼이 존재하지 않음**
  - Given 사용자가 앱을 실행해 `/` 화면을 확인할 때
  - When 화면이 렌더링될 때
  - Then `TextField` 컴포넌트가 렌더 트리에 **0개**여야 함
  - And 화면 내 텍스트(버튼 라벨/본문 포함)에 “회원가입”, “가입”, “로그인”, “비밀번호”, “이메일” 문자열이 **1개라도 포함되면 FAIL**
- **AC-2 [W][P1]: Scenario: 인증/로그인 관련 SDK/함수 호출이 소스에 포함되지 않음(정적 점검)**
  - Given 프로덕션 빌드 전 정적 점검을 수행할 때
  - When 앱 소스코드(`src/**`)에서 `getIsTossLoginIntegratedService(` 토큰을 검색할 때
  - Then 매칭 결과가 **0건**이어야 함
  - And 1건 이상이면 **FAIL**

---

### F1. 정책 위반 안내 화면(기능 차단 랜딩)
- Description: 앱 진입 시 PRD에 명시된 오픈 정책 위반 사유를 사용자에게 고지하고, 금융상품 비교/추천 등 차단 대상 기능이 앱에 존재하지 않음을 명확히 보여준다. 사용자는 “확인”을 통해 안내를 닫을 수 있으나, 앱은 계속 안내 맥락(차단 상태)을 유지한다.
- Data: `PolicyBlockAcknowledgement`, `LocalStorageHealth`(저장소 오류 기록/소비)
- API: 없음
- Requirements:
  - Screen Definitions:
    - Screen name / route: `PolicyBlockHome` — `/`
    - TDS components used:
      - `Top`(타이틀 “서비스 이용 안내”)
      - `Paragraph.Text`(위반 사유 본문)
      - `Spacing`(섹션 간 간격)
      - `Button`(“확인”, “자세히 보기”)
      - `AlertDialog`(“자세히 보기” 시 정책 위반 상세)
      - `Toast`(확인 저장 성공/실패)
      - (선택) `AdSlot`(배너: 본문 하단과 버튼 영역 사이, 콘텐츠와 겹치지 않음)
      - (추가) `Chip`(이미 확인한 상태 표시)
      - (추가) `ListRow`, `BottomSheet` (로컬 데이터 초기화 진입점 제공 — F6와 연계)
    - Loading state:
      - localStorage에서 `policyBlock.ack.v1` 읽는 동안 `Paragraph.Text`로 “불러오는 중…” 표시
    - Empty state:
      - 저장된 ack가 없으면 `hasAcknowledged=false`로 간주하고 안내 본문 표시
    - **Acknowledged state (명확화)**
      - `policyBlock.ack.v1`가 정상 파싱되고 `hasAcknowledged=true`인 경우에도 **동일하게 안내(차단) 맥락을 유지하며 `/` 화면을 계속 표시한다.**
      - 단, 사용자가 이미 확인했음을 알 수 있도록 본문 영역에 `Chip` 또는 `Paragraph.Text`로 “이미 확인했어요” 상태 표시를 추가로 노출할 수 있다(해당 표시는 화면 내에 항상 존재해야 하는 필수 UI로 AC에서 고정).
    - Error state:
      - localStorage 파싱 실패/접근 불가 시 본문 하단에 `Paragraph.Text`로 고정 문구 표시: “저장소 접근 오류로 확인 상태를 저장할 수 없어요.”
      - 위 Error state가 발생했을 때(또는 발생 이력이 감지되었을 때) `app.localStorageHealth.v1`에 health를 기록/소비하여 동일 문구를 즉시 표시할 수 있어야 함
    - Touch interactions:
      - 모든 `Button`은 TDS 기본 규격 사용(터치 타겟 ≥ 44px)
      - `AlertDialog`의 확인/닫기 버튼도 TDS 기본 버튼 사용
    - Navigation state contract:
      - Outgoing:
        - “자세히 보기” 버튼 → state 이동 없음(동일 화면에서 `AlertDialog`만 오픈)
        - “확인” 버튼 → **라우팅 이동 없음(항상 `/` 유지)**, 단 localStorage에 ack 저장 시도
      - Incoming:
        - `location.state`는 사용하지 않음(항상 `undefined` 허용)
- AC-1 [U][P0]: Scenario: 앱 진입 시 정책 위반 안내가 기본 화면으로 노출
  - Given 사용자가 토스 앱에서 미니앱을 실행했을 때
  - When 라우트가 `/`로 렌더링될 때
  - Then 화면 상단에 `Top` 타이틀 “서비스 이용 안내”가 표시됨
  - And 본문에 “금융상품 금리 비교/순위/추천은 오픈 정책상 등록이 불가합니다.” 문구가 `Paragraph.Text`로 표시됨
- AC-2 [E][P0]: Scenario: 자세히 보기 다이얼로그에서 PRD 위반 사유를 원문 수준으로 고지
  - Given 사용자가 `/` 화면에 있을 때
  - When “자세히 보기” 버튼을 탭할 때
  - Then `AlertDialog`가 열리고 제목에 “서비스 오픈 정책 위반”이 표시됨
  - And 본문에 “위반 카테고리: 5. 금융 상품 중개/판매/광고” 문구가 포함되어 표시됨
- AC-3 [E][P0]: Scenario: 확인 버튼 탭 시 고지 확인 상태가 localStorage에 저장(재탭 시 updatedAt 갱신)
  - Given `policyBlock.ack.v1` 키가 localStorage에 없거나, 존재하더라도 `hasAcknowledged`가 `false`이거나 `true`인 어떤 상태일 때
  - When 사용자가 “확인” 버튼을 탭할 때
  - Then localStorage의 `policyBlock.ack.v1`에 아래 필드가 **모두 포함된** JSON이 저장되어야 함
    - `id: "policyBlock.ack.v1"`
    - `createdAt: "<ISO>"` (**키가 없던 최초 저장이거나, 기존 값이 존재하더라도 JSON 파싱에 실패한(손상된) 경우에는 새로 생성** / **기존 값이 정상 파싱되는 경우에만** 기존 `createdAt` 유지)
    - `updatedAt: "<ISO>"` (이번 탭 시각으로 갱신)
    - `hasAcknowledged: true`
    - `violationCategory: "5. 금융 상품 중개/판매/광고"`
    - `acknowledgedAt: "<ISO>"` (이번 탭 시각으로 갱신)
  - And `Toast`로 “확인했어요” 문구가 2초 동안 표시됨
- AC-4 [S][P1]: Scenario: localStorage 로딩 중 로딩 문구 표시
  - Given 앱이 최초 렌더링되어 localStorage 읽기가 완료되지 않았을 때
  - While `/` 화면이 로딩 상태일 때
  - Then `Paragraph.Text`로 “불러오는 중…” 텍스트가 표시됨
- AC-5 [W][P1]: Scenario: localStorage JSON 파싱 실패 시 앱 크래시 방지, 오류 문구 표시, health 기록 (+ 손상 데이터는 신규로 취급)
  - Given localStorage의 `policyBlock.ack.v1` 값이 문자열 `"NOT_JSON"`일 때
  - When `/` 화면이 해당 값을 읽어 파싱할 때
  - Then 런타임 예외로 화면이 흰 화면이 되지 않아야 함
  - And `Paragraph.Text`로 “저장소 접근 오류로 확인 상태를 저장할 수 없어요.” 문구가 표시됨
  - And (가능한 경우) localStorage의 `app.localStorageHealth.v1`에 아래 필드가 **모두 포함된** JSON이 저장되어야 함
    - `id: "app.localStorageHealth.v1"`
    - `createdAt: "<ISO>"` (키가 없던 최초 저장인 경우에만 새로 생성)
    - `updatedAt: "<ISO>"` (이번 기록 시각)
    - `isAvailable: true`
    - `checkedAt: "<ISO>"`
    - `lastError: "LS_PARSE_ERROR"`
  - And (손상 데이터 처리 규칙의 테스트 가능 조건) 사용자가 같은 세션에서 이후 “확인” 버튼을 탭해 저장을 시도할 때, 저장되는 `policyBlock.ack.v1.createdAt`은 **기존(손상된) 값에서 유지되지 않고** 새로 생성된 ISO 문자열이어야 함
- AC-6 [W][P1]: Scenario: localStorage 저장 공간 부족(Quota) 시 저장 실패 토스트 표시 및 health 기록
  - Given 브라우저가 localStorage 쓰기에서 `QuotaExceededError`를 발생시키는 환경일 때
  - When 사용자가 “확인” 버튼을 탭할 때
  - Then localStorage에 `policyBlock.ack.v1`이 저장되지 않아야 함
  - And `Toast`로 “저장 공간이 부족해요. 다시 시도해주세요.” 문구가 2초 동안 표시됨
  - And (가능한 경우) localStorage의 `app.localStorageHealth.v1`에 아래 필드가 **모두 포함된** JSON이 저장되어야 함
    - `id: "app.localStorageHealth.v1"`
    - `createdAt: "<ISO>"` (키가 없던 최초 저장인 경우에만 새로 생성)
    - `updatedAt: "<ISO>"`
    - `isAvailable: false`
    - `checkedAt: "<ISO>"`
    - `lastError: "LS_QUOTA_EXCEEDED"`
- AC-7 [W][P1]: Scenario: 저장소 사용 불가 health가 기록된 상태이면 오류 문구를 즉시 표시(소비 AC)
  - Given localStorage의 `app.localStorageHealth.v1` 값이 JSON이며 `lastError = "LS_UNAVAILABLE"`이고 `isAvailable = false`일 때
  - When 사용자가 `/` 화면에 진입해 첫 렌더링이 발생할 때
  - Then `policyBlock.ack.v1` 읽기/파싱 결과와 무관하게 본문 하단에 `Paragraph.Text`로 “저장소 접근 오류로 확인 상태를 저장할 수 없어요.” 문구가 **즉시(첫 페인트 내)** 표시되어야 함
- **AC-8 [W][P1]: Scenario: localStorage 접근 자체가 불가능(비활성/차단/SecurityError)한 경우 LS_UNAVAILABLE 기록 경로 정의**
  - Given 브라우저 환경에서 `localStorage.getItem("policyBlock.ack.v1")` 호출이 `SecurityError`(또는 동등한 예외)를 throw하는 상태일 때
  - When 앱이 `/` 화면에서 ack를 읽기 위해 `getItem`을 호출할 때
  - Then 앱이 크래시(흰 화면)하지 않아야 함
  - And 본문 하단에 `Paragraph.Text`로 “저장소 접근 오류로 확인 상태를 저장할 수 없어요.” 문구가 표시되어야 함
  - And (가능한 경우) localStorage의 `app.localStorageHealth.v1`에 아래 필드가 **모두 포함된** JSON이 저장되어야 함
    - `id: "app.localStorageHealth.v1"`
    - `createdAt: "<ISO>"` (키가 없던 최초 저장인 경우에만 새로 생성)
    - `updatedAt: "<ISO>"`
    - `isAvailable: false`
    - `checkedAt: "<ISO>"`
    - `lastError: "LS_UNAVAILABLE"`
- **AC-9 [W][P1]: Scenario: LocalStorageHealth 자체 기록이 QuotaExceededError를 내더라도 무한 루프/재시도 없이 예외 흡수**
  - Given 앱이 health 기록을 시도하는 코드 경로에 진입했고(예: AC-6 또는 AC-8 상황), `localStorage.setItem("app.localStorageHealth.v1", ...)` 호출이 `QuotaExceededError`를 throw하는 환경일 때
  - When 앱이 health를 기록하려고 `setItem`을 호출할 때
  - Then 앱이 크래시(흰 화면)하지 않아야 함
  - And 같은 이벤트/렌더 사이클에서 `localStorage.setItem("app.localStorageHealth.v1", ...)`가 **1회 초과 호출되면 FAIL** (재시도/루프 금지의 정량 조건)
- **AC-10 [U][P0]: Scenario: “확인” 버튼 탭 이후에도 라우트 이동 없이 차단 맥락을 유지**
  - Given 사용자가 `/` 화면에 있고 현재 `location.pathname === "/"`일 때
  - When 사용자가 “확인” 버튼을 탭해 `Toast` “확인했어요”가 표시된 후(2초 내) 화면이 안정화되었을 때
  - Then `location.pathname`이 여전히 `/`가 아니면 **FAIL**
  - And (Pass 조건) `location.pathname === "/"` 이어야 함
- **AC-11 [E][P0]: Scenario: 이미 확인한 사용자에게 “이미 확인했어요” 상태가 화면에 표시됨(재방문 UX 명확화)**
  - Given localStorage의 `policyBlock.ack.v1`가 정상 JSON이며 `hasAcknowledged=true`일 때
  - When 사용자가 앱을 재실행하거나 `/` 화면에 재진입했을 때
  - Then `/` 화면 렌더 트리에 `Chip` 또는 `Paragraph.Text` 형태로 “이미 확인했어요” 문자열이 **1개 이상 존재**해야 함
  - And 위 문자열이 렌더 트리에 존재하지 않으면 **FAIL**
- **AC-12 [W][P1]: Scenario: 쓰기(setItem) 자체가 SecurityError 등으로 실패하는 경우 저장 실패 토스트 및 LS_UNAVAILABLE health 기록**
  - Given 브라우저 환경에서 `localStorage.setItem("policyBlock.ack.v1", ...)` 호출이 `SecurityError`(또는 동등한 예외)를 throw하는 상태일 때
  - When 사용자가 `/` 화면에서 “확인” 버튼을 탭할 때
  - Then 앱이 크래시(흰 화면)하지 않아야 함
  - And `Toast`로 “저장소 접근 오류로 확인 상태를 저장할 수 없어요.” 문구가 2초 동안 표시되어야 함
  - And localStorage에 `policyBlock.ack.v1` 값이 **새로 생성/변경되면 FAIL**
  - And (가능한 경우) localStorage의 `app.localStorageHealth.v1`에 `lastError: "LS_UNAVAILABLE"`, `isAvailable: false`가 포함되어 저장되어야 함

---

### F2. 라우팅 가드(차단 상태에서 모든 경로를 안내 화면으로 통일)
- Description: 사용자가 주소 변경/딥링크/잘못된 라우트로 진입해도, 앱은 정책 위반 차단 상태를 유지하며 `/` 안내 화면만 표시한다. 이로써 금융상품 비교/추천 기능으로 오해될 수 있는 화면/경로 노출을 원천 차단한다.
- Data: 없음
- API: 없음
- Requirements:
  - Screen Definitions:
    - Screen name / route:
      - `NotFoundRedirect` — `*` (React Router catch-all)
    - TDS components used:
      - `Paragraph.Text`(리다이렉트 중 안내/실패 안내)
      - `Spacing`
      - (리다이렉트는 `react-router-dom`의 `Navigate` 사용)
    - Loading state:
      - 잘못된 경로 진입 시 즉시 `/`로 이동 처리(중간 상태는 1프레임 내)
    - Empty state:
      - 없음
    - Error state:
      - 라우트 state가 비정상이어도 무시
      - (실패 케이스) `Navigate` 렌더링이 불가능한 환경(예: Router context 누락)에서는 흰 화면 대신 안내 문구를 표시하고 자동 이동을 시도하지 않음
    - Touch interactions:
      - 없음(자동 이동)
    - Navigation state contract:
      - Incoming: `location.pathname` 어떤 값이든 허용, `location.state: unknown`
      - Outgoing: `Navigate`로 `/` 이동, `state` 전달하지 않음
- AC-1 [U][P0]: Scenario: 정의되지 않은 경로는 항상 홈으로 리다이렉트
  - Given 사용자가 `/unknown` 경로로 진입했을 때
  - When 라우터가 `*` 경로를 매칭할 때
  - Then `react-router-dom`의 `Navigate`를 통해 **1초 이내에** `/`로 이동해야 함
  - And (Pass/Fail) 1초가 경과했는데도 `location.pathname`이 `/`가 아니면 **FAIL**
- AC-2 [W][P1]: Scenario: 라우트 state에 예상치 못한 값이 있어도 크래시 없이 무시
  - Given 사용자가 `/unknown` 경로로 진입하며 `location.state = { presetId: 123 }`일 때
  - When `*` 경로가 처리될 때
  - Then TypeError 없이 `/`로 이동해야 함
- AC-3 [W][P1]: Scenario: URL 쿼리스트링이 과도하게 길어도 렌더링이 멈추지 않음
  - Given 사용자가 `/unknown?x=` 뒤에 2000자의 문자열이 포함된 URL로 진입했을 때
  - When 라우터가 해당 URL을 파싱해 렌더링할 때
  - Then 앱이 1초 내에 `/`로 이동해야 함
- AC-4 [S][P1]: Scenario: 리다이렉트 처리 중 화면에 빈 화면 대신 안내 텍스트 표시
  - Given 사용자가 `*` 경로 화면에 매칭되었을 때
  - While `/`로 이동이 완료되기 전 1프레임 동안
  - Then `Paragraph.Text`로 “안내 화면으로 이동 중…”이 표시됨
- **AC-5 [W][P1]: Scenario: Navigate 컴포넌트 마운트 실패 시 흰 화면 방지(명시적 failure AC) — 완전한 Given/When/Then**
  - Given `NotFoundRedirect`가 **Router context 없이** 렌더링되어 `Navigate`가 정상 동작할 수 없는 상태일 때(예: 개발 실수로 `<Router>` 누락)
  - When `NotFoundRedirect`가 렌더링될 때
  - Then 런타임 예외로 인해 화면이 흰 화면이 되면 **FAIL**
  - And `Paragraph.Text`로 “서비스 이용 안내는 `/`에서 확인할 수 있어요. 앱을 다시 실행해주세요.” 문구가 **렌더 트리에 존재하지 않으면 FAIL**
  - And (Pass 조건) 위 문구가 화면에 렌더링되어 있어야 하며, 이 상태에서는 자동 이동(`Navigate`)을 시도하지 않아야 함(= `Navigate`를 렌더링하려고 시도하다가 throw하는 동작 금지)
- **AC-6 [W][P1]: Scenario: Navigate가 렌더링되었지만 1초 후에도 `/`로 이동하지 않으면 FAIL(명시적 failure AC)**
  - Given 앱이 정상적인 Router context 안에서 실행 중이고, 사용자가 `/unknown` 경로로 진입했을 때
  - When `NotFoundRedirect`가 `Navigate`를 렌더링한 뒤 1초가 경과했을 때
  - Then `location.pathname`이 `/`가 아니면 **FAIL**
  - And (Pass 조건) `location.pathname`이 `/`이면 PASS

---

### F3. 외부 링크/외부 이동 차단(검수 반려 방지)
- (기존 내용 동일)
- Description: 정책상 외부 도메인 이탈을 유발하는 동작을 앱에서 제공하지 않으며, 실수로 외부 이동 코드가 추가되는 것을 방지한다. UI 상에서도 외부 링크 버튼/배너를 제공하지 않는다.
- Data: 없음
- API: 없음
- Requirements:
  - Screen Definitions:
    - 적용 범위: 전체 앱(전역 가드 성격)
    - TDS components used: (필요 시) `AlertDialog`, `Toast` (외부 이동 시도 차단 안내)
    - Loading/empty/error state: 해당 없음(전역 정책)
    - Touch interactions: 차단 안내 다이얼로그 버튼 터치 타겟은 TDS 기본(≥44px)
    - Navigation state contract: 외부 URL로 이동하는 navigate/state 사용 금지
- AC-1 [W][P0]: Scenario: 외부 도메인으로의 강제 이동 코드(직접 할당) 사용 금지 — 정적 점검 범위 명확화
  - Given 프로덕션 빌드 전 정적 점검을 수행할 때
  - When 앱 소스코드(`src/**`)에서 직접적으로 `window.location.href =` 형태의 할당을 검색할 때
  - Then 정규식 `\bwindow\.location\.href\s*=` 매칭 결과가 **0건**이어야 함
  - And (Pass/Fail) 1건 이상 발견되면 **FAIL**
- AC-2 [W][P0]: Scenario: window.open 직접 호출 금지 — 정적 점검 범위 명확화
  - Given 프로덕션 빌드 전 정적 점검을 수행할 때
  - When 앱 소스코드(`src/**`)에서 직접적으로 `window.open(` 호출을 검색할 때
  - Then 정규식 `\bwindow\.open\s*\(` 매칭 결과가 **0건**이어야 함
  - And (Pass/Fail) 1건 이상 발견되면 **FAIL**
- AC-3 [W][P1]: Scenario: 실수로 외부 URL 버튼이 추가되면 런타임에서 차단 다이얼로그 표시(차단 wrapper는 외부 이동 미수행)
  - Given 개발 실수로 “외부 링크” 버튼이 렌더링되고 onClick에서 `openExternalUrl("https://example.com")`을 호출하도록 구현되었을 때
  - When 사용자가 해당 버튼을 탭할 때
  - Then `AlertDialog` 제목 “외부 링크는 열 수 없어요”가 표시됨
  - And 본문에 “앱 안에서만 이용할 수 있어요.”가 표시됨
  - And `openExternalUrl` 구현은 **외부 이동을 수행하지 않아야 함**
    - Pass 조건: `openExternalUrl` 함수 내부에 `window.open`, `window.location.href` 참조가 **존재하지 않아야 함**(정적 점검: 해당 함수 정의 파일에서 위 토큰 0건)
- AC-4 [U][P1]: Scenario: 외부 로깅 SDK 미사용 보장
  - Given 프로덕션 빌드가 생성되었을 때
  - Then 번들 의존성에 `"amplitude-js"`, `"@amplitude/analytics-browser"`, `"react-ga"` 패키지가 포함되지 않아야 함(의존성 점검 기준)

---

### F4. 광고 배너 배치(선택, 템플릿 AdSlot 사용)
- (기존 내용 동일)
- Description: 안내 화면 내 콘텐츠를 가리지 않는 위치에 배너 광고를 1개 배치한다. 광고는 템플릿의 `<AdSlot />`을 그대로 사용하며, 본문과 버튼 사이에 삽입하여 오동작/오탭을 줄인다.
- Data: 없음
- API: 없음 (템플릿 래퍼가 내부적으로 SDK 호출)
- Requirements:
  - Screen Definitions:
    - 적용 화면: `PolicyBlockHome`(`/`)
    - TDS components used:
      - `Spacing`(본문 ↔ 광고 ↔ 버튼 간 간격)
      - `AdSlot`(배너)
    - Loading/empty/error state:
      - 광고 로딩 실패 시에도 레이아웃이 깨지지 않고 버튼이 눌려야 함(광고 영역은 0~고정높이로 처리)
    - Touch interactions:
      - 광고와 버튼이 겹치지 않아야 하며, 버튼 터치 타겟 44px 유지
    - Navigation state contract: 광고 클릭 동작은 템플릿 구현 범위(앱에서 외부 이동 코드 추가 금지)
- AC-1 [E][P0]: Scenario: 배너가 본문/버튼과 겹치지 않는 위치에 표시됨
  - Given 사용자가 `/` 화면에 있을 때
  - When 화면이 렌더링될 때
  - Then 본문(`Paragraph.Text`) 아래, 버튼(`Button`) 위에 `<AdSlot />`이 **정확히 1개** 렌더링되어야 함
  - And `<AdSlot />`의 **하단 경계**와 “확인” 버튼의 **상단 경계** 사이에 `Spacing`이 존재해야 함
  - And (Pass/Fail) 해당 간격이 `Spacing size={8}` 이상으로 구성되어 있지 않으면 **FAIL** (최소 간격 기준: 8px 이상)
- AC-2 [W][P1]: Scenario: 광고 로드 실패 시에도 레이아웃 불변(CTA 접근성 유지)
  - Given 광고 SDK가 로딩 실패하여 `<AdSlot />`이 콘텐츠를 표시하지 못하는 상태일 때
  - When `/` 화면이 렌더링되고 사용자가 “확인” 버튼을 탭할 때
  - Then “확인” 버튼이 화면 내에 렌더링되어 있어야 하며(visibility 기준), 탭 시 `Toast` “확인했어요”가 표시되어야 함
  - And (Pass/Fail) 광고 실패로 인해 “확인” 버튼이 렌더 트리에서 제거되거나 탭 불가능 상태가 되면 **FAIL**
- AC-3 [W][P1]: Scenario: 광고 영역 탭이 버튼 탭으로 오인식되지 않음
  - Given `/` 화면에서 `<AdSlot />`과 “확인” 버튼이 모두 렌더링된 상태일 때
  - When 사용자가 `<AdSlot />`의 영역(광고 컨테이너 bounding box) 안을 탭할 때
  - Then “확인” 버튼의 onClick이 호출되면 **FAIL**
  - And (Pass 조건) 위 탭 동작으로 “확인했어요” `Toast`가 표시되지 않아야 함
- AC-4 [W][P1]: Scenario: 광고 클릭 시 앱 내 외부 이동 코드가 실행되지 않음(앱 코드 관여 금지)
  - Given `/` 화면에서 `<AdSlot />`이 렌더링된 상태일 때
  - When 사용자가 광고를 탭하여 광고 SDK 내부 클릭 핸들링이 발생할 때
  - Then 앱 애플리케이션 코드에서 `openExternalUrl(...)`이 호출되면 **FAIL**
  - And (Pass 조건) `<AdSlot />`을 감싸는 상위 컴포넌트에서 `onClick`을 직접 바인딩하여 외부 이동/라우팅을 트리거하지 않아야 함(코드 점검 기준: `PolicyBlockHome`에서 `<AdSlot />` JSX에 `onClick` prop 0건)

---

### F5. 품질/호환성 가드(콘솔 에러 0, OS 호환)
- (기존 내용 동일)
- Description: 검수 반려를 유발하는 콘솔 에러/호환성 문제를 MVP 범위에서 사전에 차단한다. 프로덕션 빌드에서 `console.error`가 발생하지 않도록 예외를 흡수하고, Android 7+/iOS16+에서 동작 가능한 API만 사용한다.
- Data: `LocalStorageHealth`(선택적으로 마지막 오류 코드 저장)
- API: 없음
- Requirements:
  - Screen Definitions:
    - 적용 범위: 전체 앱(전역)
    - TDS components used:
      - 오류를 사용자에게 알릴 필요가 있는 경우 `Toast` 사용
    - Loading/empty/error state:
      - localStorage health 체크 중에는 UI에 영향을 주지 않음(백그라운드)
- AC-1 [U][P0]: Scenario: 프로덕션 빌드에서 console.error 호출이 0건
  - Given `import.meta.env.PROD === true`인 프로덕션 빌드일 때
  - When 사용자가 `/` 화면에서 “확인” 버튼을 1회 탭할 때
  - Then `console.error`가 0회 호출되어야 함(테스트 스파이 기준)
- AC-2 [W][P1]: Scenario: localStorage 접근 불가 환경에서 예외가 console.error로 출력되지 않음
  - Given 브라우저가 `localStorage.getItem` 호출 시 예외를 throw하는 환경일 때
  - When 앱이 `/` 화면을 렌더링할 때
  - Then 앱이 크래시하지 않아야 함
  - And `console.error`가 0회 호출되어야 함
- AC-3 [W][P1]: Scenario: Date/Intl 최신 전용 기능 의존 금지(호환성)
  - Given Android 7 WebView 환경을 가정할 때
  - When 앱이 `acknowledgedAt`을 생성할 때
  - Then `new Date().toISOString()`만 사용해야 하며 `Temporal` API를 사용하지 않아야 함(정적 점검 기준: `"Temporal"` 문자열 0건)
- AC-4 [S][P1]: Scenario: 저장소 상태가 비정상인 동안 헬스 상태가 기록됨(빈/로딩 대응)
  - Given localStorage 접근이 불가한 상태일 때
  - While 앱이 헬스 체크를 수행할 때
  - Then `app.localStorageHealth.v1`에 `{ isAvailable: false, lastError: "LS_UNAVAILABLE" }`가 저장되거나(가능한 경우) 저장 실패 시에도 앱이 정상 렌더링되어야 함

---

### F6. 로컬 데이터 초기화(확인 상태 삭제/리셋)
- Description: 사용자가 로컬에 저장된 “확인(ack)” 상태를 직접 초기화할 수 있는 최소 기능을 제공한다. (개인정보/저장소 관리 기대 충족, 테스트 편의성)
- Data: `PolicyBlockAcknowledgement`, `LocalStorageHealth`
- API: 없음
- Requirements:
  - Screen Definitions:
    - 적용 화면: `PolicyBlockHome`(`/`) 내에서만 제공(추가 라우트 생성 금지)
    - 진입 UI:
      - `/` 화면 내에 `ListRow` 1개를 제공하고 타이틀 텍스트를 “확인 상태 초기화”로 고정한다.
      - 해당 `ListRow` 탭 시 `BottomSheet`가 열리고, 사용자에게 초기화 확인을 받는다.
    - BottomSheet 구성:
      - `Paragraph.Text`로 경고 문구 포함: “이 기기에서 저장된 확인 기록이 삭제돼요.”
      - `Button` 2개: “취소”, “초기화”
    - 완료/실패 피드백:
      - 성공 시 `Toast` “초기화했어요” 2초
      - 실패 시 `Toast` “초기화에 실패했어요” 2초
    - Spacing:
      - 화면 구성 요소 사이 간격은 `Spacing`만 사용
- **AC-1 [E][P0]: Scenario: 초기화 진입점(ListRow) 노출**
  - Given 사용자가 `/` 화면에 있을 때
  - When 화면이 렌더링될 때
  - Then `ListRow` 중 타이틀이 “확인 상태 초기화”인 항목이 **정확히 1개** 존재해야 함
  - And 존재하지 않거나 2개 이상이면 **FAIL**
- **AC-2 [E][P0]: Scenario: 초기화 확인 BottomSheet 노출 및 버튼 2개 구성**
  - Given 사용자가 `/` 화면에서 “확인 상태 초기화” `ListRow`를 탭했을 때
  - When `BottomSheet`가 열릴 때
  - Then `BottomSheet` 내부 렌더 트리에 `Paragraph.Text`로 “이 기기에서 저장된 확인 기록이 삭제돼요.” 문구가 **존재**해야 함
  - And 라벨이 “취소”인 `Button`과 라벨이 “초기화”인 `Button`이 **각각 1개씩 존재**해야 함(총 2개)
  - And 위 조건이 충족되지 않으면 **FAIL**
- **AC-3 [E][P0]: Scenario: 초기화 성공 시 policyBlock.ack.v1 삭제 및 UI 반영**
  - Given localStorage에 `policyBlock.ack.v1` 키가 존재하고 값이 무엇이든(정상/손상 포함) 들어 있는 상태에서
  - When 사용자가 BottomSheet에서 “초기화” 버튼을 탭했을 때
  - Then `localStorage.getItem("policyBlock.ack.v1")` 결과가 `null`이어야 함
  - And `Toast`로 “초기화했어요” 문구가 2초 동안 표시되어야 함
  - And (재렌더/상태 반영 조건) 같은 세션에서 `/` 화면 본문에 “이미 확인했어요” 문자열이 **존재하면 FAIL** (초기화 후에는 acknowledged 상태 표시가 사라져야 함)
- **AC-4 [W][P1]: Scenario: 초기화 시 localStorage 제거 동작이 실패(SecureError 등)해도 크래시 없이 실패 토스트 및 LS_UNAVAILABLE 기록**
  - Given 브라우저 환경에서 `localStorage.removeItem("policyBlock.ack.v1")` 호출이 `SecurityError`(또는 동등한 예외)를 throw하는 상태일 때
  - When 사용자가 BottomSheet에서 “초기화” 버튼을 탭할 때
  - Then 앱이 크래시(흰 화면)하지 않아야 함
  - And `Toast`로 “초기화에 실패했어요” 문구가 2초 동안 표시되어야 함
  - And (가능한 경우) localStorage의 `app.localStorageHealth.v1`에 `lastError: "LS_UNAVAILABLE"`, `isAvailable:false`가 포함되어 저장되어야 함

---

## Assumptions
- PRD가 “정책 위반으로 등록 불가”임을 명시하므로, 본 MVP는 금융상품 비교/추천/순위/조합 추천 등 핵심 기능을 **구현하지 않는다**.
- 외부 API/서버가 없으므로 네트워크 의존 기능은 없다.
- 앱은 Toss 앱 컨테이너에서 모바일 중심으로 실행되며, 모든 인터랙션은 TDS 기본 컴포넌트 규격(터치 타겟 ≥ 44px)을 따른다.

---

## Open Questions
1. 정책 위반 안내 문구를 PRD 원문 그대로 노출해야 하는지, 아니면 내부 문구 가이드에 맞춘 축약 문구가 필요한지(현재 SPEC은 PRD 기반 요약+핵심 문구 포함).
2. 배너 광고(AdSlot)를 정책 위반 안내 화면에 노출하는 것이 내부적으로 허용되는지(수익화 목적이더라도 오해 소지/심사 기준 확인 필요).
3. 차단 상태에서 “문의/피드백” 같은 추가 기능을 허용할지 여부(현재 PRD에 없으므로 MVP에서는 제외).
4. (추가) “이미 확인했어요” 상태 표시에 `Chip`를 반드시 사용할지, `Paragraph.Text`만으로 충분한지(현재 SPEC은 둘 중 하나 허용하되, 문자열 존재는 AC로 고정).