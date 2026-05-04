import { useEffect, useState } from 'react';
import { FRAME_COLORS, FRAME_LABELS, FRAME_DESCRIPTIONS, FOCUS_FRAMES } from '../types';
import FrameBadge from '../components/FrameBadge';

interface Neuron {
  id: number;
  correlation: number;
  theme: string;
}

interface TopEpisode {
  episode_id: string;
  title: string;
  show: string;
  date: string;
  activation: number;
  summary: string;
  inflation_quotes: string[];
}

interface FrameData {
  neurons: Neuron[];
  validation: { own_mean: number; other_max: number };
  top_episodes: TopEpisode[];
}

interface NonAligned {
  reason: string;
}

interface MethodologyData {
  frames: Record<string, FrameData>;
  non_aligned: Record<string, NonAligned>;
}

// Use the canonical FOCUS_FRAMES list (the three robust stories: housing
// structural, geopolitical, partisan blame). Single source of truth in
// src/types/index.ts.
const FOCUS_ORDER = FOCUS_FRAMES;

export default function Frames() {
  const [data, setData] = useState<MethodologyData | null>(null);
  const [activeFrame, setActiveFrame] = useState('GEOPOLITICAL');

  useEffect(() => {
    fetch('/data/methodology.json')
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <div className="text-center py-20 text-stone-400">Loading...</div>;
  }

  const frame = data.frames[activeFrame];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900">What does each story actually capture?</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
          A sparse autoencoder (SAE) is a neural network that learns the recurring
          patterns in how inflation is discussed across hundreds of thousands of
          podcast episodes. It does this without being told what to look for in advance.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FOCUS_ORDER.map(f => (
          <button
            key={f}
            onClick={() => setActiveFrame(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFrame === f ? 'text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
            style={activeFrame === f ? { backgroundColor: FRAME_COLORS[f] } : {}}
          >
            {FRAME_LABELS[f]}
          </button>
        ))}
      </div>

      {frame && (
        <div className="space-y-5">
          {/* Frame description */}
          <div className="rounded-md bg-stone-50 border border-stone-200 p-4">
            <p className="text-sm text-stone-700 leading-relaxed">{FRAME_DESCRIPTIONS[activeFrame]}</p>
          </div>

          {/* Neurons + Validation combined */}
          <div className="rounded-lg p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
              How the SAE captures this story
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-light)' }}>
              Each neuron is one of the patterns the SAE learned. The correlation (r)
              measures how well that neuron lines up with the story label assigned
              by an independent classifier. Higher r means a stronger match.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
              {frame.neurons.map(n => (
                <div key={n.id} className="rounded-md p-3" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono" style={{ color: 'var(--text)' }}>Neuron {n.id}</span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${FRAME_COLORS[activeFrame]}18`,
                        color: FRAME_COLORS[activeFrame],
                      }}
                    >
                      r = {n.correlation.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-light)' }}>{n.theme}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs mb-3" style={{ color: 'var(--text-light)' }}>
                <strong style={{ color: 'var(--ink)' }}>Validation:</strong> the composite
                should fire strongly on matching episodes and weakly on others.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-semibold font-mono" style={{ color: FRAME_COLORS[activeFrame] }}>
                    {frame.validation.own_mean.toFixed(3)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
                    Mean on own label
                  </p>
                </div>
                <div className="text-lg" style={{ color: 'var(--border)' }}>vs</div>
                <div className="text-center">
                  <p className="text-2xl font-semibold font-mono" style={{ color: 'var(--text-light)' }}>
                    {frame.validation.other_max.toFixed(3)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
                    Max on other labels
                  </p>
                </div>
                <div className="text-center ml-4">
                  <p className="text-2xl font-semibold font-mono" style={{ color: 'var(--ink)' }}>
                    {(frame.validation.own_mean / frame.validation.other_max).toFixed(1)}x
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
                    Separation ratio
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Non-aligned frames */}
      <details className="rounded-lg group" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <summary className="p-5 cursor-pointer select-none flex items-center justify-between hover:bg-stone-50 rounded-lg transition-colors">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              What the data doesn't separate
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
              Three theory-motivated stories did not align with any SAE neuron. Click to see why.
            </p>
          </div>
          <span className="text-stone-400 text-xs group-open:rotate-90 transition-transform ml-4 shrink-0">&#9654;</span>
        </summary>
        <div className="px-5 pb-5 space-y-2">
          {Object.entries(data.non_aligned).map(([f, info]) => (
            <details
              key={f}
              className="group rounded-lg"
              style={{ border: '1px solid var(--border)' }}
            >
              <summary
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-stone-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FrameBadge frame={f} size="md" />
                  <span className="text-sm text-stone-500">Not separable in the embedding space</span>
                </div>
                <span className="text-stone-400 text-xs group-open:rotate-90 transition-transform">&#9654;</span>
              </summary>
              <div className="px-4 pb-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                  {info.reason}
                </p>
              </div>
            </details>
          ))}
        </div>
      </details>
    </div>
  );
}
