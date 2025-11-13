# Category Reorganization - November 2025

## Summary

Reorganized indicator categories to ensure all indicators are in their most logical, user-friendly categories.

**Date**: 2025-11-13
**Primary Change**: Moved Life Expectancy and HALE indicators to their natural home

---

## Problem Statement

After removing duplicate indicators, Life Expectancy and HALE remained in the "Global Burden of Disease" category. This placement was:

1. **Not intuitive** - Users naturally look for life expectancy in "Mortality & Life Expectancy"
2. **Mixed purpose** - Combined general indicators (life expectancy) with specialized metrics (DALYs, YLDs, YLLs)
3. **Confusing** - The category name "Global Burden of Disease" doesn't clearly signal it contains life expectancy data

---

## Changes Made

### 1. Mortality & Life Expectancy Category

**Before (6 indicators):**
- Under-5 Mortality Rate
- Neonatal Mortality Rate
- Maternal Mortality Ratio
- Suicide Deaths
- NCD Deaths (Ages 30-70)
- Road Traffic Deaths

**After (8 indicators):**
- **Life Expectancy at Birth** ← MOVED from Disease Burden
- **Healthy Life Expectancy (HALE)** ← MOVED from Disease Burden
- Under-5 Mortality Rate
- Neonatal Mortality Rate
- Maternal Mortality Ratio
- Suicide Deaths
- NCD Deaths (Ages 30-70)
- Road Traffic Deaths

**Rationale**: Life expectancy indicators are fundamental mortality/survival metrics that users expect to find in this category. Now all life expectancy and mortality indicators are together in one logical place.

---

### 2. Disease Burden Metrics Category (formerly "Global Burden of Disease")

**Before (6 indicators):**
- DALYs (Disease Burden)
- Deaths from All Causes
- Years Lived with Disability
- Years of Life Lost
- Life Expectancy at Birth
- Healthy Life Expectancy (HALE)

**After (4 indicators):**
- DALYs (Disease Burden)
- Deaths from All Causes
- Years Lived with Disability (YLDs)
- Years of Life Lost (YLLs)

**Category Renamed**: "Global Burden of Disease" → "Disease Burden Metrics"

**Rationale**:
- This category now focuses exclusively on IHME's specialized burden of disease metrics
- These are technical epidemiological measures used by researchers and public health professionals
- The new name "Disease Burden Metrics" more clearly describes the category's contents
- Removed life expectancy indicators as they're more universally understood and belong with mortality indicators

---

## Complete Category Structure (Updated)

### Health Status & Outcomes

1. **Mortality & Life Expectancy** (8 indicators)
   - Life Expectancy at Birth
   - Healthy Life Expectancy (HALE)
   - Under-5 Mortality Rate
   - Neonatal Mortality Rate
   - Maternal Mortality Ratio
   - Suicide Deaths
   - NCD Deaths (Ages 30-70)
   - Road Traffic Deaths

2. **Disease Burden Metrics** (4 indicators)
   - DALYs (Disease Burden)
   - Deaths from All Causes
   - Years Lived with Disability
   - Years of Life Lost

3. **Infectious Diseases** (6 indicators)
   - Malaria Cases
   - Tuberculosis Cases
   - HIV Infections
   - Wild Polio Cases
   - Neglected Tropical Diseases
   - Hepatitis B in Children

4. **Nutrition** (5 indicators)
   - Child Stunting
   - Child Overweight
   - Adult Obesity
   - Child & Adolescent Obesity
   - Anaemia in Women

5. **NCD Risk Factors** (3 indicators)
   - Hypertension
   - Tobacco Use
   - Alcohol Consumption

6. **Reproductive Health** (1 indicator)
   - Family Planning Coverage

7. **Environmental Health** (1 indicator)
   - Air Pollution (PM2.5)

### Health Services & Systems

8. **Immunization** (4 indicators)
   - DTP3 Coverage
   - Measles MCV2 Coverage
   - PCV3 Coverage
   - HPV Coverage

