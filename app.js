let chartInstance = null;
let csvData = [];
let linearRegion = null;
let currentSlope = null;
let calculationData = null;
let currentUser = null;
let currentRegression = null;

// Check authentication
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    
    currentUser = session.user;
    return true;
}

// DOM elements
const csvFileInput = document.getElementById('csvFile');
const fileNameSpan = document.getElementById('fileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('results');
const errorDiv = document.getElementById('error');
const calculateActivityBtn = document.getElementById('calculateActivityBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const saveToDbBtn = document.getElementById('saveToDbBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Event listeners
csvFileInput.addEventListener('change', handleFileSelect);
analyzeBtn.addEventListener('click', analyzeData);
calculateActivityBtn.addEventListener('click', calculateEnzymeActivity);
exportExcelBtn.addEventListener('click', exportToExcel);
saveToDbBtn.addEventListener('click', saveToDatabase);
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        fileNameSpan.textContent = file.name;
        analyzeBtn.disabled = false;
        hideError();
    }
}

function analyzeData() {
    const file = csvFileInput.files[0];
    if (!file) {
        showError('Please select a CSV file first.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            csvData = parseCSV(content);
            
            if (csvData.length === 0) {
                showError('No valid data found in CSV file.');
                return;
            }

            if (csvData.length < 3) {
                showError('Need at least 3 data points for analysis.');
                return;
            }

            // Find the most linear region
            linearRegion = findMostLinearRegion(csvData);
            
            // Calculate linear regression on the linear region only
            const regression = calculateLinearRegression(linearRegion.data);
            regression.startIndex = linearRegion.startIndex;
            regression.endIndex = linearRegion.endIndex;
            regression.linearPoints = linearRegion.data.length;
            regression.totalPoints = csvData.length;
            
            // Display results
            displayResults(regression);
            
            // Create chart
            createChart(csvData, regression, linearRegion);
            
            // Show results section
            resultsSection.style.display = 'block';
            hideError();
        } catch (error) {
            showError('Error processing CSV file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

function parseCSV(content) {
    const lines = content.trim().split('\n');
    const data = [];
    
    // Check if first line is header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('x') && firstLine.includes('y');
    const startIndex = hasHeader ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        
        if (values.length >= 2) {
            const x = parseFloat(values[0]);
            const y = parseFloat(values[1]);
            
            if (!isNaN(x) && !isNaN(y)) {
                data.push({ x, y });
            }
        }
    }
    
    return data;
}

/**
 * Find the most linear region in the data by testing different window sizes
 * and positions, selecting the one with the highest R² value
 */
function findMostLinearRegion(data) {
    const n = data.length;
    const minWindowSize = Math.max(3, Math.floor(n * 0.4)); // At least 40% of data or 3 points
    let bestRegion = null;
    let bestR2 = -1;
    let bestScore = -1;
    
    // Try different window sizes (starting from smallest to find tightest linear region)
    for (let windowSize = minWindowSize; windowSize <= n; windowSize++) {
        // Slide the window across the data
        for (let start = 0; start <= n - windowSize; start++) {
            const end = start + windowSize;
            const windowData = data.slice(start, end);
            
            // Calculate R² for this window
            const regression = calculateLinearRegression(windowData);
            
            // Calculate a score that balances R² and window size
            // Prefer high R² but penalize very large windows slightly
            const sizePenalty = windowSize / n; // 0 to 1
            const score = regression.r2 * (1 + (1 - sizePenalty) * 0.1); // Slight preference for smaller windows
            
            // Select region with best score, prioritizing high R²
            if (regression.r2 > 0.95) { // If R² is excellent
                // Choose the smallest window with excellent R²
                if (regression.r2 > bestR2 || 
                    (regression.r2 >= bestR2 - 0.001 && windowSize < (bestRegion?.data.length || Infinity))) {
                    bestR2 = regression.r2;
                    bestScore = score;
                    bestRegion = {
                        data: windowData,
                        startIndex: start,
                        endIndex: end - 1,
                        r2: regression.r2
                    };
                }
            } else {
                // For lower R², just pick the best one
                if (score > bestScore) {
                    bestR2 = regression.r2;
                    bestScore = score;
                    bestRegion = {
                        data: windowData,
                        startIndex: start,
                        endIndex: end - 1,
                        r2: regression.r2
                    };
                }
            }
        }
    }
    
    console.log('Linear region detected:', bestRegion);
    console.log(`Points ${bestRegion.startIndex} to ${bestRegion.endIndex} (${bestRegion.data.length} points)`);
    console.log('R² =', bestRegion.r2);
    
    return bestRegion;
}

function calculateLinearRegression(data) {
    const n = data.length;
    
    // Calculate sums
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    
    for (let i = 0; i < n; i++) {
        sumX += data[i].x;
        sumY += data[i].y;
        sumXY += data[i].x * data[i].y;
        sumX2 += data[i].x * data[i].x;
        sumY2 += data[i].y * data[i].y;
    }
    
    // Calculate slope (m) and intercept (b)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const meanY = sumY / n;
    let ssTotal = 0, ssResidual = 0;
    
    for (let i = 0; i < n; i++) {
        const predictedY = slope * data[i].x + intercept;
        ssTotal += Math.pow(data[i].y - meanY, 2);
        ssResidual += Math.pow(data[i].y - predictedY, 2);
    }
    
    const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 1;
    
    return {
        slope,
        intercept,
        r2,
        n
    };
}

function displayResults(regression) {
    currentSlope = regression.slope;
    currentRegression = regression;
    
    document.getElementById('slope').textContent = regression.slope.toFixed(6);
    document.getElementById('intercept').textContent = regression.intercept.toFixed(6);
    document.getElementById('r2').textContent = regression.r2.toFixed(6);
    document.getElementById('dataPoints').textContent = 
        `${regression.linearPoints} of ${regression.totalPoints}`;
    
    // Display the x-range of the linear region
    const linearData = csvData.slice(regression.startIndex, regression.endIndex + 1);
    const minX = linearData[0].x;
    const maxX = linearData[linearData.length - 1].x;
    document.getElementById('linearRange').textContent = 
        `${minX.toFixed(3)} to ${maxX.toFixed(3)}`;
    
    const sign = regression.intercept >= 0 ? '+' : '';
    document.getElementById('equation').textContent = 
        `y = ${regression.slope.toFixed(6)}x ${sign} ${regression.intercept.toFixed(6)}`;
}

function createChart(data, regression, linearRegion) {
    const ctx = document.getElementById('dataChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Separate data into linear and non-linear points
    const linearData = [];
    const nonLinearData = [];
    
    data.forEach((point, index) => {
        if (index >= linearRegion.startIndex && index <= linearRegion.endIndex) {
            linearData.push({ x: point.x, y: point.y });
        } else {
            nonLinearData.push({ x: point.x, y: point.y });
        }
    });
    
    // Calculate regression line points (extend slightly beyond linear region)
    const linearXValues = linearRegion.data.map(d => d.x);
    const minX = Math.min(...linearXValues);
    const maxX = Math.max(...linearXValues);
    
    const regressionLine = [
        { x: minX, y: regression.slope * minX + regression.intercept },
        { x: maxX, y: regression.slope * maxX + regression.intercept }
    ];
    
    const datasets = [];
    
    // Add non-linear points if they exist
    if (nonLinearData.length > 0) {
        datasets.push({
            label: 'Excluded Points',
            data: nonLinearData,
            backgroundColor: 'rgba(150, 150, 150, 0.4)',
            borderColor: 'rgba(150, 150, 150, 0.6)',
            pointRadius: 5,
            pointHoverRadius: 7
        });
    }
    
    // Add linear points
    datasets.push({
        label: 'Linear Region Points',
        data: linearData,
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        pointRadius: 6,
        pointHoverRadius: 8
    });
    
    // Add regression line
    datasets.push({
        label: 'Linear Regression',
        data: regressionLine,
        type: 'line',
        borderColor: 'rgba(220, 53, 69, 1)',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderWidth: 3,
        pointRadius: 0,
        fill: false
    });
    
    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Enzyme Activity Data with Linear Region Detection',
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'X Values',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: true
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Y Values',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: true
                    }
                }
            }
        }
    });
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    resultsSection.style.display = 'none';
}

