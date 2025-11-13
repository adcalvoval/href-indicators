# Duplicate Indicators Removed - Data Prioritization Update

## Summary

Comprehensive analysis of all datasets to identify and remove duplicate indicators. Prioritized data sources with the most recent years.

**Date**: 2025-11-13
**Result**: Removed 2 duplicate indicators from "Mortality & Life Expectancy" category

---

## Analysis Results

### Duplicate Indicators Found

Two indicators were present in multiple categories with different data sources:

#### 1. Life Expectancy at Birth

| Source | Category | Years | Status |
|--------|----------|-------|--------|
| **IHME GBD** | Global Burden of Disease | 2018-2023 | **KEPT** |
| WHO | Mortality & Life Expectancy | 2000-2021 | REMOVED |

**Decision**: Keep IHME version (has 2023 data vs WHO's 2021)

#### 2. Healthy Life Expectancy (HALE)

| Source | Category | Years | Status |
|--------|----------|-------|--------|
| **IHME GBD** | Global Burden of Disease | 2018-2023 | **KEPT** |
| WHO | Mortality & Life Expectancy | 2000-2021 | REMOVED |

**Decision**: Keep IHME version (has 2023 data vs WHO's 2021)

---

## Root Cause of Previous Confusion

The user was selecting "Healthy Life Expectancy" from the "Mortality & Life Expectancy" category, which only had WHO data up to 2021. The IHME version with 2023 data was in the "Global Burden of Disease" category.

This caused confusion when trying to access 2023 HALE data, as the WHO version didn't have it.

---

## Changes Made

### File: `data/indicator-categories.json`

**Removed from "Mortality & Life Expectancy" category:**
1. Life Expectancy at Birth (WHOSIS_000001) - File: 90E2E48_ALL_LATEST.csv
2. Healthy Life Expectancy (WHOSIS_000002) - File: C64284D_ALL_LATEST.csv

**Kept in "Global Burden of Disease" category:**
1. Life Expectancy at Birth - File: IHME_GBD_ALL_YEARS_CONSOLIDATED.csv (2018-2023)
2. Healthy Life Expectancy (HALE) - File: IHME_GBD_ALL_YEARS_CONSOLIDATED.csv (2018-2023)

---

## Remaining Indicators in "Mortality & Life Expectancy" Category

After cleanup, this category now contains 6 unique indicators:

1. **Under-5 Mortality Rate** (2000-2023)
2. **Neonatal Mortality Rate** (1952-2023)
3. **Maternal Mortality Ratio** (1985-2023)
4. **Suicide Deaths** (2000-2021)
5. **NCD Deaths (Ages 30-70)** (2000-2021)
6. **Road Traffic Deaths** (2021)

---

## Complete Data Recency Analysis

All data files analyzed for year coverage:

### Most Recent Data (2024)
- Treated Domestic Wastewater: 2020-2024
- HIV Infections: 1990-2024
- Child Stunting: 2000-2024
- Child Overweight: 2000-2024
- DTP3 Coverage: 2000-2024
- Measles MCV2 Coverage: 2000-2024
- PCV3 Coverage: 2008-2024
- HPV Coverage: 2012-2024
- IHR Core Capacity: 2021-2024

### 2023 Data
- **IHME GBD (ALL measures): 2018-2023** ← Most comprehensive recent data
- Under-5 Mortality Rate: 1944-2023
- Neonatal Mortality Rate: 1952-2023
- Maternal Mortality Ratio: 1985-2023
- Malaria Cases: 2000-2023
- Tuberculosis Cases: 2000-2023
- Wild Polio Cases: 2016-2023
- Neglected Tropical Diseases: 2010-2023
- Anaemia in Women: 2000-2023
- Health Workforce (Doctors, Nurses, Pharmacists, Dentists): 1990-2023

### 2022 Data
- WASH indicators (Sanitation, Water, Hygiene): 2000-2022
- Adult Obesity: 1990-2022
- Child & Adolescent Obesity: 1990-2022
- Alcohol Consumption: 2000-2022
- Family Planning Coverage: 2000-2022

### 2021 and Older
- Life Expectancy at Birth (WHO - REMOVED): 2000-2021
- Healthy Life Expectancy (WHO - REMOVED): 2000-2021
- Suicide Deaths: 2000-2021
- NCD Deaths: 2000-2021
- UHC Service Coverage Index: 2000-2021
- Road Traffic Deaths: 2021 only
- Hepatitis B in Children: 2015-2020
- Deaths from Unsafe WASH: 2019 only
- Hypertension: 1990-2019
- Air Pollution (PM2.5): 2010-2019
- Essential Medicines Access: 2004-2016

### Projected Data
- Tobacco Use: 2000-2030 (includes projections)

---

## Impact on Users

### Before This Update
Users could accidentally select outdated indicators:
- Selecting "Healthy Life Expectancy" from "Mortality & Life Expectancy" → only 2021 data
- Selecting "Life Expectancy at Birth" from "Mortality & Life Expectancy" → only 2021 data

### After This Update
- **All Life Expectancy indicators now show the most recent data (up to 2023)**
- No confusion from duplicate indicators
- Users automatically get the best available data source
- "Mortality & Life Expectancy" category remains focused on WHO-specific mortality indicators
- "Global Burden of Disease" category contains comprehensive IHME data with most recent years

---

## Recommendations for Future Updates

1. **Monitor WHO data releases**: If WHO releases life expectancy data beyond 2023, re-evaluate
2. **Check for other potential duplicates**: Current analysis found only these 2 duplicates
3. **Regular data recency audits**: Run `analyze-duplicate-indicators.py` script quarterly
4. **Consider data source labels**: Could add "(WHO)" or "(IHME)" suffixes to indicator names if needed in future

---

## Verification

To verify the changes:

1. Open the application
2. Navigate to "Global Burden of Disease" category
3. Select "Healthy Life Expectancy (HALE)"
4. Year dropdown should show: 2018, 2019, 2020, 2021, 2023
5. Select 2023 and load data
6. Should display ~25 countries with data

---

## Files Generated

- `analyze-duplicate-indicators.py` - Script to analyze all indicators for duplicates and recency
- `duplicate-indicators-report.json` - Complete analysis report in JSON format
- `DUPLICATE-INDICATORS-REMOVED.md` - This summary document

---

## Conclusion

**Problem Solved**: Users were confused because duplicate "Life Expectancy" and "HALE" indicators existed in different categories with different years.

**Solution Applied**: Removed WHO versions (2000-2021) and kept IHME versions (2018-2023) to ensure users always see the most recent data.

**Result**: Clean, unambiguous indicator list with the most recent data prioritized.
