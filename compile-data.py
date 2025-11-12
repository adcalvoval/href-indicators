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
    csv_files.append(portfolios_dir / 'IHME_GBD_2021_CONSOLIDATED.csv')

    # Add new IHME-GBD 2021 data files
    csv_files.extend(list(portfolios_dir.glob('IHME-GBD_2021_DATA-*.csv')))

    # Add new IHME-GBD 2023 data files
    csv_files.extend(list(portfolios_dir.glob('IHME-GBD_2023_DATA-*.csv')))

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
        is_ihme = 'IHME' in filename

        for row in rows:
            # Get country name based on data type
            if is_ihme:
                country = row.get('location_name')
            else:
                country = row.get('Country Name') or row.get('GEO_NAME_SHORT')

            # Normalize country name using mapping
            normalized_country = COUNTRY_NAME_MAPPING.get(country, country)

            if normalized_country in TARGET_COUNTRIES:
                # For IHME data, filter for aggregate indicators only
                if is_ihme:
                    age_name = row.get('age_name', '')
                    sex_name = row.get('sex_name', '')
                    metric_name = row.get('metric_name', '')
                    cause_name = row.get('cause_name', '')
                    rei_name = row.get('rei_name', '')
                    measure_name = row.get('measure_name', '')

                    # For life expectancy and HALE: use "0-6 days" age (at birth), "Years" metric
                    # These measures don't have cause_name or rei_name populated
                    if measure_name in ['Life expectancy', 'HALE (Healthy life expectancy)']:
                        if age_name != '0-6 days' or sex_name != 'Both' or metric_name != 'Years':
                            continue
                        # Skip rows with any cause or risk factor
                        if cause_name or rei_name:
                            continue
                    # For all other measures: "All ages", "Both sexes", "All causes", no risk factor, "Rate" metric
                    else:
                        # Only include "All causes" and no specific risk factor (empty rei_name = total)
                        if cause_name != 'All causes':
                            continue
                        if rei_name:  # Skip any row with a risk factor (we want total only)
                            continue
                        # Must be "All ages", "Both sexes", "Rate" metric
                        if age_name != 'All ages' or sex_name != 'Both' or metric_name != 'Rate':
                            continue

                # Update the row with normalized country name
                if 'Country Name' in row:
                    row['Country Name'] = normalized_country
                if 'GEO_NAME_SHORT' in row:
                    row['GEO_NAME_SHORT'] = normalized_country
                if 'location_name' in row:
                    row['location_name'] = normalized_country

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
