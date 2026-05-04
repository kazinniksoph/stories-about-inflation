#!/usr/bin/env python3
"""
Enrich injection_events.json with transcript excerpts and audio URLs
from Podscan JSONL files.
"""

import json
import gzip
import glob
import os
import math
from collections import defaultdict

# Paths
EVENTS_PATH = "/Users/sophiakazinnik/Research/podcast-narrative-dashboard/public/data/injection_events.json"
JSONL_DIR = os.path.expanduser("~/Library/CloudStorage/Dropbox/podcasts/podscan/narrative_episodes/inflation/")
EXTRAS_PATH = "/Users/sophiakazinnik/Research/podcast-narrative-dashboard/public/data/episode_extras.json"

# 1. Load injection events
with open(EVENTS_PATH) as f:
    events = json.load(f)

print(f"Loaded {len(events)} injection events")

# 2. Build lookup: episode_id -> set of year-months to scan
#    Also track which episode_ids we need
episode_months = defaultdict(set)
needed_ids = set()

for ev in events:
    eid = ev["episode_id"]
    needed_ids.add(eid)
    if ev.get("posted_at"):
        ym = ev["posted_at"][:7]  # e.g. "2017-11"
        episode_months[eid].add(ym)

print(f"Need {len(needed_ids)} unique episode_ids across {len(set(m for ms in episode_months.values() for m in ms))} months")

# 3. Build month -> list of JSONL file paths
all_files = sorted(glob.glob(os.path.join(JSONL_DIR, "*.jsonl.gz")))
month_files = defaultdict(list)
for fpath in all_files:
    basename = os.path.basename(fpath)  # e.g. "2025-02_a.jsonl.gz"
    # Extract YYYY-MM from the filename
    ym = basename[:7]  # "2025-02"
    month_files[ym].append(fpath)

print(f"Found {len(all_files)} JSONL files across {len(month_files)} months")

# 4. Determine which month files to scan
months_to_scan = set()
for eid, months in episode_months.items():
    months_to_scan.update(months)

print(f"Will scan {len(months_to_scan)} months")

# 5. Scan JSONL files and extract data
extras = {}
found_count = 0
scanned_records = 0

