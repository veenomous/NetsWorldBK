# BKGrit Knowledge Base — Compilation Prompt

## Quick Run

```bash
cd /path/to/NetsWorldBK
claude "Read kb/templates/compile-prompt.md and follow the instructions to compile the knowledge base."
```

## Full Compilation Instructions

You are a Brooklyn Nets knowledge base compiler. Your job is to read raw source material and compile it into a structured wiki about the Brooklyn Nets.

### Step 1: Read All Raw Sources

Read every file in `kb/raw/` and its subdirectories (transactions, pressers, scouting, beat-reporters, stats, media). Note what's new since the last compilation by checking dates against `kb/CHANGELOG.md`.

### Step 2: Update or Create Wiki Articles

For each piece of raw material, extract key insights and update the relevant wiki article(s):
- `wiki/players/` — One article per relevant player
- `wiki/seasons/` — Season narrative arcs (living docs)
- `wiki/trades/` — Trade trees and analysis
- `wiki/front-office/` — FO strategy and decisions
- `wiki/draft/` — Draft-specific articles
- `wiki/rivalries/` — Matchup histories
- `wiki/concepts/` — Basketball concepts in Nets context

### Step 3: Article Format

Every wiki article MUST follow this format:

```markdown
---
title: Article Title
tags: [tag1, tag2, tag3]
sources: [raw/path/file.md, raw/path/file2.md]
confidence: high/medium/low
last_updated: YYYY-MM-DD
---

## Summary
One paragraph summary framed from the Nets perspective.

## Key Insights
- Bullet points of the main takeaways

## Details
Full explanation with specifics — names, dates, pick numbers, contract figures.

## Related
- [[Link to related wiki articles]]

## Open Questions
- Things we don't know yet about this topic
```

### Step 4: Update CHANGELOG.md

After every compilation, append entries to `kb/CHANGELOG.md`:

```markdown
## YYYY-MM-DD
- **Article Name** — One-line description of what changed
- **New Article Name** — Created: brief description
```

### Step 5: Update INDEX.md

Update `kb/wiki/INDEX.md` with:
- Correct article count and last compiled date in frontmatter
- Every article listed with a one-line summary
- Updated Key Themes section reflecting current state

### Compilation Rules

1. **Never edit `raw/` files** — they are immutable source records
2. **Always use `[[wikilinks]]`** to connect related wiki articles
3. **Be specific** — "Demin: 10.3 PPG, 3.3 APG in 24 minutes" not "Demin played ok"
4. **Date everything** — NBA context is perishable. Use "as of YYYY-MM-DD" for stats
5. **Nets-first perspective** — every article framed through Brooklyn's lens
6. **Include ALL picks** — first-round AND second-round picks in every trade article
7. **Specify protections** — "unprotected", "top-4 protected", etc. on every pick
8. **Note picks traded away** — if a pick was later traded to another team, say so
9. **Verify before publishing** — read `kb/templates/verification-checklist.md` and run through it before finalizing any article
10. **Wikilinks must match exact article titles** — use `[[Sean Marks Era]]` not `[[Sean Marks]]`. Check existing filenames in kb/wiki/ before creating wikilinks.
11. **Include source URLs** — when a raw file has a `source_url` field, include it as a clickable link in the wiki article. Format: `[Article Title](url)` so fans can read the original source.

### Confidence Rules

- **High**: Based on official transactions, box scores, or 3+ independent sources
- **Medium**: Based on 2 sources, or beat reporter analysis
- **Low**: Based on single tweet, rumor, or speculation

If a new source contradicts an existing article:
- Note both claims in the article
- Flag which source is more authoritative
- Set confidence to "low" on the disputed claim
- Add to Open Questions

### Cross-Reference Protocol

When compiling, actively look for connections:
- Player mentioned in a trade? Link to both the player article AND trade article
- Stats that inform a season narrative? Link to the season article
- Pick used in draft? Link to the pick inventory AND draft article
- Beat reporter quote about FO strategy? Link to front-office article

### Agent Tier Guidance

- **Routine updates** (stats changed, record updated, minor roster move): Sonnet tier
- **New article creation** (new player profile, new trade analysis): Opus tier
- **Editorial judgment** (scouting analysis, FO strategy reads, "what if" scenarios): Opus tier
- **Data formatting** (raw source cleanup, wikilink validation): Haiku tier
