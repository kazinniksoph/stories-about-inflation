export interface InjectionEvent {
  episode_id: string;
  guest_name: string;
  podcast_name: string;
  posted_at: string;
  dominant_frame: string;
  dominant_share: number;
  reach_score: number;
  year_month: string;
  n_states: number;
  surp_SAE_SUPPLY_SHOCK: number;
  surp_SAE_DEMAND_EXCESS: number;
  surp_SAE_CORPORATE_MARKUP: number;
  surp_SAE_WAGE_SPIRAL: number;
  surp_SAE_FED_FAILURE: number;
  surp_SAE_GEOPOLITICAL: number;
  surp_SAE_HOUSING_STRUCTURAL: number;
  surp_SAE_PARTISAN_BLAME: number;
  surp_SAE_TRANSITORY: number;
  arousal: number | null;
  dominance: number | null;
  valence: number | null;
  completion_rate: number | null;
  total_listeners: number | null;
  title: string | null;
  audio_url: string | null;
  excerpt: string | null;
  summary: string | null;
  guest_details: { name: string; company: string; occupation: string }[];
  topics: string[];
  inflation_excerpts: string[];
}

export interface MonthlyFrameShares {
  [yearMonth: string]: { [frame: string]: number };
}

export interface ShowSummary {
  podcast_name: string;
  n_events: number;
  dominant_frame: string;
  mean_reach_score: number;
  mean_arousal: number | null;
  mean_valence: number | null;
  nli_mean_r2: number | null;
}

export interface GuestSummary {
  guest_name: string;
  n_events: number;
  dominant_frame: string;
  shows: string[];
}

export interface TopShowByState {
  state: string;
  top_show: string;
  state_share: number;
  state_count: number;
}

export interface TopGuestByState {
  state: string;
  top_guest: string;
  total_reach: number;
  share_in_state: number;
  n_shows: number;
  n_events: number;
}

export interface TopGuestPerFrame {
  state: string;
  top_guest: string;
  frame_contrib: number;
  n_shows: number;
  n_events: number;
}

export interface StateMonthDose {
  state: string;
  year_month: string;
  surp_SAE_SUPPLY_SHOCK: number;
  surp_SAE_GEOPOLITICAL: number;
  surp_SAE_FED_FAILURE: number;
  surp_SAE_PARTISAN_BLAME: number;
  surp_SAE_HOUSING_STRUCTURAL: number;
}

export const FRAME_COLORS: Record<string, string> = {
  GEOPOLITICAL: '#b91c1c',
  PARTISAN_BLAME: '#6d28d9',
  HOUSING_STRUCTURAL: '#0e7490',
  FED_FAILURE: '#c2410c',
  SUPPLY_SHOCK: '#15803d',
  DEMAND_EXCESS: '#57534e',
  CORPORATE_MARKUP: '#92400e',
  WAGE_SPIRAL: '#9d174d',
  TRANSITORY: '#78716c',
};

export const FRAME_LABELS: Record<string, string> = {
  GEOPOLITICAL: 'Geopolitical',
  PARTISAN_BLAME: 'Partisan Blame',
  HOUSING_STRUCTURAL: 'Housing Structural',
  FED_FAILURE: 'Fed Failure',
  SUPPLY_SHOCK: 'Supply Shock',
  DEMAND_EXCESS: 'Demand Excess',
  CORPORATE_MARKUP: 'Corporate Markup',
  WAGE_SPIRAL: 'Wage–Price Spiral',
  TRANSITORY: 'Transitory',
};

export const FRAME_DESCRIPTIONS: Record<string, string> = {
  GEOPOLITICAL: 'Inflation blamed on foreign conflicts, tariffs, trade wars, oil shocks, or sanctions.',
  PARTISAN_BLAME: 'Inflation attributed to a political party or leader (e.g., "Biden destroyed the economy") without specifying an economic mechanism.',
  HOUSING_STRUCTURAL: 'Inflation linked to housing supply constraints, zoning, construction costs, or demographic shifts in housing demand.',
  FED_FAILURE: 'Inflation blamed on the Federal Reserve, with critiques of too much money printing, keeping rates too low, or losing credibility.',
  SUPPLY_SHOCK: 'Inflation caused by supply-chain disruptions, shortages, shipping delays, or input cost spikes.',
  DEMAND_EXCESS: 'Inflation driven by too much consumer spending, stimulus checks, or overheated demand.',
  CORPORATE_MARKUP: 'Inflation blamed on corporate greed, price gouging, or monopoly power.',
  WAGE_SPIRAL: 'Inflation driven by a wage–price feedback loop where rising wages push up costs which push up wages.',
  TRANSITORY: 'Inflation described as temporary, a short-lived blip that will resolve on its own.',
};

// The three frames significant at conventional 5% in the 1Y headline (paper §5.3):
// housing structural, geopolitical, and partisan blame. The three differ in causal
// strength: geopolitical clears every validity check, partisan blame is correlationally
// robust but qualified, and housing reads as a show-context exposure result. Supply
// shock and Fed failure do not reach significance; wage-price spiral is null.
export const FOCUS_FRAMES = [
  'HOUSING_STRUCTURAL',
  'GEOPOLITICAL',
  'PARTISAN_BLAME',
] as const;
