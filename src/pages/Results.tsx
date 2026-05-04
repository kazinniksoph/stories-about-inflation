import { FRAME_COLORS } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  ErrorBar, Cell,
} from 'recharts';

interface IVResult {
  frame: string;
  label: string;
  coef: number;
  se: number;
  p: number;
  color: string;
  sig: string;
}

// Coefficients sourced from output/inflation/replication/headline_cum_dose.csv
// (1Y) and horizon_shape_results.csv (3Y density mean Q9c_mean). Filtered
// carrier-IV corpus, N=2,687 state-month cells. SEs from the cluster-robust
// regression with state and month fixed effects.
const IV_1Y: IVResult[] = [
  { frame: 'HOUSING_STRUCTURAL', label: 'Housing Structural', coef: -8.56, se: 2.94, p: 0.004, color: FRAME_COLORS.HOUSING_STRUCTURAL, sig: '***' },
  { frame: 'GEOPOLITICAL', label: 'Geopolitical', coef: -5.03, se: 1.78, p: 0.005, color: FRAME_COLORS.GEOPOLITICAL, sig: '***' },
  { frame: 'PARTISAN_BLAME', label: 'Partisan Blame', coef: 1.62, se: 0.59, p: 0.006, color: FRAME_COLORS.PARTISAN_BLAME, sig: '***' },
  { frame: 'SUPPLY_SHOCK', label: 'Supply Shock', coef: -9.17, se: 5.56, p: 0.099, color: FRAME_COLORS.SUPPLY_SHOCK, sig: '*' },
  { frame: 'WAGE_SPIRAL', label: 'Wage-Price Spiral', coef: -4.65, se: 4.16, p: 0.264, color: FRAME_COLORS.WAGE_SPIRAL, sig: '' },
  { frame: 'FED_FAILURE', label: 'Fed Failure', coef: -3.12, se: 2.16, p: 0.150, color: FRAME_COLORS.FED_FAILURE, sig: '' },
];

const IV_3Y: IVResult[] = [
  { frame: 'HOUSING_STRUCTURAL', label: 'Housing Structural', coef: -5.03, se: 2.34, p: 0.032, color: FRAME_COLORS.HOUSING_STRUCTURAL, sig: '**' },
  { frame: 'GEOPOLITICAL', label: 'Geopolitical', coef: -2.62, se: 1.29, p: 0.042, color: FRAME_COLORS.GEOPOLITICAL, sig: '**' },
  { frame: 'PARTISAN_BLAME', label: 'Partisan Blame', coef: 1.33, se: 0.47, p: 0.005, color: FRAME_COLORS.PARTISAN_BLAME, sig: '***' },
  { frame: 'SUPPLY_SHOCK', label: 'Supply Shock', coef: -7.31, se: 3.50, p: 0.037, color: FRAME_COLORS.SUPPLY_SHOCK, sig: '**' },
  { frame: 'WAGE_SPIRAL', label: 'Wage-Price Spiral', coef: -5.15, se: 2.45, p: 0.036, color: FRAME_COLORS.WAGE_SPIRAL, sig: '**' },
  { frame: 'FED_FAILURE', label: 'Fed Failure', coef: -0.78, se: 1.46, p: 0.591, color: FRAME_COLORS.FED_FAILURE, sig: '' },
];

// Geopolitical column from main_v4.tex tab:het_geopolitical (respondent-level
// regressions with state and month FE, N=56,445).
const DEMOGRAPHICS = [
  { interaction: 'Dose × Female', coef: -3.11, se: 6.30, p: 0.621 },
  { interaction: 'Dose × Republican lean', coef: -3.73, se: 1.74, p: 0.032 },
  { interaction: 'Dose × High Numeracy', coef: -3.35, se: 1.24, p: 0.007 },
];

