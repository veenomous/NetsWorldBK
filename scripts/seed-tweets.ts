/**
 * Seed the tweet_drafts table with pre-written tweets
 * Run once: npx tsx scripts/seed-tweets.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TWEETS = [
  { text: "Giannis deleted all his Bucks content from social media. The Bucks went 32-49. Brooklyn has the picks. We mapped out why it makes sense → bkgrit.com/kb/rumors/giannis-to-brooklyn", title: "Giannis to Brooklyn?", url: "https://bkgrit.com/kb/rumors/giannis-to-brooklyn" },
  { text: "The Nets have picks owed from the Suns, Knicks, Mavs, and Nuggets through 2032. Here's every single one tracked → bkgrit.com/kb/assets/nets-pick-inventory", title: "Nets Pick Inventory", url: "https://bkgrit.com/kb/assets/nets-pick-inventory" },
  { text: "The Michael Porter Jr. conundrum: 24.2 PPG but does his timeline fit the rebuild? The NY Post is asking the same question → bkgrit.com/kb/rumors/mpj-trade-buzz", title: "MPJ Trade Buzz", url: "https://bkgrit.com/kb/rumors/mpj-trade-buzz" },
  { text: 'Sean Marks won\'t commit to a rebuild timeline. "You just never know." What does that mean for MPJ, the picks, and the young core? → bkgrit.com/kb/front-office/sean-marks-era', title: "Sean Marks Era", url: "https://bkgrit.com/kb/front-office/sean-marks-era" },
  { text: "The Nets had FIVE first round picks in the 2025 draft. Five. Here's what each one has done so far → bkgrit.com/kb/draft/2025-nba-draft", title: "2025 NBA Draft", url: "https://bkgrit.com/kb/draft/2025-nba-draft" },
  { text: "Egor Demin set the NBA rookie record for consecutive games with a made three (34 straight). Then plantar fasciitis ended his season. Full breakdown → bkgrit.com/kb/players/egor-demin", title: "Egor Demin", url: "https://bkgrit.com/kb/players/egor-demin" },
  { text: "Is Josh Minott the best young player on the Nets and everyone's been sleeping on him? The NY Post thinks so → bkgrit.com/kb/players/josh-minott", title: "Josh Minott", url: "https://bkgrit.com/kb/players/josh-minott" },
  { text: "Noah Clowney dropped 31 and 7 threes on the Knicks. The Year 2 leap is real → bkgrit.com/kb/players/noah-clowney", title: "Noah Clowney", url: "https://bkgrit.com/kb/players/noah-clowney" },
  { text: "Nets hold the #3 pick in the 2026 draft. Tank again or start competing? → bkgrit.com/kb/rumors/2026-draft-positioning", title: "2026 Draft Positioning", url: "https://bkgrit.com/kb/rumors/2026-draft-positioning" },
  { text: "One Kevin Durant trade turned into 6 first round picks, 2 swaps, Michael Porter Jr., and players on the roster today. The full tree → bkgrit.com/kb/trades/kevin-durant-trade-tree", title: "Kevin Durant Trade Tree", url: "https://bkgrit.com/kb/trades/kevin-durant-trade-tree" },
  { text: "Every Knicks loss makes the Nets' future brighter. Brooklyn holds 4 unprotected Knicks picks through 2031. The entanglement explained → bkgrit.com/kb/rivalries/nets-vs-knicks", title: "Nets vs Knicks", url: "https://bkgrit.com/kb/rivalries/nets-vs-knicks" },
  { text: "The Nets traded the 2027 Suns pick to Houston to get their own 2026 pick back. Smart or not? The full Rockets restructure → bkgrit.com/kb/assets/nets-pick-inventory", title: "Nets Pick Inventory", url: "https://bkgrit.com/kb/assets/nets-pick-inventory" },
  { text: "When do the Nets start competing? We mapped the rebuild timeline — core ages, pick calendar, competitive window → bkgrit.com/kb/strategy/rebuild-timeline", title: "Rebuild Timeline", url: "https://bkgrit.com/kb/strategy/rebuild-timeline" },
  { text: "The Nets tanked for the #1 pick and landed at #8. Then drafted Demin who set rookie records. Tank math doesn't always work how you think → bkgrit.com/kb/strategy/tank-math", title: "Tank Math", url: "https://bkgrit.com/kb/strategy/tank-math" },
  { text: "Jordi Fernandez has a PhD in sports psychology and worked with LeBron and Jokic. He's building something different in Brooklyn → bkgrit.com/kb/front-office/jordi-fernandez", title: "Jordi Fernandez", url: "https://bkgrit.com/kb/front-office/jordi-fernandez" },
  { text: "We built something no NBA team has — a living wiki that updates itself every morning with real beat reporting. Check the Brooklyn Nets Wiki → bkgrit.com", title: "Homepage", url: "https://bkgrit.com" },
  { text: "The Nets rebuild mapped as a knowledge graph. Click any node, trace any connection. Every trade leads somewhere → bkgrit.com/kb/graph", title: "Knowledge Graph", url: "https://bkgrit.com/kb/graph" },
  { text: "What are Nets fans actually saying? The Fan Pulse compiles real takes from the community → bkgrit.com/kb/community/fan-pulse", title: "Fan Pulse", url: "https://bkgrit.com/kb/community/fan-pulse" },
  { text: "Found a Nets article worth reading? Drop it on the wiki and help build the most complete Nets resource on the internet → bkgrit.com/kb/submit", title: "Submit", url: "https://bkgrit.com/kb/submit" },
  { text: "The KD era failed. But the exit strategy might be the greatest trade haul in NBA history. The full story from superstar gamble to rebuild → bkgrit.com/kb/seasons/the-superstar-era", title: "The Superstar Era", url: "https://bkgrit.com/kb/seasons/the-superstar-era" },
];

async function main() {
  console.log("Seeding tweet drafts...");
  for (const t of TWEETS) {
    await supabase.from("tweet_drafts").insert({
      tweet_text: t.text,
      article_title: t.title,
      article_url: t.url,
      status: "draft",
    });
    console.log(`  ✓ ${t.title}`);
  }
  console.log(`\n✅ ${TWEETS.length} tweets seeded.\n`);
}

main();
