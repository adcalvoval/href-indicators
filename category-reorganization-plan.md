# Category Reorganization Plan

## Current Issues

1. **Life Expectancy at Birth** and **HALE** are in "Global Burden of Disease" category
   - Users naturally expect these in "Mortality & Life Expectancy" category
   - "Global Burden of Disease" should focus on IHME-specific metrics (DALYs, YLDs, YLLs)

## Proposed Changes

### 1. Mortality & Life Expectancy
**Current (6 indicators):**
- Under-5 Mortality Rate
- Neonatal Mortality Rate
- Maternal Mortality Ratio
- Suicide Deaths
- NCD Deaths (Ages 30-70)
- Road Traffic Deaths

**Proposed (8 indicators):**
- **Life Expectancy at Birth** ← MOVE from Global Burden of Disease
- **Healthy Life Expectancy (HALE)** ← MOVE from Global Burden of Disease
- Under-5 Mortality Rate
- Neonatal Mortality Rate
- Maternal Mortality Ratio
- Suicide Deaths
- NCD Deaths (Ages 30-70)
- Road Traffic Deaths

**Rationale**: This is the natural home for life expectancy indicators. Users looking for life expectancy data will check this category first.

### 2. Global Burden of Disease
**Current (6 indicators):**
- DALYs (Disease Burden)
- Deaths from All Causes
- Years Lived with Disability
- Years of Life Lost
- Life Expectancy at Birth
- Healthy Life Expectancy (HALE)

**Proposed (4 indicators):**
- DALYs (Disease Burden)
- Deaths from All Causes
- Years Lived with Disability (YLDs)
- Years of Life Lost (YLLs)

**Alternative Option - Rename Category**: "Disease Burden Metrics (IHME)"

**Rationale**: Focus on IHME-specific burden of disease metrics. These are technical epidemiological measures that researchers and public health professionals use. Life expectancy is more universally understood and belongs with other mortality indicators.

### 3. Other Categories - No Changes Needed

All other categories are well-organized:
- Water, Sanitation & Hygiene ✓
- Infectious Diseases ✓
- Nutrition ✓
- Immunization ✓
- Health Workforce ✓
- Health Systems & Access ✓
- NCD Risk Factors ✓
- Reproductive Health ✓
- Environmental Health ✓
- Economic Indicators ✓
- Poverty ✓
- Health Expenditure ✓
- Demographics ✓

## Decision

Move Life Expectancy and HALE indicators from "Global Burden of Disease" to "Mortality & Life Expectancy" category.
