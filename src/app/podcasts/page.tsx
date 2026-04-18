import Link from "next/link";
import { getAllPodcasts, getRecentEpisodes, type PodcastEpisode } from "@/lib/podcasts-server";
import { isThrowback, episodeDisplayDate } from "@/lib/podcasts";

export const metadata = {
  title: "Podcasts — BK Grit",
  description: "Every Nets podcast episode, transcribed, indexed, and cross-linked to the wiki.",
};

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatDuration(sec: number | null): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
}

function EpisodeCard({ ep }: { ep: PodcastEpisode }) {
  return (
    <Link
      href={`/podcasts/${ep.podcasts?.slug}/${ep.slug}`}
      className="block border border-black/10 p-5 hover:border-brand-red/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isThrowback(ep.created_at, ep.published_at) && (
              <span className="bg-accent-blue/15 text-accent-blue border border-accent-blue/30 text-[9px] tracking-[0.15em] uppercase font-bold px-1.5 py-0.5">
                Throwback
              </span>
            )}
            <span className="text-text-muted text-[10px] tracking-[0.15em] uppercase font-bold">
              {formatDate(episodeDisplayDate(ep.created_at, ep.published_at))}
            </span>
            {ep.podcasts && (
              <>
                <span className="text-text-muted text-[10px]">·</span>
                <span className="text-brand-red text-[10px] uppercase font-bold">
                  {ep.podcasts.name}
                </span>
              </>
            )}
            {ep.duration_seconds && (
              <>
                <span className="text-text-muted text-[10px]">·</span>
                <span className="text-text-muted text-[10px] uppercase font-bold">
                  {formatDuration(ep.duration_seconds)}
                </span>
              </>
            )}
          </div>
          <p className="font-display font-black text-base uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors">
            {ep.title}
          </p>
          {ep.summary && (
            <p className="text-text-muted text-xs font-body mt-2 line-clamp-2 leading-relaxed">
              {ep.summary}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-text-muted text-[10px] font-bold uppercase tracking-wider">
            {ep.hot_moments && <span>{ep.hot_moments.length} hot moments</span>}
            {ep.chapters && (
              <>
                <span>·</span>
                <span>{ep.chapters.length} chapters</span>
              </>
            )}
          </div>
        </div>
        <span className="material-symbols-outlined text-text-muted/30 group-hover:text-brand-red text-lg transition-colors mt-1">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

export default async function PodcastsIndexPage() {
  const [shows, recent] = await Promise.all([getAllPodcasts(), getRecentEpisodes(30)]);

  const newEpisodes = recent
    .filter((ep) => !isThrowback(ep.created_at, ep.published_at))
    .sort((a, b) => {
      const aDate = a.published_at || a.created_at;
      const bDate = b.published_at || b.created_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, 12);

  const throwbacks = recent
    .filter((ep) => isThrowback(ep.created_at, ep.published_at))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">&larr; Wiki</Link>
          </nav>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-brand-red text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              podcasts
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
              Nets <span className="text-brand-red">Podcasts</span>
            </h1>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <p className="text-white/40 text-sm font-body max-w-2xl">
              Every Nets podcast episode, transcribed and cross-linked to the wiki. Hot moments, show notes,
              shareable clips — auto-generated.
            </p>
            <Link
              href="/upload"
              className="bg-brand-red text-white font-display font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-white hover:text-black transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add Episode
            </Link>
          </div>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-12">
        {shows.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-text-muted/30 text-5xl">podcasts</span>
            <p className="text-text-muted text-sm font-body mt-4">No podcasts ingested yet.</p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="font-display font-black text-lg uppercase tracking-tight text-text-primary mb-4">
                <span className="text-brand-red">Shows</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shows.map((show) => (
                  <Link
                    key={show.id}
                    href={`/podcasts/${show.slug}`}
                    className="block border border-black/10 p-5 hover:border-brand-red/30 transition-colors group"
                  >
                    <p className="font-display font-black text-base uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors">
                      {show.name}
                    </p>
                    {show.channel_url && (
                      <p className="text-text-muted text-[10px] font-body mt-1 truncate">{show.channel_url}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>

            {newEpisodes.length > 0 && (
              <section>
                <h2 className="font-display font-black text-lg uppercase tracking-tight text-text-primary mb-4">
                  New <span className="text-brand-red">Episodes</span>
                </h2>
                <div className="space-y-3">
                  {newEpisodes.map((ep) => (
                    <EpisodeCard key={ep.id} ep={ep} />
                  ))}
                </div>
              </section>
            )}

            {throwbacks.length > 0 && (
              <section>
                <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                  <h2 className="font-display font-black text-lg uppercase tracking-tight text-text-primary">
                    <span className="text-accent-blue">Throwback</span> Picks
                  </h2>
                  <p className="text-text-muted text-[11px] font-body italic">
                    Classics pulled back into the feed for context.
                  </p>
                </div>
                <div className="space-y-3">
                  {throwbacks.map((ep) => (
                    <EpisodeCard key={ep.id} ep={ep} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
