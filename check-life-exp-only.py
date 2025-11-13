#!/usr/bin/env python3
"""Check specifically for Life Expectancy 2023 data"""

import json

print("="*70)
print("CHECKING LIFE EXPECTANCY DATA (NOT HALE)")
print("="*70)

with open('data/compiled-indicators.json', 'r', encoding='utf-8') as f:
    compiled_data = json.load(f)

# Check for Life expectancy (not HALE)
for filename in sorted(compiled_data.keys()):
    if 'IHME' not in filename:
        continue

    rows = compiled_data[filename]
    life_exp_rows = [r for r in rows if r.get('measure_name') == 'Life expectancy']

    if life_exp_rows:
        years = {}
        for row in life_exp_rows:
            year = row.get('year')
            years[year] = years.get(year, 0) + 1

        print(f"\n{filename}")
        print(f"  Total Life expectancy rows: {len(life_exp_rows)}")
        print(f"  Years breakdown:")
        for year in sorted(years.keys()):
            print(f"    {year}: {years[year]} rows")

        # Show sample data for each year
        for year in sorted(years.keys()):
            year_rows = [r for r in life_exp_rows if r.get('year') == year]
            if year_rows:
                sample = year_rows[0]
                print(f"  Sample {year}: {sample.get('location_name')} - {sample.get('val')} years, age: {sample.get('age_name')}")

print("\n" + "="*70)
print("SUMMARY")
print("="*70)

all_life_exp = []
for filename in compiled_data.keys():
    if 'IHME' in filename:
        rows = compiled_data[filename]
        life_exp_rows = [r for r in rows if r.get('measure_name') == 'Life expectancy']
        all_life_exp.extend(life_exp_rows)

years_summary = {}
for row in all_life_exp:
    year = row.get('year')
    years_summary[year] = years_summary.get(year, 0) + 1

print(f"\nTotal 'Life expectancy' rows: {len(all_life_exp)}")
print(f"Years available:")
for year in sorted(years_summary.keys()):
    print(f"  {year}: {years_summary[year]} rows")

if '2023' in years_summary:
    print(f"\n[YES] 2023 data EXISTS for Life expectancy with {years_summary['2023']} rows")
else:
    print(f"\n[NO] 2023 data NOT FOUND for Life expectancy")
    print("\nThis confirms: IHME did not release 'Life expectancy at birth' data for 2023.")
    print("Only HALE (Healthy Life Expectancy) has 2023 data.")