for ym in sorted(months_to_scan):
    files_for_month = month_files.get(ym, [])
    if not files_for_month:
        print(f"  WARNING: No JSONL files for month {ym}")
        continue

    for fpath in files_for_month:
        basename = os.path.basename(fpath)
        month_found = 0
        with gzip.open(fpath, "rt", encoding="utf-8") as f:
            for line in f:
                scanned_records += 1
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue

                eid = rec.get("episode_id")
                if eid not in needed_ids:
                    continue
                if eid in extras:
                    continue  # already found

                # Extract transcript excerpt (chars 5000-5500)
                transcript = rec.get("episode_transcript", "") or ""
                if len(transcript) >= 5500:
                    excerpt = transcript[5000:5500]
                elif len(transcript) > 5000:
                    excerpt = transcript[5000:]
                elif len(transcript) > 0:
                    # Transcript too short — take middle 500 chars
                    mid = max(0, len(transcript) // 2 - 250)
                    excerpt = transcript[mid:mid + 500]
                else:
                    excerpt = None

                # Get audio URL (prefer normalized, fallback to raw)
                audio_url = rec.get("episode_audio_url") or rec.get("episode_audio_url_normalized") or None

                extras[eid] = {
                    "episode_title": rec.get("episode_title") or None,
                    "episode_audio_url": audio_url,
                    "excerpt": excerpt,
                }

                found_count += 1
                month_found += 1

                # Early exit if we found all
                if found_count == len(needed_ids):
                    break

        if month_found > 0:
            print(f"  {basename}: found {month_found} episodes (total: {found_count}/{len(needed_ids)})")

        if found_count == len(needed_ids):
            break

    if found_count == len(needed_ids):
        break

print(f"\nScanned {scanned_records:,} records total")
print(f"Matched {found_count} / {len(needed_ids)} unique episode_ids ({100*found_count/len(needed_ids):.1f}%)")

# 6. Check for remaining unmatched — scan ALL files as fallback
if found_count < len(needed_ids):
    remaining = needed_ids - set(extras.keys())
    print(f"\n{len(remaining)} episodes not found in expected month files. Scanning all files as fallback...")

    already_scanned = set()
    for ym in months_to_scan:
        for fpath in month_files.get(ym, []):
            already_scanned.add(fpath)

    for fpath in all_files:
        if fpath in already_scanned:
            continue
        basename = os.path.basename(fpath)
        month_found = 0
        with gzip.open(fpath, "rt", encoding="utf-8") as f:
            for line in f:
                scanned_records += 1
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue

                eid = rec.get("episode_id")
                if eid not in remaining:
                    continue
                if eid in extras:
                    continue

                transcript = rec.get("episode_transcript", "") or ""
                if len(transcript) >= 5500:
                    excerpt = transcript[5000:5500]
                elif len(transcript) > 5000:
                    excerpt = transcript[5000:]
                elif len(transcript) > 0:
                    mid = max(0, len(transcript) // 2 - 250)
                    excerpt = transcript[mid:mid + 500]
                else:
                    excerpt = None

                audio_url = rec.get("episode_audio_url") or rec.get("episode_audio_url_normalized") or None

                extras[eid] = {
                    "episode_title": rec.get("episode_title") or None,
                    "episode_audio_url": audio_url,
                    "excerpt": excerpt,
                }

                found_count += 1
                month_found += 1
                remaining.discard(eid)

                if len(remaining) == 0:
                    break

        if month_found > 0:
            print(f"  {basename}: found {month_found} more (total: {found_count}/{len(needed_ids)})")

        if len(remaining) == 0:
            break

    print(f"After full scan: {found_count} / {len(needed_ids)} matched ({100*found_count/len(needed_ids):.1f}%)")

# 7. Sanitize: replace any NaN/float('nan') with None
def sanitize(obj):
    """Recursively replace NaN/Inf with None."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize(v) for v in obj]
    return obj

extras = sanitize(extras)

# 8. Save episode_extras.json
with open(EXTRAS_PATH, "w") as f:
    json.dump(extras, f, ensure_ascii=False)

print(f"\nSaved {len(extras)} entries to {EXTRAS_PATH}")
print(f"  File size: {os.path.getsize(EXTRAS_PATH) / 1024 / 1024:.1f} MB")

# 9. Update injection_events.json in-place
enriched_count = 0
for ev in events:
    eid = ev["episode_id"]
    if eid in extras:
        ev["title"] = extras[eid]["episode_title"]
        ev["audio_url"] = extras[eid]["episode_audio_url"]
        ev["excerpt"] = extras[eid]["excerpt"]
        enriched_count += 1
    else:
        ev["title"] = None
        ev["audio_url"] = None
        ev["excerpt"] = None

events = sanitize(events)

with open(EVENTS_PATH, "w") as f:
    json.dump(events, f, ensure_ascii=False)

print(f"\nUpdated injection_events.json:")
print(f"  {enriched_count} / {len(events)} events enriched ({100*enriched_count/len(events):.1f}%)")
print(f"  {len(events) - enriched_count} events with null extras")
print(f"  File size: {os.path.getsize(EVENTS_PATH) / 1024 / 1024:.1f} MB")

# 10. Coverage stats
has_title = sum(1 for e in extras.values() if e["episode_title"])
has_audio = sum(1 for e in extras.values() if e["episode_audio_url"])
has_excerpt = sum(1 for e in extras.values() if e["excerpt"])
print(f"\nCoverage among matched episodes:")
print(f"  title:     {has_title}/{len(extras)} ({100*has_title/max(len(extras),1):.1f}%)")
print(f"  audio_url: {has_audio}/{len(extras)} ({100*has_audio/max(len(extras),1):.1f}%)")
print(f"  excerpt:   {has_excerpt}/{len(extras)} ({100*has_excerpt/max(len(extras),1):.1f}%)")

# Verify no NaN in output
events_str = json.dumps(events)
assert "NaN" not in events_str, "Found NaN in injection_events.json!"
extras_str = json.dumps(extras)
assert "NaN" not in extras_str, "Found NaN in episode_extras.json!"
print("\nNo NaN values detected in output files. Done!")