function hideError() {
    errorDiv.style.display = 'none';
}

function calculateEnzymeActivity() {
    if (currentSlope === null) {
        showError('Please analyze data first before calculating enzyme activity.');
        return;
    }
    
    // Get input values
    const volumeSample = parseFloat(document.getElementById('volumeSample').value);
    const volumeAssay = parseFloat(document.getElementById('volumeAssay').value);
    const dilution = parseFloat(document.getElementById('dilution').value);
    
    // Validate inputs
    if (isNaN(volumeSample) || volumeSample <= 0) {
        showError('Please enter a valid Volume (Sample) value.');
        return;
    }
    if (isNaN(volumeAssay) || volumeAssay <= 0) {
        showError('Please enter a valid Volume (Assay) value.');
        return;
    }
    if (isNaN(dilution) || dilution <= 0) {
        showError('Please enter a valid Dilution Factor value.');
        return;
    }
    
    // Fixed parameters
    const extinctionCoefficient = 0.02; // mM⁻¹cm⁻¹
    const cuvetteDiameter = 1; // cm
    
    // Calculate enzyme activity
    // Formula: ((-slope/(extinction coefficient*cuvette diameter))/1000)*(Volume (assay)/Volume(sample)))*Dillution
    const enzymeActivity = ((-currentSlope / (extinctionCoefficient * cuvetteDiameter)) / 1000) * 
                          (volumeAssay / volumeSample) * dilution;
    
    // Store calculation data for export
    calculationData = {
        slope: currentSlope,
        extinctionCoefficient: extinctionCoefficient,
        cuvetteDiameter: cuvetteDiameter,
        volumeSample: volumeSample,
        volumeAssay: volumeAssay,
        dilution: dilution,
        enzymeActivity: enzymeActivity
    };
    
    // Display result
    document.getElementById('activityValue').textContent = enzymeActivity.toFixed(4);
    document.getElementById('activityResult').style.display = 'block';
    
    hideError();
    
    console.log('Enzyme Activity Calculation:');
    console.log('Slope:', currentSlope);
    console.log('Volume Sample:', volumeSample, 'ml');
    console.log('Volume Assay:', volumeAssay, 'ml');
    console.log('Dilution:', dilution);
    console.log('Extinction Coefficient:', extinctionCoefficient, 'mM⁻¹cm⁻¹');
    console.log('Cuvette Diameter:', cuvetteDiameter, 'cm');
    console.log('Enzyme Activity:', enzymeActivity, 'U/ml');
}

