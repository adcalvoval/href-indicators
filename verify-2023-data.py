#!/usr/bin/env python3
"""Verify 2023 data was compiled correctly"""

import json
from pathlib import Path

# Load compiled data
with open('data/compiled-indicators.json', 'r', encoding='utf-8') as f:
    compiled_data = json.load(f)

print("VERIFICATION: 2023 IHME Data in Compiled JSON")
print("="*70)

# Check each IHME file
ihme_files = [f for f in compiled_data.keys() if 'IHME' in f]

print(f"\nTotal IHME files in compiled data: {len(ihme_files)}")

for filename in sorted(ihme_files):
    rows = compiled_data[filename]

    # Count rows by year
    year_counts = {}
    measure_counts = {}

    for row in rows:
        year = row.get('year', 'N/A')
        measure = row.get('measure_name', 'N/A')

        year_counts[year] = year_counts.get(year, 0) + 1
        measure_counts[measure] = measure_counts.get(measure, 0) + 1

    if rows:
        print(f"\n{filename}")
        print(f"  Total rows: {len(rows)}")
        print(f"  Years: {dict(sorted(year_counts.items()))}")
        print(f"  Measures: {list(measure_counts.keys())}")

print("\n" + "="*70)
print("SUMMARY: Data by Measure and Year")
print("="*70)

# Aggregate by measure and year
measure_year_data = {}

for filename in ihme_files:
    rows = compiled_data[filename]
    for row in rows:
        measure = row.get('measure_name', 'Unknown')
        year = row.get('year', 'Unknown')

        key = f"{measure}"
        if key not in measure_year_data:
            measure_year_data[key] = {}

        measure_year_data[key][year] = measure_year_data[key].get(year, 0) + 1

for measure in sorted(measure_year_data.keys()):
    years = measure_year_data[measure]
    print(f"\n{measure}")
    for year in sorted(years.keys()):
        print(f"  {year}: {years[year]} rows")
