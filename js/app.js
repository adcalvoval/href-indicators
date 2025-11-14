// Global variables
let map;
let categoriesData = null;
let countriesGeoJSON = null;
let compiledData = null; // Compiled indicators data
let currentMarkers = [];
let currentOverlays = [];
let timeSeriesChart = null; // Chart.js instance
let currentIndicatorData = null; // Store current indicator info for time series
const IFRC_API_TOKEN = '3f891db59f4e9fd16ba4f8be803d368a469a1276';
const DREF_API_URL = 'https://goadmin.ifrc.org/api/v2/appeal/?atype=0&status=0&limit=500';
const PAST_DREF_API_URL = 'https://goadmin.ifrc.org/api/v2/appeal/?atype=0&limit=500';
const GDACS_API_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH';

// Cache for IFRC API data to avoid repeated fetches
let cachedDrefData = null;
let cachedPastDrefData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for disaster events on time series chart
let chartDisasterEvents = {}; // { countryISO3: [events] }

// Helper function to format numbers with commas
function formatNumber(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) {
        return value;
    }
    return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chart.js loaded:', typeof Chart !== 'undefined');
    console.log('Chart version:', typeof Chart !== 'undefined' ? Chart.version : 'N/A');
    console.log('Available plugins:', typeof Chart !== 'undefined' && Chart.registry ? Object.keys(Chart.registry.plugins.items).join(', ') : 'N/A');

    initMap();
    loadCategories();
    loadCountriesGeoJSON();
    loadCompiledData();
    setupEventListeners();
});

// Initialize the map
function initMap() {
    map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
        zoomControl: false // Disable default zoom control
    });

    // Add zoom control to top right
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        noWrap: false
    }).addTo(map);

    L.control.scale({
        position: 'bottomleft',
        imperial: false,
        metric: true
    }).addTo(map);

    console.log('Map initialized successfully');
}

// Load indicator categories from JSON
async function loadCategories() {
    try {
        const response = await fetch('data/indicator-categories.json');
        categoriesData = await response.json();

        populateCategorySelect();
        console.log('Categories loaded successfully');
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('Failed to load indicator categories. Please check the data files.');
    }
}

// Load countries GeoJSON for polygon display
async function loadCountriesGeoJSON() {
    try {
        const response = await fetch('data/countries-10m.geojson');
        const data = await response.json();

        // Filter for target countries
        const targetCountryNames = ['Afghanistan', 'Bangladesh', 'Burkina Faso', 'Cameroon',
            'Central African Republic', 'Chad', 'Colombia', 'Democratic Republic of the Congo',
            'Ethiopia', 'Haiti', 'Lebanon', 'Mali', 'Mozambique', 'Myanmar', 'Niger', 'Nigeria',
            'Pakistan', 'Somalia', 'South Sudan', 'Sudan', 'Syria', 'Uganda', 'Ukraine',
            'Venezuela', 'Yemen'];

        countriesGeoJSON = {
            type: 'FeatureCollection',
            features: data.features.filter(feature => {
                const name = feature.properties.ADMIN || feature.properties.NAME;
                return targetCountryNames.includes(name) ||
                       (name === 'Dem. Rep. Congo' || name === 'Congo (Kinshasa)' || name === 'Congo DRC') ||
                       (name === 'Somaliland'); // Include Somaliland region as part of Somalia
            })
        };

        console.log(`Loaded ${countriesGeoJSON.features.length} country polygons`);
    } catch (error) {
        console.error('Error loading GeoJSON:', error);
    }
}

// Load compiled indicator data
async function loadCompiledData() {
    try {
        // Add cache-busting parameter to ensure latest data is loaded
        const response = await fetch('data/compiled-indicators.json?v=20251113', {
            cache: 'no-store'
        });
        compiledData = await response.json();
        console.log('Compiled data loaded successfully');
        console.log('IHME files in compiled data:', Object.keys(compiledData).filter(k => k.includes('IHME')));
    } catch (error) {
        console.error('Error loading compiled data:', error);
    }
}

// Populate category dropdown
function populateCategorySelect() {
    const categorySelect = document.getElementById('category-select');

    categoriesData.categories.forEach(category => {
        // Skip the country_view category as it's now in a separate dropdown
        if (category.id === 'country_view') return;

        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });

    // Populate country profile dropdown
    const countryProfileSelect = document.getElementById('country-profile-select');
    categoriesData.countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        countryProfileSelect.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    const categorySelect = document.getElementById('category-select');
    const indicatorSelect = document.getElementById('indicator-select');
    const yearSelect = document.getElementById('year-select');
    const loadDataBtn = document.getElementById('load-data-btn');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const countryProfileSelect = document.getElementById('country-profile-select');
    const viewProfileBtn = document.getElementById('view-profile-btn');
    const clearMapBtn = document.getElementById('clear-map-btn');
    const showTrendBtn = document.getElementById('show-trend-btn');
    const closeChartBtn = document.getElementById('close-chart-btn');
    const countryFilter = document.getElementById('country-filter');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const closeDataListBtn = document.getElementById('close-data-list-btn');
    const closeTimelineBtn = document.getElementById('close-timeline-btn');
    const showDisastersCheckbox = document.getElementById('show-disasters-checkbox');

    categorySelect.addEventListener('change', onCategoryChange);
    indicatorSelect.addEventListener('change', onIndicatorChange);
    loadDataBtn.addEventListener('click', loadIndicatorData);
    closeProfileBtn.addEventListener('click', closeCountryProfile);
    countryProfileSelect.addEventListener('change', onCountryProfileSelectChange);
    viewProfileBtn.addEventListener('click', onViewProfileClick);
    clearMapBtn.addEventListener('click', clearAllMapData);
    showTrendBtn.addEventListener('click', showTimeSeriesChart);
    closeChartBtn.addEventListener('click', closeChart);
    countryFilter.addEventListener('change', updateChartWithFilter);
    selectAllBtn.addEventListener('click', selectAllCountries);
    deselectAllBtn.addEventListener('click', deselectAllCountries);
    closeDataListBtn.addEventListener('click', closeDataList);
    showDisastersCheckbox.addEventListener('change', toggleDisasterEvents);

    if (closeTimelineBtn) {
        closeTimelineBtn.addEventListener('click', closeTimeline);
    } else {
        console.error('Close timeline button not found!');
    }
}

// Handle country profile selection change (enable/disable button)
function onCountryProfileSelectChange(event) {
    const countryCode = event.target.value;
    const viewProfileBtn = document.getElementById('view-profile-btn');

    if (countryCode) {
        viewProfileBtn.disabled = false;
    } else {
        viewProfileBtn.disabled = true;
    }
}

// Handle View Profile button click
function onViewProfileClick() {
    const countrySelect = document.getElementById('country-profile-select');
    const countryCode = countrySelect.value;

    if (!countryCode) {
        return;
    }

    const countryName = countrySelect.options[countrySelect.selectedIndex].text;

    // Load country profile
    loadCountryProfile(countryName, countryCode);

    // Show timeline for this country
    showCountryTimeline(countryName, countryCode);
}

// Handle category selection
function onCategoryChange(event) {
    const categoryId = event.target.value;
    const indicatorSelect = document.getElementById('indicator-select');
    const yearSelect = document.getElementById('year-select');
    const loadDataBtn = document.getElementById('load-data-btn');

    // Reset dependent dropdowns
    indicatorSelect.innerHTML = '<option value="">Select an indicator...</option>';
    yearSelect.innerHTML = '<option value="">Select a year...</option>';
    yearSelect.disabled = true;
    loadDataBtn.disabled = true;

    if (!categoryId) {
        indicatorSelect.disabled = true;
        return;
    }

    // Find selected category
    const category = categoriesData.categories.find(cat => cat.id === categoryId);

    if (category && category.indicators) {
        // Populate indicators
        category.indicators.forEach(indicator => {
            const option = document.createElement('option');
            option.value = indicator.id;
            option.textContent = indicator.name;
            option.dataset.file = indicator.file;
            option.dataset.description = indicator.description;
            option.dataset.unit = indicator.unit;
            indicatorSelect.appendChild(option);
        });

        indicatorSelect.disabled = false;
    }
}

// Handle indicator selection
async function onIndicatorChange(event) {
    const indicatorId = event.target.value;
    const yearSelect = document.getElementById('year-select');
    const loadDataBtn = document.getElementById('load-data-btn');
    const showTrendBtn = document.getElementById('show-trend-btn');
    const indicatorSelect = document.getElementById('indicator-select');

    yearSelect.innerHTML = '<option value="">Select a year...</option>';

    if (!indicatorId) {
        yearSelect.disabled = true;
        loadDataBtn.disabled = true;
        showTrendBtn.disabled = true;
        return;
    }

    // Reset current indicator data when changing indicator
    currentIndicatorData = null;

    // Check if this is API data (DREF or GDACS - doesn't need year selection or time series)
    if (indicatorId === 'ACTIVE_DREFS' || indicatorId === 'PAST_DREFS' || indicatorId === 'PAST_DISASTERS') {
        yearSelect.disabled = true;
        if (indicatorId === 'ACTIVE_DREFS') {
            yearSelect.innerHTML = '<option value="current">Current (Live Data)</option>';
        } else if (indicatorId === 'PAST_DREFS') {
            yearSelect.innerHTML = '<option value="past5years">Last 5 Years</option>';
        } else if (indicatorId === 'PAST_DISASTERS') {
            yearSelect.innerHTML = '<option value="recent">Recent Events (~3 years)</option>';
        }
        yearSelect.value = yearSelect.options[0].value;
        loadDataBtn.disabled = false;
        showTrendBtn.disabled = true; // No time series for API data
    } else {
        // Get the data file for this indicator
        const selectedOption = indicatorSelect.options[indicatorSelect.selectedIndex];
        const dataFile = selectedOption.dataset.file;

        // Check which years have data
        yearSelect.disabled = true;
        yearSelect.innerHTML = '<option value="">Checking available years...</option>';

        const availableYears = await getAvailableYears(dataFile, indicatorId);

        yearSelect.innerHTML = '<option value="">Select a year...</option>';

        if (availableYears.length > 0) {
            availableYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
            yearSelect.disabled = false;
            loadDataBtn.disabled = false;
            showTrendBtn.disabled = false;
        } else {
            yearSelect.innerHTML = '<option value="">No data available</option>';
            yearSelect.disabled = true;
            loadDataBtn.disabled = true;
            showTrendBtn.disabled = true;
        }

        // If chart is open, auto-update it with new indicator
        const chartPanel = document.getElementById('chart-panel');
        if (!chartPanel.classList.contains('hidden')) {
            showTimeSeriesChart();
        }
    }
}

