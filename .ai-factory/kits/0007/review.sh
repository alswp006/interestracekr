#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Navigate to repo root (kits are at .ai-factory/kits/<id>/ — 3 levels up)
WORK_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$WORK_DIR"

if ! command -v claude &> /dev/null; then
  echo "Error: claude CLI not found."
  echo "Install: npm install -g @anthropic-ai/claude-code"
  exit 1
fi

PACKET_ID="0007"
TITLE="$(node -p "require('$SCRIPT_DIR/manifest.json').title" 2>/dev/null || echo "Unknown")"
echo "=== AI Factory Review: $PACKET_ID — $TITLE ==="
echo "Working directory: $WORK_DIR"
echo ""
echo "스펙 준수 / 조용한 실패 / 정책 위반 — 3개 리뷰어 병렬 실행"
echo ""

# Run 3-agent parallel review via Claude Code (interactive mode)
# NOTE: -p (--print) 플래그 제거 — Agent 툴은 대화형(interactive) 모드에서만 작동.
#       -p 비대화식 모드에서는 Agent 호출이 텍스트로만 전달되어 실제 병렬화 불가.
#       Max 구독 필요 (무료 사용 — API 비용 없음).
claude --dangerously-skip-permissions < "$SCRIPT_DIR/REVIEW.md"
