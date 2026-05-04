import type {
  InjectionEvent,
  MonthlyFrameShares,
  ShowSummary,
  GuestSummary,
  StateMonthDose,
} from '../types';

let eventsCache: InjectionEvent[] | null = null;
let sharesCache: MonthlyFrameShares | null = null;
let showsCache: ShowSummary[] | null = null;
let guestsCache: GuestSummary[] | null = null;
let doseCache: StateMonthDose[] | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

export async function loadEvents(): Promise<InjectionEvent[]> {
  if (!eventsCache) {
    // Fetch events and per-episode extras in parallel, then merge audio_url
    // and transcript excerpt onto the matching events. ~1,685 of the 15,930
    // events have extras coverage; the rest pass through unchanged.
    const [events, extras] = await Promise.all([
      fetchJson<InjectionEvent[]>('/data/injection_events.json'),
      fetchJson<Record<string, { episode_title?: string; episode_audio_url?: string; excerpt?: string }>>(
        '/data/episode_extras.json',
      ),
    ]);
    eventsCache = events.map(ev => {
      const ex = extras[ev.episode_id];
      if (!ex) return ev;
      return {
        ...ev,
        title: ev.title ?? ex.episode_title,
        audio_url: ex.episode_audio_url,
        excerpt: ex.excerpt,
      };
    });
  }
  return eventsCache!;
}

export async function loadShares(): Promise<MonthlyFrameShares> {
  if (!sharesCache) sharesCache = await fetchJson('/data/monthly_frame_shares.json');
  return sharesCache!;
}

export async function loadShows(): Promise<ShowSummary[]> {
  if (!showsCache) showsCache = await fetchJson('/data/show_summary.json');
  return showsCache!;
}

export async function loadGuests(): Promise<GuestSummary[]> {
  if (!guestsCache) guestsCache = await fetchJson('/data/guest_summary.json');
  return guestsCache!;
}

export async function loadDose(): Promise<StateMonthDose[]> {
  if (!doseCache) doseCache = await fetchJson('/data/state_month_dose.json');
  return doseCache!;
}
