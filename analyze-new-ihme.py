#!/usr/bin/env python3
"""Analyze the 5 new IHME 2023 files"""

import csv
from pathlib import Path
from collections import defaultdict

new_files = [
    'IHME-GBD_2023_DATA-1e52c43e-1.csv',
    'IHME-GBD_2023_DATA-20df3c10-1.csv',
    'IHME-GBD_2023_DATA-43bf3646-1.csv',
    'IHME-GBD_2023_DATA-807bce6c-1.csv',
    'IHME-GBD_2023_DATA-b0091085-1.csv'
]

portfolios_dir = Path('Portfolios')

TARGET_COUNTRIES = [
    'Afghanistan', 'Bangladesh', 'Burkina Faso', 'Cameroon',
    'Central African Republic', 'Chad', 'Colombia', 'Congo DR',
    'Ethiopia', 'Haiti', 'Lebanon', 'Mali', 'Mozambique', 'Myanmar',
    'Niger', 'Nigeria', 'Pakistan', 'Somalia', 'South Sudan', 'Sudan',
    'Syria', 'Uganda', 'Ukraine', 'Venezuela', 'Yemen'
]

for filename in new_files:
    filepath = portfolios_dir / filename
    print(f"\n{'='*60}")
    print(f"FILE: {filename}")
    print('='*60)

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            measures = set()
            years = set()
            countries = set()
            ages = set()
            sexes = set()
            metrics = set()
            causes = set()
            reis = set()

            row_count = 0
            target_country_rows = 0

            for row in reader:
                row_count += 1

                # Collect unique values
                if row.get('measure_name'):
                    measures.add(row['measure_name'])
                if row.get('year'):
                    years.add(row['year'])
                if row.get('location_name'):
                    countries.add(row['location_name'])
                if row.get('age_name'):
                    ages.add(row['age_name'])
                if row.get('sex_name'):
                    sexes.add(row['sex_name'])
                if row.get('metric_name'):
                    metrics.add(row['metric_name'])
                if row.get('cause_name'):
                    causes.add(row['cause_name'])
                if row.get('rei_name'):
                    reis.add(row['rei_name'])

                # Check if target country
                if row.get('location_name') in TARGET_COUNTRIES:
                    target_country_rows += 1

            print(f"\nTotal rows: {row_count}")
            print(f"Target country rows: {target_country_rows}")
            print(f"\nYears: {sorted(years)}")
            print(f"\nMeasures: {sorted(measures)}")
            print(f"\nMetrics: {sorted(metrics)}")
            print(f"\nSexes: {sorted(sexes)}")
            print(f"\nAges (sample): {sorted(list(ages))[:10]}")

            if causes:
                print(f"\nCauses (sample): {sorted(list(causes))[:5]}")
            if reis:
                print(f"\nRisk factors (sample): {sorted(list(reis))[:5]}")

            # Check target countries coverage
            target_in_file = [c for c in TARGET_COUNTRIES if c in countries]
            print(f"\nTarget countries in file: {len(target_in_file)}/25")
            if len(target_in_file) < 25:
                missing = [c for c in TARGET_COUNTRIES if c not in countries]
                print(f"Missing: {', '.join(missing)}")

    except Exception as e:
        print(f"ERROR: {e}")
