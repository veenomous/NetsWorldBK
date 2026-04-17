import { NextRequest, NextResponse } from "next/server";
import { supabase, pollAssemblyAI, finalizeEpisodeAnalysis } from "@/lib/podcasts-ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { data: episode } = await supabase
      .from("podcast_episodes")
      .select("id, status, title, transcript, assemblyai_id, podcasts(name, slug), slug")
      .eq("id", id)
      .maybeSingle();

    if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

    const ep = episode as unknown as {
      id: string;
      status: string;
      title: string;
      slug: string;
      transcript: { text: string; offsetMs: number; durationMs: number }[] | null;
      assemblyai_id: string | null;
      podcasts: { name: string; slug: string };
    };

    if (ep.status === "ready") {
      return NextResponse.json({ id: ep.id, status: "ready", already_finalized: true });
    }

    if (ep.status === "error") {
      return NextResponse.json({ id: ep.id, status: "error", error: "Episode is in error state; re-ingest to retry." });
    }

    if (ep.status === "transcribing") {
      if (!ep.assemblyai_id) {
        return NextResponse.json({ error: "No AssemblyAI job ID" }, { status: 500 });
      }
      const poll = await pollAssemblyAI(ep.assemblyai_id);
      if (poll.state === "queued" || poll.state === "processing") {
        return NextResponse.json({ id: ep.id, status: "transcribing", assemblyai_state: poll.state });
      }
      if (poll.state === "error") {
        await supabase
          .from("podcast_episodes")
          .update({ status: "error", error_message: poll.errorMessage || "Transcription failed" })
          .eq("id", ep.id);
        return NextResponse.json({ id: ep.id, status: "error", error: poll.errorMessage }, { status: 502 });
      }
      if (poll.state === "completed" && poll.segments) {
        await supabase
          .from("podcast_episodes")
          .update({ transcript: poll.segments, status: "processing" })
          .eq("id", ep.id);
        const result = await finalizeEpisodeAnalysis({
          episodeId: ep.id,
          showName: ep.podcasts.name,
          title: ep.title,
          transcript: poll.segments,
        });
        if (!result.ok) {
          return NextResponse.json({ id: ep.id, status: "error", error: result.error }, { status: 502 });
        }
        return NextResponse.json({
          id: ep.id,
          show_slug: ep.podcasts.slug,
          episode_slug: ep.slug,
          status: "ready",
          summary: result.summary,
          hot_moments_count: result.hotMoments,
        });
      }
    }

    if (ep.status === "processing" && ep.transcript && ep.transcript.length) {
      const result = await finalizeEpisodeAnalysis({
        episodeId: ep.id,
        showName: ep.podcasts.name,
        title: ep.title,
        transcript: ep.transcript,
      });
      if (!result.ok) {
        return NextResponse.json({ id: ep.id, status: "error", error: result.error }, { status: 502 });
      }
      return NextResponse.json({
        id: ep.id,
        show_slug: ep.podcasts.slug,
        episode_slug: ep.slug,
        status: "ready",
        summary: result.summary,
        hot_moments_count: result.hotMoments,
      });
    }

    return NextResponse.json({ id: ep.id, status: ep.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id param required" }, { status: 400 });
  return POST(new NextRequest(req.url, { method: "POST", body: JSON.stringify({ id }), headers: { "Content-Type": "application/json" } }));
}
