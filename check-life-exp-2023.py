#!/usr/bin/env python3
"""Check Life Expectancy 2023 data"""

import json
import csv
from pathlib import Path

print("="*70)
print("CHECKING LIFE EXPECTANCY 2023 DATA")
print("="*70)

# Check compiled JSON
print("\n1. COMPILED JSON CHECK:")
with open('data/compiled-indicators.json', 'r', encoding='utf-8') as f:
    compiled_data = json.load(f)

for filename in compiled_data.keys():
    if 'IHME' in filename:
        rows = compiled_data[filename]
        life_exp_rows = [r for r in rows if r.get('measure_name') == 'Life expectancy']

        if life_exp_rows:
            years = set(r.get('year') for r in life_exp_rows)
            print(f"\n{filename}")
            print(f"  Life expectancy rows: {len(life_exp_rows)}")
            print(f"  Years: {sorted(years)}")

            # Sample data
            for row in life_exp_rows[:3]:
                print(f"    {row.get('year')}: {row.get('location_name')} - {row.get('val')} {row.get('metric_name')}")

# Check source files
print("\n" + "="*70)
print("2. SOURCE FILES CHECK:")
print("="*70)

portfolios_dir = Path('Portfolios')

# Check the file that should have Life Expectancy at birth for 2023
files_to_check = [
    'IHME-GBD_2023_DATA-807bce6c-1.csv',
    'IHME-GBD_2023_DATA-43bf3646-1.csv',
    'IHME-GBD_2023_DATA-1e52c43e-1.csv',
    'IHME-GBD_2023_DATA-20df3c10-1.csv',
    'IHME-GBD_2023_DATA-20f359aa-1.csv',
    'IHME-GBD_2023_DATA-77605976-1.csv',
    'IHME-GBD_2023_DATA-b0091085-1.csv'
]

for filename in files_to_check:
    filepath = portfolios_dir / filename
    if not filepath.exists():
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        life_exp_rows = []
        for row in reader:
            if row.get('measure_name') == 'Life expectancy':
                life_exp_rows.append(row)

        if life_exp_rows:
            print(f"\n{filename}")
            print(f"  Total Life expectancy rows: {len(life_exp_rows)}")

            # Check age groups
            ages = set(r.get('age_name') for r in life_exp_rows)
            print(f"  Age groups: {sorted(ages)}")

            # Check if has "0-6 days"
            birth_rows = [r for r in life_exp_rows if r.get('age_name') == '0-6 days']
            print(f"  Rows with '0-6 days' (at birth): {len(birth_rows)}")

            if birth_rows:
                print(f"  Sample '0-6 days' data:")
                for row in birth_rows[:5]:
                    print(f"    {row.get('location_name')}: {row.get('val')} {row.get('metric_name')}, Sex: {row.get('sex_name')}")

            # Check other age groups
            if not birth_rows and life_exp_rows:
                print(f"  Sample data (other age groups):")
                for row in life_exp_rows[:3]:
                    print(f"    Age {row.get('age_name')}: {row.get('location_name')} - {row.get('val')}")

print("\n" + "="*70)
print("3. CONCLUSION:")
print("="*70)
print("Checking if any 2023 file has 'Life expectancy' with age '0-6 days'...")
