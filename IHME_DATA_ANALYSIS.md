# IHME Global Burden of Disease Data Analysis

## Overview

The 10 IHME (Institute for Health Metrics and Evaluation) files contain comprehensive Global Burden of Disease (GBD) 2021 data for the 25 target countries.

## Consolidated File

**File:** `Portfolios/IHME_GBD_2021_CONSOLIDATED.csv`
- **Size:** 12.64 MB
- **Total rows:** 82,600
- **Years covered:** 2018-2021
- **Countries:** All 25 target countries

## Data Structure

### Columns (18 total):
- `measure_id`, `measure_name` - Type of measurement
- `location_id`, `location_name` - Country identification
- `sex_id`, `sex_name` - Sex disaggregation (Male, Female, Both)
- `age_id`, `age_name` - Age group disaggregation (25 age groups)
- `cause_id`, `cause_name` - Disease/condition causing health loss
- `rei_id`, `rei_name` - Risk factors (REI = Risk, Exposure, or Intervention)
- `metric_id`, `metric_name` - Unit of measurement (Number, Rate, Percent)
- `year` - Year of data (2018-2021)
- `val` - Value
- `upper`, `lower` - 95% uncertainty intervals

## Available Measures

### 1. **Mortality Measures**
- **Deaths** (9,276 rows) - Number/rate of deaths by cause and risk factor
- **YLLs - Years of Life Lost** (9,276 rows) - Years lost due to premature death

### 2. **Morbidity Measures**
- **YLDs - Years Lived with Disability** (25,380 rows) - Years lived with health conditions
- **DALYs - Disability-Adjusted Life Years** (9,276 rows) - Combined measure of death and disability
- **Prevalence** (16,368 rows) - Proportion of population with a condition
- **Incidence** (6,864 rows) - New cases occurring in a time period

### 3. **Life Expectancy**
- **Life expectancy** (2,200 rows) - Expected years of life at birth
- **HALE - Healthy Life Expectancy** (2,200 rows) - Years in full health

### 4. **Fertility Measures**
- **Live births** (792 rows) - Number of births
- **Crude birth rate** (792 rows) - Births per 1,000 population

### 5. **Other Measures**
- **Probability of death** (88 rows) - Risk of dying in an age interval
- **Summary exposure value** (88 rows) - Overall risk factor exposure

## Unique Characteristics

### Age Disaggregation
Data includes detailed age breakdowns:
- 0-6 days, 7-27 days, 28 days-1 year
- 1-4 years, 5-9 years, 10-14 years, 15-19 years
- 5-year intervals up to 85-89 years
- 90-94 years, 95+ years
- "All ages" aggregates

### Sex Disaggregation
- Male
- Female
- Both (aggregate)

### Risk Factors Covered
34+ unique risk factors including:
- Cholera, unsafe water, sanitation
- Air pollution, tobacco, alcohol
- Malnutrition, dietary risks
- High blood pressure, obesity
- And many more

## Recommendations for Web App Integration

### Approach 1: Summary Indicators (Recommended)
Create aggregated indicators showing "All ages" and "Both sexes" data:

**New Category: "IHME - Global Burden of Disease"**

Suggested indicators:
1. **DALYs Rate** - Overall disease burden (Rate per 100,000)
2. **Deaths from All Causes** - Total deaths (Rate per 100,000)
3. **Years Lived with Disability** - YLDs (Rate per 100,000)
4. **Years of Life Lost** - YLLs (Rate per 100,000)
5. **HALE (Healthy Life Expectancy)** - Years in full health
6. **Life Expectancy at Birth** - Total years expected
7. **Crude Birth Rate** - Births per 1,000 population
8. **DALYs from Specific Risk Factors** - Show top risk factors

**Advantages:**
- Simple to implement
- Consistent with existing indicator structure
- Fast loading (filtered to aggregates only)
- Easy comparison across countries

**Implementation:**
```python
# Filter for "All ages" and "Both sexes" data
# Metric: "Rate" for most measures (per 100,000)
# Create separate indicators for each measure type
```

### Approach 2: Interactive Explorer (Advanced)
Create a dedicated IHME data explorer:

**Features:**
- Dropdown for measure type (DALYs, Deaths, YLDs, etc.)
- Dropdown for age group selection
- Dropdown for sex selection
- Dropdown for specific cause/risk factor
- Time series visualization 2018-2021

