let currentUser = null;

// Check authentication
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user;
    document.getElementById('userEmail').textContent = currentUser.email;
    
    loadDashboardData();
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
});

// Export all data handler
document.getElementById('exportAllBtn').addEventListener('click', exportAllToExcel);

// Load dashboard data
async function loadDashboardData() {
    try {
        // Get sample statistics
        const { data: samples, error } = await supabase
            .from('sample_statistics')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('last_measurement_date', { ascending: false });
        
        if (error) throw error;
        
        // Get detailed measurements for each sample to calculate averages
        const sampleDetails = await Promise.all(samples.map(async (sample) => {
            const { data: measurements } = await supabase
                .from('measurements')
                .select('*')
                .eq('sample_id', sample.sample_id)
                .order('measurement_date', { ascending: false });
            
            // Calculate averages
            const avgR2 = measurements.length > 0 
                ? measurements.reduce((sum, m) => sum + m.r_squared, 0) / measurements.length 
                : 0;
            const avgSlope = measurements.length > 0 
                ? measurements.reduce((sum, m) => sum + m.slope, 0) / measurements.length 
                : 0;
            
            // Get most common or last used parameters
            const lastMeasurement = measurements[0] || {};
            
            return {
                ...sample,
                avgR2,
                avgSlope,
                volumeSample: lastMeasurement.volume_sample || '-',
                volumeAssay: lastMeasurement.volume_assay || '-',
                dilutionFactor: lastMeasurement.dilution_factor || '-',
                measurements: measurements // Store all measurements for expansion
            };
        }));
        
        // Calculate overview stats
        const totalSamples = samples.length;
        const totalMeasurements = samples.reduce((sum, s) => sum + s.measurement_count, 0);
        
        // Calculate this week's measurements
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentMeasurements = samples.filter(s => 
            new Date(s.last_measurement_date) > oneWeekAgo
        ).reduce((sum, s) => sum + s.measurement_count, 0);
        
        // Update overview cards
        document.getElementById('totalSamples').textContent = totalSamples;
        document.getElementById('totalMeasurements').textContent = totalMeasurements;
        document.getElementById('recentMeasurements').textContent = recentMeasurements;
        
        // Display samples
        displaySamples(sampleDetails);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading data: ' + error.message);
    }
}