// Get available years for a specific indicator
async function getAvailableYears(dataFile, indicatorId) {
    const allYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018];
    const availableYears = [];

    console.log(`Getting available years for ${indicatorId} from ${dataFile}`);

    // Try to load data from compiled JSON or CSV for each year
    for (const year of allYears) {
        try {
            const data = await loadDataFile(dataFile, indicatorId, year);
            if (data && data.length > 0) {
                console.log(`  Year ${year}: ${data.length} data points found`);
                availableYears.push(year);
            } else {
                console.log(`  Year ${year}: no data`);
            }
        } catch (e) {
            console.log(`  Year ${year}: error - ${e.message}`);
        }
    }

    return availableYears;
}

// Load and display indicator data
async function loadIndicatorData() {
    const categorySelect = document.getElementById('category-select');
    const indicatorSelect = document.getElementById('indicator-select');
    const yearSelect = document.getElementById('year-select');

    const categoryId = categorySelect.value;
    const indicatorId = indicatorSelect.value;
    const year = yearSelect.value;

    if (!categoryId || !indicatorId) {
        alert('Please select a category and indicator.');
        return;
    }

    const selectedOption = indicatorSelect.options[indicatorSelect.selectedIndex];
    const dataFile = selectedOption.dataset.file;
    const indicatorName = selectedOption.textContent;
    const unit = selectedOption.dataset.unit;

    // Store current indicator data for time series
    currentIndicatorData = {
        indicatorId: indicatorId,
        indicatorName: indicatorName,
        dataFile: dataFile,
        unit: unit
    };

    console.log(`Loading data for: ${indicatorName} from ${dataFile}`);

    try {
        // Show loading popup
        showLoading('Loading data...');

        // Clear existing markers/overlays
        clearMapData();

        // Check if this is API data (DREF or GDACS)
        if (indicatorId === 'ACTIVE_DREFS') {
            const drefData = await loadDREFData();
            hideLoading();
            if (drefData && drefData.length > 0) {
                displayDREFOnMap(drefData);
                showDREFLegend(drefData.length);
            } else {
                alert('No active DREF operations found.');
            }
        } else if (indicatorId === 'PAST_DREFS') {
            const pastDrefData = await loadPastDREFData();
            hideLoading();
            if (pastDrefData && pastDrefData.length > 0) {
                displayPastDREFOnMap(pastDrefData);
                showPastDREFLegend(pastDrefData);
            } else {
                alert('No past DREF operations found in the last 5 years.');
            }
        } else if (indicatorId === 'PAST_DISASTERS') {
            const disasterData = await loadGDACSDisasterData();
            hideLoading();
            if (disasterData && disasterData.length > 0) {
                displayDisastersOnMap(disasterData);
                showDisasterLegend(disasterData);
            } else {
                alert('No disaster events found in the last 5 years.');
            }
        } else {
            // Regular CSV data
            if (!year) {
                hideLoading();
                alert('Please select a year.');
                return;
            }

            const data = await loadDataFile(dataFile, indicatorId, year);
            console.log(`loadDataFile returned ${data ? data.length : 0} data points`);

            hideLoading();

            if (data && data.length > 0) {
                console.log(`Displaying ${data.length} countries on map`);
                displayDataOnMap(data, indicatorName, unit);
                showLegend(indicatorName, unit, data);
                showDataList(data, indicatorName, unit);
            } else {
                console.log('No data found - showing alert');
                alert('No data found for the selected criteria.');
            }
        }
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoading();
        alert('Failed to load indicator data. Please check the console for details.');
    }
}

// Parse CSV with proper handling of quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Load data from compiled JSON or fallback to CSV file
async function loadDataFile(fileName, indicatorId, year) {
    try {
        // For IHME data, check all IHME files in compiled data (not just the specified one)
        // This allows us to get data from multiple IHME files (e.g., 2021 and 2023 data)
        if (compiledData && fileName.includes('IHME')) {
            console.log(`Loading IHME indicator ${indicatorId} for year ${year} from all IHME files`);
            const data = [];

            // Check all files in compiled data that are IHME files
            for (const [dataFileName, rows] of Object.entries(compiledData)) {
                if (!dataFileName.includes('IHME') || !rows || rows.length === 0) {
                    continue;
                }

                const firstRow = rows[0];
                const isIHME = firstRow.hasOwnProperty('location_name') && firstRow.hasOwnProperty('measure_name');

                if (!isIHME) {
                    continue;
                }

                // Process this IHME file
                for (let rowData of rows) {
                    const countryName = rowData['location_name'];
                    const measureName = rowData['measure_name'];
                    const ageName = rowData['age_name'];
                    const sexName = rowData['sex_name'];
                    const metricName = rowData['metric_name'];
                    const causeName = rowData['cause_name'];
                    const reiName = rowData['rei_name'];

                    // Check if this row matches the requested measure
                    if (measureName !== indicatorId) {
                        continue;
                    }

                    // Apply filtering rules
                    if (measureName === 'Life expectancy' || measureName === 'HALE (Healthy life expectancy)') {
                        if (ageName !== '0-6 days' || sexName !== 'Both' || metricName !== 'Years') {
                            continue;
                        }
                        if (causeName || reiName) {
                            continue;
                        }
                    } else {
                        if (causeName !== 'All causes') {
                            continue;
                        }
                        if (reiName) {
                            continue;
                        }
                        if (ageName !== 'All ages' || sexName !== 'Both') {
                            continue;
                        }
                        if (metricName !== 'Rate') {
                            continue;
                        }
                    }

                    // Check year and extract value
                    const rowYear = rowData['year'];
                    if (rowYear == year) {
                        const rawValue = rowData['val'];
                        if (rawValue && rawValue !== '' && rawValue !== 'N/A') {
                            const value = parseFloat(rawValue);
                            if (!isNaN(value)) {
                                data.push({
                                    country: countryName,
                                    value: value,
                                    rowData: rowData
                                });
                            }
                        }
                    }
                }
            }

            console.log(`Found ${data.length} data points for ${indicatorId} in year ${year} across all IHME files`);
            return data;
        }

        // Try to use compiled data first (for non-IHME data)
        if (compiledData && compiledData[fileName]) {
            console.log(`Loading ${fileName} from compiled data`);
            const rows = compiledData[fileName];
            console.log(`Compiled data has ${rows.length} rows for ${fileName}`);
            const data = [];

            // Determine data type from first row
            const firstRow = rows[0];
            const isWHO = firstRow.hasOwnProperty('GEO_NAME_SHORT') || firstRow.hasOwnProperty('DIM_TIME');
            const isWorldBank = firstRow.hasOwnProperty('Country Name') &&
                              Object.keys(firstRow).some(k => k.includes('[YR'));
            const isIHME = firstRow.hasOwnProperty('location_name') && firstRow.hasOwnProperty('measure_name');

            console.log(`Data type: ${isWHO ? 'WHO' : isWorldBank ? 'World Bank' : isIHME ? 'IHME' : 'Unknown'}`);

            for (let rowData of rows) {
                // Get country name based on data type
                const countryName = rowData['Country Name'] || rowData['GEO_NAME_SHORT'] || rowData['location_name'];

                // For World Bank data, check if this row matches the requested indicator
                if (isWorldBank) {
                    const seriesCode = rowData['Series Code'];
                    // indicatorId contains the Series Code (e.g., 'NY.GNP.PCAP.CD')
                    if (seriesCode !== indicatorId) {
                        continue; // Skip rows that don't match the requested indicator
                    }
                }

                // For IHME data, check if this row matches the requested measure
                if (isIHME) {
                    const measureName = rowData['measure_name'];
                    const ageName = rowData['age_name'];
                    const sexName = rowData['sex_name'];
                    const metricName = rowData['metric_name'];
                    const causeName = rowData['cause_name'];
                    const reiName = rowData['rei_name'];

                    // indicatorId contains the measure name (e.g., 'Deaths', 'DALYs (Disability-Adjusted Life Years)')
                    if (measureName !== indicatorId) {
                        continue; // Skip rows that don't match the requested measure
                    }

                    // For life expectancy and HALE: use "0-6 days" age (at birth), "Years" metric
                    // These measures don't have cause_name or rei_name populated
                    if (measureName === 'Life expectancy' || measureName === 'HALE (Healthy life expectancy)') {
                        if (ageName !== '0-6 days' || sexName !== 'Both' || metricName !== 'Years') {
                            continue;
                        }
                        // Skip rows with any cause or risk factor
                        if (causeName || reiName) {
                            continue;
                        }
                    }
                    // For all other measures: "All ages", "Both sexes", "All causes", no risk factor, "Rate" metric
                    else {
                        // Only include "All causes" and no specific risk factor (empty reiName = total)
                        if (causeName !== 'All causes') {
                            continue;
                        }
                        if (reiName) {  // Skip any row with a risk factor (we want total only)
                            continue;
                        }
                        // Only include aggregate data: All ages, Both sexes
                        if (ageName !== 'All ages' || sexName !== 'Both') {
                            continue;
                        }
                        // Must use "Rate" metric
                        if (metricName !== 'Rate') {
                            continue;
                        }
                    }
                }

                // Extract value based on data type
                let value = null;

                if (isWHO) {
                    // WHO format: check if row matches the year in DIM_TIME
                    const rowYear = rowData['DIM_TIME'];
                    if (rowYear == year) {
                        // Try different value columns
                        value = extractValueFromRow(rowData, [
                            'PERCENT_POP_N', 'Value', 'Numeric', 'VALUE',
                            'Rate', 'RATE', 'Prevalence', 'Incidence',
                            'RATE_PER_100000_N', 'RATE_PER_10000_N', 'RATE_PER_1000_N',
                            'RATE_PER_100_N', 'RATE_PER_CAPITA_N', 'RATE_N',
                            'INDEX_N', 'COUNT_N', 'AMOUNT_N'
                        ]);
                    }
                } else if (isWorldBank) {
                    // World Bank format: year is in column header
                    const yearColumn = `${year} [YR${year}]`;
                    const rawValue = rowData[yearColumn];
                    // Handle ".." as missing data
                    if (rawValue && rawValue !== '..' && rawValue !== '') {
                        value = parseFloat(rawValue);
                    }
                } else if (isIHME) {
                    // IHME format: year is in 'year' column, value in 'val' column
                    const rowYear = rowData['year'];
                    if (rowYear == year) {
                        const rawValue = rowData['val'];
                        if (rawValue && rawValue !== '' && rawValue !== 'N/A') {
                            value = parseFloat(rawValue);
                        }
                    }
                }

                if (value !== null && !isNaN(value)) {
                    data.push({
                        country: countryName,
                        value: value,
                        rowData: rowData
                    });
                }
            }

            console.log(`Found ${data.length} data points for year ${year}`);
            return data;
        }

        // Fallback to loading CSV directly
        console.log(`Compiled data not available for ${fileName}, falling back to CSV loading`);
        const response = await fetch(`Portfolios/${fileName}`);
        const csvText = await response.text();

        // Parse CSV with proper handling
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = parseCSVLine(lines[0]);

        const data = [];
        const targetCountries = categoriesData.countries.map(c => c.name);

        // Determine CSV type
        const isWHO = headers.includes('GEO_NAME_SHORT') || headers.includes('DIM_TIME');
        const isWorldBank = headers.includes('Country Name') && headers.some(h => h.includes('[YR'));

        console.log(`Loading ${fileName}: ${isWHO ? 'WHO' : isWorldBank ? 'World Bank' : 'Unknown'} format`);

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length < 2) continue;

            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = values[index] || '';
            });

            // Get country name
            const countryName = rowData['Country Name'] || rowData['GEO_NAME_SHORT'];
            if (!countryName || !targetCountries.includes(countryName)) continue;

            // For World Bank data, check if this row matches the requested indicator
            if (isWorldBank) {
                const seriesCode = rowData['Series Code'];
                // indicatorId contains the Series Code (e.g., 'NY.GNP.PCAP.CD')
                if (seriesCode !== indicatorId) {
                    continue; // Skip rows that don't match the requested indicator
                }
            }

            // Extract value based on CSV type
            let value = null;

            if (isWHO) {
                // WHO format: check if row matches the year in DIM_TIME
                const rowYear = rowData['DIM_TIME'];
                if (rowYear == year) {
                    // Try different value columns
                    value = extractValueFromRow(rowData, [
                        'PERCENT_POP_N', 'Value', 'Numeric', 'VALUE',
                        'Rate', 'RATE', 'Prevalence', 'Incidence',
                        'RATE_PER_100000_N', 'RATE_PER_10000_N', 'RATE_PER_1000_N',
                        'RATE_PER_100_N', 'RATE_PER_CAPITA_N', 'RATE_N',
                        'INDEX_N', 'COUNT_N', 'AMOUNT_N'
                    ]);
                }
            } else if (isWorldBank) {
                // World Bank format: year is in column header
                const yearColumn = `${year} [YR${year}]`;
                const rawValue = rowData[yearColumn];
                // Handle ".." as missing data
                if (rawValue && rawValue !== '..' && rawValue !== '') {
                    value = parseFloat(rawValue);
                }
            }

            if (value !== null && !isNaN(value)) {
                data.push({
                    country: countryName,
                    value: value,
                    rowData: rowData
                });
            }
        }

        console.log(`Found ${data.length} data points for year ${year}`);
        return data;

    } catch (error) {
        console.error('Error parsing data:', error);
        throw error;
    }
}

