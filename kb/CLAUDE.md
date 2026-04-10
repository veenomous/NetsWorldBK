# BKGrit Knowledge Base — Claude Instructions

## What This Is
Brooklyn Nets knowledge base for bkgrit.com. An LLM-compiled wiki following the Karpathy pattern: raw sources are collected, then compiled by Claude into organized wiki articles that power the site.

## Structure
- `raw/` — Source material (transactions, pressers, scouting reports, beat reporter notes, stats, media). Never edit these.
- `wiki/` — LLM-compiled knowledge articles. Claude maintains these.
- `wiki/INDEX.md` — Master index of all wiki articles. Always update after creating/editing articles.
- `templates/` — Prompts for compilation and article templates.

## Raw Source Categories
| Directory | Contents |
|-----------|----------|
| `raw/transactions/` | Official NBA transactions (trades, signings, waivers, extensions) |
| `raw/pressers/` | Press conference transcripts and summaries |
| `raw/scouting/` | Draft prospect reports and evaluations |
| `raw/beat-reporters/` | Tweets and articles from Nets beat writers |
| `raw/stats/` | Notable stat snapshots and analysis |
| `raw/media/` | Screenshots, clips, images |

## Wiki Categories
| Directory | Contents |
|-----------|----------|
| `wiki/players/` | One article per relevant player (current roster, key former players, trade targets) |
| `wiki/seasons/` | Season narrative arcs — living docs updated throughout the year |
| `wiki/trades/` | Trade trees and analysis |
| `wiki/front-office/` | FO strategy, cap management, decision-making patterns |
| `wiki/draft/` | Draft-specific articles (prospects, pick values, draft history) |
| `wiki/rivalries/` | Matchup histories and rivalry narratives |
| `wiki/concepts/` | Basketball concepts in Nets context (tank math, CBA rules, etc.) |

## Key Commands

### Compile (process new raw sources into wiki)
Read all files in `raw/` and create/update wiki articles. Follow instructions in `templates/compile-prompt.md`.

### Query (ask questions against the wiki)
Read relevant wiki articles and answer questions. Cite which articles were used.

### Health Check
Find stale articles, contradictions, gaps, and suggest new articles to research.

## Rules
1. **Never edit files in `raw/`** — they are immutable source material
2. **Always use `[[wikilinks]]`** to connect related wiki articles
3. **Always update `wiki/INDEX.md`** after creating or modifying articles
4. Include **confidence levels** (high/medium/low) based on source quality and recency
5. Be specific — "traded pick #6 for Mikal Bridges" not "traded a pick for a player"
6. Each wiki article needs: frontmatter (title, tags, sources, confidence), Summary, Key Insights, Details, Related, Open Questions
7. Date all claims — NBA context changes fast. Use "as of YYYY-MM-DD" for time-sensitive facts
8. **Nets-first perspective** — every article should be framed through the Brooklyn Nets lens

## Site Integration
- Wiki articles render as pages under `/kb` route on bkgrit.com
- The Wire feed can pull from compiled wiki articles
- Trade Machine and War Room get contextual sidebars powered by KB queries
- `graph.json` (from graphify) deploys with the site for contextual links
