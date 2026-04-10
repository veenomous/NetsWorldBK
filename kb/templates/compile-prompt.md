# BKGrit Knowledge Base — Compilation Prompt

## Run from the kb/ directory:

```
claude "Compile the BKGrit knowledge base. Read all files in raw/ and update wiki/ accordingly."
```

## Full Compilation Instructions

You are a Brooklyn Nets knowledge base compiler. Your job is to read raw source material and compile it into a structured wiki about the Brooklyn Nets.

### Rules

1. Read all files in `raw/` (transactions, pressers, scouting reports, beat tweets, stats)
2. For each piece of raw material, extract the key insights relevant to the Nets
3. Create or update wiki articles in the appropriate category:
   - `wiki/players/` — One article per player (e.g., "Cameron Johnson.md")
   - `wiki/seasons/` — Season narratives (e.g., "2024-25 Season.md")
   - `wiki/trades/` — Trade trees and analysis (e.g., "Kevin Durant Trade Tree.md")
   - `wiki/front-office/` — FO strategy (e.g., "Sean Marks Era.md")
   - `wiki/draft/` — Draft articles (e.g., "2025 NBA Draft.md")
   - `wiki/rivalries/` — Matchup histories (e.g., "Nets vs Knicks.md")
   - `wiki/concepts/` — Basketball concepts (e.g., "Tank Math.md")

4. Each wiki article must follow this format:

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

5. After updating articles, update `wiki/INDEX.md`:
   - List every article with a one-line summary
   - Group by category
   - Include article count and last compile date

6. Do NOT edit `raw/` files — they are source records
7. Do NOT delete wiki articles — mark them as `needs_review` if source data contradicts them
8. Use `[[wikilinks]]` to connect related articles
9. Be specific — "Cam Johnson: 19.4 PPG on .415 3PT%" not "Cam played well"
10. Note confidence level — single tweet = "low", official transaction + multiple reporters = "high"
11. Date everything — NBA context is perishable

### Cross-referencing

When compiling, actively look for connections:
- Player mentioned in a trade? Link to both the player article and trade article
- Scouting report for a pick the Nets own? Link to the draft article
- Beat reporter quote about FO strategy? Link to front-office article
- Stats that inform a season narrative? Link to the season article

### Handling Conflicts

If two sources disagree:
- Note both claims in the wiki article
- Flag which source is more authoritative
- Set confidence to "low" on the disputed claim
- Add to Open Questions

## Health Check Prompt

```
claude "Run a health check on the BKGrit KB. Find:
1. Stale articles (not updated in 30+ days)
2. Contradictions between articles
3. Topics in raw/ not yet compiled to wiki/
4. Players on the roster without wiki articles
5. Suggest 5 articles to research and add next"
```
