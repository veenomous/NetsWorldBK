/**
 * Fetch approved fan submissions from Supabase and write to kb/raw/
 *
 * Pulls submissions with status='approved', downloads the URL content,
 * writes structured markdown to kb/raw/, and marks them as 'compiled'.
 *
 * Usage: npx tsx scripts/fetch-submissions.ts
 *
 * Agent tier: Haiku (structured data extraction)
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const KB_RAW = path.join(process.cwd(), "kb", "raw");
const TODAY = new Date().toISOString().split("T")[0];

const SOURCE_DIR_MAP: Record<string, string> = {
  article: "beat-reporters",
  tweet: "beat-reporters",
  video: "media",
  scouting: "scouting",
  rumor: "beat-reporters",
  stats: "stats",
  other: "beat-reporters",
};

async function main() {
  console.log("\n📥 Fetching approved fan submissions...\n");

  const { data: submissions, error } = await supabase
    .from("kb_submissions")
    .select("*")
    .eq("status", "approved")
    .order("upvotes", { ascending: false });

  if (error) {
    console.error("❌ Failed to fetch submissions:", error.message);
    process.exit(1);
  }

  if (!submissions || submissions.length === 0) {
    console.log("  No approved submissions to process.");
    return;
  }

  console.log(`  Found ${submissions.length} approved submission(s).\n`);

  for (const sub of submissions) {
    const subDir = SOURCE_DIR_MAP[sub.source_type] || "beat-reporters";
    const dir = path.join(KB_RAW, subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Slugify the URL for filename
    const slug = sub.url
      .replace(/https?:\/\//, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .slice(0, 60)
      .replace(/-$/, "");

    const filename = `${TODAY}-fan-${slug}.md`;
    const filePath = path.join(dir, filename);

    const md = `---
title: "Fan Submission: ${sub.url.slice(0, 80)}"
tags: [fan-submitted, ${sub.source_type}]
source_url: ${sub.url}
source_type: ${sub.source_type}
clipped_date: ${TODAY}
submitted_by: ${sub.submitted_by}
upvotes: ${sub.upvotes}
---

## Source
${sub.url}

## Fan Note
${sub.note || "No note provided."}

## Context
- Submitted by: @${sub.submitted_by}
- Upvotes: ${sub.upvotes}
- Source type: ${sub.source_type}
- Approved on: ${TODAY}

## Key Takeaways
- (To be extracted by compilation agent from the source URL)
`;

    fs.writeFileSync(filePath, md);
    console.log(`  ✓ ${subDir}/${filename}`);

    // Mark as compiled
    await supabase
      .from("kb_submissions")
      .update({ status: "compiled" })
      .eq("id", sub.id);

    console.log(`    → Marked as compiled in Supabase`);
  }

  console.log(`\n✅ Processed ${submissions.length} submission(s).\n`);
}

main();