// Extract value from row trying multiple column names
function extractValueFromRow(rowData, possibleColumns) {
    for (let col of possibleColumns) {
        const val = rowData[col];
        if (val && val !== '..' && val !== '' && val !== 'N/A') {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) {
                return parsed;
            }
        }
    }
    return null;
}

// Clear existing map data
function clearMapData() {
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentOverlays.forEach(overlay => map.removeLayer(overlay));
    currentMarkers = [];
    currentOverlays = [];
}

// Clear all map data and close country profile panel
function clearAllMapData() {
    clearMapData();
    closeCountryProfile();
    closeDataList();
    console.log('Map cleared');
}

// Display data on map using polygons
function displayDataOnMap(data, indicatorName, unit) {
    if (!countriesGeoJSON) {
        console.error('Countries GeoJSON not loaded yet');
        return;
    }

    console.log(`displayDataOnMap called with ${data.length} items`);

    // Calculate value ranges for color coding
    const values = data.map(d => d.value).filter(v => !isNaN(v));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    console.log(`Value range: ${minValue} to ${maxValue}`);

    let displayedCount = 0;
    let notFoundCount = 0;

    data.forEach(item => {
        const feature = getCountryPolygon(item.country);

        if (feature && !isNaN(item.value)) {
            const color = getColorForValue(item.value, minValue, maxValue);

            // Create polygon layer with red styling
            // fillOpacity: 0.5 = 50% transparent fill
            // White border for clear separation between countries
            const polygon = L.geoJSON(feature, {
                style: function(feature) {
                    return {
                        fillColor: '#DC2626',
                        fillOpacity: 0.5,
                        color: '#FFFFFF',
                        weight: 2,
                        opacity: 1,
                        fill: true
                    };
                }
            }).addTo(map);

            polygon.bindPopup(`
                <strong>${item.country}</strong><br>
                ${indicatorName}: <strong>${formatNumber(item.value)} ${unit}</strong>
            `);

            currentOverlays.push(polygon);
            displayedCount++;
        } else if (!feature) {
            notFoundCount++;
            console.log(`Country not found in GeoJSON: ${item.country}`);
        }
    });

    console.log(`Displayed ${displayedCount} polygons, ${notFoundCount} countries not found`);
}

// Get color based on value (gradient from green to red)
function getColorForValue(value, min, max) {
    const normalized = (value - min) / (max - min);

    // Gradient from green (low) to yellow to red (high)
    if (normalized < 0.5) {
        const r = Math.round(255 * (normalized * 2));
        return `rgb(${r}, 255, 0)`;
    } else {
        const g = Math.round(255 * (1 - ((normalized - 0.5) * 2)));
        return `rgb(255, ${g}, 0)`;
    }
}

// Show legend
function showLegend(indicatorName, unit, data) {
    // Legend disabled per user request
    // const legend = document.getElementById('legend');
    // legend.classList.add('hidden');
}

// Country coordinates (approximate center points)
function getCountryCoordinates() {
    return {
        'Afghanistan': [33.9391, 67.7100],
        'Bangladesh': [23.6850, 90.3563],
        'Burkina Faso': [12.2383, -1.5616],
        'Cameroon': [7.3697, 12.3547],
        'Central African Republic': [6.6111, 20.9394],
        'Chad': [15.4542, 18.7322],
        'Colombia': [4.5709, -74.2973],
        'Congo DR': [-4.0383, 21.7587],
        'Ethiopia': [9.1450, 40.4897],
        'Haiti': [18.9712, -72.2852],
        'Lebanon': [33.8547, 35.8623],
        'Mali': [17.5707, -3.9962],
        'Mozambique': [-18.6657, 35.5296],
        'Myanmar': [21.9162, 95.9560],
        'Niger': [17.6078, 8.0817],
        'Nigeria': [9.0820, 8.6753],
        'Pakistan': [30.3753, 69.3451],
        'Somalia': [5.1521, 46.1996],
        'South Sudan': [6.8770, 31.3070],
        'Sudan': [12.8628, 30.2176],
        'Syria': [34.8021, 38.9968],
        'Uganda': [1.3733, 32.2903],
        'Ukraine': [48.3794, 31.1656],
        'Venezuela': [6.4238, -66.5897],
        'Yemen': [15.5527, 48.5164]
    };
}

