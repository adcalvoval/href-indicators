#!/usr/bin/env python3
"""Test HALE 2023 data availability"""

import json

print("="*70)
print("CHECKING HALE 2023 IN COMPILED DATA")
print("="*70)

with open('data/compiled-indicators.json', 'r', encoding='utf-8') as f:
    compiled_data = json.load(f)

print(f"\nTotal files in compiled data: {len(compiled_data)}")

# Check each file for HALE data
for filename in sorted(compiled_data.keys()):
    if 'IHME' not in filename:
        continue

    rows = compiled_data[filename]
    hale_rows = [r for r in rows if r.get('measure_name') == 'HALE (Healthy life expectancy)']

    if hale_rows:
        years = {}
        for row in hale_rows:
            year = row.get('year')
            years[year] = years.get(year, 0) + 1

        print(f"\n{filename}")
        print(f"  Total HALE rows: {len(hale_rows)}")
        print(f"  Years breakdown:")
        for year in sorted(years.keys()):
            print(f"    {year}: {years[year]} rows")

        # Show sample 2023 data if exists
        hale_2023 = [r for r in hale_rows if r.get('year') == '2023']
        if hale_2023:
            print(f"  Sample 2023 data:")
            for row in hale_2023[:5]:
                print(f"    {row.get('location_name')}: {row.get('val')} years (age: {row.get('age_name')}, sex: {row.get('sex_name')})")

print("\n" + "="*70)
print("SUMMARY")
print("="*70)

all_hale = []
for filename in compiled_data.keys():
    if 'IHME' in filename:
        rows = compiled_data[filename]
        hale_rows = [r for r in rows if r.get('measure_name') == 'HALE (Healthy life expectancy)']
        all_hale.extend(hale_rows)

years_summary = {}
for row in all_hale:
    year = row.get('year')
    years_summary[year] = years_summary.get(year, 0) + 1

print(f"\nTotal HALE rows across all IHME files: {len(all_hale)}")
print(f"Years available:")
for year in sorted(years_summary.keys()):
    print(f"  {year}: {years_summary[year]} rows")

# Check if 2023 exists
if '2023' in years_summary:
    print(f"\n✅ 2023 data EXISTS in compiled JSON with {years_summary['2023']} rows")
else:
    print(f"\n❌ 2023 data NOT FOUND in compiled JSON")
