import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { loadShares } from '../data/loader';
import type { MonthlyFrameShares } from '../types';
import { FRAME_LABELS, FOCUS_FRAMES } from '../types';

// Logo-aligned palette: navy-derived tones + gold accent
const CHART_COLORS: Record<string, string> = {
  GEOPOLITICAL: '#b91c1c',
  PARTISAN_BLAME: '#6d28d9',
  HOUSING_STRUCTURAL: '#0e7490',
  FED_FAILURE: '#c2410c',
  SUPPLY_SHOCK: '#15803d',
  OTHER: '#c4bfb6',
};

export default function Staircase() {
  const [shares, setShares] = useState<MonthlyFrameShares>({});

  useEffect(() => {
    loadShares().then(setShares);
  }, []);

  const chartData = useMemo(() => {
    const months = Object.keys(shares).sort();
    return months
      .map(ym => {
        const counts = shares[ym];
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const row: Record<string, number | string> = { month: ym };
        for (const f of FOCUS_FRAMES) {
          row[f] = total > 0 ? (counts[f] || 0) / total : 0;
        }
        row['OTHER'] = total > 0
          ? Object.entries(counts)
              .filter(([k]) => !FOCUS_FRAMES.includes(k as typeof FOCUS_FRAMES[number]))
              .reduce((a, [, v]) => a + v, 0) / total
          : 0;
        row['total'] = total;
        return row;
      })
      .filter(row => (row['total'] as number) >= 5);
  }, [shares]);

  if (!chartData.length) {
    return <div className="text-center py-20" style={{ color: 'var(--text-light)' }}>Loading...</div>;
  }

  const allFrames = [...FOCUS_FRAMES, 'OTHER'] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
          What are people talking about?
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-light)' }}>
          Each month, carrier guests appear on podcasts and tell different
          inflation stories. This chart shows what fraction of appearances is
          dominated by each story (months with fewer than 5 appearances are
          excluded).
        </p>
      </div>

      <div
        className="rounded-lg p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <ResponsiveContainer width="100%" height={420}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#2a4a6b', fontFamily: 'var(--font-body)' }}
              tickFormatter={v => {
                const [y, m] = v.split('-');
                return m === '01' || m === '07'
                  ? `${['Jan','','','','','','Jul'][parseInt(m)-1]} '${y.slice(2)}`
                  : '';
              }}
              interval={0}
              axisLine={{ stroke: '#2a4a6b', strokeWidth: 0.5 }}
              tickLine={{ stroke: '#2a4a6b', strokeWidth: 0.5 }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#2a4a6b', fontFamily: 'var(--font-body)' }}
              tickFormatter={v => `${(v * 100).toFixed(0)}%`}
              domain={[0, 1]}
              axisLine={{ stroke: '#2a4a6b', strokeWidth: 0.5 }}
              tickLine={false}
            />
            <Tooltip
              labelFormatter={v => {
                const [y, m] = String(v).split('-');
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return `${months[parseInt(m) - 1]} ${y}`;
              }}
              formatter={(value: any, name: any) => [
                `${(Number(value) * 100).toFixed(1)}%`,
                FRAME_LABELS[name as string] || 'Other',
              ]}
              contentStyle={{
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
            {allFrames.map(f => (
              <Area
                key={f}
                type="monotone"
                dataKey={f}
                stackId="1"
                fill={CHART_COLORS[f] || '#c4bfb6'}
                stroke={CHART_COLORS[f] || '#a8a29e'}
                fillOpacity={0.75}
                strokeWidth={0.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Custom legend */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-2">
          {allFrames.map(f => (
            <div key={f} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: CHART_COLORS[f] || '#c4bfb6' }}
              />
              <span className="text-xs" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                {FRAME_LABELS[f] || 'Other'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--navy)' }}>
          Monthly event counts
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9, fill: '#2a4a6b' }}
              tickFormatter={v => {
                const [y, m] = v.split('-');
                return m === '01' ? `'${y.slice(2)}` : '';
              }}
              interval={0}
              axisLine={{ stroke: '#2a4a6b', strokeWidth: 0.5 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#2a4a6b' }}
              axisLine={false}
              tickLine={false}
            />
            <Area
              type="monotone"
              dataKey="total"
              fill="#1a2e44"
              stroke="#1a2e44"
              fillOpacity={0.12}
              strokeWidth={1.5}
            />
            <Tooltip
              labelFormatter={v => String(v)}
              formatter={(value: any) => [`${value} events`, 'Count']}
              contentStyle={{
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                borderRadius: 6,
                border: '1px solid var(--border)',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
