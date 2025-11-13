#!/usr/bin/env python3
"""
Analyze disease causes in IHME data files
"""

import csv
import glob
from pathlib import Path
from collections import Counter

# Change to script directory
import os
os.chdir(Path(__file__).parent)

portfolios_dir = Path('Portfolios')

# Check original IHME files
ihme_files = sorted(portfolios_dir.glob('IHME-GBD_2021_DATA-*.csv'))

print(f"Checking {len(ihme_files)} original IHME files...")

causes = set()
measure_cause_combos = []

# Sample first 2 files to see structure
for ihme_file in ihme_files[:2]:
    print(f"\nAnalyzing {ihme_file.name}...")

    with open(ihme_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            cause = row.get('cause_name', '')
            measure = row.get('measure_name', '')

            if cause:
                causes.add(cause)
                measure_cause_combos.append((measure, cause))

            # Just sample first 1000 rows per file
            if reader.line_num > 1000:
                break

print(f"\n{'='*60}")
print(f"Total unique causes found: {len(causes)}")
print(f"\nAll specific causes:")
for cause in sorted(causes):
    print(f"  - {cause}")

print(f"\n{'='*60}")
print(f"Sample measure + cause combinations:")
combo_counts = Counter(measure_cause_combos)
for (measure, cause), count in combo_counts.most_common(20):
    print(f"  {measure} | {cause}")
