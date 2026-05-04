import { useEffect, useState } from 'react';

interface FunnelStep {
  stage: string;
  count: number;
  description: string;
}

interface MethodologyData {
  funnel: FunnelStep[];
}

export default function Methodology() {
  const [data, setData] = useState<MethodologyData | null>(null);

  useEffect(() => {
    fetch('/data/methodology.json')
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <div className="text-center py-20 text-stone-400">Loading...</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>How we measure inflation stories</h2>
        <p className="text-sm mt-2 leading-relaxed mx-auto max-w-2xl" style={{ color: 'var(--text-light)' }}>
          Starting from a commercial podcast database covering 4.3 million shows
          and 49 million transcribed episodes, each filtering step narrows the
          sample to episodes that substantively discuss inflation and have the
          metadata needed for causal identification. Transcripts come from a
          commercial podcast database that ingests RSS feeds and transcribes
          each episode using Whisper automatic speech recognition.
        </p>
      </div>

      <div className="rounded-lg p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col items-center">
          {data.funnel.map((step, i) => {
            const maxCount = data.funnel[0].count;
            const logMax = Math.log10(maxCount);
            const logVal = Math.log10(Math.max(step.count, 1));
            // Tighter width range so the funnel narrows visibly without
            // collapsing on the smallest stages.
            const widthPct = Math.max(28, (logVal / logMax) * 100);
            const isLast = i === data.funnel.length - 1;
            // Canonical navy palette: darkest at top, lightest at bottom,
            // matching the paper's figure style.
            const colors = ['#163758', '#1f4e79', '#5a82a9', '#7a9bbd', '#a5bdd4'];
            const bg = colors[Math.min(i, colors.length - 1)];
            const formatted = step.count >= 1e6
              ? `${(step.count / 1e6).toFixed(1)}M`
              : step.count.toLocaleString();
            return (
              <div key={i} className="flex flex-col items-center w-full" style={{ marginTop: i === 0 ? 0 : 4 }}>
                <div
                  className="relative flex items-center justify-center py-3 transition-all"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: bg,
                    color: '#ffffff',
                    clipPath: isLast
                      ? 'polygon(6% 0%, 94% 0%, 50% 100%, 50% 100%)'
                      : 'polygon(0% 0%, 100% 0%, 92% 100%, 8% 100%)',
                    minHeight: 50,
                  }}
                >
                  <span className="text-base font-semibold tabular-nums tracking-tight">
                    {formatted}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-3 text-center" style={{ color: 'var(--ink)' }}>
                  {step.stage}
                </p>
                <p className="text-xs text-center max-w-sm mt-1 mb-3 leading-relaxed" style={{ color: 'var(--text-light)' }}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
