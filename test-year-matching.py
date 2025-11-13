#!/usr/bin/env python3
"""Test if year matching works correctly"""

import json

print("="*70)
print("TESTING YEAR MATCHING FOR HALE 2023")
print("="*70)

with open('data/compiled-indicators.json', 'r', encoding='utf-8') as f:
    compiled_data = json.load(f)

# Simulate what the JavaScript does
indicatorId = 'HALE (Healthy life expectancy)'
year = 2023  # This is what JavaScript passes (number)

print(f"\nLooking for: {indicatorId}, year: {year} (type: {type(year)})")

data = []

for fileName, rows in compiled_data.items():
    if 'IHME' not in fileName:
        continue

    print(f"\nChecking file: {fileName}")

    for rowData in rows:
        measureName = rowData.get('measure_name')
        if measureName != indicatorId:
            continue

        rowYear = rowData.get('year')
        ageName = rowData.get('age_name')
        sexName = rowData.get('sex_name')
        metricName = rowData.get('metric_name')
        causeName = rowData.get('cause_name')
        reiName = rowData.get('rei_name')

        # Apply filtering
        if ageName != '0-6 days' or sexName != 'Both' or metricName != 'Years':
            continue
        if causeName or reiName:
            continue

        # Check year - this is the critical part
        # JavaScript uses: if (rowYear == year)
        # In Python: rowYear is string, year is int
        print(f"  Row year: '{rowYear}' (type: {type(rowYear)}), comparing with {year}")

        if str(rowYear) == str(year):  # Force string comparison like JS ==
            countryName = rowData.get('location_name')
            value = float(rowData.get('val'))
            data.append({
                'country': countryName,
                'value': value
            })
            print(f"    MATCH! {countryName}: {value}")

print(f"\n{'='*70}")
print(f"RESULT: Found {len(data)} data points for {indicatorId} year {year}")
print(f"{'='*70}")

if len(data) > 0:
    print("\nSample data:")
    for item in data[:5]:
        print(f"  {item['country']}: {item['value']:.2f} years")
    print("\n✓ SUCCESS: Data exists and year matching works!")
else:
    print("\n✗ PROBLEM: No data found - year matching failed!")
