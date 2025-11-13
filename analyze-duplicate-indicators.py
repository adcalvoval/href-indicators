#!/usr/bin/env python3
"""
Analyze all indicators to find duplicates and determine which data sources
have the most recent data. Prioritize the most recent data sources.
"""

import json
from pathlib import Path
from collections import defaultdict

def get_year_range(compiled_data, filename):
    """Get the year range available in a data file."""
    if filename not in compiled_data or not compiled_data[filename]:
        return None, None

    years = set()
    for row in compiled_data[filename]:
        # Try different year column names
        year_value = None
        if 'year' in row and row['year']:
            year_value = row['year']
        elif 'YEAR' in row and row['YEAR']:
            year_value = row['YEAR']
        elif 'DIM_TIME' in row and row['DIM_TIME']:
            year_value = row['DIM_TIME']
        elif 'Year' in row and row['Year']:
            year_value = row['Year']

        if year_value:
            try:
                years.add(int(year_value))
            except (ValueError, TypeError):
                pass

    if not years:
        return None, None

    return min(years), max(years)

def normalize_indicator_name(name):
    """Normalize indicator name for comparison."""
    # Remove common variations
    name = name.lower()
    name = name.replace('(', '').replace(')', '')
    name = name.replace('hale', 'healthy life expectancy')
    return name.strip()

def analyze_indicators():
    """Analyze all indicators for duplicates and recent data."""

    # Load configuration
    with open('data/indicator-categories.json', 'r', encoding='utf-8') as f:
        config = json.load(f)

    # Load compiled data
    with open('data/compiled-indicators.json', 'r', encoding='utf-8') as f:
        compiled_data = json.load(f)

    print("=" * 80)
    print("INDICATOR DUPLICATE & RECENCY ANALYSIS")
    print("=" * 80)
    print()

    # Group indicators by normalized name
    indicator_groups = defaultdict(list)

    for category in config['categories']:
        if category['id'] in ['country_view', 'dref']:
            continue  # Skip special categories

        for indicator in category['indicators']:
            normalized = normalize_indicator_name(indicator['name'])

            # Get year range
            min_year, max_year = get_year_range(compiled_data, indicator['file'])

            indicator_groups[normalized].append({
                'category': category['name'],
                'name': indicator['name'],
                'id': indicator['id'],
                'file': indicator['file'],
                'unit': indicator['unit'],
                'min_year': min_year,
                'max_year': max_year
            })

    # Find duplicates and analyze
    duplicates_found = []
    recommendations = []

    print("DUPLICATE INDICATORS:")
    print("-" * 80)

    for normalized_name, indicators in sorted(indicator_groups.items()):
        if len(indicators) > 1:
            duplicates_found.append({
                'name': normalized_name,
                'indicators': indicators
            })

            print(f"\n{indicators[0]['name'].upper()}")
            print(f"  Found in {len(indicators)} categories:")

            # Sort by max year (most recent first)
            sorted_indicators = sorted(indicators, key=lambda x: (x['max_year'] or 0, x['min_year'] or 0), reverse=True)

            for idx, ind in enumerate(sorted_indicators):
                year_str = f"{ind['min_year']}-{ind['max_year']}" if ind['min_year'] else "No year data"
                status = "[KEEP - MOST RECENT]" if idx == 0 else "[REMOVE - OLDER]"
                print(f"    {idx+1}. {ind['category']}")
                print(f"       Years: {year_str}")
                print(f"       File: {ind['file']}")
                print(f"       {status}")

            # Add recommendation
            if sorted_indicators[0]['max_year']:
                recommendations.append({
                    'action': 'remove',
                    'indicators_to_remove': sorted_indicators[1:],
                    'keep': sorted_indicators[0],
                    'reason': f"Source '{sorted_indicators[0]['category']}' has more recent data ({sorted_indicators[0]['max_year']} vs {sorted_indicators[1]['max_year']})"
                })

    if not duplicates_found:
        print("  No duplicates found!")

    print("\n")
    print("=" * 80)
    print("SUMMARY OF ALL INDICATORS BY DATA RECENCY")
    print("=" * 80)
    print()

    # Group all indicators by file and show year ranges
    file_groups = defaultdict(list)

    for category in config['categories']:
        if category['id'] in ['country_view', 'dref']:
            continue

        for indicator in category['indicators']:
            file_groups[indicator['file']].append({
                'category': category['name'],
                'name': indicator['name'],
                'id': indicator['id']
            })

    # Sort files by their max year
    file_year_ranges = {}
    for filename in file_groups.keys():
        min_year, max_year = get_year_range(compiled_data, filename)
        file_year_ranges[filename] = (min_year, max_year)

    sorted_files = sorted(file_year_ranges.items(), key=lambda x: (x[1][1] or 0), reverse=True)

    for filename, (min_year, max_year) in sorted_files:
        year_str = f"{min_year}-{max_year}" if min_year else "No year data"
        print(f"\n{filename}")
        print(f"  Years: {year_str}")
        print(f"  Indicators ({len(file_groups[filename])}):")
        for ind in file_groups[filename]:
            print(f"    - {ind['name']} ({ind['category']})")

    print("\n")
    print("=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    print()

    if recommendations:
        for rec in recommendations:
            print(f"[KEEP] {rec['keep']['name']} from '{rec['keep']['category']}'")
            print(f"  Years: {rec['keep']['min_year']}-{rec['keep']['max_year']}")
            print(f"  File: {rec['keep']['file']}")
            print()
            for ind in rec['indicators_to_remove']:
                print(f"[REMOVE] {ind['name']} from '{ind['category']}'")
                year_str = f"{ind['min_year']}-{ind['max_year']}" if ind['min_year'] else "No years"
                print(f"  Years: {year_str}")
                print(f"  File: {ind['file']}")
            print(f"  Reason: {rec['reason']}")
            print()
    else:
        print("No duplicates to remove - all indicators are unique!")

    # Save recommendations to JSON
    with open('duplicate-indicators-report.json', 'w', encoding='utf-8') as f:
        json.dump({
            'duplicates': duplicates_found,
            'recommendations': recommendations,
            'file_year_ranges': {k: {'min': v[0], 'max': v[1]} for k, v in file_year_ranges.items()}
        }, f, indent=2)

    print()
    print("Full report saved to: duplicate-indicators-report.json")
    print()

if __name__ == '__main__':
    analyze_indicators()
