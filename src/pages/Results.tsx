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

// Coefficients from the paper's headline respondent-level regressions
// (main_v6.tex, Table tab:cum_dose for the 1Y point forecast; tab:horizon_comparison
// for the 3Y density mean). Respondent-level, N = 64,256 across 2,687 state-month
// cells; state + month fixed effects, state-clustered SEs. Coefficients are per
// unit of cumulative 3-month dose. Housing is analyzed separately as a show-context
// exposure (see the Housing card below), so it is not shown in these carrier plots.
const IV_1Y: IVResult[] = [
  { frame: 'GEOPOLITICAL', label: 'Geopolitical', coef: -3.64, se: 0.92, p: 0.001, color: FRAME_COLORS.GEOPOLITICAL, sig: '***' },
  { frame: 'PARTISAN_BLAME', label: 'Partisan Blame', coef: 1.46, se: 0.34, p: 0.001, color: FRAME_COLORS.PARTISAN_BLAME, sig: '***' },
  { frame: 'SUPPLY_SHOCK', label: 'Supply Shock', coef: -8.19, se: 3.21, p: 0.011, color: FRAME_COLORS.SUPPLY_SHOCK, sig: '**' },
  { frame: 'FED_FAILURE', label: 'Fed Failure', coef: -2.27, se: 1.43, p: 0.112, color: FRAME_COLORS.FED_FAILURE, sig: '' },
  { frame: 'WAGE_SPIRAL', label: 'Wage-Price Spiral', coef: 1.35, se: 3.21, p: 0.676, color: FRAME_COLORS.WAGE_SPIRAL, sig: '' },
];

// 3Y density mean (Q9c). Coefficients and p-values from tab:horizon_comparison;
// SEs are back-computed from the coefficient and p-value under a normal approximation.
const IV_3Y: IVResult[] = [
  { frame: 'GEOPOLITICAL', label: 'Geopolitical', coef: -1.34, se: 0.89, p: 0.134, color: FRAME_COLORS.GEOPOLITICAL, sig: '' },
  { frame: 'PARTISAN_BLAME', label: 'Partisan Blame', coef: 0.99, se: 0.30, p: 0.001, color: FRAME_COLORS.PARTISAN_BLAME, sig: '***' },
  { frame: 'SUPPLY_SHOCK', label: 'Supply Shock', coef: -5.00, se: 2.35, p: 0.033, color: FRAME_COLORS.SUPPLY_SHOCK, sig: '**' },
  { frame: 'FED_FAILURE', label: 'Fed Failure', coef: -0.23, se: 1.07, p: 0.830, color: FRAME_COLORS.FED_FAILURE, sig: '' },
  { frame: 'WAGE_SPIRAL', label: 'Wage-Price Spiral', coef: -1.00, se: 1.57, p: 0.526, color: FRAME_COLORS.WAGE_SPIRAL, sig: '' },
];

