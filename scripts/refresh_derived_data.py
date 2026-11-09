#!/usr/bin/env python3
"""
Rebuild the derived site files from the verified injection events so every page uses one vintage:
  monthly_frame_shares.json  dominant-story counts by month
  show_summary.json          one row per show with a verified carrier appearance
  episode_extras.json        pruned to verified events; episode titles filled for all of them
"""
import json, sqlite3
from collections import Counter, defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / 'public/data'
DB = '/Users/sophiakazinnik/Research/podcasts/output/inflation/stage1/chunks.db'

ev = json.load(open(DATA / 'injection_events.json'))

# monthly shares
monthly = defaultdict(Counter)
for e in ev:
    monthly[e['year_month']][e['dominant_frame']] += 1
json.dump({k: dict(sorted(v.items())) for k, v in sorted(monthly.items())}, open(DATA / 'monthly_frame_shares.json', 'w'))

# show summary
old = {s['podcast_name']: s for s in json.load(open(DATA / 'show_summary.json'))}
by = defaultdict(list)
for e in ev:
    by[e['podcast_name']].append(e)
def mean(xs):
    xs = [x for x in xs if x is not None]
    return round(sum(xs) / len(xs), 4) if xs else None
shows = []
for name, es in by.items():
    shows.append(dict(podcast_name=name, n_events=len(es),
                      dominant_frame=Counter(e['dominant_frame'] for e in es).most_common(1)[0][0],
                      mean_reach_score=mean([e.get('reach_score') for e in es]),
                      mean_arousal=mean([e.get('arousal') for e in es]),
                      mean_valence=mean([e.get('valence') for e in es]),
                      nli_mean_r2=old.get(name, {}).get('nli_mean_r2')))
shows.sort(key=lambda s: -s['n_events'])
json.dump(shows, open(DATA / 'show_summary.json', 'w'), ensure_ascii=False)

# extras
ex = json.load(open(DATA / 'episode_extras.json'))
ids = [e['episode_id'] for e in ev]
cx = sqlite3.connect(DB); titles = {}
for i in range(0, len(ids), 900):
    b = ids[i:i + 900]
    for eid, t in cx.execute(f"select episode_id, title from episodes where episode_id in ({','.join('?' * len(b))})", b):
        if t: titles[eid] = t
cx.close()
new = {}
for eid in set(ids):
    row = dict(ex.get(eid, {}))
    if not row.get('episode_title') and eid in titles:
        row['episode_title'] = titles[eid]
    if row:
        new[eid] = row
json.dump(new, open(DATA / 'episode_extras.json', 'w'), ensure_ascii=False)
print('months', len(monthly), 'events', sum(sum(v.values()) for v in monthly.values()), '| shows', len(shows),
      '| extras', len(new), 'with title', sum(1 for v in new.values() if v.get('episode_title')),
      'with excerpt', sum(1 for v in new.values() if v.get('excerpt')))
