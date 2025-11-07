#!/usr/bin/env python3
"""
Consolidate IHME Global Burden of Disease data files into a single optimized file
"""

import csv
import glob
import os
from pathlib import Path

# Target countries
TARGET_COUNTRIES = [
    'Afghanistan', 'Bangladesh', 'Burkina Faso', 'Cameroon',
    'Central African Republic', 'Chad', 'Colombia', 'Democratic Republic of the Congo',
    'Ethiopia', 'Haiti', 'Lebanon', 'Mali', 'Mozambique', 'Myanmar',
    'Niger', 'Nigeria', 'Pakistan', 'Somalia', 'South Sudan', 'Sudan',
    'Syrian Arab Republic', 'Uganda', 'Ukraine', 'Venezuela (Bolivarian Republic of)', 'Yemen'
]

# Normalize country names for consistency with app
COUNTRY_NAME_MAPPING = {
    'Democratic Republic of the Congo': 'Congo DR',
    'Syrian Arab Republic': 'Syria',
    'Venezuela (Bolivarian Republic of)': 'Venezuela'
}

def consolidate_ihme_data():
    """Consolidate all IHME files into a single CSV"""
    portfolios_dir = Path('Portfolios')

    # Get all IHME CSV files
    ihme_files = sorted(portfolios_dir.glob('IHME-GBD_2021_DATA-*.csv'))

    if not ihme_files:
        print("No IHME files found!")
        return

    print(f"Found {len(ihme_files)} IHME files to consolidate...")

    # Collect all unique headers
    all_headers = set()
    for ihme_file in ihme_files:
        with open(ihme_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            all_headers.update(reader.fieldnames)

    # Define the combined header order
    headers = sorted(list(all_headers))
    print(f"Total unique columns: {len(headers)}")

    # Collect all data
    all_rows = []

    for ihme_file in ihme_files:
        print(f"Processing {ihme_file.name}...")

        with open(ihme_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row in reader:
                location = row['location_name']

                # Normalize country name
                normalized_location = COUNTRY_NAME_MAPPING.get(location, location)

                # Filter for target countries only
                if normalized_location in TARGET_COUNTRIES:
                    # Update the row with normalized name
                    row['location_name'] = normalized_location

                    # Fill missing columns with empty strings
                    full_row = {col: row.get(col, '') for col in headers}
                    all_rows.append(full_row)

    print(f"\nTotal rows after filtering: {len(all_rows):,}")

    # Write consolidated file
    output_file = portfolios_dir / 'IHME_GBD_2021_CONSOLIDATED.csv'

    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(all_rows)

    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"\nConsolidated file written to {output_file}")
    print(f"   File size: {file_size_mb:.2f} MB")
    print(f"   Total rows: {len(all_rows):,}")

    # Show summary by measure
    print("\n=== Summary by Measure ===")
    measures = {}
    for row in all_rows:
        measure = row['measure_name']
        measures[measure] = measures.get(measure, 0) + 1

    for measure, count in sorted(measures.items()):
        print(f"   {measure}: {count:,} rows")

if __name__ == '__main__':
    os.chdir(Path(__file__).parent)
    consolidate_ihme_data()
