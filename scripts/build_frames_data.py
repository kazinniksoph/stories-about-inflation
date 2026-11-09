#!/usr/bin/env python3
"""
Regenerate the `frames`, `non_aligned`, and `meta` blocks of public/data/methodology.json
from the M=1024, K=32 sparse autoencoder the paper uses (the previous blocks came from the
retired M=128 model). The `funnel` block is left as is.

Inputs (paper project):
  output/inflation/sae_v3_M1024/{activations.npy, episode_composites.parquet, neuron_assignments.csv}
  output/inflation/sae_openai/episode_meta_openai.parquet   (independent single-label LLM classification)
  output/inflation/stage1/chunks.db                         (episode titles, shows, dates)
"""
import json, sqlite3
from datetime import datetime
from pathlib import Path
import numpy as np, pandas as pd

ROOT = Path('/Users/sophiakazinnik/Research/podcasts/output/inflation')
OUT = Path(__file__).resolve().parents[1] / 'public/data/methodology.json'
SAE = ROOT / 'sae_v3_M1024'
FRAMES = ['GEOPOLITICAL', 'PARTISAN_BLAME', 'HOUSING_STRUCTURAL', 'FED_FAILURE', 'SUPPLY_SHOCK', 'WAGE_SPIRAL']
NON = ['DEMAND_EXCESS', 'CORPORATE_MARKUP', 'TRANSITORY']
THRESH = 0.20

comp = pd.read_parquet(SAE / 'episode_composites.parquet')
act = np.load(SAE / 'activations.npy', mmap_mode='r')
assert len(comp) == act.shape[0]
assign = pd.read_csv(SAE / 'neuron_assignments.csv')
lab = pd.read_parquet(ROOT / 'sae_openai/episode_meta_openai.parquet')[['episode_id', 'causal_narrative']]
cx = sqlite3.connect(ROOT / 'stage1/chunks.db')
meta = pd.read_sql('select episode_id, title, podcast_name, posted_at from episodes', cx); cx.close()

comp['row'] = np.arange(len(comp))
df = comp.merge(lab, on='episode_id', how='left').merge(meta, on='episode_id', how='left')
labeled = df.dropna(subset=['causal_narrative'])
rows_l = labeled['row'].values
A_l = np.asarray(act[rows_l])                      # labeled episodes x 1024
Az = (A_l - A_l.mean(0)) / (A_l.std(0) + 1e-12)

def corr_with_label(frame):
    y = (labeled['causal_narrative'].values == frame).astype(float)
    yz = (y - y.mean()) / y.std()
    return (Az * yz[:, None]).mean(0)

titled = df.dropna(subset=['title', 'podcast_name'])
rows_t = titled['row'].values

def examples(values, k=3, per_show=1):
    """Top-k titled episodes by `values` (aligned to `titled`), at most `per_show` per show."""
    order = np.argsort(-values)
    out, seen = [], {}
    for i in order:
        r = titled.iloc[i]
        if seen.get(r.podcast_name, 0) >= per_show:
            continue
        seen[r.podcast_name] = seen.get(r.podcast_name, 0) + 1
        out.append((r, float(values[i])))
        if len(out) >= k:
            break
    return out

frames = {}
for f in FRAMES:
    col = f'SAE_{f}'
    r_check = corr_with_label(f)
    neurons = []
    for _, n in assign[assign.assigned_frame == f].sort_values('abs_r', ascending=False).iterrows():
        j = int(n.neuron)
        v = np.asarray(act[:, j])
        ex = examples(v[rows_t])
        neurons.append(dict(id=j, correlation=round(float(n.best_r), 4), usage=int((v > 0).sum()),
                            examples=[dict(title=r.title, show=r.podcast_name, date=str(r.posted_at)[:10]) for r, _ in ex]))
        print(f'  {f} neuron {j}: stored r={n.best_r:.3f} recomputed r={r_check[j]:.3f}')
    means = labeled.groupby('causal_narrative')[col].mean()
    other = means.drop(f)
    top = examples(titled[col].values, k=10, per_show=2)
    frames[f] = dict(
        neurons=neurons,
        validation=dict(own_mean=round(float(means[f]), 6), other_max=round(float(other.max()), 6),
                        other_max_frame=other.idxmax(), separation_ratio=round(float(means[f] / other.max()), 2)),
        top_episodes=[dict(episode_id=r.episode_id, title=r.title, show=r.podcast_name, date=str(r.posted_at)[:10],
                           activation=round(a, 4), summary='', inflation_quotes=[]) for r, a in top])
    print(f, frames[f]['validation'])

WHERE = {
    'DEMAND_EXCESS': 'In the transcripts, talk about too much stimulus or overheated demand arrives inside discussion of the Federal Reserve and monetary policy, so it does not form a dimension of its own.',
    'CORPORATE_MARKUP': 'In the transcripts, talk about corporate greed or price gouging arrives inside partisan blame, so it does not form a dimension of its own.',
    'TRANSITORY': 'In the transcripts, "transitory" appears as a judgment on the Federal Reserve\'s account of inflation, so it does not form a dimension of its own.',
}
non = {}
n_lab = len(labeled)
for f in NON:
    r = corr_with_label(f)
    best = float(np.nanmax(r)); cnt = int((labeled.causal_narrative == f).sum())
    non[f] = dict(neuron_count=int((r >= THRESH).sum()), best_correlation=round(best, 3),
                  label_share=f'{100 * cnt / n_lab:.0f}%', episode_count=cnt,
                  reason=f'No dimension reaches the {THRESH:.2f} alignment threshold (best r = {best:.2f}). ' + WHERE[f])
    print(f, non[f]['best_correlation'], non[f]['neuron_count'], non[f]['label_share'])

alive = int((np.asarray(act).max(0) > 0).sum())
m = json.load(open(OUT))
m['frames'], m['non_aligned'] = frames, non
m['meta'] = dict(generated=datetime.now().isoformat(timespec='seconds'),
                 sae_architecture=f'OpenAI text-embedding-3-large (3072-dim), 1024 dimensions, TopK=32, trained on {len(comp):,} keyword-matched episodes',
                 alignment_threshold=THRESH, alive_neurons=alive, aligned_neurons=int(len(assign)),
                 labeled_episodes=int(n_lab), source_paper='Stories People Hear About Inflation (Kazinnik 2026)')
json.dump(m, open(OUT, 'w'), ensure_ascii=False)
print('wrote', OUT, 'alive', alive)
