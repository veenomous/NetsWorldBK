import Link from "next/link";
import { notFound } from "next/navigation";
import { getPodcastBySlug, getEpisodesByPodcast } from "@/lib/podcasts-server";

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

export async function generateMetadata({ params }: { params: Promise<{ show: string }> }) {
  const { show } = await params;
  const podcast = await getPodcastBySlug(show);
  if (!podcast) return { title: "Podcast — BK Grit" };
  return {
    title: `${podcast.name} — BK Grit`,
    description: `${podcast.name} episodes on BKGrit — transcripts, hot moments, and wiki cross-links for every episode.`,
  };
}

export default async function ShowPage({ params }: { params: Promise<{ show: string }> }) {
  const { show } = await params;
  const podcast = await getPodcastBySlug(show);
  if (!podcast) notFound();
  const episodes = await getEpisodesByPodcast(podcast.id);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/podcasts" className="text-white/40 hover:text-white transition-colors">&larr; Podcasts</Link>
          </nav>
          <h1 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight">
            {podcast.name}
          </h1>
          <p className="text-white/40 text-sm font-body mt-3">
            {episodes.length} {episodes.length === 1 ? "episode" : "episodes"} indexed · transcripts, hot moments, wiki cross-links
          </p>
          {podcast.channel_url && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <a
                href={podcast.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-red text-white text-[11px] font-display font-bold uppercase tracking-wider px-4 py-2 hover:bg-white hover:text-black transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Subscribe on YouTube
              </a>
              <span className="text-white/30 text-[10px] font-body italic">
                BKGrit indexes this show for fan commentary. Full episodes and ad support live on the original channel.
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {episodes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-sm font-body">No episodes ingested yet for this show.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/podcasts/${podcast.slug}/${ep.slug}`}
                className="block border border-black/10 p-5 hover:border-brand-red/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {ep.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ep.thumbnail_url}
                      alt=""
                      className="w-32 h-20 object-cover flex-shrink-0 hidden sm:block"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-text-muted text-[10px] tracking-[0.15em] uppercase font-bold">
                        {formatDate(ep.created_at)}
                      </span>
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
