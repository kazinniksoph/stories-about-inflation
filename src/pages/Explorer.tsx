import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadEvents } from '../data/loader';
import type { InjectionEvent } from '../types';
import { FRAME_COLORS, FRAME_LABELS, FOCUS_FRAMES } from '../types';
import { formatDate, formatNumber } from '../utils/format';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

type SortKey = 'posted_at' | 'reach_score' | 'dominant_share' | 'arousal';
type SortDir = 'asc' | 'desc';

export default function Explorer() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<InjectionEvent[]>([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [sortKey, setSortKey] = useState<SortKey>('posted_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadEvents().then(setEvents);
  }, []);

  const PAGE_SIZE = 50;

  const filtered = useMemo(() => {
    // Only show guests with a real first + last name. Drops:
    //   - single-token entries (e.g. "Trump", "Biden", "Powell")
    //   - placeholder names ("Guest 1", "Speaker 03", "Anonymous")
    //   - anything containing a digit (ASR/diarization artifacts)
    const PLACEHOLDER_RE =
      /^(Guest|Speaker|Caller|Anonymous|Unknown|Person|Voice|Female|Male|N\/?A)\b/i;
    const isRealName = (name: string | undefined) => {
      if (!name) return false;
      const trimmed = name.trim();
      if (trimmed.split(/\s+/).length < 2) return false;
      if (/\d/.test(trimmed)) return false;
      if (PLACEHOLDER_RE.test(trimmed)) return false;
      return true;
    };
    let out = events.filter(e => isRealName(e.guest_name));
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        e =>
          e.guest_name.toLowerCase().includes(q) ||
          e.podcast_name.toLowerCase().includes(q) ||
          e.episode_id.toLowerCase().includes(q)
      );
    }
    out = [...out].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return out;
  }, [events, search, sortKey, sortDir]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  }

  const COLUMN_TIPS: Record<string, string> = {
    posted_at: 'When the episode was published.',
    reach_score: "How large the show's audience is (composite of listeners, chart rankings, and engagement, normalized so 50 = median).",
    dominant_share: "What fraction of this guest's total appearances activate this story. Higher means a more consistent carrier. This is the guest's typical story, not necessarily what this specific episode is about.",
    arousal: 'How emotionally intense the speaker sounds, measured by an AI audio model (wav2vec2). Higher = more energetic delivery.',
  };

  function SortHeader({ k, label }: { k: SortKey; label: string }) {
    const [showTip, setShowTip] = useState(false);
    const active = sortKey === k;
    const tip = COLUMN_TIPS[k] || '';
    return (
      <div className="relative">
        <button
          onClick={() => toggleSort(k)}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide cursor-help ${
            active ? 'text-stone-900' : 'text-stone-500'
          } hover:text-stone-900`}
        >
          {label}
          {active && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </button>
        {showTip && tip && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-lg text-xs font-normal leading-relaxed p-2.5 shadow-xl z-[100] pointer-events-none"
            style={{ background: 'var(--ink)', color: 'var(--cream-light)' }}
          >
            <span
              className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent"
              style={{ borderBottomColor: 'var(--ink)' }}
            />
            {tip}
          </div>
        )}
      </div>
    );
  }

  if (!events.length) {
    return <div className="text-center py-20 text-stone-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-900">Guest Appearance Explorer</h2>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          Every row is a podcast episode where a carrier guest appeared on
          someone else's show. Click any row to see the episode title, read a
          transcript excerpt, and listen to the full episode.
        </p>
        <p className="text-sm text-stone-500 mt-1">
          Showing {filtered.length.toLocaleString()} appearances
          {search && ` matching "${search}"`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search guest, show, or episode ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white overflow-visible">
        <div className="grid grid-cols-[20px_1fr_1fr_120px_80px_80px] gap-2 px-4 py-2 border-b border-stone-100 bg-stone-50">
          <div></div>
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wide">Guest</div>
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wide">Show</div>
          <SortHeader k="posted_at" label="Date" />
          <SortHeader k="reach_score" label="Audience" />
          <SortHeader k="arousal" label="Energy" />
        </div>

        {paged.map((ev, idx) => {
          const rowId = page * PAGE_SIZE + idx;
          const isExpanded = expanded === rowId;

          return (
            <div key={rowId} className={isExpanded ? 'border-l-2 border-stone-400' : ''}>
              <button
                onClick={() => setExpanded(isExpanded ? null : rowId)}
                className={`w-full grid grid-cols-[20px_1fr_1fr_120px_80px_80px] gap-2 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors ${isExpanded ? 'bg-stone-100 border-b border-stone-200' : 'border-b border-stone-50'}`}
              >
                <div className="flex items-center text-stone-400">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} className="rotate-90" />}
                </div>
                <div className="text-sm text-stone-900 font-medium truncate">
                  {ev.guest_name}
                  {!ev.guest_name.includes(' ') && <span className="ml-1 text-stone-400 text-xs" title="First name only in source metadata">*</span>}
                </div>
                <div className="text-sm text-stone-600 truncate">{ev.podcast_name}</div>
                <div className="text-sm text-stone-500 tabular-nums">{formatDate(ev.posted_at)}</div>
                <div className="text-sm text-stone-500 tabular-nums">{ev.reach_score}</div>
                <div className="text-sm text-stone-500 tabular-nums">
                  {ev.arousal != null ? formatNumber(ev.arousal, 3) : '—'}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 space-y-3">
                  {ev.title && (
                    <p className="text-sm font-medium text-stone-800">{ev.title}</p>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    {ev.guest_details?.length > 0 && ev.guest_details.some(g => g.occupation || g.company) && (
                      <span className="text-xs text-stone-500">
                        {ev.guest_details
                          .filter(g => g.name === ev.guest_name || ev.guest_details.length === 1)
                          .map(g => [g.occupation, g.company].filter(Boolean).join(', '))
                          .filter(Boolean)
                          .join(' · ') || ''}
                      </span>
                    )}
                    {ev.n_states != null && (
                      <span className="text-xs text-stone-400">
                        {ev.n_states} states reached
                      </span>
                    )}
                  </div>

                  {ev.summary && (
                    <div className="rounded-md bg-white border border-stone-200 p-3">
                      <p className="text-xs text-stone-400 mb-1 uppercase tracking-wide">AI-generated episode summary</p>
                      <p className="text-sm text-stone-700 leading-relaxed">
                        {ev.summary}
                      </p>
                    </div>
                  )}

                  {ev.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {ev.topics.slice(0, 8).map((t, i) => (
                        <span key={i} className="text-xs bg-stone-200 text-stone-600 rounded-full px-2 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {ev.audio_url && (
                    <audio
                      controls
                      preload="none"
                      className="w-full h-8"
                      src={ev.audio_url}
                    />
                  )}

                  {(ev.arousal != null || ev.valence != null || ev.completion_rate != null) && (
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-stone-400">Vocal Arousal</span>
                        <p className="font-mono text-stone-900 mt-0.5">{ev.arousal != null ? formatNumber(ev.arousal, 3) : '—'}</p>
                      </div>
                      <div>
                        <span className="text-stone-400">Vocal Valence</span>
                        <p className="font-mono text-stone-900 mt-0.5">{ev.valence != null ? formatNumber(ev.valence, 3) : '—'}</p>
                      </div>
                      <div>
                        <span className="text-stone-400">Completion Rate</span>
                        <p className="font-mono text-stone-900 mt-0.5">
                          {ev.completion_rate != null ? `${(ev.completion_rate * 100).toFixed(1)}%` : '—'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-stone-400 mb-1.5 uppercase tracking-wide">Narrative surprise scores</p>
                    <p className="text-xs text-stone-400 mb-2">How much this guest's inflation framing differs from the show's baseline, by frame:</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {FOCUS_FRAMES.map(f => {
                      const key = `surp_SAE_${f}` as keyof InjectionEvent;
                      const val = ev[key] as number;
                      const color = FRAME_COLORS[f];
                      return (
                        <div key={f} className="rounded-md border border-stone-200 bg-white p-2">
                          <span className="text-stone-400">{FRAME_LABELS[f]}</span>
                          <p
                            className="font-mono mt-0.5"
                            style={{ color: val > 0 ? color : '#9ca3af' }}
                          >
                            {val > 0 ? '+' : ''}{formatNumber(val, 4)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-stone-500">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-stone-300 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-stone-300 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