function displaySamples(samples) {
    const samplesTable = document.getElementById('samplesTable');
    const emptyState = document.getElementById('emptyState');
    
    if (samples.length === 0) {
        samplesTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    samplesTable.style.display = 'table';
    emptyState.style.display = 'none';
    
    const tbody = samplesTable.querySelector('tbody');
    tbody.innerHTML = samples.map((sample, index) => {
        // Calculate CV% (Coefficient of Variation)
        const cv = sample.mean_activity && sample.std_dev_activity ? 
            ((sample.std_dev_activity / sample.mean_activity) * 100).toFixed(2) : '-';
        
        // Format date
        const lastDate = sample.last_measurement_date 
            ? new Date(sample.last_measurement_date).toLocaleDateString() 
            : '-';
        
        // Main sample row
        const mainRow = `
            <tr>
                <td class="sample-name-cell">
                    ${sample.measurement_count > 1 ? `<button class="btn-expand" onclick="toggleMeasurements('sample-${index}', this)">▶</button>` : ''}
                    ${sample.sample_name}
                </td>
                <td>
                    <span class="measurement-count-badge">${sample.measurement_count}</span>
                </td>
                <td class="date-cell">${lastDate}</td>
                <td class="activity-value">
                    ${sample.mean_activity ? sample.mean_activity.toFixed(4) : '-'}
                </td>
                <td class="std-dev-value">
                    ${sample.std_dev_activity ? sample.std_dev_activity.toFixed(4) : '-'}
                </td>
                <td class="cv-value">
                    ${cv !== '-' ? cv + '%' : '-'}
                </td>
                <td class="r2-value">
                    ${sample.avgR2 ? sample.avgR2.toFixed(4) : '-'}
                </td>
                <td class="numeric-value">
                    ${sample.avgSlope ? sample.avgSlope.toFixed(6) : '-'}
                </td>
                <td class="numeric-value">${sample.volumeSample}</td>
                <td class="numeric-value">${sample.volumeAssay}</td>
                <td class="numeric-value">${sample.dilutionFactor}</td>
                <td style="text-align: center;">
                    <button class="btn-view-details" onclick="viewSample('${sample.sample_id}', '${sample.sample_name}')">
                        Details
                    </button>
                </td>
            </tr>
        `;
        
        // Detail row with individual measurements (only if multiple measurements)
        let detailRow = '';
        if (sample.measurement_count > 1) {
            const measurementsTable = `
                <table class="measurements-detail-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Activity (U/ml)</th>
                            <th>R²</th>
                            <th>Slope</th>
                            <th>Vol Sample</th>
                            <th>Vol Assay</th>
                            <th>Dilution</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sample.measurements.map((m, mIndex) => `
                            <tr>
                                <td class="measurement-row-number">${mIndex + 1}</td>
                                <td>${new Date(m.measurement_date).toLocaleString()}</td>
                                <td class="activity-value">${m.enzyme_activity.toFixed(4)}</td>
                                <td class="r2-value">${m.r_squared.toFixed(4)}</td>
                                <td class="numeric-value">${m.slope.toFixed(6)}</td>
                                <td class="numeric-value">${m.volume_sample}</td>
                                <td class="numeric-value">${m.volume_assay}</td>
                                <td class="numeric-value">${m.dilution_factor}</td>
                                <td>${m.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            detailRow = `
                <tr class="measurements-detail-row" id="sample-${index}">
                    <td colspan="12" class="measurements-detail-cell">
                        ${measurementsTable}
                    </td>
                </tr>
            `;
        }
        
        return mainRow + detailRow;
    }).join('');
}

function toggleMeasurements(rowId, button) {
    const detailRow = document.getElementById(rowId);
    detailRow.classList.toggle('show');
    button.classList.toggle('expanded');
}

function viewSample(sampleId, sampleName) {
    window.location.href = `sample.html?id=${sampleId}&name=${encodeURIComponent(sampleName)}`;
}

async function exportAllToExcel() {
    try {
        // Get all measurements for the user
        const { data: measurements, error } = await supabase
            .from('measurements')
            .select(`
                *,
                samples!inner(sample_name)
            `)
            .eq('user_id', currentUser.id)
            .order('measurement_date', { ascending: false });
        
        if (error) throw error;

        if (measurements.length === 0) {
            alert('No measurements to export!');
            return;
        }

        // Create CSV content with headers
        const headers = [
            'Sample Name',
            'Measurement Date',
            'Enzyme Activity (U/ml)',
            'Slope',
            'R²',
            'Intercept',
            'Linear Region Start',
            'Linear Region End',
            'Linear Points',
            'Total Points',
            'Volume Sample (ml)',
            'Volume Assay (ml)',
            'Dilution Factor',
            'Extinction Coefficient',
            'Cuvette Diameter (cm)',
            'CSV Filename',
            'Notes'
        ];

        const rows = measurements.map(m => [
            m.samples.sample_name,
            new Date(m.measurement_date).toLocaleString(),
            m.enzyme_activity,
            m.slope,
            m.r_squared,
            m.intercept || '',
            m.linear_region_start,
            m.linear_region_end,
            m.linear_points,
            m.total_points,
            m.volume_sample,
            m.volume_assay,
            m.dilution_factor,
            m.extinction_coefficient,
            m.cuvette_diameter,
            m.csv_filename || '',
            m.notes || ''
        ]);

        // Create CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // Escape cells that contain commas or quotes
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `enzyme_activity_all_measurements_${timestamp}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`Exported ${measurements.length} measurements to:`, filename);

    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data: ' + error.message);
    }
}

// Initialize
checkAuth();
