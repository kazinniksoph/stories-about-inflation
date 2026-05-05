import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  loadDose, loadTopShowsByState, loadTopGuestsByFrame,
} from '../data/loader';
import type {
  StateMonthDose, TopShowByState, TopGuestPerFrame,
} from '../types';
import { FRAME_COLORS, FRAME_LABELS, FOCUS_FRAMES } from '../types';

// Match the Python slug() used by build_state_map.py for cover-art file names
function showSlug(name: string): string {
  let out = '';
  for (const ch of name.toLowerCase()) {
    out += /[a-z0-9]/.test(ch) ? ch : '_';
  }
  return out.slice(0, 80);
}

// Standard tile-grid US layout (50 states + DC). Empty cells are gaps.
const TILE_GRID: (string | null)[][] = [
  ['AK', null, null, null, null, null, null, null, null, null, 'ME'],
  [null, null, null, null, null, null, null, null, 'VT', 'NH', null],
  ['WA', 'ID', 'MT', 'ND', 'MN', 'WI', null, 'MI', null, 'NY', 'MA'],
  ['OR', 'NV', 'WY', 'SD', 'IA', 'IL', 'IN', 'OH', 'PA', 'NJ', 'CT'],
  ['CA', 'UT', 'CO', 'NE', 'MO', 'KY', 'WV', 'VA', 'MD', 'DE', 'RI'],
  [null, 'AZ', 'NM', 'KS', 'AR', 'TN', 'NC', 'SC', 'DC', null, null],
  ['HI', null, null, 'OK', 'LA', 'MS', 'AL', 'GA', null, null, null],
  [null, null, null, 'TX', null, null, 'FL', null, null, null, null],
];

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',DC:'D.C.',FL:'Florida',GA:'Georgia',HI:'Hawaii',
  ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',
  LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',
  MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',
  NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',
  NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',
  PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
};

function quantileColor(val: number, min: number, max: number, color: string): string {
  if (max === min) return `${color}30`;
  const t = (val - min) / (max - min);
  const alpha = Math.round(15 + t * 85).toString(16).padStart(2, '0');
  return `${color}${alpha}`;
}

