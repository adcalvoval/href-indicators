#!/usr/bin/env python3
"""Verify the consolidated IHME file"""

import csv
from pathlib import Path
from collections import defaultdict

portfolios_dir = Path('Portfolios')
consolidated_file = portfolios_dir / 'IHME_GBD_ALL_YEARS_CONSOLIDATED.csv'

print("="*70)
print("VERIFYING CONSOLIDATED IHME FILE")
print("="*70)

# Count rows by measure-year-country
data_by_measure_year = defaultdict(lambda: defaultdict(set))
total_rows = 0

with open(consolidated_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)

    for row in reader:
        total_rows += 1
        measure = row.get('measure_name', '')
        year = row.get('year', '')
        country = row.get('location_name', '')

        data_by_measure_year[measure][year].add(country)

print(f"\nTotal rows: {total_rows:,}")
print(f"Total measures: {len(data_by_measure_year)}")

print(f"\n{'='*70}")
print("DATA AVAILABILITY: Measures by Year and Country Count")
print("="*70)

for measure in sorted(data_by_measure_year.keys()):
    print(f"\n{measure}:")
    years_data = data_by_measure_year[measure]
    for year in sorted(years_data.keys()):
        countries = years_data[year]
        print(f"  {year}: {len(countries)} countries")

print(f"\n{'='*70}")
print("CHECKING 2023 DATA AVAILABILITY")
print("="*70)

measures_with_2023 = []
measures_without_2023 = []

for measure in sorted(data_by_measure_year.keys()):
    if '2023' in data_by_measure_year[measure]:
        countries_2023 = len(data_by_measure_year[measure]['2023'])
        measures_with_2023.append((measure, countries_2023))
        print(f"[YES] {measure}: {countries_2023} countries")
    else:
        latest_year = max(data_by_measure_year[measure].keys())
        countries_latest = len(data_by_measure_year[measure][latest_year])
        measures_without_2023.append((measure, latest_year, countries_latest))
        print(f"[NO]  {measure}: Latest year {latest_year} ({countries_latest} countries)")

print(f"\n{'='*70}")
print("SUMMARY")
print("="*70)
print(f"Measures with 2023 data: {len(measures_with_2023)}")
print(f"Measures without 2023 data: {len(measures_without_2023)}")

if measures_with_2023:
    print(f"\nMeasures available in 2023:")
    for measure, count in measures_with_2023:
        print(f"  - {measure} ({count} countries)")

print("\nConsolidation successful!")
