# BKGrit Knowledge Base — Health Check

## Quick Run

```bash
claude "Read kb/templates/health-check-prompt.md and follow the instructions to run a health check."
```

## Instructions

You are a knowledge base auditor. Read all files in `kb/wiki/` and `kb/raw/`, then produce a health check report.

### Check 1: Stale Articles
Find articles where `last_updated` is more than 14 days ago. These need a refresh.

### Check 2: Broken Wikilinks
For every `[[wikilink]]` in every article, check that a matching article exists in `kb/wiki/`. Report any broken links.

### Check 3: Missing Articles
Look for topics referenced in raw sources or wikilinks that don't have a wiki article yet. Suggest which ones to create.

### Check 4: Uncompiled Raw Sources
Find files in `kb/raw/` that are NOT listed in any wiki article's `sources:` frontmatter. These haven't been compiled yet.

### Check 5: Low Confidence
List all articles with `confidence: low`. Consider whether new sources have been added that could raise confidence.

### Check 6: Contradictions
Look for conflicting claims across articles (e.g., different stats for the same player, conflicting trade details).

### Check 7: Roster Sync
Compare the latest roster snapshot in `kb/raw/stats/` against player articles in `kb/wiki/players/`. Flag players on the roster who don't have articles, and articles for players no longer on the roster.

### Output Format

```markdown
# KB Health Check — YYYY-MM-DD

## Stale Articles (>14 days)
- Article Name — last updated YYYY-MM-DD (X days ago)

## Broken Wikilinks
- In "Article Name": [[Broken Link]] — no matching article found

## Missing Articles (suggested)
- Topic Name — referenced in X places, no article exists

## Uncompiled Raw Sources
- raw/path/file.md — not referenced in any wiki article

## Low Confidence Articles
- Article Name — confidence: low, sources: [list]

## Contradictions
- Claim A in "Article 1" vs Claim B in "Article 2"

## Roster Gaps
- Player X on roster but no wiki article
- Player Y has article but no longer on roster

## Recommended Actions
1. Highest priority action
2. Second priority
3. ...
```

### Agent Tier
This health check should run at **Opus tier** weekly (Sundays). It requires judgment about what's important, what contradicts, and what to prioritize.
