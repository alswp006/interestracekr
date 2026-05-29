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

```tsx
import { generateHapticFeedback } from '@apps-in-toss/web-framework';

interface GridItem { id: string; content: React.ReactNode }

interface InteractiveGridProps {
  items: GridItem[];
  cols: number;
  onTap: (id: string) => void;
}

export function InteractiveGrid({ items, cols, onTap }: InteractiveGridProps) {
  const handleTap = (id: string) => {
    generateHapticFeedback({ type: 'tickWeak' });
    onTap(id);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
        padding: '0 16px',
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handleTap(item.id)}
          style={{
            aspectRatio: '1',
            border: 'none',
            borderRadius: 12,
            backgroundColor: 'var(--adaptiveLayeredBackground)',
            cursor: 'pointer',
          }}
        >
          {item.content}
        </button>
      ))}
    </div>
  );
}
```

**핵심**: `generateHapticFeedback({ type: 'tickWeak' })` 셀 탭 / `'success'` 주요 CTA. CSS Grid + aspect-ratio. raw `<button>` 사용 OK (TDS Button은 텍스트 중심이라 그리드 셀에 부적합).

---

## Pattern 6 — 하단 고정 CTA (FixedBottomCTA)

**언제**: 페이지 1차 액션을 화면 하단에 고정 노출. 폼 제출, 결제, 다음 단계 진행 등.

```tsx
import { FixedBottomCTA, Button } from '@toss/tds-mobile';

interface SubmitFooterProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function SubmitFooter({ label, onClick, disabled }: SubmitFooterProps) {
  return (
    <FixedBottomCTA>
      <Button variant="fill" onClick={onClick} disabled={disabled}>
        {label}
      </Button>
    </FixedBottomCTA>
  );
}
```

**핵심**: `FixedBottomCTA`가 safe-area + 하단 그라데이션 자동 처리 (직접 position fixed 작성 금지). Button variant는 `'fill' | 'weak'`만.

---

## Pattern 7 — 일시 오버레이 애니메이션 (Portal)

**언제**: 액션 성공 시 화면 중앙에 잠깐 보였다 사라지는 피드백 (하트, 별, 체크 등).

**준비**: `index.html`에 `<div id="overlay" />` 추가 필요.

```tsx
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface OverlayProps {
  src: string;
  durationMs?: number;
}

export function useOverlayPulse({ src, durationMs = 900 }: OverlayProps) {
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(false);

  const pulse = useCallback(() => {
    setTick((t) => t + 1);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(id);
  }, [visible, tick, durationMs]);

  const portal = (() => {
    if (!visible) return null;
    const target = document.getElementById('overlay');
    if (!target) return null;
    return createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      >
        <img src={`${src}?v=${tick}`} alt="" style={{ width: 120, height: 120 }} />
      </div>,
      target,
    );
  })();

  return { pulse, portal };
}
```

**핵심**: APNG/GIF는 종료 이벤트 없음 → 타이머로 자동 숨김. `?v=${tick}` URL 캐시 우회로 같은 이미지 재재생 가능. `pointer-events: none`로 클릭 통과.

---

## Pattern 8 — 하단 버튼 컨테이너 (2개 이상 CTA)

**언제**: 1차/2차 CTA가 함께 있을 때 (예: "다시 시도" + "처음으로"). FixedBottomCTA는 단일 버튼용.

```tsx
import { Button, Spacing } from '@toss/tds-mobile';

interface ButtonStackProps {
  primary: { label: string; onClick: () => void; disabled?: boolean };
  secondary?: { label: string; onClick: () => void };
}

export function ButtonStack({ primary, secondary }: ButtonStackProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 16px calc(var(--toss-safe-area-bottom) + 12px)',
        backgroundColor: 'var(--adaptiveBackground)',
      }}
    >
      <Button variant="fill" onClick={primary.onClick} disabled={primary.disabled} display="block">
        {primary.label}
      </Button>
      {secondary && (
        <Button variant="weak" onClick={secondary.onClick} display="block">
          {secondary.label}
        </Button>
      )}
    </div>
  );
}
```

**핵심**: `display="block"` (전체 너비), safe-area 하단 패딩, primary는 `fill` / secondary는 `weak`. Spacing 컴포넌트 대신 flex `gap` (TDS는 플렉스 gap 권장).

---

## 패턴 적용 가이드

1. **새 페이지 생성 시**: Pattern 1(PageShell) + Pattern 2(Top) + Pattern 6/8(하단 CTA) 조합이 골든.
2. **모달이 필요할 때**: Pattern 4(라디오) 또는 Pattern 2(BottomSheet)
3. **상호작용 강화**: Pattern 5(햅틱) + Pattern 7(오버레이 펄스)
4. **상태 표시**: Pattern 3(StatusPanel)

## 다루지 않은 영역

- 결제 흐름 (`createOneTimePurchaseOrder` 패턴)
- 리워드 광고 게이트 (`loadFullScreenAd`/`showFullScreenAd`)
- 실시간/소켓 통신
- 딥링크 / Storage 공유
- AI 결과 노출 (생성형 AI 고지 의무 — 기존 `toss-mini-app.md` 참조)

이 영역들은 별도 레퍼런스/룰 파일에서 다룹니다.
