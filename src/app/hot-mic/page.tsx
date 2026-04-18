import Link from "next/link";
import {
  getAllPodcasts,
  getRecentEpisodes,
  getRecentSpaces,
  getTopHotMoments,
  getHotMicStats,
  type PodcastEpisode,
} from "@/lib/podcasts-server";
import { isThrowback, episodeDisplayDate } from "@/lib/podcasts";

export const metadata = {
  title: "Hot Mic — BK Grit",
  description: "Every Nets podcast and Space. Transcribed, cross-linked, and turned into shareable clips.",
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

function formatTs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default async function HotMicPage() {
  const [shows, episodes, spaces, hotMoments, stats] = await Promise.all([
    getAllPodcasts(),
    getRecentEpisodes(30),
    getRecentSpaces(6),
    getTopHotMoments(6),
    getHotMicStats(),
  ]);

  const newEpisodes = episodes
    .filter((ep) => !isThrowback(ep.created_at, ep.published_at))
    .sort((a, b) => {
      const aDate = a.published_at || a.created_at;
      const bDate = b.published_at || b.created_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  const throwbacks = episodes.filter((ep) => isThrowback(ep.created_at, ep.published_at));
  const featured = newEpisodes[0];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* HERO */}
      <section className="bg-black text-white px-4 sm:px-8 pt-6 pb-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-brand-red text-base" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
            <span className="font-display font-bold text-[10px] uppercase tracking-[0.3em] text-brand-red">Hot Mic</span>
          </div>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-[-0.03em] leading-[0.9]">
                Every Nets voice,<br />
                <span className="text-brand-red">transcribed.</span>
              </h1>
              <p className="text-white/50 text-sm sm:text-base font-body mt-4 max-w-xl leading-relaxed">
                Nets podcasts and fan Spaces. AI pulls the transcript, the hottest quotes,
                and auto-generates shareable clips. Every episode cross-linked to the wiki.
              </p>
            </div>
            <Link
              href="/upload"
              className="bg-brand-red text-white font-display font-bold text-xs uppercase tracking-wider px-5 py-3 hover:bg-white hover:text-black transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add Content
            </Link>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-black text-white border-t border-white/5 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat value={stats.shows} label="Shows" />
          <Stat value={stats.episodes} label="Podcast Episodes" />
          <Stat value={stats.spaces} label="Spaces" />
          <Stat value={stats.hotMoments} label="Hot Moments" color="text-brand-red" />
        </div>
      </section>

      <div className="h-1 bg-brand-red" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-14">
        {/* FEATURED EPISODE */}
        {featured && (
          <section>
            <SectionLabel>Latest Episode</SectionLabel>
            <Link
              href={`/podcasts/${featured.podcasts?.slug}/${featured.slug}`}
              className="block group border border-black/10 overflow-hidden hover:border-brand-red/40 transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                <div className="md:col-span-2 relative aspect-video md:aspect-auto bg-black overflow-hidden">
                  {featured.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.thumbnail_url}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <span className="material-symbols-outlined text-6xl">podcasts</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-brand-red text-white font-display font-bold text-[10px] uppercase tracking-wider px-2 py-1">
                    Latest
                  </div>
                </div>
                <div className="md:col-span-3 p-6 sm:p-8 bg-white">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-brand-red text-[10px] font-display font-bold uppercase tracking-[0.15em]">
                      {featured.podcasts?.name}
                    </span>
                    <span className="text-text-muted text-[10px]">·</span>
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                      {formatDate(episodeDisplayDate(featured.created_at, featured.published_at))}
                    </span>
                    {featured.duration_seconds && (
                      <>
                        <span className="text-text-muted text-[10px]">·</span>
                        <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                          {formatDuration(featured.duration_seconds)}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight leading-tight group-hover:text-brand-red transition-colors">
                    {featured.title}
                  </h2>
                  {featured.summary && (
                    <p className="text-text-muted font-body text-sm mt-3 leading-relaxed line-clamp-3">
                      {featured.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-4 text-text-muted text-[10px] font-bold uppercase tracking-wider">
                    {featured.hot_moments && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>
                          local_fire_department
                        </span>
                        {featured.hot_moments.length} hot moments
                      </span>
                    )}
                    {featured.chapters && <span>{featured.chapters.length} chapters</span>}
                    <span className="ml-auto text-brand-red group-hover:underline">Listen →</span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* HOT MOMENTS SPOTLIGHT */}
        {hotMoments.length > 0 && (
          <section>
            <SectionLabel>
              <span className="text-brand-red">Hot</span> Moments
            </SectionLabel>
            <p className="text-text-muted text-sm font-body mb-6 max-w-2xl">
              The spiciest quotes across every show. Download a quote card or tap through to the episode.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotMoments.map((m, i) => (
                <Link
                  key={`${m.episode_id}-${m.idx}`}
                  href={`/podcasts/${m.show_slug}/${m.episode_slug}`}
                  className="group block border border-black/10 bg-white p-5 hover:border-brand-red/40 transition-colors relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[9px] font-display font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 shrink-0">
                      {m.topic}
                    </span>
                    <div className="flex gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`h-1.5 w-2 ${n <= m.fire_level ? (m.fire_level >= 4 ? "bg-brand-red" : "bg-accent-blue") : "bg-black/10"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <blockquote className="border-l-4 border-brand-red pl-3 mb-3">
                    <p className="text-text-primary font-body text-sm leading-relaxed italic line-clamp-4">
                      &ldquo;{m.quote}&rdquo;
                    </p>
                  </blockquote>
                  <div className="flex items-center justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider">
                    <span className="truncate mr-2">{m.show_name}</span>
                    <span className="text-brand-red tabular-nums shrink-0">{formatTs(m.timestamp_ms)}</span>
                  </div>
                  <span className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-red text-xs font-bold">↗</span>
                  {i === 0 && (
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-red/10 rounded-full blur-2xl pointer-events-none" />
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SHOWS */}
        {shows.length > 0 && (
          <section>
            <SectionLabel>Shows</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shows.map((show) => {
                const showEps = episodes.filter((ep) => ep.podcasts?.slug === show.slug);
                return (
                  <Link
                    key={show.id}
                    href={`/podcasts/${show.slug}`}
                    className="group block border border-black/10 bg-white p-5 hover:border-brand-red/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          podcasts
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-black text-sm uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors line-clamp-2">
                          {show.name}
                        </p>
                        <p className="text-text-muted text-[10px] font-body mt-0.5">
                          {showEps.length} {showEps.length === 1 ? "episode" : "episodes"} indexed
                        </p>
                      </div>
                    </div>
                    {show.channel_url && (
                      <p className="text-text-muted text-[10px] font-body truncate border-t border-black/5 pt-2">
                        {show.channel_url.replace(/^https?:\/\//, "")}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* NEW EPISODES */}
        {newEpisodes.length > 1 && (
          <section>
            <SectionLabel>New Episodes</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {newEpisodes.slice(1, 9).map((ep) => (
                <EpisodeRow key={ep.id} ep={ep} />
              ))}
            </div>
          </section>
        )}

        {/* THROWBACKS */}
        {throwbacks.length > 0 && (
          <section>
            <div className="flex items-baseline gap-3 mb-6 flex-wrap">
              <SectionLabel noMargin>
                <span className="text-accent-blue">Throwback</span> Picks
              </SectionLabel>
              <p className="text-text-muted text-[11px] font-body italic">
                Classics pulled back into the feed for context.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {throwbacks.slice(0, 6).map((ep) => (
                <EpisodeRow key={ep.id} ep={ep} />
              ))}
            </div>
          </section>
        )}

        {/* SPACES */}
        {spaces.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <SectionLabel noMargin>Fan Spaces</SectionLabel>
              <Link href="/spaces" className="text-[10px] text-brand-red font-display font-bold uppercase tracking-wider hover:underline">
                All Spaces →
              </Link>
            </div>
            <p className="text-text-muted text-sm font-body mb-4 max-w-2xl">
              Live fan reactions — raw, unscripted, recorded off X. Audio-only.
            </p>
            <div className="space-y-2">
              {spaces.map((sp) => (
                <Link
                  key={sp.id}
                  href={`/spaces/${sp.id}`}
                  className="block border-l-4 border-l-accent-blue border border-black/10 bg-white p-4 hover:border-brand-red/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-accent-blue text-[10px] font-display font-bold uppercase tracking-[0.15em]">
                          Space
                        </span>
                        <span className="text-text-muted text-[10px]">·</span>
                        <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">
                          {sp.date}
                        </span>
                        {sp.opponent && (
                          <>
                            <span className="text-text-muted text-[10px]">·</span>
                            <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">
                              {sp.opponent}
                            </span>
                          </>
                        )}
                        <span className="text-text-muted text-[10px]">·</span>
                        <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                          {sp.duration_mins}m
                        </span>
                      </div>
                      <p className="font-display font-black text-sm uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors">
                        {sp.title}
                      </p>
                      {sp.summary && (
                        <p className="text-text-muted text-xs font-body mt-1 line-clamp-2 leading-relaxed">
                          {sp.summary}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-text-muted/30 group-hover:text-brand-red text-lg transition-colors mt-1 shrink-0">
                      play_circle
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* EMPTY STATE */}
        {shows.length === 0 && spaces.length === 0 && (
          <section className="text-center py-20 border border-black/10 bg-white">
            <span className="material-symbols-outlined text-text-muted/30 text-5xl">mic_off</span>
            <p className="font-display font-black text-lg uppercase tracking-tight mt-4">Hot Mic is empty</p>
            <p className="text-text-muted text-sm font-body mt-2 mb-6">Add a podcast episode or a Space recording to get started.</p>
            <Link
              href="/upload"
              className="bg-brand-red text-white font-display font-bold text-xs uppercase tracking-wider px-6 py-3 hover:bg-black transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add Content
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

function EpisodeRow({ ep }: { ep: PodcastEpisode }) {
  const throwback = isThrowback(ep.created_at, ep.published_at);
  return (
    <Link
      href={`/podcasts/${ep.podcasts?.slug}/${ep.slug}`}
      className="group flex gap-3 border border-black/10 bg-white p-3 hover:border-brand-red/40 transition-colors"
    >
      {ep.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ep.thumbnail_url}
          alt=""
          className="w-24 h-16 object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {throwback && (
            <span className="bg-accent-blue/15 text-accent-blue border border-accent-blue/30 text-[9px] tracking-[0.15em] uppercase font-bold px-1.5 py-0.5">
              Throwback
            </span>
          )}
          <span className="text-brand-red text-[9px] font-display font-bold uppercase tracking-wider truncate">
            {ep.podcasts?.name}
          </span>
          <span className="text-text-muted text-[9px]">·</span>
          <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider shrink-0">
            {formatDate(episodeDisplayDate(ep.created_at, ep.published_at))}
          </span>
        </div>
        <p className="font-display font-black text-xs uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors line-clamp-2 leading-tight">
          {ep.title}
        </p>
        {ep.hot_moments && (
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mt-1">
            {ep.hot_moments.length} hot moments
          </p>
        )}
      </div>
    </Link>
  );
}

function Stat({ value, label, color = "text-white" }: { value: number; label: string; color?: string }) {
  return (
    <div>
      <div className={`font-display font-black text-3xl sm:text-4xl leading-none tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.15em] mt-1">{label}</div>
    </div>
  );
}

function SectionLabel({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <h2 className={`font-display font-black text-lg sm:text-xl uppercase tracking-tight text-text-primary ${noMargin ? "" : "mb-6"}`}>
      {children}
    </h2>
  );
}