export default function Geography() {
  const [dose, setDose] = useState<StateMonthDose[]>([]);
  const [topShowsDistinctive, setTopShowsDistinctive] = useState<TopShowByState[]>([]);
  const [topShowsAbsolute, setTopShowsAbsolute] = useState<TopShowByState[]>([]);
  const [topGuestsByFrame, setTopGuestsByFrame] = useState<Record<string, TopGuestPerFrame[]>>({});
  const [mapVariant, setMapVariant] = useState<'distinctive' | 'absolute'>('distinctive');
  const [selectedFrame, setSelectedFrame] = useState<string>('GEOPOLITICAL');

  useEffect(() => {
    loadDose().then(setDose);
    loadTopShowsByState('distinctive').then(setTopShowsDistinctive);
    loadTopShowsByState('absolute').then(setTopShowsAbsolute);
    loadTopGuestsByFrame().then(setTopGuestsByFrame);
  }, []);

  const topShows = mapVariant === 'distinctive' ? topShowsDistinctive : topShowsAbsolute;

  const topGuestPerFrameByState = useMemo(() => {
    const m: Record<string, TopGuestPerFrame> = {};
    const rows = topGuestsByFrame[selectedFrame] || [];
    for (const r of rows) m[r.state] = r;
    return m;
  }, [topGuestsByFrame, selectedFrame]);

  const topShowByState = useMemo(() => {
    const m: Record<string, TopShowByState> = {};
    for (const r of topShows) m[r.state] = r;
    return m;
  }, [topShows]);

  const shareRange = useMemo(() => {
    if (!topShows.length) return { min: 0, max: 1 };
    const vals = topShows.map(r => r.state_share);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [topShows]);

  const stateAgg = useMemo(() => {
    const agg: Record<string, { total: number; count: number }> = {};
    const col = `surp_SAE_${selectedFrame}` as keyof StateMonthDose;
    for (const row of dose) {
      const st = row.state;
      if (!agg[st]) agg[st] = { total: 0, count: 0 };
      agg[st].total += (row[col] as number) || 0;
      agg[st].count += 1;
    }
    const result: { state: string; name: string; cumDose: number; months: number }[] = [];
    for (const [st, { total, count }] of Object.entries(agg)) {
      result.push({ state: st, name: STATE_NAMES[st] || st, cumDose: total, months: count });
    }
    result.sort((a, b) => b.cumDose - a.cumDose);
    return result;
  }, [dose, selectedFrame]);

  if (!dose.length) {
    return <div className="text-center py-20 text-stone-400">Loading...</div>;
  }

  const vals = stateAgg.map(s => s.cumDose);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const color = FRAME_COLORS[selectedFrame];

  return (
    <div className="space-y-4">
      {/* Tile-grid US map: top show per state, distinctive vs largest-audience */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
          <h3 className="text-sm font-semibold text-stone-900">
            Each state's top podcast
          </h3>
          <div className="flex rounded-md overflow-hidden border border-stone-300 shrink-0 text-xs">
            <button
              onClick={() => setMapVariant('distinctive')}
              className={`px-2.5 py-1 transition-colors ${
                mapVariant === 'distinctive'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              Most distinctive
            </button>
            <button
              onClick={() => setMapVariant('absolute')}
              className={`px-2.5 py-1 border-l border-stone-300 transition-colors ${
                mapVariant === 'absolute'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              Largest audience
            </button>
          </div>
        </div>
        <p className="text-xs text-stone-500 mt-0.5 mb-3 leading-relaxed">
          {mapVariant === 'distinctive' ? (
            <>
              Each tile is the podcast whose audience is most concentrated in that
              state, picked from U.S.-majority shows. The percentage is the share
              of the show's U.S. listeners who live in that state. A high
              percentage usually means a small, locally rooted show.
            </>
          ) : (
            <>
              Each tile is the podcast with the most listeners in that state, in
              absolute terms, picked from U.S.-majority shows. The percentage is
              the share of the show's U.S. listeners who live in that state. Big
              national shows can win on raw listeners while still drawing only a
              few percent of their audience from any single state.
            </>
          )}{' '}
          Click a tile to filter the Explorer by that show.
        </p>
        {topShows.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">Loading map...</div>
        ) : (
          <div className="space-y-1">
            {TILE_GRID.map((row, ri) => (
              <div key={ri} className="grid grid-cols-11 gap-1">
                {row.map((st, ci) => {
                  if (!st) return <div key={ci} />;

                  const entry = topShowByState[st];
                  if (!entry) {
                    return (
                      <div
                        key={ci}
                        className="rounded-sm border border-stone-200 bg-stone-50 aspect-[5/4] flex items-center justify-center text-[10px] font-mono text-stone-400"
                      >
                        {st}
                      </div>
                    );
                  }
                  const t = shareRange.max > shareRange.min
                    ? (entry.state_share - shareRange.min) / (shareRange.max - shareRange.min)
                    : 0.5;
                  // Navy tint
                  const alphaPct = Math.round(15 + t * 60);
                  const bg = `rgba(30, 58, 95, ${alphaPct / 100})`;
                  const textColor = t > 0.55 ? '#ffffff' : '#1f3550';
                  return (
                    <Link
                      key={ci}
                      to={`/explorer?q=${encodeURIComponent(entry.top_show)}`}
                      title={`${STATE_NAMES[st] || st}: ${entry.top_show} (${(entry.state_share * 100).toFixed(1)}% of show's US audience)`}
                      className="relative rounded-sm border border-stone-200 aspect-[5/4] p-1 flex flex-col items-center justify-start hover:border-stone-400 transition-colors group overflow-hidden"
                      style={{ backgroundColor: bg, color: textColor }}
                    >
                      <div className="absolute top-0.5 left-1 text-[9px] font-mono opacity-80 z-10">{st}</div>
                      <div className="absolute top-0.5 right-1 text-[9px] font-mono tabular-nums opacity-80 z-10">{(entry.state_share * 100).toFixed(0)}%</div>
                      <img
                        src={`/show_logos/${showSlug(entry.top_show)}.jpg`}
                        alt=""
                        loading="lazy"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        className="rounded-sm object-cover bg-white/40 mt-3"
                        style={{ width: '60%', aspectRatio: '1 / 1' }}
                      />
                      <div className="text-[9px] leading-tight font-medium text-center line-clamp-2 group-hover:underline decoration-1 underline-offset-2 mt-1 px-0.5">
                        {entry.top_show}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-stone-900">Per-story exposure by state</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          The tables below show which states received the most (and least) total
          exposure to each story over the full sample period.
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {FOCUS_FRAMES.map(f => (
          <button
            key={f}
            onClick={() => setSelectedFrame(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedFrame === f ? 'text-white' : 'text-stone-600 hover:bg-stone-200'
            }`}
            style={
              selectedFrame === f
                ? { backgroundColor: FRAME_COLORS[f] }
                : { backgroundColor: `${FRAME_COLORS[f]}15` }
            }
          >
            {FRAME_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Per-frame heatmap on the same tile grid */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-stone-900 mb-1">
          {FRAME_LABELS[selectedFrame]} dose by state
        </h3>
        <p className="text-xs text-stone-500 mt-0.5 mb-3 leading-relaxed">
          Each tile shades by that state's cumulative {FRAME_LABELS[selectedFrame].toLowerCase()} dose
          across the sample. Darker = more exposure. Hover for the exact value.
        </p>
        <div className="space-y-1">
          {TILE_GRID.map((row, ri) => {
            const stateMap: Record<string, { cumDose: number; name: string }> = {};
            for (const s of stateAgg) stateMap[s.state] = { cumDose: s.cumDose, name: s.name };
            return (
              <div key={ri} className="grid grid-cols-11 gap-1">
                {row.map((st, ci) => {
                  if (!st) return <div key={ci} />;
                  const entry = stateMap[st];
                  if (!entry) {
                    return (
                      <div
                        key={ci}
                        className="rounded-sm border border-stone-200 bg-stone-50 aspect-[5/3] flex items-center justify-center text-[10px] font-mono text-stone-400"
                      >
                        {st}
                      </div>
                    );
                  }
                  // Normalize using the positive max so all frame heatmaps
                  // compare consistently (negative values render as faint).
                  const t = maxVal > 0 ? Math.max(0, entry.cumDose) / maxVal : 0;
                  const alphaPct = entry.cumDose <= 0 ? 8 : Math.round(15 + t * 70);
                  const bg = `${color}${alphaPct.toString(16).padStart(2, '0')}`;
                  const textColor = t > 0.55 ? '#ffffff' : '#1f3550';
                  const topG = topGuestPerFrameByState[st];
                  const tooltip = topG
                    ? `${entry.name}: ${entry.cumDose.toFixed(4)}\nTop ${FRAME_LABELS[selectedFrame]} carrier: ${topG.top_guest} (${topG.n_events} events)`
                    : `${entry.name}: ${entry.cumDose.toFixed(4)}`;
                  return (
                    <div
                      key={ci}
                      title={tooltip}
                      className="rounded-sm border border-stone-200 aspect-[5/3] p-1 flex flex-col justify-between"
                      style={{ backgroundColor: bg, color: textColor }}
                    >
                      <div className="text-[10px] font-mono opacity-90">{st}</div>
                      <div className="text-[9px] font-mono tabular-nums opacity-80 text-right">
                        {entry.cumDose >= 0 ? '+' : ''}{entry.cumDose.toFixed(3)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-stone-400 uppercase tracking-wide text-[10px] mb-1">Top 3</div>
            <div className="space-y-0.5">
              {stateAgg.slice(0, 3).map(s => (
                <div key={s.state} className="flex justify-between font-mono">
                  <span className="text-stone-700">{s.state} <span className="text-stone-400 text-[11px]">{s.name}</span></span>
                  <span className="text-stone-600 tabular-nums">{s.cumDose.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-stone-400 uppercase tracking-wide text-[10px] mb-1">Bottom 3</div>
            <div className="space-y-0.5">
              {stateAgg.slice(-3).reverse().map(s => (
                <div key={s.state} className="flex justify-between font-mono">
                  <span className="text-stone-700">{s.state} <span className="text-stone-400 text-[11px]">{s.name}</span></span>
                  <span className="text-stone-600 tabular-nums">{s.cumDose.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_100px_80px] gap-2 px-4 py-2 border-b border-stone-100 bg-stone-50 text-xs font-medium text-stone-500 uppercase tracking-wide">
          <div>State</div>
          <div>Name</div>
          <div className="text-right">Cum. Dose</div>
          <div className="text-right">Months</div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {stateAgg.map(s => (
            <div
              key={s.state}
              className="grid grid-cols-[60px_1fr_100px_80px] gap-2 px-4 py-1.5 border-b border-stone-50 hover:bg-stone-50"
              style={{ backgroundColor: quantileColor(s.cumDose, minVal, maxVal, color) }}
            >
              <div className="text-sm font-mono text-stone-700">{s.state}</div>
              <div className="text-sm text-stone-600">{s.name}</div>
              <div className="text-sm font-mono text-stone-700 text-right">{s.cumDose.toFixed(4)}</div>
              <div className="text-sm text-stone-500 text-right">{s.months}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
