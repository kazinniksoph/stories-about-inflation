import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { loadEvents, loadGuests, loadShows } from '../data/loader';
import type { InjectionEvent, GuestSummary, ShowSummary } from '../types';
import { FRAME_COLORS, FRAME_LABELS, FOCUS_FRAMES } from '../types';
import StatCard from '../components/StatCard';
import FrameBadge from '../components/FrameBadge';

export default function Landing() {
  const [events, setEvents] = useState<InjectionEvent[]>([]);
  const [guests, setGuests] = useState<GuestSummary[]>([]);
  const [shows, setShows] = useState<ShowSummary[]>([]);

  useEffect(() => {
    Promise.all([loadEvents(), loadGuests(), loadShows()]).then(([e, g, s]) => {
      setEvents(e);
      setGuests(g);
      setShows(s);
    });
  }, []);

  if (!events.length) {
    return <div className="text-center py-20 text-stone-400">Loading...</div>;
  }

  const frameCounts: Record<string, number> = {};
  for (const e of events) {
    frameCounts[e.dominant_frame] = (frameCounts[e.dominant_frame] || 0) + 1;
  }

  const months = new Set(events.map(e => e.year_month));
  const minMonth = [...months].sort()[0];
  const maxMonth = [...months].sort().pop()!;

  // Episode metadata occasionally tags a discussed subject as a guest (the paper
  // excludes "AOC / Ocasio-Cortez" by name for the same reason; Trump is the
  // most prominent additional case, since appearances on critique shows like David
  // Pakman or news roundups like Bloomberg News Now are not interviews).
  const SUBJECT_NOT_GUEST = new Set(['Donald Trump', 'AOC', 'Ocasio-Cortez', 'AOC / Ocasio-Cortez']);

  // Cap at 2 carriers per frame, sorted by overall volume. Without this,
  // PARTISAN_BLAME (~13k events vs ~700 per other frame) crowds out every
  // expert from housing, Fed-failure, geopolitical, etc.
  const topGuests: GuestSummary[] = [];
  const perFrame: Record<string, number> = {};
  for (const g of [...guests].sort((a, b) => b.n_events - a.n_events)) {
    if (!FOCUS_FRAMES.includes(g.dominant_frame as typeof FOCUS_FRAMES[number])) continue;
    if (SUBJECT_NOT_GUEST.has(g.guest_name)) continue;
    if ((perFrame[g.dominant_frame] || 0) >= 2) continue;
    topGuests.push(g);
    perFrame[g.dominant_frame] = (perFrame[g.dominant_frame] || 0) + 1;
    if (topGuests.length >= 8) break;
  }

  return (
    <div className="space-y-8">
      <div
        className="rounded-xl p-6 flex items-center gap-8"
        style={{ background: 'var(--warm-white)', border: '1px solid var(--border)' }}
      >
        <img
          src="/logo.png"
          alt="Stories People Hear About Inflation"
          className="h-36 w-auto shrink-0 hidden md:block"
        />
        <p className="leading-relaxed text-sm" style={{ color: 'var(--text)' }}>
          When people listen to podcasts, they hear different stories about why
          prices are rising: tariffs, government spending, housing shortages,
          the Fed. Using over 350,000 podcast transcripts, this research finds
          that recurring inflation discussion sorts into <em>two channels</em>:
          one that explains rising prices through specific economic mechanisms,
          another that attributes them to a political actor without spelling out
          a mechanism. The two channels differ in causal language, vocal
          delivery, and listener retention, and exposure to story content
          moves household inflation expectations in story-specific ways. This
          dashboard lets you explore the data.
        </p>
      </div>

      <div
        className="rounded-md p-4 text-sm leading-relaxed space-y-3"
        style={{ background: 'var(--warm-white)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        <p>
          <strong>How the identification works.</strong>{' '}
          Some podcast guests have a recognizable inflation story: a particular
          frame they invoke more often than others. These guests are called{' '}
          <em>narrative carriers</em>: guests who appear on at least three shows
          and devote a majority of their classified inflation content to a single
          frame. When a carrier shows up on a podcast whose listeners live in,
          say, Ohio and Texas, those states receive a dose of that frame for
          reasons unrelated to local economic conditions.
        </p>
        <p>
          <strong>What counts as an "injection."</strong>{' '}
          When a carrier appears on a new show, the "surprise" is the difference
          between the guest's typical inflation framing and what the show normally
          covers. This surprise is computed continuously from the episode's actual
          content. When the guest discusses inflation in their characteristic way,
          the surprise is large. When the same guest talks about something else,
          the surprise is near zero, and the episode barely contributes to the dose.
          Off-topic episodes downweight themselves automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Guest Appearances"
          value={events.length.toLocaleString()}
          sub={`${minMonth} to ${maxMonth}`}
        />
        <StatCard
          label="Carrier Guests"
          value={guests.length.toLocaleString()}
          sub="Appeared on 3+ shows"
        />
        <StatCard
          label="Podcast Shows"
          value={shows.length.toLocaleString()}
          sub="With US listener data"
        />
        <StatCard label="US States" value="51" sub="All 50 + D.C." />
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-1">
          What story does each guest primarily tell?
        </h3>
        <p className="text-xs text-stone-500 mb-3">
          Each guest appearance is classified by its dominant inflation story:
          the explanation the guest emphasizes most. The bars below show how many
          appearances fall into each story. Faded stories did not produce a
          statistically significant headline effect on inflation expectations in
          the causal analysis.
        </p>
        <div className="space-y-2">
          {Object.entries(frameCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([frame, count]) => {
              const pct = count / events.length;
              const color = FRAME_COLORS[frame] || '#6b7280';
              const isFocus = FOCUS_FRAMES.includes(frame as typeof FOCUS_FRAMES[number]);
              return (
                <div key={frame} className={`flex items-center gap-3 ${isFocus ? '' : 'opacity-40'}`}>
                  <div className="w-44 text-sm text-stone-700">
                    {FRAME_LABELS[frame] || frame}
                    {isFocus && <span className="ml-1 text-xs text-stone-400">✓</span>}
                  </div>
                  <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct * 100}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm text-stone-500 tabular-nums">
                    {count.toLocaleString()}
                  </div>
                </div>
              );
            })}
        </div>
        <p className="text-xs text-stone-400 mt-3 leading-relaxed">
          ✓ = frame with a statistically significant headline effect on inflation
          expectations. Geopolitical exposure has the cleanest causal evidence
          (every robustness check passes); partisan blame is correlationally
          robust but qualified by within-state autocorrelation and ideology
          interactions; housing structural is best read as a show-context
          exposure result. See <Link to="/results" className="underline decoration-stone-300 underline-offset-2">Results</Link> for details.
        </p>
      </div>

      <div className="rounded-md bg-stone-100 border border-stone-200 p-4 text-xs text-stone-600 leading-relaxed flex gap-2">
        <Info size={14} className="text-stone-400 mt-0.5 shrink-0" />
        <div>
          <strong>One label per appearance, but the analysis uses more.</strong>{' '}
          The bar chart above shows each appearance's single strongest story.
          The statistical analysis is more granular: it scores every appearance
          on all six stories at once, so an appearance labeled "Fed Failure" can
          still carry some housing or geopolitical signal if the guest's typical
          mix differs from the show's. This is why a story like Housing
          Structural can produce significant results even though only 866 of
          15,930 appearances are housing-dominant: many other appearances carry
          partial housing signal too.
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-1">
          Top Narrative Carriers
        </h3>
        <p className="text-xs text-stone-500 mb-3">
          These guests appear most frequently across different shows, consistently
          telling the same inflation story. Click a name to see all their appearances.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {topGuests.map(g => (
            <Link
              key={g.guest_name}
              to={`/explorer?q=${encodeURIComponent(g.guest_name)}`}
              className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-stone-100 transition-colors"
            >
              <div>
                <span className="text-sm font-medium text-stone-900 underline decoration-stone-300 underline-offset-2">{g.guest_name}</span>
                <span className="text-xs text-stone-400 ml-2">
                  {g.n_events} appearances, {g.shows.length} shows
                </span>
              </div>
              <FrameBadge frame={g.dominant_frame} />
            </Link>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          to="/explorer"
          className="inline-flex items-center gap-2 rounded-md bg-stone-900 text-white px-4 py-2 text-sm hover:bg-stone-800 transition-colors"
        >
          Explore all events <ArrowRight size={14} />
        </Link>
        <Link
          to="/results"
          className="inline-flex items-center gap-2 rounded-md border border-stone-300 text-stone-700 px-4 py-2 text-sm hover:bg-stone-50 transition-colors"
        >
          View causal estimates <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