// Load DREF data from IFRC API
async function loadDREFData() {
    try {
        // Check cache first
        const now = Date.now();
        if (cachedDrefData && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
            console.log('Using cached DREF data');
            return cachedDrefData;
        }

        console.log('Fetching fresh DREF data from API...');
        const response = await fetch(DREF_API_URL, {
            headers: {
                'Authorization': `Token ${IFRC_API_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log(`DREF API Response: ${data.results?.length || 0} active DREFs loaded`);

        // Filter for the 25 target countries
        const targetCountries = categoriesData.countries.map(c => c.name);
        const targetISO3Codes = ['AFG', 'BGD', 'BFA', 'CMR', 'CAF', 'TCD', 'COL', 'COD',
                                 'ETH', 'HTI', 'LBN', 'MLI', 'MOZ', 'MMR', 'NER', 'NGA',
                                 'PAK', 'SOM', 'SSD', 'SDN', 'SYR', 'UGA', 'UKR', 'VEN', 'YEM'];

        const drefs = data.results || [];
        const filteredDrefs = drefs.filter(dref => {
            const countryName = dref.country?.name || dref.country_details?.name;
            const countryISO3 = dref.country?.iso3 || dref.country_details?.iso3;
            return targetCountries.includes(countryName) || targetISO3Codes.includes(countryISO3);
        });

        console.log(`Found ${filteredDrefs.length} active DREFs in target countries`);

        // Cache the results
        cachedDrefData = filteredDrefs;
        cacheTimestamp = now;

        return filteredDrefs;

    } catch (error) {
        console.error('Error loading DREF data:', error);
        throw error;
    }
}

// Display DREF data on map with red cross icons
function displayDREFOnMap(drefs) {
    const countryCoordinates = getCountryCoordinates();

    drefs.forEach(dref => {
        const countryName = dref.country?.name || dref.country_details?.name;
        const coords = countryCoordinates[countryName];

        if (coords) {
            // Create red cross icon (same style as ERU markers)
            const redCrossIcon = L.divIcon({
                html: `<div style="
                    background-color: white;
                    color: #dc2626;
                    width: 24px;
                    height: 24px;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    border: 2px solid #dc2626;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">✚</div>`,
                className: 'dref-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            // Format dates
            const startDate = dref.start_date ? new Date(dref.start_date).toLocaleDateString() : 'N/A';
            const endDate = dref.end_date ? new Date(dref.end_date).toLocaleDateString() : 'Ongoing';

            // Format amount
            const amount = dref.amount_requested ?
                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CHF' }).format(dref.amount_requested) :
                'N/A';

            // Create popup content
            const popupContent = `
                <div style="min-width: 200px;">
                    <strong style="color: #dc2626; font-size: 14px;">DREF Operation</strong><br>
                    <strong>Country:</strong> ${countryName}<br>
                    <strong>Name:</strong> ${dref.name || 'N/A'}<br>
                    <strong>Type:</strong> ${dref.dtype?.name || 'N/A'}<br>
                    <strong>Amount:</strong> ${amount}<br>
                    <strong>Start Date:</strong> ${startDate}<br>
                    <strong>End Date:</strong> ${endDate}<br>
                    ${dref.code ? `<strong>Code:</strong> ${dref.code}<br>` : ''}
                </div>
            `;

            const marker = L.marker(coords, { icon: redCrossIcon })
                .bindPopup(popupContent)
                .addTo(map);

            currentMarkers.push(marker);
        } else {
            console.warn(`No coordinates found for country: ${countryName}`);
        }
    });

    console.log(`Displayed ${currentMarkers.length} DREF markers on map`);
}

// Show DREF legend
function showDREFLegend(count) {
    // Legend disabled per user request
}

// Load past DREF data from IFRC API (last 5 years)
async function loadPastDREFData() {
    try {
        // Check cache first
        const now = Date.now();
        if (cachedPastDrefData && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
            console.log('Using cached past DREF data');
            return cachedPastDrefData;
        }

        console.log('Fetching fresh past DREF data from API...');

        // First request to get total count and determine number of pages
        const firstResponse = await fetch(PAST_DREF_API_URL, {
            headers: {
                'Authorization': `Token ${IFRC_API_TOKEN}`
            }
        });

        if (!firstResponse.ok) {
            throw new Error(`API request failed: ${firstResponse.status}`);
        }

        const firstData = await firstResponse.json();
        const totalCount = firstData.count;
        const pageSize = 500;
        const totalPages = Math.ceil(totalCount / pageSize);

        console.log(`Total DREFs: ${totalCount}, Pages needed: ${totalPages}`);

        // Build array of all page URLs
        const pageUrls = [];
        for (let i = 0; i < Math.min(totalPages, 10); i++) { // Limit to 10 pages (5000 records) for safety
            const offset = i * pageSize;
            pageUrls.push(`${PAST_DREF_API_URL}&offset=${offset}`);
        }

        // Fetch all pages in parallel (batches of 3 to avoid overwhelming the server)
        const batchSize = 3;
        let allDrefs = firstData.results || [];

        for (let i = 1; i < pageUrls.length; i += batchSize) {
            const batch = pageUrls.slice(i, i + batchSize);
            console.log(`Fetching pages ${i + 1}-${Math.min(i + batchSize, pageUrls.length)} in parallel...`);

            const batchResults = await Promise.all(
                batch.map(url =>
                    fetch(url, {
                        headers: { 'Authorization': `Token ${IFRC_API_TOKEN}` }
                    }).then(r => r.json())
                )
            );

            batchResults.forEach(data => {
                if (data.results) {
                    allDrefs = allDrefs.concat(data.results);
                }
            });
        }

        console.log(`Fetched total of ${allDrefs.length} DREFs`);

        // Calculate date 5 years ago
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

        // Filter for the 25 target countries and last 5 years
        const targetCountries = categoriesData.countries.map(c => c.name);
        const targetISO3Codes = ['AFG', 'BGD', 'BFA', 'CMR', 'CAF', 'TCD', 'COL', 'COD',
                                 'ETH', 'HTI', 'LBN', 'MLI', 'MOZ', 'MMR', 'NER', 'NGA',
                                 'PAK', 'SOM', 'SSD', 'SDN', 'SYR', 'UGA', 'UKR', 'VEN', 'YEM'];

        const filteredDrefs = allDrefs.filter(dref => {
            const countryName = dref.country?.name || dref.country_details?.name;
            const countryISO3 = dref.country?.iso3 || dref.country_details?.iso3;
            const startDate = dref.start_date ? new Date(dref.start_date) : null;

            // Check if in target countries
            const isTargetCountry = targetCountries.includes(countryName) || targetISO3Codes.includes(countryISO3);

            // Check if started within last 5 years
            const isWithinLastFiveYears = startDate && startDate >= fiveYearsAgo;

            // Include ALL DREFs from last 5 years (both active and past)
            // We want to show all DREFs that started in the last 5 years
            return isTargetCountry && isWithinLastFiveYears;
        });

        console.log(`Found ${filteredDrefs.length} DREFs in target countries from last 5 years`);
        console.log(`Date range: ${fiveYearsAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`);

        // Cache the results
        cachedPastDrefData = filteredDrefs;
        cacheTimestamp = now;

        return filteredDrefs;

    } catch (error) {
        console.error('Error loading past DREF data:', error);
        throw error;
    }
}

// Display past DREF data on map grouped by country
function displayPastDREFOnMap(drefs) {
    const countryCoordinates = getCountryCoordinates();

    // Group DREFs by country
    const drefsByCountry = {};
    drefs.forEach(dref => {
        const countryName = dref.country?.name || dref.country_details?.name;
        if (!drefsByCountry[countryName]) {
            drefsByCountry[countryName] = [];
        }
        drefsByCountry[countryName].push(dref);
    });

    // Display markers with count
    Object.keys(drefsByCountry).forEach(countryName => {
        const coords = countryCoordinates[countryName];
        const countryDrefs = drefsByCountry[countryName];

        if (coords) {
            // Create badge icon with count
            const count = countryDrefs.length;
            const badgeIcon = L.divIcon({
                html: `<div style="
                    background-color: #dc2626;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                ">${count}</div>`,
                className: 'past-dref-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            // Create popup content with list of all DREFs
            let popupContent = `
                <div style="min-width: 250px; max-height: 400px; overflow-y: auto;">
                    <strong style="color: #dc2626; font-size: 15px;">${countryName}</strong><br>
                    <strong>Past DREFs (Last 5 Years): ${count}</strong><br><br>
            `;

            // Sort by start date (most recent first)
            countryDrefs.sort((a, b) => {
                const dateA = new Date(a.start_date || 0);
                const dateB = new Date(b.start_date || 0);
                return dateB - dateA;
            });

            countryDrefs.forEach((dref, index) => {
                const startDate = dref.start_date ? new Date(dref.start_date).toLocaleDateString() : 'N/A';
                const endDate = dref.end_date ? new Date(dref.end_date).toLocaleDateString() : 'Ongoing';
                const amount = dref.amount_requested ?
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CHF' }).format(dref.amount_requested) :
                    'N/A';
                const status = dref.status_display || 'N/A';

                popupContent += `
                    <div style="border-left: 3px solid #dc2626; padding-left: 8px; margin-bottom: 12px;">
                        <strong>${index + 1}. ${dref.name || 'DREF Operation'}</strong><br>
                        <span style="font-size: 12px;">
                        <strong>Type:</strong> ${dref.dtype?.name || 'N/A'}<br>
                        <strong>Status:</strong> ${status}<br>
                        <strong>Amount:</strong> ${amount}<br>
                        <strong>Period:</strong> ${startDate} - ${endDate}<br>
                        ${dref.code ? `<strong>Code:</strong> ${dref.code}<br>` : ''}
                        </span>
                    </div>
                `;
            });

            popupContent += '</div>';

            const marker = L.marker(coords, { icon: badgeIcon })
                .bindPopup(popupContent, {
                    maxWidth: 300,
                    maxHeight: 400
                })
                .addTo(map);

            currentMarkers.push(marker);
        } else {
            console.warn(`No coordinates found for country: ${countryName}`);
        }
    });

    console.log(`Displayed ${currentMarkers.length} country markers for past DREFs`);
}

// Show past DREF legend
function showPastDREFLegend(drefs) {
    // Legend disabled per user request
}

// Load country profile - aggregate all indicators for a country
async function loadCountryProfile(countryName, countryCode) {
    const profilePanel = document.getElementById('country-profile-panel');
    const profileTitle = document.getElementById('country-profile-title');
    const profileContent = document.getElementById('country-profile-content');

    profileTitle.textContent = `${countryName} - Country Profile`;
    profileContent.innerHTML = '<p>Loading all indicators...</p>';
    profilePanel.classList.remove('hidden');

    // Highlight country on map with polygon
    // fillOpacity: 0.5 = 50% transparent fill
    // White border for clear separation
    const feature = getCountryPolygon(countryName);
    if (feature) {
        const polygon = L.geoJSON(feature, {
            style: function(feature) {
                return {
                    fillColor: '#DC2626',
                    fillOpacity: 0.5,
                    color: '#FFFFFF',
                    weight: 2,
                    opacity: 1,
                    fill: true
                };
            }
        }).addTo(map);

        // Zoom to country bounds
        map.fitBounds(polygon.getBounds());
        currentOverlays.push(polygon);
    }

    try {
        const years = [2023, 2022, 2021, 2020, 2019];
        const indicatorsByCategory = {};

        // Iterate through all categories and indicators
        for (const category of categoriesData.categories) {
            if (category.id === 'country_view' || category.id === 'dref' || category.id === 'disasters') continue;

            indicatorsByCategory[category.name] = [];

            for (const indicator of category.indicators) {
                // Try to get data for most recent available year
                let foundData = null;

                for (const year of years) {
                    try {
                        const data = await loadDataFile(indicator.file, indicator.id, year);
                        const countryData = data.find(d => d.country === countryName);

                        if (countryData && countryData.value !== null) {
                            foundData = {
                                name: indicator.name,
                                value: countryData.value,
                                unit: indicator.unit,
                                year: year
                            };
                            break;
                        }
                    } catch (e) {
                        // Skip if error
                        continue;
                    }
                }

                if (foundData) {
                    indicatorsByCategory[category.name].push(foundData);
                }
            }
        }

        // Display the profile
        displayCountryProfile(countryName, indicatorsByCategory);

    } catch (error) {
        console.error('Error loading country profile:', error);
        profileContent.innerHTML = '<p style="color: red;">Error loading country profile. Please try again.</p>';
    }
}

// Display country profile in panel
function displayCountryProfile(countryName, indicatorsByCategory) {
    const profileContent = document.getElementById('country-profile-content');

    let html = '';
    let totalIndicators = 0;

    for (const [categoryName, indicators] of Object.entries(indicatorsByCategory)) {
        if (indicators.length === 0) continue;

        totalIndicators += indicators.length;

        html += `
            <div class="indicator-category-section">
                <h4>${categoryName}</h4>
        `;

        indicators.forEach(indicator => {
            const displayValue = typeof indicator.value === 'number' ?
                formatNumber(indicator.value) : indicator.value;

            html += `
                <div class="indicator-item">
                    <span class="indicator-name">${indicator.name}</span>
                    <span class="indicator-value">${displayValue} ${indicator.unit} (${indicator.year})</span>
                </div>
            `;
        });

        html += '</div>';
    }

    if (totalIndicators === 0) {
        html = `<p class="no-data">No indicator data available for ${countryName}</p>`;
    } else {
        html = `<p style="margin-bottom: 20px; font-weight: 600; color: #8B0000;">
            Found ${totalIndicators} indicators with data
        </p>` + html;
    }

    profileContent.innerHTML = html;
}

// Close country profile panel
function closeCountryProfile() {
    const profilePanel = document.getElementById('country-profile-panel');
    profilePanel.classList.add('hidden');
}

// Get country polygon from GeoJSON
// Returns a FeatureCollection containing all matching features (e.g., Somalia + Somaliland)
function getCountryPolygon(countryName) {
    if (!countriesGeoJSON) return null;

    // Name mappings for matching
    const nameMap = {
        'Congo DR': 'Democratic Republic of the Congo',
        'Central Africa Republic': 'Central African Republic',
        'Syrian Arab Republic': 'Syria'
    };

    const searchName = nameMap[countryName] || countryName;

    // Collect all matching features
    const matchingFeatures = countriesGeoJSON.features.filter(f => {
        const name = f.properties.ADMIN || f.properties.NAME;
        return name === searchName ||
               (countryName === 'Congo DR' && (name === 'Dem. Rep. Congo' || name.includes('Congo') && name.includes('Democratic'))) ||
               (countryName === 'Syria' && (name === 'Syria' || name === 'Syrian Arab Republic')) ||
               (countryName === 'Somalia' && name === 'Somaliland'); // Include Somaliland as part of Somalia
    });

    // Return null if no matches found
    if (matchingFeatures.length === 0) return null;

    // Return as FeatureCollection to support multiple polygons (e.g., Somalia + Somaliland)
    return {
        type: 'FeatureCollection',
        features: matchingFeatures
    };
}

// Load time series data for all years
async function loadTimeSeriesData() {
    if (!currentIndicatorData) {
        alert('Please load an indicator first.');
        return null;
    }

    const { indicatorId, dataFile, unit } = currentIndicatorData;
    const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
    const timeSeriesData = {};

    console.log('Loading time series data...');

    // Load data for each year
    for (const year of years) {
        try {
            const data = await loadDataFile(dataFile, indicatorId, year);

            if (data && data.length > 0) {
                data.forEach(item => {
                    if (!timeSeriesData[item.country]) {
                        timeSeriesData[item.country] = {};
                    }
                    timeSeriesData[item.country][year] = item.value;
                });
            }
        } catch (e) {
            console.log(`No data for year ${year}`);
        }
    }

    return { years, timeSeriesData, unit };
}

// Show time series chart
async function showTimeSeriesChart() {
    const chartPanel = document.getElementById('chart-panel');
    const chartTitle = document.getElementById('chart-title');
    const categorySelect = document.getElementById('category-select');
    const indicatorSelect = document.getElementById('indicator-select');

    // If no indicator data stored yet, get it from the UI
    if (!currentIndicatorData) {
        const categoryId = categorySelect.value;
        const indicatorId = indicatorSelect.value;

        if (!categoryId || !indicatorId) {
            alert('Please select a category and indicator first.');
            return;
        }

        const selectedOption = indicatorSelect.options[indicatorSelect.selectedIndex];
        const dataFile = selectedOption.dataset.file;
        const indicatorName = selectedOption.textContent;
        const unit = selectedOption.dataset.unit;

        // Store current indicator data
        currentIndicatorData = {
            indicatorId: indicatorId,
            indicatorName: indicatorName,
            dataFile: dataFile,
            unit: unit
        };
    }

    chartTitle.textContent = `${currentIndicatorData.indicatorName} - Time Trend`;
    chartPanel.classList.remove('hidden');

    // Load time series data
    const result = await loadTimeSeriesData();

    if (!result) {
        return;
    }

    const { years, timeSeriesData, unit } = result;

    // Populate country filter dropdown
    const countryFilter = document.getElementById('country-filter');
    countryFilter.innerHTML = '<option value="all">All Countries</option>';

    const countriesWithData = Object.keys(timeSeriesData).sort();
    countriesWithData.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        option.selected = true; // Select all by default
        countryFilter.appendChild(option);
    });

    // Store time series data globally for filtering
    window.currentTimeSeriesData = { years, timeSeriesData, unit };

    // Initialize disaster events toggle
    const disasterToggle = document.getElementById('disaster-events-toggle');
    const showDisastersCheckbox = document.getElementById('show-disasters-checkbox');
    showDisastersCheckbox.checked = false;

    // Apply initial filter logic to show/hide disaster toggle appropriately
    updateChartWithFilter();

    console.log(`Time series chart created with ${countriesWithData.length} countries`);
}

// Create or update the time series chart
function createTimeSeriesChart(years, timeSeriesData, unit, selectedCountries) {
    // Prepare data for Chart.js
    const datasets = [];
    const colors = [
        '#DC2626', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0',
        '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#E91E63',
        '#3F51B5', '#8BC34A', '#FF5722', '#009688', '#FFC107',
        '#673AB7', '#CDDC39', '#F44336', '#03A9F4', '#8E24AA',
        '#00897B', '#FFA726', '#5C6BC0', '#7CB342', '#D32F2F'
    ];

    let colorIndex = 0;
    const allCountries = Object.keys(timeSeriesData).sort();

    for (const country of allCountries) {
        // Skip countries not in selected list
        if (!selectedCountries.includes(country)) {
            continue;
        }

        const yearData = timeSeriesData[country];
        // Convert to {x, y} coordinate pairs for linear scale
        const dataPoints = years.map(year => ({
            x: year,
            y: yearData[year] || null
        }));

        // Only add countries that have at least one data point
        if (dataPoints.some(point => point.y !== null)) {
            datasets.push({
                label: country,
                data: dataPoints,
                borderColor: colors[colorIndex % colors.length],
                backgroundColor: colors[colorIndex % colors.length],
                borderWidth: 2,
                tension: 0.1,
                spanGaps: true // Connect lines even if there are gaps
            });
            colorIndex++;
        }
    }

    // Destroy existing chart if it exists
    if (timeSeriesChart) {
        timeSeriesChart.destroy();
    }

    // Get disaster event annotations
    const annotations = getDisasterEventAnnotations();
    console.log('Creating chart with annotations:', annotations);
    console.log('Number of annotations:', Object.keys(annotations).length);

    // Create new chart
    const ctx = document.getElementById('time-series-chart').getContext('2d');
    timeSeriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 20
                }
            },
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'right',
                    align: 'start',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatNumber(context.parsed.y) + ' ' + unit;
                            }
                            return label;
                        }
                    }
                },
                annotation: {
                    annotations: annotations
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Year'
                    },
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Math.floor(value); // Show only integer years
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `${currentIndicatorData.indicatorName} (${unit})`
                    },
                    beginAtZero: false
                }
            }
        }
    });

    console.log('Chart created successfully');
    console.log('Chart plugins config:', timeSeriesChart.options.plugins);
    console.log('Chart annotation config:', timeSeriesChart.options.plugins.annotation);
}

