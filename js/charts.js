// js/charts.js

/**
 * ======================================
 * CHART RENDERING LOGIC (Chart.js)
 * ======================================
 * Handles rendering the scam types chart on the dashboard page.
 */

// --- Module-level variable to hold the chart instance ---
let scamChartInstance = null; // Allows destroying the previous chart before redrawing

/**
 * Renders the scam types chart onto the specified canvas element.
 * Uses data fetched from getSimulatedScamData() in data.js.
 * @param {string} canvasId The ID of the canvas element where the chart should be drawn.
 */
function renderScamChart(canvasId) {
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
        console.error(`Chart rendering failed: Canvas element with id "${canvasId}" not found.`);
        return;
    }

    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
         console.error(`Chart rendering failed: Could not get 2D context for canvas "${canvasId}".`);
         return;
    }

    // --- Destroy existing chart instance (if any) ---
    // This prevents flickering or drawing multiple charts on top of each other if
    // this function is called multiple times (e.g., for updates).
    if (scamChartInstance) {
        console.log("Destroying previous chart instance.");
        scamChartInstance.destroy();
        scamChartInstance = null;
    }

    // --- Get Simulated Data ---
    // Ensure data.js is loaded and the function exists
    let chartData;
    if (typeof getSimulatedScamData === 'function') {
         chartData = getSimulatedScamData();
         if (!chartData || !chartData.labels || !chartData.datasets) {
             console.error("Chart rendering failed: Invalid data received from getSimulatedScamData().");
             // Optionally draw a placeholder message on the canvas
             ctx.font = "16px 'Orbitron', sans-serif";
             ctx.fillStyle = "#ff4d4d"; // Use a red color for error
             ctx.textAlign = "center";
             ctx.fillText("Error loading chart data.", canvasElement.width / 2, canvasElement.height / 2);
             return;
         }
    } else {
        console.error("Chart rendering failed: getSimulatedScamData function not found. Is data.js loaded?");
        return;
    }


    // --- Chart.js Configuration ---
    const chartConfig = {
        type: 'bar', // Type of chart (bar, line, doughnut, pie, etc.)
        data: chartData, // Use the data fetched from data.js
        options: {
            responsive: true, // Make chart resize with container
            maintainAspectRatio: false, // Important: Allows chart to fill container height
            indexAxis: 'y', // Optional: Make bars horizontal for potentially long labels
            scales: {
                y: { // Category Axis (was x-axis before indexAxis change)
                    ticks: {
                        color: '#cceeee', // Color for labels (attack types)
                        font: {
                            family: "'Orbitron', sans-serif",
                            size: 10 // Slightly smaller font for axis labels
                        }
                    },
                    grid: {
                         color: 'rgba(0, 255, 204, 0.1)', // Fainter grid lines
                         borderColor: '#007a7a' // Axis line color
                    }
                },
                x: { // Value Axis (was y-axis before indexAxis change)
                    beginAtZero: true, // Start axis at zero
                    ticks: {
                        color: '#cceeee', // Color for value labels
                         font: {
                            family: "'Orbitron', sans-serif",
                            size: 10
                        },
                        // Optional: Format numbers if they get very large
                        // callback: function(value) {
                        //     return value.toLocaleString();
                        // }
                    },
                    grid: {
                        color: 'rgba(0, 255, 204, 0.1)',
                         borderColor: '#007a7a'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend - dataset label shown in tooltip is enough
                    // position: 'bottom',
                    // labels: {
                    //     color: '#00ffcc',
                    //     font: {
                    //         family: "'Orbitron', sans-serif",
                    //         size: 12
                    //     },
                    //     padding: 20 // Add padding below chart
                    // }
                },
                title: {
                    display: false // Chart title is handled by the card header in HTML
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 10, 10, 0.9)', // Dark tooltip background
                    titleColor: '#00ffcc', // Neon title color
                    titleFont: { family: "'Orbitron', sans-serif", weight: 'bold' },
                    bodyColor: '#ffffff', // White body text
                    bodyFont: { family: "'Orbitron', sans-serif" },
                    borderColor: '#00ffcc',
                    borderWidth: 1,
                    padding: 10, // Tooltip padding
                    usePointStyle: true, // Use point style (circle) in tooltip label
                    callbacks: {
                        // Customize tooltip label
                        label: function(context) {
                             let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.x !== null) { // Use parsed.x because indexAxis is 'y'
                                label += context.parsed.x.toLocaleString() + ' incidents';
                            }
                            return label;
                        },
                         // Customize tooltip title (optional, shows the attack type)
                         title: function(context) {
                             return context[0].label; // Get the label (attack type)
                         }
                    }
                }
            },
             // Optional: Add hover effects if desired
             // onHover: (event, chartElement) => {
             //    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
             // }
        }
    };

    // --- Create the Chart ---
    try {
        console.log("Creating new Chart instance...");
        scamChartInstance = new Chart(ctx, chartConfig);
        console.log("Scam chart rendered successfully.");

        // --- Optional: Set up periodic updates ---
        // Uncomment this block if you want the chart data to refresh automatically
        /*
        const UPDATE_INTERVAL = 30000; // Update every 30 seconds (adjust as needed)
        setInterval(() => {
            if (scamChartInstance && typeof getSimulatedScamData === 'function') {
                console.log("Updating chart data...");
                const newData = getSimulatedScamData();
                // Update dataset data and potentially labels if they change
                scamChartInstance.data.labels = newData.labels;
                scamChartInstance.data.datasets.forEach((dataset, i) => {
                    if (newData.datasets[i]) {
                         dataset.data = newData.datasets[i].data;
                    }
                });
                scamChartInstance.update(); // Redraw the chart with new data
                 console.log("Chart data updated.");
            }
        }, UPDATE_INTERVAL);
        */

    } catch (error) {
        console.error("Error creating Chart.js instance:", error);
        // Display error on canvas as fallback
        ctx.font = "16px 'Orbitron', sans-serif";
        ctx.fillStyle = "#ff4d4d";
        ctx.textAlign = "center";
        ctx.fillText("Failed to render chart.", canvasElement.width / 2, canvasElement.height / 2);
    }
}

// --- Script Load Confirmation ---
console.log("charts.js loaded: Chart rendering functions available.");
