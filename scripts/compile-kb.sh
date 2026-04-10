#!/bin/bash
#
# BKGrit Knowledge Base — Master Compilation Pipeline
#
# Usage: ./scripts/compile-kb.sh [--fetch-only] [--compile-only] [--health-check]
#
# Steps:
#   1. Fetch fresh data from ESPN API → kb/raw/
#   2. Run Claude CLI to compile raw → wiki
#   3. Update changelog and index
#   4. Git commit + push (triggers Vercel rebuild)
#
# Environment:
#   ANTHROPIC_API_KEY — required for Claude CLI
#   CLAUDE_MODEL — optional, defaults to claude-sonnet-4-6
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TODAY=$(date +%Y-%m-%d)
LOG_PREFIX="[KB $TODAY]"

echo ""
echo "═══════════════════════════════════════════"
echo "  BKGrit KB Pipeline — $TODAY"
echo "═══════════════════════════════════════════"
echo ""

cd "$PROJECT_DIR"

# ─── Parse args ───
FETCH_ONLY=false
COMPILE_ONLY=false
HEALTH_CHECK=false

for arg in "$@"; do
  case $arg in
    --fetch-only) FETCH_ONLY=true ;;
    --compile-only) COMPILE_ONLY=true ;;
    --health-check) HEALTH_CHECK=true ;;
  esac
done

# ─── Step 1: Fetch fresh data ───
if [ "$COMPILE_ONLY" = false ]; then
  echo "$LOG_PREFIX Step 1: Fetching data from ESPN..."
  npx tsx scripts/fetch-espn.ts --type all
  echo ""
fi

# ─── Step 2: Compile raw → wiki ───
if [ "$FETCH_ONLY" = false ] && [ "$HEALTH_CHECK" = false ]; then
  echo "$LOG_PREFIX Step 2: Compiling knowledge base..."

  # Check if Claude CLI is available
  if ! command -v claude &> /dev/null; then
    echo "  ⚠ Claude CLI not found. Skipping compilation."
    echo "  Install: npm install -g @anthropic-ai/claude-code"
    echo "  Or run manually: claude \"Read kb/templates/compile-prompt.md and compile the KB\""
  else
    claude --print "Read the file kb/templates/compile-prompt.md and follow its instructions to compile the knowledge base. Read all files in kb/raw/ that have been updated since the last entry in kb/CHANGELOG.md, then update the relevant wiki articles in kb/wiki/. Update kb/CHANGELOG.md and kb/wiki/INDEX.md when done."
  fi
  echo ""
fi

# ─── Step 3: Health Check (optional) ───
if [ "$HEALTH_CHECK" = true ]; then
  echo "$LOG_PREFIX Running health check..."

  if ! command -v claude &> /dev/null; then
    echo "  ⚠ Claude CLI not found. Skipping health check."
  else
    claude --print "Read the file kb/templates/health-check-prompt.md and follow its instructions to audit the knowledge base."
  fi
  echo ""
fi

# ─── Step 4: Git commit + push ───
if [ "$FETCH_ONLY" = false ]; then
  echo "$LOG_PREFIX Step 3: Checking for changes..."

  if git diff --quiet kb/ && git diff --cached --quiet kb/; then
    echo "  No KB changes to commit."
  else
    echo "  Changes detected. Committing..."
    git add kb/
    git commit -m "KB auto-update: $TODAY — fetched + compiled

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

    echo "  Pushing to trigger deploy..."
    git push
    echo "  ✅ Pushed. Vercel will rebuild."
  fi
fi

echo ""
echo "$LOG_PREFIX Pipeline complete."
echo ""
