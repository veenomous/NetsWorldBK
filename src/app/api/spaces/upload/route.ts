import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";
const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req: NextRequest) {
  try {
    const { title, opponent, date, audio_url, duration_mins } = await req.json();

    if (!title || !audio_url) {
      return NextResponse.json({ error: "Title and audio_url required" }, { status: 400 });
    }

    // 1. Insert space record
    const { data: space, error: insertError } = await supabase
      .from("spaces")
      .insert({
        title,
        opponent: opponent || null,
        date: date || new Date().toISOString().split("T")[0],
        duration_mins: duration_mins || 0,
        audio_url,
        status: "processing",
      })
      .select("id")
      .single();

    if (insertError || !space) {
      return NextResponse.json({ error: insertError?.message || "Failed to create space" }, { status: 500 });
    }

    // 2. Submit to AssemblyAI for transcription
    if (ASSEMBLYAI_KEY) {
      const aaiRes = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          Authorization: ASSEMBLYAI_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url,
          speaker_labels: true,
        }),
      });

      if (aaiRes.ok) {
        const aaiData = await aaiRes.json();
        // Save the AssemblyAI job ID
        await supabase
          .from("spaces")
          .update({ transcript: { assemblyai_id: aaiData.id } })
          .eq("id", space.id);
      } else {
        // AssemblyAI failed — mark as error but still return the space
        await supabase
          .from("spaces")
          .update({ status: "error" })
          .eq("id", space.id);
      }
    } else {
      // No API key — mark as error
      await supabase
        .from("spaces")
        .update({ status: "error", summary: "AssemblyAI API key not configured" })
        .eq("id", space.id);
    }

    return NextResponse.json({ id: space.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
