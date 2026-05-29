#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Navigate to repo root (kits are at .ai-factory/kits/<id>/run.sh — 3 levels up)
WORK_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$WORK_DIR"

# Claude Code CLI check
if ! command -v claude &> /dev/null; then
  echo "Error: claude CLI not found."
  echo "Install: npm install -g @anthropic-ai/claude-code"
  exit 1
fi

PACKET_ID="0009"
# set -e 아래에서 서브셸 내 || 는 작동하나, 서브셸 자체 실패 시 조용히 빈 값
TITLE="$(node -p "require('$SCRIPT_DIR/manifest.json').title" 2>/dev/null)" || TITLE="Unknown"
TITLE="${TITLE:-Unknown}"
echo "=== AI Factory Kit: $PACKET_ID — $TITLE ==="
echo "Working directory: $WORK_DIR"
echo ""

# Run Claude Code with the kit prompt
# set -e 를 일시 해제하여 코딩 실패 시에도 안내 블록 출력 보장
set +e
claude --dangerously-skip-permissions -p "$(cat "$SCRIPT_DIR/PROMPT.md")"
CODING_EXIT=$?
set -e

if [ "$CODING_EXIT" -ne 0 ]; then
  echo ""
  echo "⚠️  코딩 중 오류 발생 (exit code: $CODING_EXIT)"
  echo ""
  echo "현재 패킷을 먼저 해결하세요:"
  echo "  1. PROMPT.md를 읽고 실패 원인 파악"
  echo "  2. 이 스크립트를 재실행: bash $SCRIPT_DIR/run.sh"
  echo ""
  echo "다음 패킷은 이 패킷이 완료된 후에 실행하세요."
else
  echo ""
  echo "✅ 코딩 완료!"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "다음 단계 (순서 엄수):"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "1. 코드 리뷰 (선택 — Max 구독 무료):"
  echo "   bash $SCRIPT_DIR/review.sh"
  echo ""
  echo "2. 다음 패킷이 있으면:"
  NEXT_DEPS=$(node -p "require('$SCRIPT_DIR/manifest.json').dependsOn ? require('$SCRIPT_DIR/manifest.json').dependsOn.join(', ') : '없음'" 2>/dev/null)
  NEXT_DEPS="${NEXT_DEPS:-확인 불가}"
  echo "   이 패킷의 선행 패킷: $NEXT_DEPS"
  echo "   다음 패킷 실행: bash .ai-factory/kits/<next-id>/run.sh"
  echo ""
  echo "3. 모든 패킷 완료 후 오케스트레이터에 결과 import:"
  echo "   pnpm --filter @ai-factory/orchestrator kit:import <project-id>"
  echo "   (import 전 반드시 git push 필요)"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
