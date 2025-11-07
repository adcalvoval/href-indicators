# HREF Indicators Analysis Tool

An interactive web application for visualizing humanitarian, economic, demographic, and health indicators for 25 priority countries, with real-time DREF operations data from the IFRC.

## Features

### Map Visualization
- Interactive OpenStreetMap-based world map with high-resolution country boundaries (Natural Earth 1:10m scale)
- Red polygons with 50% transparency showing indicator values across countries
- White borders for clear country separation
- Interactive tooltips on hover showing country name and indicator value
- Responsive design with dark red header and footer
- Zoom and pan controls

### Country Profile Panel
- Select any country to view a comprehensive profile
- Displays all available indicators organized by category
- Shows most recent data for each indicator
- Color-coded section headers matching category colors
- Scrollable interface for easy navigation

### Data List Panel
- Appears on the right side when loading indicator data
- Shows all countries with their data values
- Alphabetically sorted for easy reference
- Scrollable list with clean formatting
- Green header with indicator name

### Time Series Visualization
- Interactive line charts showing trends over time (2018-2024)
- Multi-country comparison with color-coded lines
- Country filtering with multi-select dropdown
- "Select All" and "Clear" buttons for easy filtering
- Automatically updates when changing indicators
- Powered by Chart.js library

### Data Categories

The application organizes **60+ indicators** into 15 categories:

1. **Country Profile View**
   - View all indicators for a selected country

2. **DREF - Disaster Response Emergency Fund** (Live data)
   - Active DREF operations with real-time updates from IFRC API
   - Past DREF operations (last 5 years)

3. **Water, Sanitation & Hygiene** (5 indicators)
   - Safely managed sanitation and drinking water
   - Hand-washing facilities
   - Treated wastewater
   - Deaths from unsafe WASH

4. **Mortality & Life Expectancy** (8 indicators)
   - Life expectancy and healthy life expectancy
   - Under-5, neonatal, and maternal mortality
   - Suicide and road traffic deaths
   - NCD deaths

5. **Infectious Diseases** (6 indicators)
   - Malaria, tuberculosis, HIV
   - Polio, hepatitis B
   - Neglected tropical diseases

6. **Nutrition** (5 indicators)
   - Child stunting and overweight
   - Adult and adolescent obesity
   - Anaemia in women

7. **Immunization** (4 indicators)
   - DTP3, Measles (MCV2), PCV3, HPV coverage

8. **Health Workforce** (4 indicators)
   - Density of doctors, nurses, pharmacists, dentists

9. **Health Systems & Access** (3 indicators)
   - UHC service coverage index
   - Essential medicines access
   - IHR core capacity

10. **NCD Risk Factors** (3 indicators)
    - Hypertension, tobacco use, alcohol consumption

11. **Reproductive Health** (1 indicator)
    - Family planning coverage

12. **Environmental Health** (1 indicator)
    - Air pollution (PM2.5)

13. **Economic Indicators** (3 indicators)
    - GNI per capita, GDP per capita growth, GDP growth

14. **Poverty** (2 indicators)
    - National poverty headcount
    - Multidimensional poverty (UNDP)

15. **Health Expenditure** (3 indicators)
    - Health expenditure as % of GDP
    - Per capita health expenditure
    - Out-of-pocket spending

16. **Demographics** (2 indicators)
    - Total population
    - Population growth

### Target Countries (25)

Afghanistan, Bangladesh, Burkina Faso, Cameroon, Central African Republic, Chad, Colombia, Congo DR, Ethiopia, Haiti, Lebanon, Mali, Mozambique, Myanmar, Niger, Nigeria, Pakistan, Somalia, South Sudan, Sudan, Syria, Uganda, Ukraine, Venezuela, Yemen

## Data Sources

- **IFRC GO Platform API**: Real-time DREF operations data
- **WHO Global Health Observatory**: Health indicators
- **World Bank Open Data**: Economic and development indicators
- **Natural Earth**: High-resolution country boundary data (1:10m scale)

## Project Structure

```
href-indicators-app/
├── index.html              # Main application page
├── css/
│   └── styles.css         # Application styling
├── js/
│   └── app.js            # Application logic and API integration
├── data/
│   ├── indicator-categories.json  # Indicator definitions
│   ├── compiled-indicators.json   # Pre-compiled data (18MB)
│   └── countries-10m.geojson     # High-res country boundaries (13MB)
├── Portfolios/            # Source data files
│   ├── *_ALL_LATEST.csv  # WHO indicator data (41 files)
│   └── WB Data 25b.csv   # World Bank data
├── compile-data.py        # Script to compile CSV into JSON
└── README.md             # This file
```

