import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { input, type } = await req.json();
  // type: "url" (article URL to analyze) or "topic" (player name, trade idea, etc.)

  if (!input?.trim()) {
    return NextResponse.json({ error: "Input required" }, { status: 400 });
  }

  let prompt = "";

  if (type === "url") {
    prompt = `You are a Brooklyn Nets wiki writer for BKGrit.com. A user has shared this article URL: ${input}

Your job:
1. Based on the URL and what you know about current NBA events, write a wiki article from the Brooklyn Nets perspective
2. Frame it as: how does this news affect the Nets? Should Brooklyn be interested? What assets could they offer?
3. Be honest about confidence — if the Nets aren't mentioned, say so clearly
4. Include wikilinks to existing Nets articles using [[Article Title]] format. Known articles: [[Sean Marks Era]], [[Michael Porter Jr.]], [[Egor Demin]], [[Nic Claxton]], [[Noah Clowney]], [[Nolan Traore]], [[Nets Pick Inventory]], [[Rebuild Timeline]], [[Kevin Durant Trade Tree]], [[Giannis to Brooklyn?]], [[MPJ Trade Buzz]]

Return a complete markdown article with this exact format:

---
title: [Article Title]
tags: [tag1, tag2, tag3]
sources: []
confidence: low
last_updated: ${new Date().toISOString().split("T")[0]}
status: active
---

## Summary
[One paragraph from Nets perspective]

## What We Know
[Bullet points of facts]

## The Nets Angle
[Analysis of how this connects to Brooklyn]

## Confidence Level
[Honest assessment]

## Related
[Wikilinks to related articles]

## Source
[Link to the original article]

Also generate a tweet (under 280 chars) that promotes this article with a link to bkgrit.com. Return the tweet after the article, separated by "---TWEET---".`;
  } else {
    prompt = `You are a Brooklyn Nets wiki writer for BKGrit.com. A user wants an article about: "${input}"

Your job:
1. Write a wiki article about this topic from the Brooklyn Nets perspective
2. Use what you know about the current Nets situation: rebuilding, Sean Marks as GM, Jordi Fernandez as coach, Egor Demin as franchise bet, Michael Porter Jr. as veteran scorer, picks owed through 2032, 2025-26 season ended at 20-62
3. Be specific with facts, stats, and dates where possible
4. Include wikilinks to existing Nets articles using [[Article Title]] format. Known articles: [[Sean Marks Era]], [[Michael Porter Jr.]], [[Egor Demin]], [[Nic Claxton]], [[Noah Clowney]], [[Nolan Traore]], [[Nets Pick Inventory]], [[Rebuild Timeline]], [[Kevin Durant Trade Tree]], [[Giannis to Brooklyn?]], [[MPJ Trade Buzz]], [[2025 NBA Draft]], [[2025-26 Season]]

Return a complete markdown article with this exact format:

---
title: [Article Title]
tags: [tag1, tag2, tag3]
sources: []
confidence: [high/medium/low based on how much is fact vs speculation]
last_updated: ${new Date().toISOString().split("T")[0]}
status: active
---

## Summary
[One paragraph]

## Key Insights
[Bullet points]

## Details
[Full analysis]

## Related
[Wikilinks]

## Open Questions
[What we don't know yet]

Also generate a tweet (under 280 chars) that promotes this article with a link to bkgrit.com. Return the tweet after the article, separated by "---TWEET---".`;
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message || "API error" }, { status: 500 });
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || "";

    const parts = content.split("---TWEET---");
    const article = parts[0].trim();
    const tweet = parts[1]?.trim() || "";

    // Extract title from article frontmatter
    const titleMatch = article.match(/^title:\s*(.+)$/m);
    const articleTitle = titleMatch ? titleMatch[1].trim() : input.slice(0, 60);

    // Auto-save tweet draft to Supabase
    if (tweet) {
      await supabase.from("tweet_drafts").insert({
        tweet_text: tweet,
        article_title: articleTitle,
        article_url: `https://bkgrit.com`,
        status: "draft",
      });
    }

    return NextResponse.json({ article, tweet });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate" }, { status: 500 });
  }
}