function exportToExcel() {
    if (!calculationData) {
        showError('Please calculate enzyme activity first before exporting.');
        return;
    }
    
    // Create CSV content (Excel-compatible)
    const headers = [
        'Slope',
        'Extinction Coefficient (mM⁻¹cm⁻¹)',
        'Cuvette Diameter (cm)',
        'Volume Sample (ml)',
        'Volume Assay (ml)',
        'Dilution Factor',
        'Enzyme Activity (U/ml)'
    ];
    
    const values = [
        calculationData.slope,
        calculationData.extinctionCoefficient,
        calculationData.cuvetteDiameter,
        calculationData.volumeSample,
        calculationData.volumeAssay,
        calculationData.dilution,
        calculationData.enzymeActivity
    ];
    
    // Create CSV string
    const csvContent = headers.join(',') + '\n' + values.join(',');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `enzyme_activity_results_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Exported to:', filename);
}

async function saveToDatabase() {
    if (!calculationData) {
        showError('Please calculate enzyme activity first before saving.');
        return;
    }
    
    const sampleName = document.getElementById('sampleName').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const csvFileName = csvFileInput.files[0]?.name || 'unknown.csv';
    
    if (!sampleName) {
        showError('Please enter a sample name before saving.');
        return;
    }
    
    try {
        // First, check if sample exists or create it
        let { data: existingSample, error: sampleCheckError } = await supabase
            .from('samples')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('sample_name', sampleName)
            .single();
        
        let sampleId;
        
        if (existingSample) {
            sampleId = existingSample.id;
        } else {
            // Create new sample
            const { data: newSample, error: sampleCreateError } = await supabase
                .from('samples')
                .insert({
                    user_id: currentUser.id,
                    sample_name: sampleName
                })
                .select()
                .single();
            
            if (sampleCreateError) throw sampleCreateError;
            sampleId = newSample.id;
        }
        
        // Get linear region data
        const linearData = csvData.slice(currentRegression.startIndex, currentRegression.endIndex + 1);
        
        // Insert measurement
        const { data: measurement, error: measurementError } = await supabase
            .from('measurements')
            .insert({
                user_id: currentUser.id,
                sample_id: sampleId,
                slope: calculationData.slope,
                r_squared: currentRegression.r2,
                linear_region_start: linearData[0].x,
                linear_region_end: linearData[linearData.length - 1].x,
                linear_points: currentRegression.linearPoints,
                total_points: currentRegression.totalPoints,
                volume_sample: calculationData.volumeSample,
                volume_assay: calculationData.volumeAssay,
                dilution_factor: calculationData.dilution,
                extinction_coefficient: calculationData.extinctionCoefficient,
                cuvette_diameter: calculationData.cuvetteDiameter,
                enzyme_activity: calculationData.enzymeActivity,
                csv_filename: csvFileName,
                notes: notes || null
            })
            .select()
            .single();
        
        if (measurementError) throw measurementError;
        
        showSuccess('Measurement saved successfully! Redirecting to dashboard...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error saving to database:', error);
        showError('Error saving to database: ' + error.message);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    hideError();
}

// Initialize - check authentication on page load
checkAuth();
