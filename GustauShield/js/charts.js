

function initDashboardCharts() {
    console.log("Attempting to initialize dashboard charts...");
    // Call individual chart creation functions
    createAttackVectorChart('attackVectorChart'); // Target the first canvas ID
    createDetectionTrendChart('detectionTrendChart'); // Target the second canvas ID
}

/**
 * Creates the Attack Vector Distribution chart (Doughnut Chart).
 * @param {string} canvasId The ID of the canvas element for this chart.
 */
function createAttackVectorChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Chart Error: Canvas element with ID "${canvasId}" not found.`);
        return;
    }

    // Simulated data for attack vector distribution
    const chartData = {
        labels: ['AI-Powered Phishing', 'Deepfake Impersonation', 'Adaptive Malware', 'Automated Exploits', 'Credential Stuffing'],
        datasets: [{
            label: 'Attack Vector Frequency',
            // Example Percentages (should add up to 100 ideally)
            data: [38, 22, 15, 15, 10],
            backgroundColor: [ // Array of cyber-themed colors with some transparency
                'rgba(0, 255, 255, 0.7)', // cyber-cyan
                'rgba(138, 43, 226, 0.7)', // cyber-purple
                'rgba(255, 77, 77, 0.7)',  // Neon Red
                'rgba(255, 165, 0, 0.7)', // Neon Orange
                'rgba(54, 162, 235, 0.7)'  // Chart.js Blue
            ],
            borderColor: '#0a0a1a', // Use dark page background for distinct borders
            borderWidth: 2,
            hoverOffset: 8, // Slightly enlarge segment on hover
            hoverBorderColor: '#ffffff' // White border on hover
        }]
    };

    // Chart configuration options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Allow chart to fit container
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#cccccc', // light-gray text for legend
                    font: {
                        family: "'Poppins', sans-serif", // Consistent font
                        size: 11
                    },
                    padding: 20, // Space between chart and legend
                    usePointStyle: true, // Use circles instead of boxes
                }
            },
            tooltip: {
                backgroundColor: 'rgba(10, 10, 26, 0.9)', // Dark tooltip background
                titleColor: '#00ffff', // Cyan title
                bodyColor: '#cccccc', // Light gray body text
                borderColor: 'rgba(0, 255, 255, 0.5)', // Cyan border
                borderWidth: 1,
                padding: 10,
                usePointStyle: true,
                callbacks: {
                    // Format tooltip label to show percentage
                    label: function(context) {
                        let label = context.label || '';
                        if (label) { label += ': '; }
                        // Get the value for the segment
                        let value = context.parsed || 0;
                        label += value + '%';
                        return ' ' + label; // Add space for point style
                    }
                }
            },
            title: {
                display: false // Main title is in the HTML card
            }
        },
        // Optional: Add subtle animation
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };

    // Create the chart instance
    try {
        new Chart(ctx, {
            type: 'doughnut', // Doughnut chart type
            data: chartData,
            options: chartOptions
        });
        console.log(`Chart "${canvasId}" initialized successfully.`);
    } catch(error) {
        console.error(`Error initializing chart "${canvasId}":`, error);
    }
}

/**
 * Creates the AI Detection Trend chart (Line Chart).
 * @param {string} canvasId The ID of the canvas element for this chart.
 */
function createDetectionTrendChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Chart Error: Canvas element with ID "${canvasId}" not found.`);
        return;
    }

    // Simulated data for a trend over time (e.g., quarters)
    const chartData = {
        labels: ['Q3 \'24', 'Q4 \'24', 'Q1 \'25', 'Q2 \'25', 'Q3 \'25', 'Q4 \'25'], // Example time labels
        datasets: [{
            label: 'AI Detection Rate',
            // Example data showing improvement (%)
            data: [78, 81, 86, 89, 93, 96],
            fill: true, // Fill area below the line
            backgroundColor: 'rgba(0, 119, 255, 0.25)', // Transparent cyber-blue fill
            borderColor: 'rgba(0, 119, 255, 1)',     // Solid cyber-blue line
            borderWidth: 2,
            tension: 0.4, // Creates smoother curves
            pointBackgroundColor: 'rgba(0, 119, 255, 1)',
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'rgba(0, 119, 255, 1)'
        }]
    };

    // Chart configuration options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { // Value axis (Percentage)
                beginAtZero: false, // Don't necessarily start at 0 if values are high
                min: 70,          // Set reasonable min/max for effectiveness %
                max: 100,
                ticks: {
                    color: '#cccccc',
                    font: { family: "'Poppins', sans-serif" },
                    // Add '%' suffix to tick labels
                    callback: function(value) {
                        return value + '%';
                    }
                },
                grid: {
                    color: 'rgba(0, 255, 255, 0.1)', // Subtle cyan grid lines
                    borderColor: 'rgba(0, 255, 255, 0.2)'
                }
            },
            x: { // Time axis
                ticks: {
                    color: '#cccccc',
                    font: { family: "'Poppins', sans-serif" }
                },
                grid: {
                    color: 'rgba(0, 255, 255, 0.1)',
                     borderColor: 'rgba(0, 255, 255, 0.2)'
                }
            }
        },
        plugins: {
            legend: {
                display: false // Hide legend for a single dataset line chart
            },
            tooltip: {
                backgroundColor: 'rgba(10, 10, 26, 0.9)',
                titleColor: '#00ffff', // Cyan title (e.g., 'Q3 '25')
                bodyColor: '#cccccc',
                borderColor: 'rgba(0, 255, 255, 0.5)',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    // Format tooltip to show label and value with %
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y + '%';
                        }
                        return label;
                    }
                }
            },
            title: {
                display: false // Title is in HTML card
            }
        },
        interaction: { // Improve hover interaction
             mode: 'index',
             intersect: false,
        },
    };

    // Create the chart instance
    try {
        new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
        console.log(`Chart "${canvasId}" initialized successfully.`);
    } catch(error) {
        console.error(`Error initializing chart "${canvasId}":`, error);
    }
}

// --- Script Load Confirmation ---
console.log("charts.js loaded: Dashboard chart functions available.");

// Note: initDashboardCharts() is NOT called automatically here.
// It MUST be called from the inline script in dashboard.html after
// the DOM is ready and this script has been loaded.
