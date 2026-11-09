import { FRAME_COLORS } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  ErrorBar, Cell,
} from 'recharts';

interface Estimate {
  label: string;
  coef: number;
  se: number;
  color: string;
  muted?: boolean;
}

// Pooled respondent-level regressions (paper Table "cum_dose"): SCE one-year
// point forecast on the lag-only cumulative three-month dose, state and month
// fixed effects, state-clustered standard errors, N = 64,124. Coefficients are
// per unit of dose. Housing is measured from show programming, not carriers,
// and is described in the text below.
const POOLED: Estimate[] = [
  { label: 'Geopolitical', coef: -3.13, se: 0.81, color: FRAME_COLORS.GEOPOLITICAL },
  { label: 'Partisan blame', coef: 1.76, se: 0.40, color: FRAME_COLORS.PARTISAN_BLAME },
  { label: 'Fed failure', coef: -2.70, se: 1.27, color: FRAME_COLORS.FED_FAILURE },
  { label: 'Supply shock', coef: -12.19, se: 4.76, color: FRAME_COLORS.SUPPLY_SHOCK },
  { label: 'Wage-price spiral', coef: 4.67, se: 4.16, color: FRAME_COLORS.WAGE_SPIRAL },
];

// Paper Section 5.3, Table "Pooled Estimates and the December 2024 Break".
// Standard errors are coefficient / t from that table.
interface BreakRow {
  spec: string;
  geo: number; geoT: number;
  blame: number; blameT: number;
  n: string;
}

const BREAK: BreakRow[] = [
  { spec: 'Pooled, state and month fixed effects', geo: -3.13, geoT: -3.88, blame: 1.76, blameT: 4.41, n: '64,124' },
  { spec: 'Before the expansion only (to Nov 2024)', geo: 1.98, geoT: 0.54, blame: 3.18, blameT: 0.78, n: '56,844' },
  { spec: 'After the expansion only (Dec 2024 to Jun 2025)', geo: -0.47, geoT: -0.40, blame: -0.84, blameT: -1.74, n: '7,280' },
  { spec: 'State × period fixed effects', geo: -0.26, geoT: -0.23, blame: -0.64, blameT: -1.24, n: '64,124' },
  { spec: 'State × year fixed effects', geo: -1.07, geoT: -1.06, blame: -0.72, blameT: -1.35, n: '64,124' },
  { spec: 'Pooled + Trump 2020 share × post-expansion', geo: -0.83, geoT: -0.96, blame: 0.49, blameT: 1.16, n: '64,124' },
];

const BREAK_GEO: Estimate[] = BREAK.map((r, i) => ({
  label: ['Pooled', 'Before only', 'After only', 'State × period', 'State × year', 'Trump × post'][i],
  coef: r.geo,
  se: Math.abs(r.geo / r.geoT),
  color: FRAME_COLORS.GEOPOLITICAL,
}));

