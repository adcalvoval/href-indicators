#!/usr/bin/env python3
"""Consolidate ALL IHME files into one comprehensive file"""

import csv
from pathlib import Path
from collections import defaultdict

# Target countries
TARGET_COUNTRIES = [
    'Afghanistan', 'Bangladesh', 'Burkina Faso', 'Cameroon',
    'Central African Republic', 'Chad', 'Colombia', 'Democratic Republic of the Congo',
    'Ethiopia', 'Haiti', 'Lebanon', 'Mali', 'Mozambique', 'Myanmar',
    'Niger', 'Nigeria', 'Pakistan', 'Somalia', 'South Sudan', 'Sudan',
    'Syrian Arab Republic', 'Uganda', 'Ukraine', 'Venezuela', 'Yemen'
]

# Alternative country names that might appear in the data
COUNTRY_ALIASES = {
    'Congo DR': 'Democratic Republic of the Congo',
    'DR Congo': 'Democratic Republic of the Congo',
    'Syria': 'Syrian Arab Republic',
    'Venezuela (Bolivarian Republic of)': 'Venezuela',
    'Bolivarian Republic of Venezuela': 'Venezuela'
}

portfolios_dir = Path('Portfolios')
output_file = portfolios_dir / 'IHME_GBD_ALL_YEARS_CONSOLIDATED.csv'

print("="*70)
print("CONSOLIDATING ALL IHME FILES")
print("="*70)

# Get all IHME files
ihme_files = sorted(portfolios_dir.glob('IHME*.csv'))
print(f"\nFound {len(ihme_files)} IHME files:")
for f in ihme_files:
    print(f"  - {f.name}")

# Track all unique measures, years, and data
all_data = []
measures_by_year = defaultdict(lambda: defaultdict(int))
files_processed = 0
total_rows_read = 0
total_rows_kept = 0

# Determine all possible column names
all_columns = set()

print(f"\n{'='*70}")
print("PROCESSING FILES")
print("="*70)

for ihme_file in ihme_files:
    print(f"\nProcessing: {ihme_file.name}")

    try:
        with open(ihme_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            # Collect column names
            fieldnames = reader.fieldnames
            all_columns.update(fieldnames)

            rows_in_file = 0
            rows_kept = 0

            for row in reader:
                rows_in_file += 1
                total_rows_read += 1

                # Normalize country name
                location_name = row.get('location_name', '')
                if location_name in COUNTRY_ALIASES:
                    location_name = COUNTRY_ALIASES[location_name]

                # Check if target country
                if location_name not in TARGET_COUNTRIES:
                    continue

                # Get key fields
                measure_name = row.get('measure_name', '')
                year = row.get('year', '')
                age_name = row.get('age_name', '')
                sex_name = row.get('sex_name', '')
                metric_name = row.get('metric_name', '')
                cause_name = row.get('cause_name', '')
                rei_name = row.get('rei_name', '')

                # Apply filtering logic (same as compile-data.py)
                # For life expectancy and HALE: use "0-6 days" age (at birth), "Years" metric
                if measure_name in ['Life expectancy', 'HALE (Healthy life expectancy)']:
                    if age_name != '0-6 days' or sex_name != 'Both' or metric_name != 'Years':
                        continue
                    # Skip rows with any cause or risk factor
                    if cause_name or rei_name:
                        continue
                # For all other measures: "All ages", "Both sexes", "All causes", no risk factor, "Rate" metric
                else:
                    # Only include "All causes" and no specific risk factor
                    if cause_name and cause_name != 'All causes':
                        continue
                    if rei_name:  # Skip any row with a risk factor
                        continue
                    # Must be "All ages", "Both sexes"
                    if age_name != 'All ages' or sex_name != 'Both':
                        continue
                    # Must use "Rate" metric
                    if metric_name != 'Rate':
                        continue

                # Update normalized location name in row
                row['location_name'] = location_name

                # Keep this row
                all_data.append(row)
                rows_kept += 1
                total_rows_kept += 1

                # Track measure-year combination
                measures_by_year[measure_name][year] += 1

            print(f"  Rows read: {rows_in_file:,}")
            print(f"  Rows kept: {rows_kept:,}")
            files_processed += 1

    except Exception as e:
        print(f"  ERROR: {e}")
        continue

print(f"\n{'='*70}")
print("SUMMARY")
print("="*70)
print(f"Files processed: {files_processed}")
print(f"Total rows read: {total_rows_read:,}")
print(f"Total rows kept: {total_rows_kept:,}")
print(f"Unique columns: {len(all_columns)}")

# Determine standard column order (all possible columns)
standard_columns = sorted(all_columns)

print(f"\n{'='*70}")
print("DATA AVAILABILITY BY MEASURE AND YEAR")
print("="*70)

for measure in sorted(measures_by_year.keys()):
    print(f"\n{measure}:")
    years_data = measures_by_year[measure]
    for year in sorted(years_data.keys()):
        print(f"  {year}: {years_data[year]} rows")

# Write consolidated file
print(f"\n{'='*70}")
print("WRITING CONSOLIDATED FILE")
print("="*70)

with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=standard_columns, extrasaction='ignore')
    writer.writeheader()

    for row in all_data:
        writer.writerow(row)

file_size_mb = output_file.stat().st_size / (1024 * 1024)
print(f"\n✓ Consolidated file written: {output_file.name}")
print(f"  Size: {file_size_mb:.2f} MB")
print(f"  Rows: {total_rows_kept:,}")
print(f"  Columns: {len(standard_columns)}")

print(f"\n{'='*70}")
print("VERIFICATION: Data for each indicator")
print("="*70)

# Count unique countries per measure-year
countries_per_measure_year = defaultdict(lambda: defaultdict(set))
for row in all_data:
    measure = row.get('measure_name', '')
    year = row.get('year', '')
    country = row.get('location_name', '')
    countries_per_measure_year[measure][year].add(country)

print("\nCountries with data per measure-year:")
for measure in sorted(countries_per_measure_year.keys()):
    print(f"\n{measure}:")
    years_data = countries_per_measure_year[measure]
    for year in sorted(years_data.keys()):
        num_countries = len(years_data[year])
        print(f"  {year}: {num_countries}/25 countries")

print("\n" + "="*70)
print("✓ CONSOLIDATION COMPLETE")
print("="*70)
