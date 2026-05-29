import { useEffect, useRef } from "react";
import { TossAds } from "@apps-in-toss/web-framework";

interface AdSlotProps {
  /** 광고 그룹 ID — 앱인토스 콘솔에서 발급받아 입력 */
  adGroupId: string;
  className?: string;
  /** 'card' (기본) | 'expanded' */
  variant?: "card" | "expanded";
  /** 'auto' (기본 — 시스템 다크모드 추종) | 'light' | 'dark' */
  theme?: "auto" | "light" | "dark";
}

let tossAdsInitialized = false;

function ensureInitialized() {
  if (tossAdsInitialized) return;
  if (!TossAds.initialize.isSupported?.()) return;
  TossAds.initialize({});
  tossAdsInitialized = true;
}

/**
 * 배너 광고 슬롯 — TossAds.attachBanner의 React 래퍼.
 *
 * SDK는 imperative API: 빈 DOM 노드에 attachBanner(adGroupId, element)를
 * 호출하면 SDK가 해당 노드 안에 배너를 렌더링. cleanup은 result.destroy().
 *
 * 앱인토스 WebView 외 환경(로컬 브라우저, jsdom)에서는 isSupported가
 * false → 조용히 빈 영역 반환.
 */
export function AdSlot({ adGroupId, className, variant, theme }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;
    if (!TossAds.attachBanner.isSupported?.()) return;

    ensureInitialized();

    let result: { destroy: () => void } | null = null;
    try {
      result = TossAds.attachBanner(adGroupId, target, { variant, theme });
    } catch {
      /* SDK unavailable or attach failed — silent */
    }

    return () => {
      try {
        result?.destroy();
      } catch {
        /* cleanup best-effort */
      }
    };
  }, [adGroupId, variant, theme]);

  return <div ref={containerRef} data-ad-group-id={adGroupId} className={className ?? "ad-slot"} />;
}
