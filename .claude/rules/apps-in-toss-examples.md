# Apps-in-Toss 공식 예제 매핑

토스가 제공하는 공식 mini-app 예제(`@granite-js/aite`)는 SDK API 사용법의 **그라운드 트루스**입니다.
새 기능을 구현하기 전에 해당 예제가 있는지 먼저 확인하세요. 예제는 작고(보통 < 200 LOC) 검증된 패턴이라 추측보다 안전합니다.

## 기능 → 예제 매핑

| 기능 카테고리 | 예제 | 트랙 | 핵심 SDK API / 패턴 |
|---|---|---|---|
| **TDS 풀 페이지 (web)** | `with-contacts-viral` | Web | `TDSMobileAITProvider`, `useDialog`, `Top`, `Asset.ContentIcon`, `Switch` |
| **공유 (텍스트)** | `with-share-text` | RN/Web | `share({ text })` 패턴 |
| **공유 (URL/딥링크)** | `with-share-link` | RN/Web | `share({ url })` |
| **클립보드** | `with-clipboard-text` | RN | `getClipboardText`, `setClipboardText` |
| **연락처 읽기** | `with-contacts` | RN | `fetchContacts` 권한 게이트 |
| **연락처 + 게임 통합** | `with-contacts-viral` | Web | 권한 게이트 + 게임 로직 결합 (큰 예제) |
| **카메라** | `with-camera` | RN | `openCamera({ onEvent, onError })` |
| **앨범 사진** | `with-album-photos` | RN | `fetchAlbumPhotos` |
| **로그인 통합 확인** | `with-app-login` | RN | `getIsTossLoginIntegratedService` |
| **인앱 결제 (IAP)** | `with-in-app-purchase` | RN | `createOneTimePurchaseOrder`, `processProductGrant` 콜백 |
| **풀스크린 광고** | `with-interstitial-ad` | RN | `loadFullScreenAd`, `showFullScreenAd` |
| **리워드 광고** | `with-rewarded-ad` | RN | 풀스크린과 동일 API + 보상 처리 |
| **햅틱 피드백** | `with-haptic-feedback` | RN | `generateHapticFeedback({ type })` 모든 type |
| **위치 (1회)** | `with-location-once` | RN | `getCurrentLocation` |
| **위치 (콜백 구독)** | `with-location-callback` | RN | `startUpdateLocation` 콜백 |
| **위치 (지속 추적)** | `with-location-tracking` | RN | 백그라운드 추적 패턴 |
| **네트워크 상태** | `with-network-status` | RN | 온라인/오프라인 감지 |
| **로케일/언어** | `with-locale` | RN | 한/영 전환 |
| **플랫폼 분기** | `with-platform-os` | RN | iOS/Android 분기 |
| **운영환경 (sandbox/prod)** | `with-operational-environment` | RN | `env` 객체 |
| **로컬 저장소** | `with-storage` | RN | `Storage.setItem/getItem/removeItem` |
| **간단한 게임** | `with-game`, `random-balls` | RN/Web | 게임 루프, 점수 |
| **Todo (3가지 프레임워크)** | `weekly-todo-jquery`, `weekly-todo-react`, `weekly-todo-vue` | Web (TDS 미사용) | 프레임워크 비교 (TDS 학습 X) |

## 트랙 구분

- **RN (React Native)**: `@granite-js/react-native`, `@toss/tds-react-native` 사용. 우리 토스 미니앱 템플릿(웹)과 다른 트랙.
- **Web**: `@toss/tds-mobile`, `TDSMobileAITProvider` 사용. **우리 템플릿이 이쪽 트랙.**

➜ Web track 예제는 `with-contacts-viral` 하나뿐. 나머지는 RN 예제이지만 **SDK 함수 사용법은 동일** (import 위치만 다름). RN 예제도 SDK API 호출 패턴 학습용으로 유용.

## 사용 가이드

1. **새 기능 구현 전**: 위 표에서 해당 기능 검색
2. **예제 위치 (CI/로컬 환경에 있다면)**: `/tmp/aite/<example-name>/src/`
3. **공식 저장소**: https://github.com/granite-js/aite (필요 시 사용자가 클론 후 `/tmp/aite`에 위치)
4. **예제 코드 그대로 복사 금지**: SDK API 호출 패턴만 참조하고, UI는 우리 템플릿의 TDS 패턴(`tds-patterns.md`) 준수
5. **여러 기능 결합**: 예제 1개 = 1개 기능 중심. 결합은 `with-contacts-viral`(연락처+게임+TDS) 참조