9. **Health Workforce** (4 indicators)
   - Doctors Density
   - Nurses & Midwives Density
   - Pharmacists Density
   - Dentists Density

10. **Health Systems & Access** (3 indicators)
    - UHC Service Coverage Index
    - Essential Medicines Access
    - IHR Core Capacity

11. **Water, Sanitation & Hygiene** (5 indicators)
    - Safely Managed Sanitation Services
    - Safely Managed Drinking Water
    - Hand-washing Facilities
    - Treated Domestic Wastewater
    - Deaths from Unsafe WASH

### Socioeconomic Indicators

12. **Economic Indicators** (3 indicators)
    - GNI per capita
    - GDP per capita growth
    - GDP growth

13. **Poverty** (2 indicators)
    - National Poverty Headcount
    - Multidimensional Poverty (UNDP)

14. **Health Expenditure** (3 indicators)
    - Health Expenditure (% of GDP)
    - Health Expenditure per capita
    - Out-of-pocket Health Spending

15. **Demographics** (2 indicators)
    - Total Population
    - Population Growth

---

## Benefits of This Reorganization

### 1. Intuitive Navigation
Users looking for life expectancy data will naturally go to "Mortality & Life Expectancy" first, where they'll now find it immediately.

### 2. Clear Category Purposes
- **Mortality & Life Expectancy**: General mortality and survival metrics
- **Disease Burden Metrics**: Specialized epidemiological burden measures

### 3. Consistent with User Expectations
Life expectancy is universally understood as a key mortality/survival indicator, not as a "disease burden" metric.

### 4. Better Data Discovery
Users can find all life expectancy variants (standard and healthy) in one category alongside related mortality indicators.

### 5. Professional Clarity
Researchers and professionals will understand that "Disease Burden Metrics" contains IHME-specific technical measures (DALYs, YLDs, YLLs).

---

## User Impact

### Before This Change
- User selects category: "Mortality & Life Expectancy"
- **Cannot find** life expectancy indicators
- Must search through other categories
- Eventually finds them in "Global Burden of Disease"
- Category name doesn't clearly indicate it contains life expectancy

### After This Change
- User selects category: "Mortality & Life Expectancy"
- **Immediately sees** both life expectancy indicators at the top
- Clear, logical organization
- Can access 2023 data for both indicators
- Category name clearly describes its contents

---

## Data Source Information

Both life expectancy indicators use **IHME GBD consolidated data**:

| Indicator | Data Source | Years Available | Unit |
|-----------|-------------|-----------------|------|
| Life Expectancy at Birth | IHME_GBD_ALL_YEARS_CONSOLIDATED.csv | 2018-2023 | years |
| Healthy Life Expectancy (HALE) | IHME_GBD_ALL_YEARS_CONSOLIDATED.csv | 2018-2023 | years |

This provides the most recent data available (up to 2023) for these critical indicators.

---

## Technical Details

### Files Modified
- `data/indicator-categories.json`

### Changes
1. Moved 2 indicators from "ihme_gbd" category to "mortality" category
2. Renamed "Global Burden of Disease" category to "Disease Burden Metrics"
3. Reordered indicators within "Mortality & Life Expectancy" to place life expectancy at the top

### JSON Structure
Category structure remains the same. Only indicator placement and category name changed.

---

## Testing Verification

To verify the changes work correctly:

1. Open the application
2. Navigate to "Mortality & Life Expectancy" category
3. Verify you see "Life Expectancy at Birth" and "Healthy Life Expectancy (HALE)" at the top
4. Select "Healthy Life Expectancy (HALE)"
5. Year dropdown should show: 2018, 2019, 2020, 2021, 2023
6. Select 2023 and load data
7. Should display ~25 countries with HALE data

---

## Conclusion

**Problem**: Life expectancy indicators were in an unintuitive category location

**Solution**: Moved them to "Mortality & Life Expectancy" where users naturally expect to find them

**Result**: More intuitive, user-friendly category structure that aligns with user expectations and standard public health organization

All indicators are now in their most logical categories, making the application easier to navigate and more professional.