## Usage

### Viewing Indicator Data

1. Select a **Category** from the dropdown
2. Select an **Indicator** from the filtered list
3. Select a **Year** - only years with available data are shown
4. Click **Load Data** to visualize on the map
5. The data list panel shows all countries and values alphabetically
6. Click **Show Time Trend** to see the time series chart

### Country Profiles

1. In the "Country Profile" section (top-left)
2. Select a country from the dropdown
3. Click **View Profile**
4. A panel appears on the right showing all available indicators for that country

### Time Series Analysis

1. Load any indicator data
2. Click **Show Time Trend**
3. Use the country filter dropdown to select/deselect countries
4. Use "Select All" or "Clear" buttons for quick filtering

### DREF Operations

When you select "Active DREFs" or "Past DREFs":
- Markers appear on countries with operations
- Click markers to view details
- Data is fetched live from the IFRC GO Platform API

## Data Performance Optimization

The application uses a compiled JSON file (`compiled-indicators.json`) for faster data loading:
- All 41 WHO CSV files and World Bank data pre-compiled into single file
- Filtered to only include target countries
- 18MB compiled file vs loading 41 separate CSV files
- Falls back to CSV loading if compiled data not available

To rebuild the compiled data:
```bash
python compile-data.py
```

## Technical Details

### Technologies Used
- **Leaflet.js v1.9.4**: Interactive mapping library
- **Chart.js v4.4.0**: Time series visualization
- **OpenStreetMap**: Base map tiles
- **Natural Earth**: High-resolution GeoJSON boundaries
- **Vanilla JavaScript**: No framework dependencies
- **Fetch API**: For data loading
- **CSS3**: Modern styling with flexbox

### Key Features Implementation

**Country Name Normalization**
The compile script handles variations in country names:
- "Democratic Republic of the Congo" → "Congo DR"
- "Congo, Dem. Rep." → "Congo DR"
- "Syrian Arab Republic" → "Syria"
- "Venezuela, RB" → "Venezuela"
- Other variations normalized

**Dynamic Year Filtering**
Only years with actual data are shown in the dropdown:
- Checks data availability for each year (2018-2024)
- Prevents "No data found" errors
- Improves user experience

**Data Column Handling**
WHO data files use various column names for values:
- `PERCENT_POP_N`, `Value`, `Numeric`, `VALUE`
- `Rate`, `RATE`, `Prevalence`, `Incidence`
- `RATE_PER_100000_N` (for death rate indicators)

World Bank data uses year columns:
- Format: `2024 [YR2024]`
- Handles missing data marked as `..`

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Requires JavaScript enabled

## Bug Fixes and Corrections

### Series Code Corrections
Several World Bank indicators had incorrect Series Codes that were fixed:

**Poverty Indicators:**
- `POVERTY_HEADCOUNT_NATIONAL` → `SI.POV.NAHC`
- `MULTIDIM_POVERTY_UNDP` → `SI.POV.MPUN`

**Health Expenditure:**
- `OUT_OF_POCKET_HEALTH` → `SH.XPD.OOPC.CH.ZS`

**Demographics:**
- `POPULATION_TOTAL` → `SP.POP.TOTL`
- `POPULATION_GROWTH` → `SP.POP.GROW`

### Data Loading Fixes
- Added `RATE_PER_100000_N` column support for death rate indicators
- Fixed duplicate country filtering in compiled data loading
- Added country name mapping for DR Congo and other variations
- Fixed World Bank data filtering by Series Code

### UI/UX Improvements
- Moved panels to avoid covering map controls
- Adjusted positioning for better screen space utilization
- Made indicator analysis panel compact with bottom spacing
- Reduced padding and font sizes for better information density

## Development History

The application was developed through iterative improvements:
1. Initial setup with OpenStreetMap and Leaflet
2. WHO data integration with CSV loading
3. World Bank data addition
4. DREF API integration
5. Country profile feature
6. Performance optimization with compiled JSON
7. High-resolution country borders (Natural Earth)
8. Time series visualization with Chart.js
9. Country filtering in charts
10. Data list panel for quick reference
11. Dynamic year filtering
12. Bug fixes for country names and Series Codes

## Credits

Created by Adrián Calvo-Valderrama
International Federation of Red Cross and Red Crescent Societies (IFRC)

Developed with assistance from Claude Code (Anthropic)

## License

For IFRC humanitarian response and analysis purposes.
