# Analysis of 5 New IHME-GBD 2023 Files

## Summary
All 5 files contain **2023 data** for 22-24 of our 25 target countries.

### Missing Countries (commonly):
- **Congo DR** (missing in all 5 files)
- **Syria** (missing in 3 files)
- **Venezuela** (missing in 3 files)

---

## File Details

### 1. IHME-GBD_2023_DATA-1e52c43e-1.csv
- **Rows**: 26,700 total / 23,496 target country rows
- **Year**: 2023
- **Measures**:
  - ✅ DALYs (Disability-Adjusted Life Years) - ALREADY IN CONFIG
  - ✅ Deaths - ALREADY IN CONFIG
  - ✅ YLDs (Years Lived with Disability) - ALREADY IN CONFIG
  - ✅ YLLs (Years of Life Lost) - ALREADY IN CONFIG
- **Metrics**: Number, Percent, Rate
- **Focus**: Disease burden by **causes and risk factors**
- **Countries**: 22/25 (missing: Congo DR, Syria, Venezuela)

### 2. IHME-GBD_2023_DATA-20df3c10-1.csv
- **Rows**: 12,900 total / 12,384 target country rows
- **Year**: 2023
- **Measures**:
  - ✅ DALYs - ALREADY IN CONFIG
  - ✅ Deaths - ALREADY IN CONFIG
  - ✅ YLDs - ALREADY IN CONFIG
  - ✅ YLLs - ALREADY IN CONFIG
  - ⚠️ Incidence - NEW (not in current config)
  - ⚠️ Prevalence - NEW (not in current config)
- **Metrics**: Number, Percent, Rate
- **Focus**: Disease burden by **major disease categories**
- **Countries**: 24/25 (missing: Congo DR)

### 3. IHME-GBD_2023_DATA-43bf3646-1.csv
- **Rows**: 25 total / 22 target country rows
- **Year**: 2023
- **Measures**:
  - ✅ HALE (Healthy life expectancy) - ALREADY IN CONFIG
- **Metrics**: Years
- **Age**: 0-6 days (at birth)
- **Countries**: 22/25 (missing: Congo DR, Syria, Venezuela)

### 4. IHME-GBD_2023_DATA-807bce6c-1.csv
- **Rows**: 225 total / 198 target country rows
- **Year**: 2023
- **Measures**:
  - ✅ Life expectancy - ALREADY IN CONFIG
- **Metrics**: Years
- **Age groups**: Multiple (10-14 through 50-54 years)
- **Countries**: 22/25 (missing: Congo DR, Syria, Venezuela)

### 5. IHME-GBD_2023_DATA-b0091085-1.csv
- **Rows**: 575 total / 506 target country rows
- **Year**: 2023
- **Measures**:
  - ⚠️ Crude birth rate - NEW (not in current config)
  - ⚠️ Live births - NEW (not in current config)
- **Metrics**: Number, Rate
- **Age groups**: Various (10-14 through 40-44 years)
- **Countries**: 22/25 (missing: Congo DR, Syria, Venezuela)

---

## Integration Plan

### Already Configured Measures (will get 2023 data):
1. ✅ DALYs (Disability-Adjusted Life Years)
2. ✅ Deaths
3. ✅ YLDs (Years Lived with Disability)
4. ✅ YLLs (Years of Life Lost)
5. ✅ Life expectancy
6. ✅ HALE (Healthy life expectancy)

### New Measures (could be added if desired):
- Incidence (file: 20df3c10)
- Prevalence (file: 20df3c10)
- Crude birth rate (file: b0091085)
- Live births (file: b0091085)

---

## Recommendation

**Automatic Integration**: The 5 new files are already being included by the glob pattern in `compile-data.py`:
```python
csv_files.extend(list(portfolios_dir.glob('IHME-GBD_2023_DATA-*.csv')))
```

This means:
- All 6 existing IHME measures will automatically get 2023 data
- Users can select year 2023 for these indicators
- Data will be available for 22-24 countries (depending on indicator)

**Optional Enhancement**: Could add the 4 new measures (Incidence, Prevalence, Crude birth rate, Live births) to the indicator configuration if desired.
