// Global variables
let map;
let categoriesData = null;
let currentMarkers = [];
let currentOverlays = [];
const IFRC_API_TOKEN = '3f891db59f4e9fd16ba4f8be803d368a469a1276';
const DREF_API_URL = 'https://goadmin.ifrc.org/api/v2/appeal/?atype=0&status=0';
const PAST_DREF_API_URL = 'https://goadmin.ifrc.org/api/v2/appeal/?atype=0';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadCategories();
    setupEventListeners();
});

// Initialize the map
function initMap() {
    map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true
    });

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

// Populate category dropdown
function populateCategorySelect() {
    const categorySelect = document.getElementById('category-select');

    categoriesData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    const categorySelect = document.getElementById('category-select');
    const indicatorSelect = document.getElementById('indicator-select');
    const yearSelect = document.getElementById('year-select');
    const loadDataBtn = document.getElementById('load-data-btn');

    categorySelect.addEventListener('change', onCategoryChange);
    indicatorSelect.addEventListener('change', onIndicatorChange);
    loadDataBtn.addEventListener('click', loadIndicatorData);
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
function onIndicatorChange(event) {
    const indicatorId = event.target.value;
    const yearSelect = document.getElementById('year-select');
    const loadDataBtn = document.getElementById('load-data-btn');

    yearSelect.innerHTML = '<option value="">Select a year...</option>';

    if (!indicatorId) {
        yearSelect.disabled = true;
        loadDataBtn.disabled = true;
        return;
    }

    // Check if this is DREF data (doesn't need year selection)
    if (indicatorId === 'ACTIVE_DREFS' || indicatorId === 'PAST_DREFS') {
        yearSelect.disabled = true;
        if (indicatorId === 'ACTIVE_DREFS') {
            yearSelect.innerHTML = '<option value="current">Current (Live Data)</option>';
        } else {
            yearSelect.innerHTML = '<option value="past5years">Last 5 Years</option>';
        }
        yearSelect.value = yearSelect.options[0].value;
        loadDataBtn.disabled = false;
    } else {
        // Populate years for regular indicators
        const years = [2024, 2023, 2022, 2021, 2020, 2019, 2018];
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        yearSelect.disabled = false;
        loadDataBtn.disabled = false;
    }
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

    console.log(`Loading data for: ${indicatorName} from ${dataFile}`);

    try {
        // Clear existing markers/overlays
        clearMapData();

        // Check if this is DREF data
        if (indicatorId === 'ACTIVE_DREFS') {
            const drefData = await loadDREFData();
            if (drefData && drefData.length > 0) {
                displayDREFOnMap(drefData);
                showDREFLegend(drefData.length);
            } else {
                alert('No active DREF operations found.');
            }
        } else if (indicatorId === 'PAST_DREFS') {
            const pastDrefData = await loadPastDREFData();
            if (pastDrefData && pastDrefData.length > 0) {
                displayPastDREFOnMap(pastDrefData);
                showPastDREFLegend(pastDrefData);
            } else {
                alert('No past DREF operations found in the last 5 years.');
            }
        } else {
            // Regular CSV data
            if (!year) {
                alert('Please select a year.');
                return;
            }

            const data = await loadDataFile(dataFile, indicatorId, year);

            if (data && data.length > 0) {
                displayDataOnMap(data, indicatorName, unit);
                showLegend(indicatorName, unit, data);
            } else {
                alert('No data found for the selected criteria.');
            }
        }
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load indicator data. Please check the console for details.');
    }
}

// Load data from CSV file
async function loadDataFile(fileName, indicatorId, year) {
    try {
        const response = await fetch(`Portfolios/${fileName}`);
        const csvText = await response.text();

        // Parse CSV
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');

        const data = [];
        const targetCountries = categoriesData.countries.map(c => c.name);

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].split(',');
            if (row.length < headers.length) continue;

            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header.trim()] = row[index] ? row[index].trim() : '';
            });

            // Check if this row matches our criteria
            const countryName = rowData['Country Name'] || rowData['GEO_NAME_SHORT'];
            if (targetCountries.includes(countryName)) {
                // For year-based data, extract the value for the selected year
                // This is a simplified parser - you may need to adjust based on actual CSV structure
                data.push({
                    country: countryName,
                    value: extractValue(rowData, year),
                    rowData: rowData
                });
            }
        }

        return data.filter(d => d.value !== null && d.value !== '');
    } catch (error) {
        console.error('Error parsing CSV:', error);
        throw error;
    }
}