// Update chart when country filter changes
function updateChartWithFilter() {
    if (!window.currentTimeSeriesData) {
        return;
    }

    const countryFilter = document.getElementById('country-filter');
    const selectedOptions = Array.from(countryFilter.selectedOptions);
    const selectedValues = selectedOptions.map(opt => opt.value);

    // Show/hide disaster events toggle based on selection
    const disasterToggle = document.getElementById('disaster-events-toggle');
    const showDisastersCheckbox = document.getElementById('show-disasters-checkbox');

    // If "All Countries" is selected AND it's the ONLY selection (or with all others), show all
    let selectedCountries;
    const allCountriesOption = selectedValues.includes('all');
    const onlyAllCountriesSelected = allCountriesOption && selectedValues.length === 1;

    if (onlyAllCountriesSelected) {
        // User explicitly selected only "All Countries"
        selectedCountries = Object.keys(window.currentTimeSeriesData.timeSeriesData);
        // Hide disaster events option for "All Countries"
        disasterToggle.style.display = 'none';
        if (showDisastersCheckbox.checked) {
            showDisastersCheckbox.checked = false;
            chartDisasterEvents = {}; // Clear cache
        }
    } else if (allCountriesOption && selectedValues.length > 1) {
        // "All Countries" is selected along with specific countries - use specific countries only
        selectedCountries = selectedValues.filter(v => v !== 'all');
        // Show disaster events option for specific countries
        disasterToggle.style.display = 'block';
    } else {
        // Only specific countries selected
        selectedCountries = selectedValues;
        // Show disaster events option for specific countries
        if (selectedCountries.length > 0) {
            disasterToggle.style.display = 'block';
        } else {
            disasterToggle.style.display = 'none';
            if (showDisastersCheckbox.checked) {
                showDisastersCheckbox.checked = false;
                chartDisasterEvents = {};
            }
        }
    }

    const { years, timeSeriesData, unit } = window.currentTimeSeriesData;
    createTimeSeriesChart(years, timeSeriesData, unit, selectedCountries);
}

// Select all countries
function selectAllCountries() {
    const countryFilter = document.getElementById('country-filter');
    for (let i = 0; i < countryFilter.options.length; i++) {
        countryFilter.options[i].selected = true;
    }
    updateChartWithFilter();
}

// Deselect all countries
function deselectAllCountries() {
    const countryFilter = document.getElementById('country-filter');
    for (let i = 0; i < countryFilter.options.length; i++) {
        countryFilter.options[i].selected = false;
    }
    updateChartWithFilter();
}

// Close chart panel
function closeChart() {
    const chartPanel = document.getElementById('chart-panel');
    chartPanel.classList.add('hidden');

    if (timeSeriesChart) {
        timeSeriesChart.destroy();
        timeSeriesChart = null;
    }

    // Clear disaster events cache when closing chart
    chartDisasterEvents = {};
}