function CoefPlot({ data, title, subtitle }: { data: IVResult[]; title: string; subtitle: string }) {
  const chartData = data.map(d => ({
    ...d,
    ciLo: d.coef - 1.96 * d.se,
    ciHi: d.coef + 1.96 * d.se,
    errorBar: [d.coef - (d.coef - 1.96 * d.se), (d.coef + 1.96 * d.se) - d.coef],
  }));

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="text-xs text-stone-500 mt-0.5 mb-4">{subtitle}</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: '#78716c' }} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#44403c' }} width={110} />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === 'coef') {
                const v = Number(value);
                const item = chartData.find(d => d.coef === v);
                return [
                  `${v.toFixed(2)} (SE: ${item?.se.toFixed(2)}, p: ${item?.p.toFixed(3)})`,
                  'Coefficient',
                ];
              }
              return [value, name];
            }}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
          />
          <ReferenceLine x={0} stroke="#a8a29e" strokeDasharray="3 3" />
          <Bar dataKey="coef" radius={[0, 4, 4, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.p < 0.05 ? d.color : '#d6d3d1'} />
            ))}
            <ErrorBar
              dataKey="errorBar"
              width={6}
              strokeWidth={1.5}
              stroke="#57534e"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Results() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900">Does hearing these stories change expectations?</h2>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          The charts below show causal estimates: how much does a state's average
          inflation expectation change when its residents hear more of a given
          story? Colored bars are statistically significant (p &lt; 0.05); gray
          bars are not. The whiskers show 95% confidence intervals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CoefPlot
          data={IV_1Y}
          title="1-Year Expected Inflation"
          subtitle="SCE 1-year point forecast, cumulative 3-month dose, N = 2,687 state-month cells"
        />
        <CoefPlot
          data={IV_3Y}
          title="3-Year Expected Inflation"
          subtitle="SCE 3-year density mean, cumulative 3-month dose"
        />
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900">Who is most affected?</h3>
        <p className="text-xs text-stone-500 mt-0.5 mb-4">
          Does the geopolitical narrative effect differ by listener demographics?
          A negative interaction means that group is <em>less</em> responsive;
          positive means <em>more</em>. Republican-leaning and high-numeracy
          respondents both absorb geopolitical exposure significantly less
          than the average listener. N = 56,445.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-2 px-3 text-xs font-medium text-stone-500 uppercase">Interaction</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">Coefficient</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">Std. Error</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">p-value</th>
              </tr>
            </thead>
            <tbody>
              {DEMOGRAPHICS.map(d => (
                <tr key={d.interaction} className="border-b border-stone-50">
                  <td className="py-2 px-3 text-stone-700">{d.interaction}</td>
                  <td className={`py-2 px-3 text-right font-mono ${d.p < 0.05 ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}>
                    {d.coef > 0 ? '+' : ''}{d.coef.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-stone-500">{d.se.toFixed(2)}</td>
                  <td className={`py-2 px-3 text-right font-mono ${d.p < 0.05 ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}>
                    {d.p.toFixed(3)}
                    {d.p < 0.01 ? ' ***' : d.p < 0.05 ? ' **' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900">Two ways of telling inflation stories</h3>
        <p className="text-xs text-stone-500 mt-0.5 mb-4">
          Inflation stories reach listeners through two distinct channels.
          <em> Analytical</em> shows (Bloomberg, CNBC, Marketplace) feature
          calmer vocal delivery and more explicit causal reasoning.
          <em> Political</em> shows (Kudlow, Glenn Beck, Clay Travis) feature
          more emotionally intense delivery and more partisan attribution.
          The arousal difference is highly significant (p &lt; 0.001).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-2 px-3 text-xs font-medium text-stone-500 uppercase">Channel</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">Events</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">Causal Sents</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">Partisan %</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">Arousal</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-stone-500 uppercase">Completion</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-50">
                <td className="py-2 px-3 text-stone-700 font-medium">Analytical</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">1,394</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">23.1%</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">71.3%</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">0.353</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">—</td>
              </tr>
              <tr className="border-b border-stone-50">
                <td className="py-2 px-3 text-stone-700 font-medium">Political</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">1,102</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">5.5%</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">93.2%</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">0.379</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">—</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-stone-400 text-xs italic" colSpan={6}>
                  Sample of 2,496 episodes with both audio and language analysis. Episodes are split at the median rate of explicit causal sentences (12%). The 0.026 difference in arousal is highly significant (p &lt; 0.001). The split on causal sentences is mechanical (above vs below the median). The 21.9 percentage-point gap in partisan-event share is the striking part.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md bg-stone-100 border border-stone-200 p-4 text-xs text-stone-500 leading-relaxed">
        <strong className="text-stone-700">What these numbers mean, and what they don't.</strong>{' '}
        The estimates measure what happens to a state's average inflation
        expectation when its residents hear more of a given story. They are
        causal in the sense that the variation in exposure comes from guest
        travel across shows, not from local economic conditions. But the
        treatment bundles the messenger and the message: we cannot fully
        separate whether it is the story itself or the person telling it that
        moves beliefs. Coefficients are in percentage points per unit of
        cumulative three-month narrative dose. See the paper for full
        specification details, robustness checks, and limitations.
      </div>
    </div>
  );
}