// Extract value from row data based on year
function extractValue(rowData, year) {
    // Check various possible column formats
    const possibleKeys = [
        `${year} [YR${year}]`,
        `${year}`,
        'PERCENT_POP_N',
        'Value'
    ];

    for (let key of possibleKeys) {
        if (rowData[key] && rowData[key] !== '..' && rowData[key] !== '') {
            return parseFloat(rowData[key]);
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

// Display data on map
function displayDataOnMap(data, indicatorName, unit) {
    // Get country coordinates (placeholder - you'll need a proper geocoding solution)
    const countryCoordinates = getCountryCoordinates();

    // Calculate value ranges for color coding
    const values = data.map(d => d.value).filter(v => !isNaN(v));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    data.forEach(item => {
        const coords = countryCoordinates[item.country];
        if (coords && !isNaN(item.value)) {
            const color = getColorForValue(item.value, minValue, maxValue);

            const marker = L.circleMarker(coords, {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            marker.bindPopup(`
                <strong>${item.country}</strong><br>
                ${indicatorName}: <strong>${item.value.toFixed(2)} ${unit}</strong>
            `);

            currentMarkers.push(marker);
        }
    });
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
    const legend = document.getElementById('legend');
    const legendTitle = document.getElementById('legend-title');
    const legendContent = document.getElementById('legend-content');

    legendTitle.textContent = indicatorName;

    const values = data.map(d => d.value).filter(v => !isNaN(v));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    legendContent.innerHTML = `
        <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(0, 255, 0);"></div>
            <div class="legend-label">Low: ${minValue.toFixed(2)} ${unit}</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(255, 255, 0);"></div>
            <div class="legend-label">Medium</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(255, 0, 0);"></div>
            <div class="legend-label">High: ${maxValue.toFixed(2)} ${unit}</div>
        </div>
    `;

    legend.classList.remove('hidden');
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
        const response = await fetch(DREF_API_URL, {
            headers: {
                'Authorization': `Token ${IFRC_API_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('DREF API Response:', data);

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
    const legend = document.getElementById('legend');
    const legendTitle = document.getElementById('legend-title');
    const legendContent = document.getElementById('legend-content');

    legendTitle.textContent = 'Active DREF Operations';

    legendContent.innerHTML = `
        <div class="legend-item">
            <div class="legend-color" style="background-color: white; border: 2px solid #dc2626; display: flex; align-items: center; justify-content: center; color: #dc2626; font-weight: bold; font-size: 12px;">✚</div>
            <div class="legend-label">Active DREF: ${count} operation${count !== 1 ? 's' : ''}</div>
        </div>
        <div style="margin-top: 10px; font-size: 12px; color: #666;">
            DREF: Disaster Response Emergency Fund<br>
            Click markers for details
        </div>
    `;

    legend.classList.remove('hidden');
}

// Load past DREF data from IFRC API (last 5 years)
async function loadPastDREFData() {
    try {
        const response = await fetch(PAST_DREF_API_URL, {
            headers: {
                'Authorization': `Token ${IFRC_API_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Past DREF API Response:', data);

        // Calculate date 5 years ago
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

        // Filter for the 25 target countries and last 5 years
        const targetCountries = categoriesData.countries.map(c => c.name);
        const targetISO3Codes = ['AFG', 'BGD', 'BFA', 'CMR', 'CAF', 'TCD', 'COL', 'COD',
                                 'ETH', 'HTI', 'LBN', 'MLI', 'MOZ', 'MMR', 'NER', 'NGA',
                                 'PAK', 'SOM', 'SSD', 'SDN', 'SYR', 'UGA', 'UKR', 'VEN', 'YEM'];

        const drefs = data.results || [];
        const filteredDrefs = drefs.filter(dref => {
            const countryName = dref.country?.name || dref.country_details?.name;
            const countryISO3 = dref.country?.iso3 || dref.country_details?.iso3;
            const startDate = dref.start_date ? new Date(dref.start_date) : null;

            // Check if in target countries and within last 5 years
            const isTargetCountry = targetCountries.includes(countryName) || targetISO3Codes.includes(countryISO3);
            const isWithinLastFiveYears = startDate && startDate >= fiveYearsAgo;

            return isTargetCountry && isWithinLastFiveYears;
        });

        console.log(`Found ${filteredDrefs.length} past DREFs in target countries (last 5 years)`);
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
    const legend = document.getElementById('legend');
    const legendTitle = document.getElementById('legend-title');
    const legendContent = document.getElementById('legend-content');

    // Count unique countries
    const countries = new Set();
    drefs.forEach(dref => {
        const countryName = dref.country?.name || dref.country_details?.name;
        if (countryName) countries.add(countryName);
    });

    legendTitle.textContent = 'Past DREFs (Last 5 Years)';

    legendContent.innerHTML = `
        <div class="legend-item">
            <div class="legend-color" style="background-color: #dc2626; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">#</div>
            <div class="legend-label">Number shows DREF count per country</div>
        </div>
        <div style="margin-top: 10px; font-size: 12px; color: #666;">
            <strong>Total DREFs:</strong> ${drefs.length}<br>
            <strong>Countries:</strong> ${countries.size}<br>
            <strong>Period:</strong> Last 5 years<br><br>
            Click markers to see all DREFs for each country
        </div>
    `;

    legend.classList.remove('hidden');
}