function CoefPlot({ data, title, subtitle, height = 260 }: { data: Estimate[]; title: string; subtitle: string; height?: number }) {
  const chartData = data.map(d => ({
    ...d,
    sig: Math.abs(d.coef / d.se) > 1.96,
    errorBar: [1.96 * d.se, 1.96 * d.se],
  }));

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="text-xs text-stone-500 mt-0.5 mb-4 leading-relaxed">{subtitle}</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: '#78716c' }} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#44403c' }} width={120} />
          <Tooltip
            formatter={(value: any, name: any, item: any) => {
              if (name === 'coef') {
                const d = item?.payload as (Estimate | undefined);
                const v = Number(value);
                return [
                  `${v > 0 ? '+' : ''}${v.toFixed(2)} (SE ${d?.se.toFixed(2)}, t ${(v / (d?.se || 1)).toFixed(2)})`,
                  'Coefficient',
                ];
              }
              return [value, name];
            }}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
          />
          <ReferenceLine x={0} stroke="#a8a29e" strokeDasharray="3 3" />
          <Bar dataKey="coef" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.sig ? d.color : '#d6d3d1'} />
            ))}
            <ErrorBar dataKey="errorBar" width={6} strokeWidth={1.5} stroke="#57534e" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function fmt(v: number) {
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}`;
}

export default function Results() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900">Do these stories track inflation expectations?</h2>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed max-w-4xl">
          Pooled over 2020 to 2025, states more exposed to geopolitical stories
          report lower inflation expectations and states more exposed to
          partisan blame report higher ones. Those pooled estimates do not hold
          up: they are absent within the period before December 2024, absent
          within the period after it, and absent once each state is allowed its
          own level across that date. This page shows both sets of numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CoefPlot
          data={POOLED}
          title="Pooled estimates: 1-year expected inflation"
          subtitle="Coefficient on the three-month story dose with 95% intervals. State and month fixed effects, N = 64,124 respondent-months. Gray bars are not significant at 5%."
        />
        <CoefPlot
          data={BREAK_GEO}
          title="The geopolitical estimate around December 2024"
          subtitle="Same regression, estimated within each period and with state-specific levels. Only the pooled row is distinguishable from zero."
        />
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900">Pooled estimates and the December 2024 break</h3>
        <p className="text-xs text-stone-500 mt-0.5 mb-4 leading-relaxed max-w-4xl">
          A regression with one fixed effect per state compares each state's
          expectations before and after the expansion against the change in its
          measured exposure. The expansion coincides with the 2024 election,
          after which expectations shifted differently across states. A single
          control for that shift (2020 Trump vote share interacted with a
          post-expansion indicator) removes both estimates.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-2 px-3 text-xs font-medium text-stone-500 uppercase">Specification</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">Geopolitical</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">t</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">Partisan blame</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">t</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">N</th>
              </tr>
            </thead>
            <tbody>
              {BREAK.map(r => (
                <tr key={r.spec} className="border-b border-stone-50">
                  <td className="py-2 px-3 text-stone-700">{r.spec}</td>
                  <td className={`py-2 px-3 text-right font-mono tabular-nums ${Math.abs(r.geoT) > 1.96 ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}>{fmt(r.geo)}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-stone-500">{fmt(r.geoT)}</td>
                  <td className={`py-2 px-3 text-right font-mono tabular-nums ${Math.abs(r.blameT) > 1.96 ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}>{fmt(r.blame)}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-stone-500">{fmt(r.blameT)}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-stone-500">{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-400 mt-3 leading-relaxed">
          Respondent-level regressions of the SCE one-year point forecast on the
          lag-only three-month dose, standard errors clustered by state. Period
          means before versus from December 2024. Bold coefficients are
          significant at 5%.
        </p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900">How to read each story</h3>
        <div className="space-y-3 mt-4">
          <div className="rounded-md p-4" style={{ background: `${FRAME_COLORS.GEOPOLITICAL}10`, borderLeft: `3px solid ${FRAME_COLORS.GEOPOLITICAL}` }}>
            <h4 className="text-sm font-semibold text-stone-900 mb-1">Geopolitical: a pooled association that does not survive</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              The pooled estimate (about −0.14 percentage points per standard
              deviation of exposure) passes the checks usually asked of this
              kind of design: no pre-trends, no dependence on a few guests or
              shows, and a placebo built from audience shares alone that is far
              smaller. It still disappears with a state-specific level after
              December 2024. Passing those checks was not enough.
            </p>
          </div>

          <div className="rounded-md p-4" style={{ background: `${FRAME_COLORS.PARTISAN_BLAME}10`, borderLeft: `3px solid ${FRAME_COLORS.PARTISAN_BLAME}` }}>
            <h4 className="text-sm font-semibold text-stone-900 mb-1">Partisan blame: who listens</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              People who usually hear more blame content expect higher inflation
              (between-listener coefficient +2.50). When the same person hears
              more blame than usual, their forecast does not rise
              (within-listener coefficient −0.96, p = 0.07). The pooled
              state-level association also disappears across the December 2024
              break. Blame content marks audiences; the data do not show it
              changing their minds.
            </p>
          </div>

          <div className="rounded-md p-4" style={{ background: `${FRAME_COLORS.HOUSING_STRUCTURAL}10`, borderLeft: `3px solid ${FRAME_COLORS.HOUSING_STRUCTURAL}` }}>
            <h4 className="text-sm font-semibold text-stone-900 mb-1">Housing: a property of shows, not guests</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Housing content comes from housing shows' own programming. Guests
              dilute it. Audiences more exposed to that programming report
              somewhat higher expectations (about +0.20 percentage points per
              standard deviation), and the association fades once regional
              trends are absorbed.
            </p>
          </div>

          <div className="rounded-md p-4 bg-stone-50" style={{ borderLeft: '3px solid #d6d3d1' }}>
            <h4 className="text-sm font-semibold text-stone-700 mb-1">Supply shock, Fed failure, wage-price spiral</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Supply shock and Fed failure content is carried by a small set of
              freight and business-news programs, so their pooled coefficients
              describe exposure to those shows. Wage-price spiral is the rarest
              story and its estimate is indistinguishable from zero. None of the
              three has been re-estimated around the December 2024 break.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900">What the data do show</h3>
        <ul className="text-sm text-stone-600 leading-relaxed mt-3 space-y-2 list-disc pl-5">
          <li>
            Inflation explanations split into mechanism stories and blame
            stories. Claims that name a political actor state a mechanism about
            20 percent of the time, against 50 to 65 percent for other claims.
          </li>
          <li>
            Blame content is tied to particular show formats. Comparing guests
            on the same program removes 71 to 76 percent of the vocal
            difference between blame and other stories.
          </li>
          <li>
            Guest listings overstate appearances. Of 16,193 listed carrier
            appearances, 70.6 percent could be verified as the guest speaking;
            in about a quarter the guest is only mentioned or is absent.
          </li>
          <li>
            Measured exposure is almost entirely predictable from which stories
            circulate nationally and where audiences already are (correlations
            of 0.89 to 0.96), and the remaining booking margin responds to
            audience demand.
          </li>
        </ul>
      </div>

      <div className="rounded-md bg-stone-100 border border-stone-200 p-4 text-xs text-stone-500 leading-relaxed">
        <strong className="text-stone-700">What these numbers mean, and what they don't.</strong>{' '}
        The data do not show that stories heard on podcasts move inflation
        expectations, and they do not show the opposite. The design lacks the
        within-period variation to tell. Coefficients are in percentage points
        per unit of cumulative three-month dose. See the paper for
        specifications and limitations.
      </div>
    </div>
  );
}