// Toggle disaster events on time series chart
async function toggleDisasterEvents() {
    const checkbox = document.getElementById('show-disasters-checkbox');
    const isChecked = checkbox.checked;

    console.log('toggleDisasterEvents called, checked:', isChecked);

    if (!window.currentTimeSeriesData) {
        console.log('No time series data available');
        return;
    }

    if (isChecked) {
        // Load disaster events for countries in chart
        showLoading('Loading disaster events...');
        console.log('Loading disaster events for chart...');
        await loadDisasterEventsForChart();
        console.log('Disaster events loaded, cache:', chartDisasterEvents);
        hideLoading();
    } else {
        console.log('Disaster events unchecked, clearing annotations');
    }

    // Redraw chart with or without disaster events
    console.log('Redrawing chart with filter...');
    updateChartWithFilter();
}

// Load disaster events for countries shown in the chart
async function loadDisasterEventsForChart() {
    if (!window.currentTimeSeriesData) return;

    const countryFilter = document.getElementById('country-filter');
    const selectedOptions = Array.from(countryFilter.selectedOptions);
    const selectedValues = selectedOptions.map(opt => opt.value);

    // Get list of countries to load events for
    let selectedCountries;
    if (selectedValues.includes('all')) {
        selectedCountries = Object.keys(window.currentTimeSeriesData.timeSeriesData);
    } else {
        selectedCountries = selectedValues;
    }

    // Map country names to ISO3 codes
    const countryToISO3 = {
        'Afghanistan': 'AFG', 'Bangladesh': 'BGD', 'Burkina Faso': 'BFA',
        'Cameroon': 'CMR', 'Central African Republic': 'CAF', 'Chad': 'TCD',
        'Colombia': 'COL', 'Congo DR': 'COD', 'Ethiopia': 'ETH',
        'Haiti': 'HTI', 'Lebanon': 'LBN', 'Mali': 'MLI',
        'Mozambique': 'MOZ', 'Myanmar': 'MMR', 'Niger': 'NER',
        'Nigeria': 'NGA', 'Pakistan': 'PAK', 'Somalia': 'SOM',
        'South Sudan': 'SSD', 'Sudan': 'SDN', 'Syria': 'SYR',
        'Uganda': 'UGA', 'Ukraine': 'UKR', 'Venezuela': 'VEN', 'Yemen': 'YEM'
    };

    // Load events for each country in parallel
    const loadPromises = selectedCountries.map(async (countryName) => {
        const iso3 = countryToISO3[countryName];
        if (!iso3) return;

        // Check if already loaded
        if (chartDisasterEvents[iso3]) return;

        try {
            // Load GDACS and EM-DAT events
            const [gdacsEvents, emdatEvents] = await Promise.all([
                loadGDACSDisasterData(),
                loadEmdatData(iso3)
            ]);

            // Filter GDACS events for this country
            const countryGdacsEvents = gdacsEvents.filter(event => {
                return event.properties.iso3 === iso3;
            });

            // Combine both sources
            chartDisasterEvents[iso3] = {
                gdacs: countryGdacsEvents,
                emdat: emdatEvents
            };

            console.log(`Loaded ${countryGdacsEvents.length} GDACS + ${emdatEvents.length} EM-DAT events for ${countryName}`);
        } catch (error) {
            console.error(`Error loading disaster events for ${countryName}:`, error);
            chartDisasterEvents[iso3] = { gdacs: [], emdat: [] };
        }
    });

    await Promise.all(loadPromises);
}

// Get disaster event annotations for Chart.js
function getDisasterEventAnnotations() {
    const checkbox = document.getElementById('show-disasters-checkbox');
    if (!checkbox.checked || !window.currentTimeSeriesData) {
        return {};
    }

    const annotations = {};
    const { years } = window.currentTimeSeriesData;
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    console.log('Creating disaster event annotations...');
    console.log('Year range:', minYear, 'to', maxYear);
    console.log('Disaster events cache:', chartDisasterEvents);

    // Create annotations for each disaster event
    Object.keys(chartDisasterEvents).forEach(iso3 => {
        const events = chartDisasterEvents[iso3];
        if (!events) return;

        // Process GDACS events
        events.gdacs.forEach((event, idx) => {
            const eventDate = new Date(event.properties.fromdate);
            const eventYear = eventDate.getFullYear();
            const eventMonth = eventDate.getMonth(); // 0-11

            // Calculate decimal year position (e.g., June 2018 = 2018.5)
            const xPosition = eventYear + (eventMonth / 12);

            // Only show events within the year range
            if (eventYear >= minYear && eventYear <= maxYear) {
                const annotationKey = `gdacs_${iso3}_${idx}`;

                // Format date for tooltip
                const dateStr = eventDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                // Get event details
                const eventType = event.properties.eventtype || 'Unknown';
                const eventName = event.properties.name || eventType;
                const severity = event.properties.severity || event.properties.alertlevel || 'N/A';

                annotations[annotationKey] = {
                    type: 'label',
                    xScaleID: 'x',
                    yScaleID: 'y',
                    xValue: xPosition,
                    yValue: 'max',
                    content: ['▼'],
                    color: 'rgba(249, 115, 22, 1)',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    yAdjust: -5,
                    callout: {
                        display: true,
                        borderColor: 'rgba(249, 115, 22, 1)',
                        borderWidth: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        position: 'top',
                        margin: 8
                    },
                    // Add tooltip-like label that appears on hover
                    enter: function(ctx) {
                        ctx.element.options.content = [
                            '▼',
                            eventType,
                            dateStr,
                            `Severity: ${severity}`
                        ];
                        ctx.element.options.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                        ctx.element.options.borderColor = 'rgba(249, 115, 22, 1)';
                        ctx.element.options.borderWidth = 1;
                        ctx.element.options.padding = 8;
                        ctx.element.options.color = '#333';
                        ctx.element.options.font.size = 12;
                        return true;
                    },
                    leave: function(ctx) {
                        ctx.element.options.content = ['▼'];
                        ctx.element.options.backgroundColor = undefined;
                        ctx.element.options.borderColor = undefined;
                        ctx.element.options.borderWidth = undefined;
                        ctx.element.options.padding = undefined;
                        ctx.element.options.color = 'rgba(249, 115, 22, 1)';
                        ctx.element.options.font.size = 20;
                        return true;
                    }
                };
                console.log(`Added GDACS annotation: ${annotationKey} at ${xPosition.toFixed(2)} (${eventMonth + 1}/${eventYear})`);
            }
        });

        // Process EM-DAT events
        events.emdat.forEach((event, idx) => {
            const dateStr = event.fromDate || (event.startyear ? `${event.startyear}-01-01` : null);
            if (!dateStr) return;

            const eventDate = new Date(dateStr);
            const eventYear = eventDate.getFullYear();
            const eventMonth = eventDate.getMonth(); // 0-11

            // Calculate decimal year position (e.g., June 2018 = 2018.5)
            const xPosition = eventYear + (eventMonth / 12);

            // Only show events within the year range
            if (eventYear >= minYear && eventYear <= maxYear) {
                const annotationKey = `emdat_${iso3}_${idx}`;

                // Format date for tooltip
                const displayDate = eventDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                // Get event details
                const eventType = event.disastertype || event.disaster_type || 'Unknown';
                const subType = event.disastersubtype || event.disaster_subtype || '';
                const affected = event.totalaffected || event.total_affected || 'N/A';

                annotations[annotationKey] = {
                    type: 'label',
                    xScaleID: 'x',
                    yScaleID: 'y',
                    xValue: xPosition,
                    yValue: 'max',
                    content: ['▼'],
                    color: 'rgba(249, 115, 22, 1)',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    yAdjust: -5,
                    callout: {
                        display: true,
                        borderColor: 'rgba(249, 115, 22, 1)',
                        borderWidth: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        position: 'top',
                        margin: 8
                    },
                    // Add tooltip-like label that appears on hover
                    enter: function(ctx) {
                        const tooltipContent = ['▼', eventType];
                        if (subType) tooltipContent.push(subType);
                        tooltipContent.push(displayDate);
                        if (affected !== 'N/A') tooltipContent.push(`Affected: ${affected}`);

                        ctx.element.options.content = tooltipContent;
                        ctx.element.options.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                        ctx.element.options.borderColor = 'rgba(249, 115, 22, 1)';
                        ctx.element.options.borderWidth = 1;
                        ctx.element.options.padding = 8;
                        ctx.element.options.color = '#333';
                        ctx.element.options.font.size = 12;
                        return true;
                    },
                    leave: function(ctx) {
                        ctx.element.options.content = ['▼'];
                        ctx.element.options.backgroundColor = undefined;
                        ctx.element.options.borderColor = undefined;
                        ctx.element.options.borderWidth = undefined;
                        ctx.element.options.padding = undefined;
                        ctx.element.options.color = 'rgba(249, 115, 22, 1)';
                        ctx.element.options.font.size = 20;
                        return true;
                    }
                };
                console.log(`Added EM-DAT annotation: ${annotationKey} at ${xPosition.toFixed(2)} (${eventMonth + 1}/${eventYear})`);
            }
        });
    });

    console.log(`Total annotations created: ${Object.keys(annotations).length}`);
    return annotations;
}

// Show data list panel
function showDataList(data, indicatorName, unit) {
    const dataListPanel = document.getElementById('data-list-panel');
    const dataListTitle = document.getElementById('data-list-title');
    const dataListContent = document.getElementById('data-list-content');

    // Sort data alphabetically by country name
    const sortedData = [...data].sort((a, b) => a.country.localeCompare(b.country));

    // Update title
    dataListTitle.textContent = indicatorName;

    // Build the list HTML
    let html = '';
    sortedData.forEach(item => {
        html += `
            <div class="data-list-item">
                <span class="data-country-name">${item.country}</span>
                <span class="data-country-value">${formatNumber(item.value)} ${unit}</span>
            </div>
        `;
    });

    dataListContent.innerHTML = html;
    dataListPanel.classList.remove('hidden');
}

// Close data list panel
function closeDataList() {
    const dataListPanel = document.getElementById('data-list-panel');
    dataListPanel.classList.add('hidden');
}

// Helper function to get human-readable event type labels
function getEventTypeLabel(eventType) {
    const eventTypeLabels = {
        'EQ': 'Earthquake',
        'TC': 'Tropical Cyclone',
        'FL': 'Flood',
        'DR': 'Drought',
        'VO': 'Volcano',
        'WF': 'Wildfire',
        'TS': 'Tsunami'
    };
    return eventTypeLabels[eventType] || eventType;
}

