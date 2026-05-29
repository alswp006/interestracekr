import { useState, useEffect, useRef } from "react";
import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";
import "@/styles/reward-ad.css";

interface TossRewardAdProps {
  /** 광고 슬롯 ID (앱인토스 콘솔에서 발급) */
  slotId: string;
  /** 광고 시청 완료 후 보여줄 콘텐츠 */
  children: React.ReactNode;
  /** 광고 시청 전 표시할 안내 문구 */
  description?: string;
  /** 광고 버튼 텍스트 */
  buttonText?: string;
  /** 광고 시청 완료 콜백 */
  onRewarded?: () => void;
  /** 광고 로드 타임아웃 (ms). 초과 시 자동 언락 */
  timeoutMs?: number;
}

/**
 * 보상형 광고 게이트 컴포넌트.
 * 광고 시청 완료 전까지 children을 숨기고, 시청 후 노출합니다.
 * 광고 로드 실패 / 타임아웃 / 앱인토스 외 환경(개발 브라우저 등) → 자동 언락.
 *
 * SDK는 loadFullScreenAd + showFullScreenAd를 imperative API로 제공하므로
 * 이 컴포넌트가 React 래핑 레이어 역할을 합니다.
 *
 * ```tsx
 * <TossRewardAd slotId="result-unlock">
 *   <ResultContent data={result} />
 * </TossRewardAd>
 * ```
 */
export function TossRewardAd({
  slotId,
  children,
  description = "광고를 시청하면 결과를 확인할 수 있어요",
  buttonText = "광고 보고 확인하기",
  onRewarded,
  timeoutMs = 15000,
}: TossRewardAdProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the ad on mount
  useEffect(() => {
    try {
      loadFullScreenAd({
        slotId,
        onEvent: () => setAdLoaded(true),
        onError: () => {
          // Load failed (e.g., local browser) — auto-unlock
          setUnlocked(true);
          onRewarded?.();
        },
      } as Parameters<typeof loadFullScreenAd>[0]);
    } catch {
      // SDK not available (e.g., jsdom) — auto-unlock
      setUnlocked(true);
      onRewarded?.();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotId]);

  if (unlocked) {
    return <>{children}</>;
  }

  const handleWatch = () => {
    setIsShowing(true);

    // Timeout fallback
    timeoutRef.current = setTimeout(() => {
      setUnlocked(true);
      onRewarded?.();
    }, timeoutMs);

    try {
      showFullScreenAd({
        slotId,
        onEvent: (event: { type?: string }) => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          // event.type === 'rewarded' indicates completion (SDK version-dependent)
          // For safety, unlock on any event that finishes the ad
          setUnlocked(true);
          setIsShowing(false);
          if (event?.type === "rewarded" || event?.type === "completed") {
            onRewarded?.();
          } else {
            // dismissed or other — still unlock for UX (policy: gate only final payoff)
            onRewarded?.();
          }
        },
        onError: () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          // Playback failed — unlock as fallback
          setUnlocked(true);
          setIsShowing(false);
          onRewarded?.();
        },
      } as Parameters<typeof showFullScreenAd>[0]);
    } catch {
      // SDK call threw — unlock
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setUnlocked(true);
      setIsShowing(false);
      onRewarded?.();
    }
  };

  return (
    <div className="reward-ad-gate">
      <p className="reward-ad-description">{description}</p>
      <button
        className={`reward-ad-button${isShowing ? " reward-ad-button--loading" : ""}`}
        onClick={handleWatch}
        disabled={isShowing || !adLoaded}
        aria-label={buttonText}
      >
        {isShowing ? "광고 재생 중..." : !adLoaded ? "광고 준비 중..." : buttonText}
      </button>
    </div>
  );
}
