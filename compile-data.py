#!/usr/bin/env python3
"""
Compile all CSV indicator files into a single JSON file for faster loading
"""

import csv
import json
import os
from pathlib import Path

# Target countries (with alternative names for matching)
TARGET_COUNTRIES = [
    'Afghanistan', 'Bangladesh', 'Burkina Faso', 'Cameroon',
    'Central African Republic', 'Chad', 'Colombia', 'Congo DR',
    'Ethiopia', 'Haiti', 'Lebanon', 'Mali', 'Mozambique', 'Myanmar',
    'Niger', 'Nigeria', 'Pakistan', 'Somalia', 'South Sudan', 'Sudan',
    'Syria', 'Uganda', 'Ukraine', 'Venezuela', 'Yemen'
]

# Country name variations (maps data file names to standard names)
COUNTRY_NAME_MAPPING = {
    'Democratic Republic of the Congo': 'Congo DR',
    'Congo, Dem. Rep.': 'Congo DR',
    'Syrian Arab Republic': 'Syria',
    'Venezuela, RB': 'Venezuela',
    'Venezuela (Bolivarian Republic of)': 'Venezuela',
    'Myanmar (Burma)': 'Myanmar',
    'Yemen, Rep.': 'Yemen'
}

def parse_csv_file(filepath):
    """Parse a CSV file and return structured data"""
    data = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

    return data

def compile_data():
    """Compile all CSV files into a single JSON structure"""
    portfolios_dir = Path('Portfolios')
    compiled_data = {}

    # Get all CSV files
    csv_files = list(portfolios_dir.glob('*_ALL_LATEST.csv'))
    csv_files.append(portfolios_dir / 'WB Data 25b.csv')

    print(f"Found {len(csv_files)} CSV files to compile...")

    for csv_file in csv_files:
        if not csv_file.exists():
            continue

        filename = csv_file.name
        print(f"Processing {filename}...")

        # Parse the CSV
        rows = parse_csv_file(csv_file)

        # Filter for target countries
        filtered_rows = []
        for row in rows:
            country = row.get('Country Name') or row.get('GEO_NAME_SHORT')

            # Normalize country name using mapping
            normalized_country = COUNTRY_NAME_MAPPING.get(country, country)

            if normalized_country in TARGET_COUNTRIES:
                # Update the row with normalized country name
                if 'Country Name' in row:
                    row['Country Name'] = normalized_country
                if 'GEO_NAME_SHORT' in row:
                    row['GEO_NAME_SHORT'] = normalized_country
                filtered_rows.append(row)

        if filtered_rows:
            compiled_data[filename] = filtered_rows
            print(f"  -> Added {len(filtered_rows)} rows")

    # Write compiled data
    output_file = Path('data') / 'compiled-indicators.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(compiled_data, f, separators=(',', ':'))

    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"\nCompiled data written to {output_file}")
    print(f"   File size: {file_size_mb:.2f} MB")
    print(f"   Total files: {len(compiled_data)}")

if __name__ == '__main__':
    os.chdir(Path(__file__).parent)
    compile_data()
