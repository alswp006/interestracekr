# App-in-Toss Development Master Guide for AI Agents

This document contains the absolute rules from the latest official Toss documentation (2026) for developing mini-apps that run inside the Toss app. The AI MUST prioritize these rules above all else when generating code.

## GROUND TRUTH
**For exact SDK API usage, read `.ai-factory/apps-in-toss-essential.txt` — it contains verified exports from the installed `@apps-in-toss/web-framework` `.d.ts` files.** Do not guess SDK API names; if not in that reference, it doesn't exist.

## 1. Architecture & Runtime Environment
- **Rendering:** App-in-Toss WebView supports SSG or CSR ONLY. **Dynamic SSR strictly forbidden.** Next.js requires `output: 'export'` in `next.config.mjs`.
- **Minimum OS support:** Android 7+, iOS 16+.
- **Routing scheme:** `intoss://{appName}` for sandbox and production testing.

## 2. Dependencies & Package Installation
- **Package name:** `@apps-in-toss/web-framework` (NOT `@apps-in-toss/framework` — that's a legacy/wrong name)
- **Install command:** `npm install @apps-in-toss/web-framework@latest @toss/tds-mobile@latest @emotion/react@^11`
- Always use `@latest` for Toss packages — hardcoded old versions cause ETARGET errors.
- **TDS is mandatory:** Custom UI to mimic TDS components → instant review rejection.

## 3. Configuration (`granite.config.ts`)
- `appName`: English app ID registered in console (case-sensitive — mismatch causes 4031 deploy error)
- `displayName`: User-facing app name
- `primaryColor`: TDS theme color (RGB HEX, e.g., `#3182F6`)
- `webViewProps.type`: `partner` for non-game, `game` for game apps
- `permissions`: Device permissions array (e.g., `{ name: "clipboard", access: "write" }`)

## 4. TDS (Toss Design System) Absolute Rules
- **NEVER override margin/padding:** TDS components have built-in padding. Use TDS `Spacing` (size prop required) for gaps. ListRow has NO padding prop.
- **Use auto-layout:** Flexbox `gap` only.
- **No external fonts:** Toss Products Sans auto-applied.

## 5. Core API & SDK Integration

**Import from `@apps-in-toss/web-framework`.** All SDK APIs are **imperative functions with `onEvent`/`onError` callbacks**, not React hooks.

**There are NO `useTossLogin`, `useTossAd`, `useTossPayment` hooks in the SDK.**

### Haptic feedback
```typescript
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
generateHapticFeedback({ type: "tickWeak" });    // Toggle, Chip
generateHapticFeedback({ type: "success" });      // Major CTA
```

### Storage (native persistence)
```typescript
import { Storage } from '@apps-in-toss/web-framework';
await Storage.setItem('key', 'stringValue');
const value = await Storage.getItem('key');  // string | null
await Storage.removeItem('key');
```

### Promotion (user rewards)
```typescript
import { grantPromotionReward } from '@apps-in-toss/web-framework';
await grantPromotionReward({
  promotionCode: 'CONSOLE_CODE',    // from 앱인토스 콘솔
  amount: 1000,                       // ≤ 5000 per user (cumulative)
});
```

### Ads — imperative only, NOT React components
- Banner: `TossAds` namespace — `TossAds.initialize({})` once, then `TossAds.attachBanner(adGroupId, targetEl, options?)` returns `{ destroy }` for cleanup
- Reward/Interstitial: `loadFullScreenAd` + `showFullScreenAd` — top-level functions with `onEvent` / `onError` callbacks
- All TossAds methods have `.isSupported()` for capability check before use
- **NO `loadAdMob` / `showAdMob` / `isAdMobLoaded` exports** — those names do not exist in the SDK
- **NO `TossRewardAd` or `AdSlot` in the SDK.** If needed as React component, wrap the imperative API in `src/components/` yourself. See `.ai-factory/apps-in-toss-essential.txt`.

### Login — no SDK API
Toss app provides user session automatically. NO `useTossLogin` or `login()` to call. Use `getIsTossLoginIntegratedService()` to check integration status (configured in 앱인토스 콘솔).

### In-App Purchase (IAP)
```typescript
import { createOneTimePurchaseOrder, createSubscriptionPurchaseOrder } from '@apps-in-toss/web-framework';
createOneTimePurchaseOrder({
  options: {
    sku: 'product-id',
    processProductGrant: async ({ orderId }) => true,  // backend call
  },
  onEvent: (event) => { /* success */ },
  onError: (error) => { /* ... */ },
});
```
NO `useTossPayment` hook.

### Analytics (SDK only — external tools forbidden)
```typescript
import { Analytics } from '@apps-in-toss/web-framework';
Analytics.screen({ log_name: 'Home' });
Analytics.click({ log_name: 'CTA', salary: 50000000 });
```

## 6. 인앱광고 수수료 정책 (2026.04.01~)
- 인앱광고(IAA) 수수료 15% 적용 — 수익 UI에 순수익/총수익 구분 표시 권장
- 순수익 = 총수익 × 0.85
- 외부 로깅/분석 솔루션 (GA, Amplitude 등) 금지 — 반드시 SDK `Analytics` 사용

## 7. Deployment
- Deploy to Toss CDN (NOT Vercel, AWS, external clouds).
- Deploy command: `npx ait deploy --api-key $APPS_IN_TOSS_API_KEY`

## 8. Review Checklist (Must Pass All)
- Users must be 19+ — no minor-targeted content
- No external domain navigation (outlinks) — all flows within the app
- Zero console.error in production build
- Zero CORS errors on external API calls
- Android 7+ / iOS 16+ compatible Web APIs only
- 외부 로깅/분석 솔루션 사용 금지 — SDK `Analytics`만
- HEX 색상 하드코딩 금지 — TDS 컴포넌트 또는 `var(--tds-color-*)` CSS 변수만 (다크모드 필수)
- 앱 설치 유도 금지
- 프로모션 지급 한도 — `grantPromotionReward` amount ≤ 5000
