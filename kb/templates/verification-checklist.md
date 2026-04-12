# BKGrit KB — Verification Checklist

Run this checklist before publishing ANY wiki article or content update.
This exists because we shipped inaccurate pick data, missed second-round picks,
inflated trade haul numbers, and had inconsistencies between articles.

## Before Publishing ANY Article

### Trade Articles
- [ ] Every pick exchanged is listed (first AND second round)
- [ ] Pick protections are specified (unprotected, top-4 protected, etc.)
- [ ] Pick swap rights are listed separately from picks
- [ ] Every player exchanged is listed
- [ ] Trade date is exact (not approximate)
- [ ] Source URL or Wikipedia citation for the trade
- [ ] Cross-check: does the Pick Inventory article match this trade's claims?
- [ ] Cross-check: do player articles mention this trade correctly?

### Player Articles
- [ ] Current team verified (not assumed from old data)
- [ ] Stats are from the current or most recent season with date noted
- [ ] Contract details verified (salary, years remaining)
- [ ] Draft position verified (round, pick number, year)
- [ ] Trade history is accurate and matches trade articles

### Pick/Asset Articles
- [ ] Every first-round pick listed with: year, source team, protection, origin trade
- [ ] Every second-round pick listed separately
- [ ] Every pick swap right listed with year and teams involved
- [ ] Picks that were traded AWAY are clearly marked (to which team, when)
- [ ] Total counts match when you add everything up
- [ ] Cross-check: does the dashboard picks data (src/data/picks.ts) match?

### Rumor Articles
- [ ] Confidence level is honest (low if speculation, medium if beat reporters, high if official)
- [ ] Sources cited or explicitly noted as "no concrete reports"
- [ ] No claims stated as fact that are actually speculation
- [ ] Date stamped — rumors are perishable

### Season Articles
- [ ] Final record is correct (verified against ESPN/Basketball Reference)
- [ ] Coaching staff is current
- [ ] Key transactions during the season are mentioned
- [ ] Draft picks used that season are listed with correct pick numbers

## Before Updating Dashboard Data

### src/data/picks.ts
- [ ] Every pick year has correct entries
- [ ] Source team labels match the actual source
- [ ] Swap rights are flagged with isSwap: true
- [ ] Links point to correct wiki articles
- [ ] Total counts (totalFirstRoundPicks, totalSwaps) compute correctly

### src/data/kb-players.ts
- [ ] All listed players are currently on the Nets roster
- [ ] Stats are from the current season
- [ ] Status descriptions are accurate and current
- [ ] Links point to existing wiki articles

### src/data/standings.ts
- [ ] Records match current ESPN data
- [ ] Games remaining is accurate
- [ ] Lottery positions are correct
- [ ] This is a FALLBACK — live API should override

## Content Source Quality Check
- [ ] Are we pulling from LOCAL beat writers (NY Post, NYDN, SNY, Newsday), not just national?
- [ ] Are we pulling from team-specific RSS feeds, not just league-wide?
- [ ] Are we capturing podcast/video analysis, not just text articles?
- [ ] Have we searched Google for "[topic] Brooklyn Nets" to find sources we're missing?
- [ ] Are rumor articles based on real reporting, not our own speculation?

## Common Mistakes We've Made
1. Claiming inflated pick totals ("9 FRPs" when some were traded to Houston)
2. Missing the Rockets pick restructure trade entirely
3. Ignoring second-round picks in all articles
4. Inconsistent pick numbers between articles and dashboard data
5. Stale roster data with players on wrong teams
6. Not dating statistical claims
7. Saying "confidence: high" on speculative content
8. Using only ESPN national when local NYC beat writers have the real intel
9. Building the pipeline before researching the best sources