**Advantages:**
- Full access to detailed data
- Age and sex-specific analysis
- Cause-specific insights
- Risk factor attribution

**Disadvantages:**
- More complex interface
- Requires significant UI development
- Slower data loading

### Approach 3: Hybrid (Best of Both)
1. Add summary indicators (Approach 1) for quick access
2. Add optional "View Detailed Breakdown" button that opens explorer
3. Keep consolidated file for future detailed analysis

## Integration Steps

### Step 1: Update indicator-categories.json
Add new category:
```json
{
  "id": "ihme_gbd",
  "name": "IHME - Global Burden of Disease",
  "color": "#673AB7",
  "indicators": [
    {
      "id": "IHME_DALYS_RATE",
      "name": "DALYs (Disease Burden)",
      "file": "IHME_GBD_2021_CONSOLIDATED.csv",
      "unit": "per 100,000",
      "description": "Disability-Adjusted Life Years - combined measure of death and disability"
    },
    // ... more indicators
  ]
}
```

### Step 2: Update compile-data.py
Add IHME file to compilation:
```python
csv_files.append(portfolios_dir / 'IHME_GBD_2021_CONSOLIDATED.csv')
```

Filter logic:
```python
if isIHME:
    # Filter for "All ages" and "Both sexes"
    if rowData['age_name'] == 'All ages' and rowData['sex_name'] == 'Both':
        # Filter for specific metric (e.g., "Rate")
        if rowData['metric_name'] == 'Rate':
            value = rowData['val']
```

### Step 3: Update app.js
Add IHME data loading logic:
```javascript
const isIHME = fileName.includes('IHME');
if (isIHME) {
    // Filter by measure_name, age_name, sex_name, metric_name
    if (rowData['measure_name'] === indicatorMeasure &&
        rowData['age_name'] === 'All ages' &&
        rowData['sex_name'] === 'Both' &&
        rowData['metric_name'] === 'Rate') {
        value = parseFloat(rowData['val']);
    }
}
```

## Data Quality Notes

### Completeness
- All 25 target countries have data
- 4 years of data (2018-2021) - recent and relevant
- Uncertainty intervals provided (upper/lower bounds)

### Reliability
- IHME GBD is a gold-standard global health dataset
- Widely used by WHO, World Bank, researchers
- Rigorous methodology and peer-reviewed

### Comparability
- Standardized age groups allow cross-country comparison
- Rates per 100,000 enable fair comparison regardless of population size
- All causes and risk factors use consistent definitions

## Recommended Priority Indicators

Based on humanitarian relevance and data availability:

**High Priority:**
1. **DALYs Rate** - Overall disease burden metric
2. **Life Expectancy** - Summary health indicator
3. **HALE** - Healthy years, not just survival
4. **Deaths Rate** - Mortality burden

**Medium Priority:**
5. **YLDs Rate** - Non-fatal health loss
6. **YLLs Rate** - Fatal health loss
7. **Crude Birth Rate** - Fertility indicator

**Future Enhancement:**
8. Risk factor-specific DALYs (requires UI for selection)
9. Age-specific indicators (requires additional interface)
10. Sex-specific indicators (requires additional interface)

## File Management

**Keep Original Files:**
Yes, for reference and future detailed analysis.

**Use Consolidated File:**
Yes, for web app integration (faster, simpler).

**Include in compiled-indicators.json:**
Yes, add filtered IHME data to the main compiled file.

## Next Steps

1. ✅ Consolidate 10 IHME files into single CSV (DONE)
2. ⏳ Decide on integration approach (Summary vs. Explorer vs. Hybrid)
3. ⏳ Update indicator-categories.json with IHME indicators
4. ⏳ Update compile-data.py to include IHME data
5. ⏳ Add IHME data loading logic to app.js
6. ⏳ Test with all 25 countries
7. ⏳ Update README documentation

## Summary

The IHME data provides comprehensive, high-quality health burden data that significantly enhances the webapp's analytical capabilities. The consolidated file (12.64 MB) is manageable and includes 82,600 rows covering 12 different health measures across 4 years for all 25 target countries.

**Recommendation:** Start with **Approach 1 (Summary Indicators)** to add 7-8 key indicators showing aggregate "All ages, Both sexes" data. This provides immediate value with minimal complexity. Later, consider adding an advanced explorer for age/sex/cause-specific analysis.
