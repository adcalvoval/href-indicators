# Quick Reference - HREF Indicators Analysis Tool

## Recent Updates (November 2025)

### ✅ Completed Changes

1. **Removed Duplicate Indicators**
   - Removed WHO Life Expectancy (2000-2021)
   - Removed WHO HALE (2000-2021)
   - Kept IHME versions with most recent data (2018-2023)

2. **Reorganized Categories**
   - Moved Life Expectancy and HALE to "Mortality & Life Expectancy"
   - Renamed "Global Burden of Disease" to "Disease Burden Metrics"

### 📊 Current Category Structure (15 categories, 54 indicators)

#### Health Status & Outcomes

**Mortality & Life Expectancy** (8 indicators)
- Life Expectancy at Birth (2018-2023) ⭐ IHME
- Healthy Life Expectancy/HALE (2018-2023) ⭐ IHME
- Under-5 Mortality Rate (1944-2023)
- Neonatal Mortality Rate (1952-2023)
- Maternal Mortality Ratio (1985-2023)
- Suicide Deaths (2000-2021)
- NCD Deaths Ages 30-70 (2000-2021)
- Road Traffic Deaths (2021)

**Disease Burden Metrics** (4 indicators) - IHME Technical Metrics
- DALYs - Disease Burden (2018-2023)
- Deaths from All Causes (2018-2023)
- Years Lived with Disability (2018-2023)
- Years of Life Lost (2018-2023)

**Infectious Diseases** (6 indicators)
- Malaria Cases (2000-2023)
- Tuberculosis Cases (2000-2023)
- HIV Infections (1990-2024)
- Wild Polio Cases (2016-2023)
- Neglected Tropical Diseases (2010-2023)
- Hepatitis B in Children (2015-2020)

**Nutrition** (5 indicators)
- Child Stunting (2000-2024)
- Child Overweight (2000-2024)
- Adult Obesity (1990-2022)
- Child & Adolescent Obesity (1990-2022)
- Anaemia in Women (2000-2023)

**NCD Risk Factors** (3 indicators)
- Hypertension (1990-2019)
- Tobacco Use (2000-2030)
- Alcohol Consumption (2000-2022)

**Reproductive Health** (1 indicator)
- Family Planning Coverage (2000-2022)

**Environmental Health** (1 indicator)
- Air Pollution PM2.5 (2010-2019)

#### Health Services & Systems

**Immunization** (4 indicators)
- DTP3 Coverage (2000-2024)
- Measles MCV2 Coverage (2000-2024)
- PCV3 Coverage (2008-2024)
- HPV Coverage (2012-2024)

**Health Workforce** (4 indicators)
- Doctors Density (1990-2023)
- Nurses & Midwives Density (1990-2023)
- Pharmacists Density (1997-2023)
- Dentists Density (1990-2023)

**Health Systems & Access** (3 indicators)
- UHC Service Coverage Index (2000-2021)
- Essential Medicines Access (2004-2016)
- IHR Core Capacity (2021-2024)

**Water, Sanitation & Hygiene** (5 indicators)
- Safely Managed Sanitation (2000-2022)
- Safely Managed Drinking Water (2000-2022)
- Hand-washing Facilities (2000-2022)
- Treated Domestic Wastewater (2020-2024)
- Deaths from Unsafe WASH (2019)

#### Socioeconomic Indicators

**Economic Indicators** (3 indicators)
- GNI per capita
- GDP per capita growth
- GDP growth

**Poverty** (2 indicators)
- National Poverty Headcount
- Multidimensional Poverty (UNDP)

**Health Expenditure** (3 indicators)
- Health Expenditure (% of GDP)
- Health Expenditure per capita
- Out-of-pocket Health Spending

**Demographics** (2 indicators)
- Total Population
- Population Growth

---

## Data Sources

### IHME Global Burden of Disease (GBD)
- **File**: `IHME_GBD_ALL_YEARS_CONSOLIDATED.csv`
- **Years**: 2018, 2019, 2020, 2021, 2023 (no 2022)
- **Indicators**: 6 (Life Expectancy, HALE, DALYs, Deaths, YLDs, YLLs)
- **Countries**: 25 HREF target countries
- **Source**: Institute for Health Metrics and Evaluation

### WHO Data
- **Files**: 40+ individual CSV files (*_ALL_LATEST.csv)
- **Years**: Varies by indicator (most up to 2021-2024)
- **Indicators**: ~45 indicators
- **Source**: World Health Organization

### World Bank Data
- **File**: `WB Data 25b.csv`
- **Indicators**: 10 (economic, poverty, health expenditure, demographics)
- **Source**: World Bank

---

## How to Access 2023 Data

### Life Expectancy Indicators (2023 Available)

1. **Select Category**: "Mortality & Life Expectancy"
2. **Select Indicator**: "Life Expectancy at Birth" OR "Healthy Life Expectancy (HALE)"
3. **Available Years**: 2018, 2019, 2020, 2021, 2023
4. **Select Year**: 2023
5. **Load Data**: ~25 countries with values

### Disease Burden Indicators (2023 Available)

1. **Select Category**: "Disease Burden Metrics"
2. **Select Any Indicator**: DALYs, Deaths, YLDs, or YLLs
3. **Available Years**: 2018, 2019, 2020, 2021, 2023
4. **Select Year**: 2023
5. **Load Data**: ~25 countries with values

---

## Key Files

### Configuration
- `data/indicator-categories.json` - All indicators and categories
- `data/compiled-indicators.json` - Compiled data (generated)

### Data Processing
- `compile-data.py` - Compiles all CSV data into single JSON
- `consolidate-all-ihme.py` - Consolidates IHME files
- `analyze-duplicate-indicators.py` - Analyzes for duplicates

### Source Data
- `Portfolios/IHME_GBD_ALL_YEARS_CONSOLIDATED.csv` - IHME consolidated data
- `Portfolios/*_ALL_LATEST.csv` - WHO data files
- `Portfolios/WB Data 25b.csv` - World Bank data

### Documentation
- `README.md` - Main documentation
- `DUPLICATE-INDICATORS-REMOVED.md` - Duplicate removal details
- `CATEGORY-REORGANIZATION.md` - Category reorganization details
- `QUICK-REFERENCE.md` - This file

---

## Troubleshooting

### Indicator Not Showing Expected Year

1. Check which category you selected
2. Verify indicator name (may have similar names in different categories)
3. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Check console logs (F12) for year availability

### No Data Loading

1. Open browser console (F12)
2. Check for error messages
3. Verify `compiled-indicators.json` exists in `data/` folder
4. Run `python compile-data.py` to regenerate compiled data

### Need to Update Data

1. Add new CSV files to `Portfolios/` folder
2. Run `python compile-data.py`
3. Refresh browser

---

## Git Status

### Local Commits (Ready to Push)
- ✅ `535ee45` - Remove duplicate Life Expectancy and HALE indicators
- ✅ `479ed72` - Reorganize indicators into logical categories

### Push Status
⚠️ GitHub experiencing Internal Server Error
To push when resolved: `git push`

---

## Contact & Support

For issues or questions:
- Check documentation in project folder
- Review console logs for debugging
- Run analysis scripts to verify data

---

**Last Updated**: 2025-11-13
**Version**: 2.0 (Category Reorganization)
