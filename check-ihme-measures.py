#!/usr/bin/env python3
import csv
from pathlib import Path

portfolios_dir = Path('Portfolios')
file_path = portfolios_dir / 'IHME_GBD_2021_CONSOLIDATED.csv'

with open(file_path, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

# Check Life expectancy at birth (0-6 days)
print("=== Life expectancy (0-6 days, Both sexes) ===")
life_exp = [r for r in rows if r['measure_name'] == 'Life expectancy'
            and r['age_name'] == '0-6 days' and r['sex_name'] == 'Both'
            and r['location_name'] == 'Pakistan' and r['year'] == '2021']
for r in life_exp:
    print(f"Cause: '{r['cause_name']}', Risk: '{r['rei_name']}', Metric: {r['metric_name']}, Value: {r['val']}")

# Check HALE
print("\n=== HALE (0-6 days, Both sexes) ===")
hale = [r for r in rows if r['measure_name'] == 'HALE (Healthy life expectancy)'
        and r['age_name'] == '0-6 days' and r['sex_name'] == 'Both'
        and r['location_name'] == 'Pakistan' and r['year'] == '2021']
for r in hale:
    print(f"Cause: '{r['cause_name']}', Risk: '{r['rei_name']}', Metric: {r['metric_name']}, Value: {r['val']}")

# Check Crude birth rate - find what aggregates exist
print("\n=== Crude birth rate (Pakistan 2021) ===")
cbr_all = [r for r in rows if r['measure_name'] == 'Crude birth rate'
           and r['location_name'] == 'Pakistan' and r['year'] == '2021']
print(f"Total rows: {len(cbr_all)}")
ages = set([r['age_name'] for r in cbr_all])
print(f"Age groups: {sorted(ages)}")

# Check if there's a summary age
for age in sorted(ages):
    sample = [r for r in cbr_all if r['age_name'] == age][0]
    print(f"  Age: {age}, Sex: {sample['sex_name']}, Cause: '{sample['cause_name']}', Value: {sample['val']}")
