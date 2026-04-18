import Link from "next/link";
import { notFound } from "next/navigation";
import { getEpisode } from "@/lib/podcasts-server";
import { detectWikiLinks, isThrowback, episodeDisplayDate } from "@/lib/podcasts";
import { formatTimestamp } from "@/lib/youtube";
import EpisodeHotMoments from "@/components/EpisodeHotMoments";
import EpisodeTranscript from "@/components/EpisodeTranscript";
import EpisodeChapters from "@/components/EpisodeChapters";
import { EpisodePlayerProvider } from "@/components/EpisodePlayerProvider";

function formatEpDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ show: string; episode: string }>;
}) {
  const { show, episode } = await params;
  const ep = await getEpisode(show, episode);
  if (!ep) return { title: "Episode — BK Grit" };
  return {
    title: `${ep.title} — ${ep.podcasts?.name || "Podcast"} on BK Grit`,
    description: ep.summary || "Nets podcast episode on BKGrit",
    openGraph: {
      title: ep.title,
      description: ep.summary || "",
      images: ep.thumbnail_url ? [ep.thumbnail_url] : [],
    },
  };
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ show: string; episode: string }>;
}) {
  const { show, episode } = await params;
  const ep = await getEpisode(show, episode);
  if (!ep) notFound();

  const transcript = ep.transcript || [];
  const wikiLinks = transcript.length ? detectWikiLinks(transcript) : [];
  const hotMoments = ep.hot_moments || [];
  const chapters = ep.chapters || [];
  const youtubeId = ep.youtube_id;
  const audioUrl = !youtubeId ? ep.audio_url : null;
  const throwback = isThrowback(ep.created_at, ep.published_at);
  const displayDate = episodeDisplayDate(ep.created_at, ep.published_at);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4 flex-wrap">
            <Link href="/podcasts" className="text-white/40 hover:text-white transition-colors">Podcasts</Link>
            <span className="text-white/20">/</span>
            {ep.podcasts && (
              <>
                <Link href={`/podcasts/${ep.podcasts.slug}`} className="text-white/40 hover:text-white transition-colors">
                  {ep.podcasts.name}
                </Link>
                <span className="text-white/20">/</span>
              </>
            )}
            <span className="text-white/60 truncate">Episode</span>
          </nav>
          <h1 className="font-display font-black text-xl sm:text-3xl uppercase tracking-tight leading-tight">
            {ep.title}
          </h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {throwback && (
              <span className="bg-accent-blue/20 text-accent-blue border border-accent-blue/40 text-[10px] font-display font-bold uppercase tracking-[0.15em] px-2 py-1">
                Throwback · {formatEpDate(displayDate)}
              </span>
            )}
            {!throwback && ep.published_at && (
              <span className="text-white/40 text-[10px] font-display font-bold uppercase tracking-[0.15em]">
                {formatEpDate(ep.published_at)}
              </span>
            )}
            {ep.podcasts && (
              <Link
                href={`/podcasts/${ep.podcasts.slug}`}
                className="text-brand-red text-xs font-body uppercase tracking-[0.15em] font-bold hover:underline"
              >
                From {ep.podcasts.name}
              </Link>
            )}
            {youtubeId && (
              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-red text-white text-[10px] font-display font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-white hover:text-black transition-colors inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                Watch on YouTube
              </a>
            )}
            {ep.podcasts?.channel_url && (
              <a
                href={ep.podcasts.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 text-white border border-white/20 text-[10px] font-display font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-white hover:text-black transition-colors inline-flex items-center gap-1"
              >
                Subscribe to {ep.podcasts.name}
              </a>
            )}
          </div>
          <p className="text-white/30 text-[10px] font-body mt-3 italic max-w-2xl">
            Excerpts and summary shown here are fair-use commentary for the Brooklyn Nets wiki. Full episode lives on {ep.podcasts?.name || "the show"} — give them a listen.
          </p>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <EpisodePlayerProvider audioUrl={audioUrl}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Embedded player */}
            {youtubeId && (
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={ep.title}
                />
              </div>
            )}

            {/* Summary */}
            {ep.summary && (
              <section>
                <h2 className="font-display font-black text-xs uppercase tracking-[0.15em] text-text-muted mb-2">
                  Summary
                </h2>
                <p className="text-text-primary font-body text-sm sm:text-base leading-relaxed">{ep.summary}</p>
              </section>
            )}

            {/* Hot Moments — interactive */}
            {hotMoments.length > 0 && (
              <EpisodeHotMoments
                episodeId={ep.id}
                showName={ep.podcasts?.name || "Nets Podcast"}
                showSlug={ep.podcasts?.slug || ""}
                episodeSlug={ep.slug}
                youtubeId={youtubeId}
                moments={hotMoments}
                tweetThread={ep.tweet_thread || ""}
              />
            )}

            {/* Transcript — collapsible */}
            {transcript.length > 0 && <EpisodeTranscript segments={transcript} youtubeId={youtubeId} />}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* Chapters */}
            {chapters.length > 0 && (
              <EpisodeChapters chapters={chapters} youtubeId={youtubeId} />
            )}

            {/* Wiki Cross-Links */}
            {wikiLinks.length > 0 && (
              <section className="border border-black/10 p-4">
                <h2 className="font-display font-black text-xs uppercase tracking-[0.15em] text-text-muted mb-3">
                  <span className="text-brand-red">Wiki</span> Connections
                </h2>
                <ul className="space-y-2">
                  {wikiLinks.slice(0, 15).map((link, i) => (
                    <li key={i}>
                      <Link
                        href={`/kb/${link.category}/${link.slug}`}
                        className="flex items-start gap-2 group"
                      >
                        <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider font-display tabular-nums shrink-0 mt-0.5">
                          {formatTimestamp(link.timestamp_ms)}
                        </span>
                        <span className="text-text-primary text-xs font-body group-hover:text-brand-red transition-colors">
                          {link.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Show Notes */}
            {ep.show_notes && (
              <section className="border border-black/10 p-4">
                <h2 className="font-display font-black text-xs uppercase tracking-[0.15em] text-text-muted mb-3">
                  Show Notes
                </h2>
                <div className="text-text-primary text-xs font-body whitespace-pre-wrap leading-relaxed">
                  {ep.show_notes}
                </div>
              </section>
            )}
          </div>
        </div>
        </EpisodePlayerProvider>
      </div>
    </div>
  );
}