// Load EM-DAT data for a specific country
async function loadEmdatData(iso3) {
    console.log(`Fetching EM-DAT data for country ISO3: ${iso3}`);
    try {
        const url = `https://www.gdacs.org/gdacsapi/api/Emdat/getemdatbyiso3?iso3=${iso3}`;
        console.log(`EM-DAT API URL: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`EM-DAT API request failed with status: ${response.status}`);
            throw new Error(`EM-DAT API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log(`EM-DAT API raw response for ${iso3}:`, data);
        console.log(`EM-DAT API returned ${data.length || 0} events for ${iso3}`);

        // Log first event to see structure
        if (data && data.length > 0) {
            console.log('Sample EM-DAT event structure:', data[0]);
            console.log('Available date fields:', {
                fromDate: data[0].fromDate,
                toDate: data[0].toDate,
                startyear: data[0].startyear,
                startmonth: data[0].startmonth,
                startday: data[0].startday
            });
        }

        // Filter events from 2018 onwards to match our timeline
        const startDate = new Date('2018-01-01');
        const filteredEvents = (data || []).filter(event => {
            // Try multiple possible date field names (note: API uses 'fromDate' with capital D)
            const dateStr = event.fromDate || event.start_date || event.eventdate || event.fromdate ||
                           (event.startyear ? `${event.startyear}-01-01` : null) ||
                           (event.year ? `${event.year}-01-01` : null) ||
                           (event.start_year ? `${event.start_year}-01-01` : null);

            const eventDate = dateStr ? new Date(dateStr) : null;
            const isValid = eventDate && eventDate >= startDate;

            if (eventDate) {
                console.log(`EM-DAT event: ${event.disastertype || event.disaster_type || event.eventtype || 'Unknown'}, Date: ${dateStr}, Valid: ${isValid}`);
            } else {
                console.log('EM-DAT event with no valid date:', event);
            }
            return isValid;
        });

        console.log(`Filtered to ${filteredEvents.length} EM-DAT events from 2018 onwards for ${iso3}`);
        return filteredEvents;

    } catch (error) {
        console.error(`Error loading EM-DAT data for ${iso3}:`, error);
        return [];
    }
}

// Load GDACS disaster data
// Note: GDACS API returns the 100 most recent events (~3 years of data)
// No pagination is available, and date parameters are not supported
async function loadGDACSDisasterData() {
    try {
        const response = await fetch(GDACS_API_URL);

        if (!response.ok) {
            throw new Error(`GDACS API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('GDACS API Response:', data);
        console.log(`API returned ${data.features?.length || 0} events (API limit: 100 most recent)`);

        // Calculate date 5 years ago for filtering
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

        // Target country ISO3 codes
        const targetISO3Codes = ['AFG', 'BGD', 'BFA', 'CMR', 'CAF', 'TCD', 'COL', 'COD',
                                 'ETH', 'HTI', 'LBN', 'MLI', 'MOZ', 'MMR', 'NER', 'NGA',
                                 'PAK', 'SOM', 'SSD', 'SDN', 'SYR', 'UGA', 'UKR', 'VEN', 'YEM'];

        const events = data.features || [];

        const filteredEvents = events.filter(event => {
            const properties = event.properties;
            const eventDate = properties.fromdate ? new Date(properties.fromdate) : null;
            const countryISO3 = properties.iso3 || properties.country;

            // Check if in target countries
            const isTargetCountry = targetISO3Codes.includes(countryISO3);

            // Check if within last 5 years
            const isWithinLastFiveYears = eventDate && eventDate >= fiveYearsAgo;

            return isTargetCountry && isWithinLastFiveYears;
        });

        // Find actual date range in the data
        const eventDates = filteredEvents
            .map(e => e.properties.fromdate ? new Date(e.properties.fromdate) : null)
            .filter(d => d !== null)
            .sort((a, b) => a - b);

        const oldestEvent = eventDates[0];
        const newestEvent = eventDates[eventDates.length - 1];

        console.log(`Found ${filteredEvents.length} disaster events in target countries`);
        if (oldestEvent && newestEvent) {
            console.log(`Actual date range in data: ${oldestEvent.toISOString().split('T')[0]} to ${newestEvent.toISOString().split('T')[0]}`);
            console.log(`Coverage: ~${Math.round((newestEvent - oldestEvent) / (365 * 24 * 60 * 60 * 1000) * 10) / 10} years`);
        }

        return filteredEvents;

    } catch (error) {
        console.error('Error loading GDACS disaster data:', error);
        throw error;
    }
}

// Display disaster events on map grouped by country
function displayDisastersOnMap(events) {
    const countryCoordinates = getCountryCoordinates();

    // Create mapping from ISO3 to country names we use
    const iso3ToCountryName = {
        'AFG': 'Afghanistan', 'BGD': 'Bangladesh', 'BFA': 'Burkina Faso',
        'CMR': 'Cameroon', 'CAF': 'Central African Republic', 'TCD': 'Chad',
        'COL': 'Colombia', 'COD': 'Congo DR', 'ETH': 'Ethiopia',
        'HTI': 'Haiti', 'LBN': 'Lebanon', 'MLI': 'Mali',
        'MOZ': 'Mozambique', 'MMR': 'Myanmar', 'NER': 'Niger',
        'NGA': 'Nigeria', 'PAK': 'Pakistan', 'SOM': 'Somalia',
        'SSD': 'South Sudan', 'SDN': 'Sudan', 'SYR': 'Syria',
        'UGA': 'Uganda', 'UKR': 'Ukraine', 'VEN': 'Venezuela', 'YEM': 'Yemen'
    };

    // Group events by country using ISO3 code
    const eventsByCountry = {};
    events.forEach(event => {
        const props = event.properties;
        const countryISO3 = props.iso3;
        const countryName = iso3ToCountryName[countryISO3];

        if (countryName) {
            if (!eventsByCountry[countryName]) {
                eventsByCountry[countryName] = [];
            }
            eventsByCountry[countryName].push(event);
        }
    });

    console.log('Events grouped by country:', Object.keys(eventsByCountry).map(c => `${c}: ${eventsByCountry[c].length}`));

    // Display markers with count
    Object.keys(eventsByCountry).forEach(countryName => {
        const coords = countryCoordinates[countryName];
        const countryEvents = eventsByCountry[countryName];

        if (coords && coords.length === 2) {
            const [lat, lng] = coords;
            // Create badge icon with count
            const count = countryEvents.length;
            const badgeIcon = L.divIcon({
                html: `<div style="
                    background-color: #f97316;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                ">${count}</div>`,
                className: 'disaster-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            // Create popup content with list of all events
            let popupContent = `<div style="min-width: 300px; max-width: 400px;">`;
            popupContent += `<h3 style="margin: 0 0 10px 0; color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 8px;">${countryName}</h3>`;
            popupContent += `<p style="margin: 0 0 12px 0; font-size: 14px;"><strong>Total: ${count} disaster event${count > 1 ? 's' : ''}</strong></p>`;
            popupContent += `<div style="max-height: 350px; overflow-y: auto;">`;

            // Sort by date reverse chronologically (most recent first)
            countryEvents.sort((a, b) => {
                const dateA = new Date(a.properties.fromdate || 0);
                const dateB = new Date(b.properties.fromdate || 0);
                return dateB - dateA; // Descending order (most recent first)
            });

            countryEvents.forEach((event, idx) => {
                const props = event.properties;
                const eventName = props.name || props.eventtype;
                const eventType = props.eventtype || 'Unknown';
                const alertLevel = props.alertlevel || 'Unknown';
                const fromDate = props.fromdate ? new Date(props.fromdate) : null;
                const toDate = props.todate ? new Date(props.todate) : null;

                // Format dates
                const dateStr = fromDate ? fromDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                const toDateStr = toDate ? toDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null;
                const dateRange = toDateStr && toDateStr !== dateStr ? `${dateStr} - ${toDateStr}` : dateStr;

                // Color code alert levels
                const alertColors = {
                    'Red': '#DC2626',
                    'Orange': '#F97316',
                    'Green': '#10B981'
                };
                const alertColor = alertColors[alertLevel] || '#666';

                popupContent += `
                    <div style="padding: 10px; margin-bottom: 8px; ${idx > 0 ? 'border-top: 2px solid #eee;' : ''} background: #f9f9f9; border-radius: 4px;">
                        <div style="font-weight: bold; color: #333; font-size: 13px; margin-bottom: 6px;">${eventName}</div>
                        <div style="font-size: 12px; color: #666;">
                            <div style="margin-bottom: 3px;"><strong>Type:</strong> ${getEventTypeLabel(eventType)}</div>
                            <div style="margin-bottom: 3px;"><strong>Alert Level:</strong> <span style="color: ${alertColor}; font-weight: bold;">${alertLevel}</span></div>
                            <div><strong>Date:</strong> ${dateRange}</div>
                        </div>
                    </div>
                `;
            });

            popupContent += `</div></div>`;

            const marker = L.marker([lat, lng], { icon: badgeIcon })
                .bindPopup(popupContent)
                .addTo(map);

            currentMarkers.push(marker);
        }
    });
}

// Show legend for disaster events
function showDisasterLegend(events) {
    // Group by event type for legend
    const eventTypes = {};
    events.forEach(event => {
        const type = event.properties.eventtype || 'Unknown';
        eventTypes[type] = (eventTypes[type] || 0) + 1;
    });

    let legendContent = `
        <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
            <h4 style="margin: 0 0 10px 0; color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 5px;">Recent Disaster Events</h4>
            <div style="font-size: 13px;">
                <div style="margin-bottom: 8px; font-weight: bold;">Total Events: ${events.length}</div>
    `;

    // Add event types with readable labels
    const sortedTypes = Object.entries(eventTypes).sort((a, b) => b[1] - a[1]);
    sortedTypes.forEach(([type, count]) => {
        const typeLabel = getEventTypeLabel(type);
        legendContent += `<div style="margin: 4px 0; padding-left: 5px;">${typeLabel}: <strong>${count}</strong></div>`;
    });

    legendContent += `
            </div>
        </div>
    `;

    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'legend disaster-legend');
        div.innerHTML = legendContent;
        return div;
    };
    legend.addTo(map);
    currentOverlays.push(legend);
}

// Loading popup functions
function showLoading(message = 'Loading data...') {
    const loadingPopup = document.getElementById('loading-popup');
    const loadingMessage = document.getElementById('loading-message');
    loadingMessage.textContent = message;
    loadingPopup.classList.remove('hidden');
}

