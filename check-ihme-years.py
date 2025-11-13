#!/usr/bin/env python3
"""Check years available in IHME files"""

import csv
from pathlib import Path
from collections import defaultdict

portfolios_dir = Path('Portfolios')
ihme_files = list(portfolios_dir.glob('IHME*.csv'))

print(f"Found {len(ihme_files)} IHME files\n")

for file in sorted(ihme_files):
    print(f"=== {file.name} ===")

    try:
        with open(file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            years = set()

            for row in reader:
                if 'year' in row:
                    years.add(row['year'])

            sorted_years = sorted(years)
            if sorted_years:
                print(f"Years: {', '.join(sorted_years)}")
                print(f"Range: {sorted_years[0]} - {sorted_years[-1]}")
            else:
                print("No year column found")
    except Exception as e:
        print(f"Error: {e}")

    print()
