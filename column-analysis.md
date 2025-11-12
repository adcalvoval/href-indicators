# Column Analysis for All Indicator Files

## WHO Data Files (*_ALL_LATEST.csv)

### Value Columns Found:
1. **PERCENT_POP_N** - Used by: 12EE54A, 1548EA3, 75DDA77, D1223E8
2. **RATE_PER_100000_N** - Used by: 16BBF41, AC597B1, C288D13, D6176E2, ED50112
3. **RATE_PER_100_N** - Used by: 1F96863, 287D1D2, 5F8A486, 608DE39, 64E2430, 8074BD9, 8D58801, A37BDD6, BB4567B, BEFA58B, D2A45A5, D45F91C, EF93DDB, F513188, F8E084C
4. **RATE_PER_10000_N** - Used by: 217795A, 45CA7C8, 5C8435F, 9F88C44
5. **RATE_PER_1000_N** - Used by: 2322814, 442CEA8, 77D059C, A4C49D3
6. **COUNT_N** - Used by: 2D6FBE4, 7B2BFA6
7. **AMOUNT_N** - Used by: 90E2E48, C64284D
8. **INDEX_N** - Used by: 9A706FD, FDBB8E8
9. **RATE_PER_CAPITA_N** - Used by: EE6F72A
10. **RATE_N** - Used by: F810947

## World Bank Data
- Uses year-based columns: `2018 [YR2018]`, `2019 [YR2019]`, etc.
- File: WB Data 25b.csv

## IHME Data
- Uses `val` column for values
- Files: IHME_GBD_2021_CONSOLIDATED.csv, IHME-GBD_2021_DATA-*.csv, IHME-GBD_2023_DATA-*.csv

## Current Extraction List (in app.js)
```javascript
[
    'PERCENT_POP_N', 'Value', 'Numeric', 'VALUE',
    'Rate', 'RATE', 'Prevalence', 'Incidence',
    'RATE_PER_100000_N', 'INDEX_N', 'RATE_PER_100_N'
]
```

## Missing Columns (Need to be added):
1. **RATE_PER_10000_N** - Used by 4 files (Health Workforce indicators)
2. **RATE_PER_1000_N** - Used by 4 files (Mortality, Malaria, HIV, Neonatal)
3. **COUNT_N** - Used by 2 files (NTD, Wild Polio)
4. **AMOUNT_N** - Used by 2 files (Life Expectancy, HALE)
5. **RATE_PER_CAPITA_N** - Used by 1 file (Alcohol Consumption)
6. **RATE_N** - Used by 1 file (Air Pollution)

## Recommendation:
Add all missing columns to the extraction list to ensure complete coverage.