function hideLoading() {
    const loadingPopup = document.getElementById('loading-popup');
    loadingPopup.classList.add('hidden');
}

// Close timeline
function closeTimeline(event) {
    console.log('closeTimeline function called', event);

    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const timelineContainer = document.getElementById('timeline-container');
    const tooltip = document.getElementById('timeline-tooltip');

    console.log('Timeline container before:', timelineContainer.className);

    timelineContainer.classList.add('hidden');

    console.log('Timeline container after:', timelineContainer.className);

    if (tooltip) {
        tooltip.classList.add('hidden');
    }

    console.log('Timeline closed - container should be hidden');
}

// Show timeline for a country
async function showCountryTimeline(countryName, countryISO3) {
    const timelineContainer = document.getElementById('timeline-container');
    const timelineTitle = document.getElementById('timeline-title');
    const timelineSvg = document.getElementById('timeline-svg');

    timelineTitle.textContent = `Event Timeline - ${countryName}`;

    // Show timeline
    timelineContainer.classList.remove('hidden');

    // Show loading popup
    showLoading('Loading timeline data...');

    // Fetch disaster events, DREFs, and EM-DAT events for this country
    try {
        const [disasters, drefs, emdatEvents] = await Promise.all([
            loadGDACSDisasterData(),
            loadPastDREFData(),
            loadEmdatData(countryISO3)
        ]);

        // Filter for this country
        const countryDisasters = disasters.filter(event => {
            const props = event.properties;
            return props.iso3 === countryISO3;
        });

        const countryDrefs = drefs.filter(dref => {
            const drefISO3 = dref.country?.iso3 || dref.country_details?.iso3;
            return drefISO3 === countryISO3;
        });

        console.log(`Timeline for ${countryName}: ${countryDisasters.length} GDACS disasters, ${countryDrefs.length} DREFs, ${emdatEvents.length} EM-DAT events`);

        // Draw timeline
        drawTimeline(countryDisasters, countryDrefs, emdatEvents);

        // Hide loading popup
        hideLoading();

    } catch (error) {
        console.error('Error loading timeline data:', error);
        hideLoading();
    }
}

// Draw timeline with events
function drawTimeline(disasters, drefs, emdatEvents = []) {
    const svg = document.getElementById('timeline-svg');
    const container = document.getElementById('timeline-content');
    const width = container.clientWidth;
    const height = 110; // Increased height to show year labels

    // Clear existing content
    svg.innerHTML = '';
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    // Timeline dates: Jan 2018 to Dec 2025
    const startDate = new Date('2018-01-01');
    const endDate = new Date('2025-12-31');
    const timeRange = endDate - startDate;

    // Draw main timeline axis
    const axisY = 60; // Position axis to leave room for markers above and labels below
    const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axisLine.setAttribute('x1', 40);
    axisLine.setAttribute('y1', axisY);
    axisLine.setAttribute('x2', width - 40);
    axisLine.setAttribute('y2', axisY);
    axisLine.setAttribute('stroke', '#666');
    axisLine.setAttribute('stroke-width', '2');
    svg.appendChild(axisLine);

    // Draw year markers
    for (let year = 2018; year <= 2025; year++) {
        const yearDate = new Date(`${year}-01-01`);
        const x = 40 + ((yearDate - startDate) / timeRange) * (width - 80);

        // Year tick
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', x);
        tick.setAttribute('y1', axisY);
        tick.setAttribute('x2', x);
        tick.setAttribute('y2', axisY + 8);
        tick.setAttribute('stroke', '#666');
        tick.setAttribute('stroke-width', '2');
        svg.appendChild(tick);

        // Year label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', axisY + 25);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '13');
        label.setAttribute('font-weight', '600');
        label.setAttribute('fill', '#333');
        label.textContent = year;
        svg.appendChild(label);
    }

    // Y positions for different marker types (DREFs higher, disasters lower)
    const drefY = 20;
    const disasterY = 40;

    // Get tooltip element
    const tooltip = document.getElementById('timeline-tooltip');

    // Draw GDACS disaster events (orange triangles)
    disasters.forEach(event => {
        const eventDate = new Date(event.properties.fromdate);
        if (eventDate >= startDate && eventDate <= endDate) {
            const x = 40 + ((eventDate - startDate) / timeRange) * (width - 80);

            // Create triangle (polygon)
            const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const size = 9;
            // Points for upward-pointing triangle
            const points = `${x},${disasterY - size} ${x - size},${disasterY + size} ${x + size},${disasterY + size}`;
            triangle.setAttribute('points', points);
            triangle.setAttribute('fill', '#f97316');
            triangle.setAttribute('stroke', 'white');
            triangle.setAttribute('stroke-width', '2');
            triangle.style.cursor = 'pointer';

            // Prepare tooltip data
            const eventName = event.properties.name || event.properties.eventtype;
            const eventType = getEventTypeLabel(event.properties.eventtype);
            const alertLevel = event.properties.alertlevel || 'N/A';
            const severity = event.properties.severity || 'N/A';

            // Add click event for tooltip
            triangle.addEventListener('click', (e) => {
                const tooltipContent = `<strong>GDACS DISASTER EVENT</strong>
                    <div><b>Name:</b> ${eventName}</div>
                    <div><b>Type:</b> ${eventType}</div>
                    <div><b>Date:</b> ${eventDate.toLocaleDateString()}</div>
                    <div><b>Alert Level:</b> ${alertLevel}</div>
                    <div><b>Severity:</b> ${severity}</div>`;

                showTimelineTooltip(e, tooltipContent, x);
            });

            svg.appendChild(triangle);
        }
    });

    // Draw EM-DAT events (orange triangles, same as GDACS)
    emdatEvents.forEach(event => {
        // Try multiple possible date field names (note: API uses 'fromDate' with capital D)
        const dateStr = event.fromDate || event.start_date || event.eventdate || event.fromdate ||
                       (event.startyear ? `${event.startyear}-01-01` : null) ||
                       (event.year ? `${event.year}-01-01` : null) ||
                       (event.start_year ? `${event.start_year}-01-01` : null);

        const eventDate = dateStr ? new Date(dateStr) : null;

        if (eventDate && eventDate >= startDate && eventDate <= endDate) {
            const x = 40 + ((eventDate - startDate) / timeRange) * (width - 80);

            // Create triangle (polygon)
            const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const size = 9;
            // Points for upward-pointing triangle
            const points = `${x},${disasterY - size} ${x - size},${disasterY + size} ${x + size},${disasterY + size}`;
            triangle.setAttribute('points', points);
            triangle.setAttribute('fill', '#f97316');
            triangle.setAttribute('stroke', 'white');
            triangle.setAttribute('stroke-width', '2');
            triangle.style.cursor = 'pointer';

            // Prepare tooltip data
            const eventName = event.disastertype || event.disaster_type || event.eventtype || 'Disaster Event';
            const location = event.location || 'N/A';
            const deaths = event.totaldeaths || event.total_deaths || event.deaths || 0;
            const affected = event.totalaffected || event.total_affected || event.affected || 0;

            // Add click event for tooltip
            triangle.addEventListener('click', (e) => {
                const tooltipContent = `<strong>EM-DAT DISASTER EVENT</strong>
                    <div><b>Type:</b> ${eventName}</div>
                    <div><b>Location:</b> ${location}</div>
                    <div><b>Date:</b> ${eventDate.toLocaleDateString()}</div>
                    <div><b>Deaths:</b> ${deaths.toLocaleString()}</div>
                    <div><b>Affected:</b> ${affected.toLocaleString()}</div>`;

                showTimelineTooltip(e, tooltipContent, x);
            });

            svg.appendChild(triangle);
        }
    });

    // Draw DREF operations (red circles)
    drefs.forEach(dref => {
        const startDateStr = dref.start_date;
        if (startDateStr) {
            const drefDate = new Date(startDateStr);
            if (drefDate >= startDate && drefDate <= endDate) {
                const x = 40 + ((drefDate - startDate) / timeRange) * (width - 80);

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', drefY);
                circle.setAttribute('r', '8');
                circle.setAttribute('fill', '#dc2626');
                circle.setAttribute('stroke', 'white');
                circle.setAttribute('stroke-width', '2');
                circle.style.cursor = 'pointer';

                // Prepare tooltip data
                const drefName = dref.name || dref.dtype?.name || 'DREF Operation';
                const amount = dref.amount_funded ? `CHF ${dref.amount_funded.toLocaleString()}` : 'N/A';
                const disasterType = dref.dtype?.name || 'N/A';

                // Add click event for tooltip
                circle.addEventListener('click', (e) => {
                    const tooltipContent = `<strong>DREF OPERATION</strong>
                        <div><b>Name:</b> ${drefName}</div>
                        <div><b>Type:</b> ${disasterType}</div>
                        <div><b>Start Date:</b> ${drefDate.toLocaleDateString()}</div>
                        <div><b>Amount:</b> ${amount}</div>`;

                    showTimelineTooltip(e, tooltipContent, x);
                });

                svg.appendChild(circle);
            }
        }
    });
}

// Show timeline tooltip above marker
function showTimelineTooltip(event, content, markerX) {
    const tooltip = document.getElementById('timeline-tooltip');
    const timelineContainer = document.getElementById('timeline-container');
    const containerRect = timelineContainer.getBoundingClientRect();

    tooltip.innerHTML = content;
    tooltip.classList.remove('hidden');

    // Wait for tooltip to render to get accurate dimensions
    setTimeout(() => {
        const tooltipWidth = tooltip.offsetWidth || 220;
        const tooltipHeight = tooltip.offsetHeight;

        // Position tooltip completely above the timeline container
        const left = containerRect.left + markerX - (tooltipWidth / 2);
        const top = containerRect.top - tooltipHeight - 10; // 10px above timeline container

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }, 0);
}

// Hide tooltip when clicking outside
document.addEventListener('click', (e) => {
    const tooltip = document.getElementById('timeline-tooltip');
    const closeBtn = document.getElementById('close-timeline-btn');

    // Don't process if clicking close button
    if (e.target === closeBtn || closeBtn.contains(e.target)) {
        return;
    }

    // Check if click is on a marker (circle or polygon/triangle) or the tooltip itself
    const isMarker = e.target.tagName === 'circle' || e.target.tagName === 'polygon';
    if (tooltip && !isMarker && !tooltip.contains(e.target)) {
        tooltip.classList.add('hidden');
    }
});
