# IHME 2023 Data Availability Report

## Summary
The 5 new IHME-GBD 2023 files do **NOT** contain "Life Expectancy at Birth" data for year 2023.

---

## Data Availability by Indicator (Year 2023)

### ✅ Available in 2023:
1. **Deaths from All Causes** - ✅ Available (25 countries)
2. **DALYs (Disease Burden)** - ✅ Available (25 countries)
3. **HALE (Healthy Life Expectancy at Birth)** - ✅ Available (22-25 countries)

### ❌ NOT Available in 2023:
4. **Life Expectancy at Birth** - ❌ Not in 2023 files (Latest: 2021)
5. **YLDs (Years Lived with Disability)** - ❌ Not in 2023 files (Latest: 2021)
6. **YLLs (Years of Life Lost)** - ❌ Not in 2023 files (Latest: 2021)

---

## Investigation Results

### Life Expectancy Data in 2023 Files:

**File: IHME-GBD_2023_DATA-807bce6c-1.csv**
- ❌ Contains "Life expectancy" measure
- ❌ BUT only for age groups: 10-14, 15-19, 20-24, 25-29, 30-34, 35-39, 40-44, 45-49, 50-54 years
- ❌ Does NOT contain "0-6 days" (at birth) data
- **Result**: Filtered out by our system (correctly)

**Why filtered?**
Our system is configured to only show "Life expectancy at birth" (age: 0-6 days) because:
1. It's the standard comparative measure across countries
2. It's what users expect when they see "Life Expectancy"
3. Life expectancy at other ages is less meaningful for country comparison

### HALE vs Life Expectancy:

| Indicator | 2023 Data | Age Group |
|-----------|-----------|-----------|
| **HALE (Healthy Life Expectancy)** | ✅ Yes | 0-6 days (at birth) |
| **Life Expectancy** | ❌ No | Only 10-54 years age groups |

---

## What This Means for Users

### Available Year Selection:

**Deaths from All Causes:**
- Years: 2018, 2019, 2020, 2021, **2023** ✅

**DALYs (Disease Burden):**
- Years: 2018, 2019, 2020, 2021, **2023** ✅

**HALE (Healthy Life Expectancy):**
- Years: 2018, 2019, 2020, 2021, **2023** ✅

**Life Expectancy at Birth:**
- Years: 2018, 2019, 2020, 2021
- **2023 NOT available** ❌

**YLDs, YLLs:**
- Years: 2018, 2019, 2020, 2021
- **2023 NOT available** ❌

---

## Recommendation

### For Users:
If you need 2023 life expectancy data, use **HALE (Healthy Life Expectancy)** instead:
- HALE is available for 2023
- HALE is actually a better measure as it accounts for health quality, not just longevity
- Both are measured "at birth" and are comparable

### Technical Note:
This is a **data source limitation**, not a system bug:
- IHME-GBD 2023 release did not include "Life Expectancy at Birth" data
- Only life expectancy for older age groups was released
- Our filtering system is working correctly
- No code changes needed

---

## Verified Correct Behavior

✅ System correctly filters Life Expectancy to only show "at birth" (0-6 days)
✅ System correctly excludes age-specific life expectancy (10+ years)
✅ HALE (Healthy Life Expectancy) 2023 data successfully integrated
✅ Users can view 2023 data for 3 major health indicators

**Conclusion**: Everything is working as designed. The absence of "Life Expectancy at Birth" 2023 data is due to IHME not releasing it in these files, not a system issue.
