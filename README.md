# HREF Indicators Analysis Tool

An interactive web application for visualizing humanitarian, economic, demographic, and health indicators for 25 priority countries, with real-time DREF operations data from the IFRC.

## Features

### Map Visualization
- Interactive OpenStreetMap-based world map
- Color-coded markers showing indicator values
- Red Cross icons for active DREF operations
- Responsive design with dark red header and footer

### Data Categories

The application organizes **50+ indicators** into 14 categories:

1. **DREF - Disaster Response Emergency Fund** (Live data)
   - Active DREF operations with real-time updates from IFRC API

2. **Water, Sanitation & Hygiene** (5 indicators)
   - Safely managed sanitation and drinking water
   - Hand-washing facilities
   - Treated wastewater
   - Deaths from unsafe WASH

3. **Mortality & Life Expectancy** (8 indicators)
   - Life expectancy and healthy life expectancy
   - Under-5, neonatal, and maternal mortality
   - Suicide and road traffic deaths
   - NCD deaths

4. **Infectious Diseases** (6 indicators)
   - Malaria, tuberculosis, HIV
   - Polio, hepatitis B
   - Neglected tropical diseases

5. **Nutrition** (5 indicators)
   - Child stunting and overweight
   - Adult and adolescent obesity
   - Anaemia in women

6. **Immunization** (4 indicators)
   - DTP3, Measles (MCV2), PCV3, HPV coverage

7. **Health Workforce** (4 indicators)
   - Density of doctors, nurses, pharmacists, dentists

8. **Health Systems & Access** (3 indicators)
   - UHC service coverage index
   - Essential medicines access
   - IHR core capacity

9. **NCD Risk Factors** (3 indicators)
   - Hypertension, tobacco use, alcohol consumption

10. **Reproductive Health** (1 indicator)
    - Family planning coverage

11. **Environmental Health** (1 indicator)
    - Air pollution (PM2.5)

12. **Economic Indicators** (3 indicators)
    - GNI per capita, GDP growth

13. **Poverty** (2 indicators)
    - National and multidimensional poverty

14. **Health Expenditure** (3 indicators)
    - Health expenditure as % of GDP
    - Per capita health expenditure
    - Out-of-pocket spending

### Target Countries (25)

Afghanistan, Bangladesh, Burkina Faso, Cameroon, Central African Republic, Chad, Colombia, Congo DR, Ethiopia, Haiti, Lebanon, Mali, Mozambique, Myanmar, Niger, Nigeria, Pakistan, Somalia, South Sudan, Sudan, Syria, Uganda, Ukraine, Venezuela, Yemen

## Data Sources

- **IFRC GO Platform API**: Real-time DREF operations data
- **WHO Global Health Observatory**: Health indicators
- **World Bank Open Data**: Economic and development indicators
- **CSV Files**: Historical indicator data (2000-2024)

## Project Structure

```
href-indicators-app/
├── index.html              # Main application page
├── css/
│   └── styles.css         # Application styling
├── js/
│   └── app.js            # Application logic and API integration
├── data/
│   └── indicator-categories.json  # Indicator definitions
├── Portfolios/            # Data files
│   ├── *_ALL_LATEST.csv  # WHO indicator data
│   └── WB Data 25b.csv   # World Bank data
└── README.md             # This file
```

## Usage

1. Open `index.html` in a web browser
2. Select a **Category** from the dropdown
3. Select an **Indicator** from the filtered list
4. Select a **Year** (or "Current" for DREF data)
5. Click **Load Data** to visualize on the map

### DREF Operations

When you select the "DREF - Disaster Response Emergency Fund" category:
- Red Cross icons (✚) appear on countries with active operations
- Click markers to view details:
  - Operation name and type
  - Requested amount (in CHF)
  - Start and end dates
  - DREF code
- Data is fetched live from the IFRC GO Platform API

### Color Coding

For numerical indicators:
- **Green**: Low values
- **Yellow**: Medium values
- **Red**: High values

The legend displays the actual min/max values for the selected indicator.

## API Configuration

The application uses the IFRC GO Platform API for DREF data:
- **Endpoint**: `https://goadmin.ifrc.org/api/v2/appeal/?atype=0&status=0`
- **Authentication**: Token-based (configured in `js/app.js`)
- **Filter**: Active DREFs (status=0) of type DREF (atype=0)

## Technical Details

### Technologies Used
- **Leaflet.js**: Interactive mapping library
- **OpenStreetMap**: Base map tiles
- **Vanilla JavaScript**: No framework dependencies
- **Fetch API**: For data loading
- **CSS3**: Modern styling with flexbox

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Requires JavaScript enabled

## Data Updates

- **DREF Operations**: Real-time via API
- **CSV Indicators**: Updated periodically (check file timestamps)
- Historical data coverage: 1950s-2024 (varies by indicator)

## Credits

Created by Adrián Calvo-Valderrama
International Federation of Red Cross and Red Crescent Societies (IFRC)

## License

For IFRC humanitarian response and analysis purposes.