// Geopolitical column of the demographic-interaction table (main_v6.tex, appendix).
// Respondent-level regressions with state and month FE. Because the average
// geopolitical effect is negative, a more negative interaction means that group
// responds more strongly to geopolitical exposure.
const DEMOGRAPHICS = [
  { interaction: 'Dose × Female', coef: -3.11, se: 6.30, p: 0.621 },
  { interaction: 'Dose × Lower income', coef: -3.73, se: 1.74, p: 0.032 },
  { interaction: 'Dose × High numeracy', coef: -3.35, se: 1.24, p: 0.007 },
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
          The charts below show story-by-story estimates: how much does a state's
          average inflation expectation change when its residents hear more of a
          given story? Colored bars are statistically significant in the headline
          regression (p &lt; 0.05); gray bars are not. The whiskers show 95%
          confidence intervals. The three colored stories differ in how
          confidently the effect can be read as causal (see notes below).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CoefPlot
          data={IV_1Y}
          title="1-Year Expected Inflation"
          subtitle="SCE 1-year point forecast, cumulative 3-month dose, respondent-level, N = 64,256"
        />
        <CoefPlot
          data={IV_3Y}
          title="3-Year Expected Inflation"
          subtitle="SCE 3-year density mean, cumulative 3-month dose"
        />
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900">Story by story: how confidently can each effect be read as causal?</h3>
        <p className="text-xs text-stone-500 mt-0.5 mb-4 leading-relaxed">
          The three colored bars above are all statistically significant at the 1% level
          in the headline regression. They differ in how cleanly the effect can be read
          as the causal impact of <em>story content</em> rather than something correlated
          with it.
        </p>
        <div className="space-y-3">
          <div className="rounded-md p-4" style={{ background: `${FRAME_COLORS.GEOPOLITICAL}10`, borderLeft: `3px solid ${FRAME_COLORS.GEOPOLITICAL}` }}>
            <div className="flex items-baseline justify-between mb-1">
              <h4 className="text-sm font-semibold text-stone-900">Geopolitical: cleanest causal evidence</h4>
              <span className="text-xs font-mono text-stone-500">−0.19 pp / SD</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              A one-standard-deviation increase in cumulative 3-month exposure to oil
              shocks, sanctions, war, and trade conflict lowers 1-year expected inflation
              by about 0.19 percentage points. Every robustness check passes or is
              directionally preserved (region × month FE, lag-only, respondent-level,
              lagged-Y placebo, future-dose placebo, share-orthogonality, Rotemberg
              decomposition), and the host-as-carrier placebo decisively fails to
              replicate the result, which means the effect is identifying carrier-borne content,
              not the show's typical programming.
            </p>
          </div>

          <div className="rounded-md p-4" style={{ background: `${FRAME_COLORS.PARTISAN_BLAME}10`, borderLeft: `3px solid ${FRAME_COLORS.PARTISAN_BLAME}` }}>
            <div className="flex items-baseline justify-between mb-1">
              <h4 className="text-sm font-semibold text-stone-900">Partisan blame: selection, not persuasion</h4>
              <span className="text-xs font-mono text-stone-500">+0.21 pp / SD</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Partisan-blame exposure is associated with about 0.21 pp higher 1-year
              expectations per standard deviation, and the association persists at three
              and five years. But a Mundlak decomposition shows this reflects audience
              sorting rather than persuasion. The between-listener term is large and
              significant (people who habitually hear more blame expect higher inflation,
              β₁ = +2.20, p = 0.005), while the within-listener term is null (hearing more
              blame than usual does not move a given respondent, β₂ = −0.74, p = 0.11).
              Partisan shows attract listeners who already expect higher inflation, so the
              dose identifies who is listening rather than a causal effect of blame content.
            </p>
          </div>

          <div className="rounded-md p-4" style={{ background: `${FRAME_COLORS.HOUSING_STRUCTURAL}10`, borderLeft: `3px solid ${FRAME_COLORS.HOUSING_STRUCTURAL}` }}>
            <div className="flex items-baseline justify-between mb-1">
              <h4 className="text-sm font-semibold text-stone-900">Housing structural: show-context exposure</h4>
              <span className="text-xs font-mono text-stone-500">+0.20 pp / SD</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Audiences more exposed to housing-focused programming hold somewhat
              <em> higher</em> 1-year expectations, about +0.20 pp per standard deviation.
              Housing does not fit the carrier design: a messenger-vs-show test shows that
              guest appearances do not raise housing content above the show's solo
              (no-guest) baseline, so exposure is measured from the show's own programming
              rather than from guests. The association also weakens to insignificance once
              Census-division × month fixed effects absorb regional housing-market trends,
              so it is best read as a show-context correlation rather than a causal effect.
            </p>
          </div>

          <div className="rounded-md p-4 bg-stone-50" style={{ borderLeft: '3px solid #d6d3d1' }}>
            <h4 className="text-sm font-semibold text-stone-700 mb-1">Supply shock, Fed failure, wage-price spiral: qualified or null</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Supply shock is negative and significant (−0.19 pp per SD, the same size as
              geopolitical), but the story is too rare to run the guest-versus-show test,
              so it is reported as a robust correlation rather than a causal effect. Fed
              failure and wage-price spiral do not robustly affect 1-year expectations:
              Fed failure is a show-context story (guests do not lift Fed content above the
              show baseline), and wage-price spiral is the rarest story in the data.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900">Who is most affected?</h3>
        <p className="text-xs text-stone-500 mt-0.5 mb-4">
          Does the geopolitical narrative effect differ by listener demographics?
          Because the average geopolitical effect is negative, a <em>more negative</em>
          interaction means that group responds <em>more</em> strongly. High-numeracy and
          lower-income respondents respond significantly more strongly to geopolitical
          exposure than the average listener; the gender interaction is not significant.
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
                <td className="py-2 px-3 text-right font-mono text-stone-700">-</td>
              </tr>
              <tr className="border-b border-stone-50">
                <td className="py-2 px-3 text-stone-700 font-medium">Political</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">1,102</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">5.5%</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">93.2%</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">0.379</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">-</td>
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
        expectation when its residents hear more of a given story. The variation
        in exposure comes from guest travel across shows with different
        listener geographies, not from local economic conditions. The treatment
        bundles the messenger and the message. Only geopolitical clears every
        validity check; partisan blame reflects audience selection rather than
        persuasion (the within-listener decomposition is null); and housing reads
        as a show-context correlation. Coefficients
        are in percentage points per unit of cumulative three-month narrative
        dose. See the paper for full specification details, robustness checks,
        and limitations.
      </div>
    </div>
  );
}
