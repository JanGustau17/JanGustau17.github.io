// js/charts.js

/**
 * Initializes all charts specifically for the dashboard page.
 */
function initDashboardCharts() {
    console.log("Attempting to initialize dashboard charts...");
    createAttackVectorChart('attackVectorChart'); // Target the first canvas ID
    createDetectionTrendChart('detectionTrendChart'); // Target the second canvas ID
}

/**
 * Creates the Attack Vector Distribution chart (Doughnut).
 */
function createAttackVectorChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) { console.error(`Chart Error: Canvas element #${canvasId} not found.`); return; }

    const chartData = {
        labels: ['AI Phishing', 'Deepfake Fraud', 'Adaptive Malware', 'Automated Exploits', 'Credential Stuffing'],
        datasets: [{
            label: 'Attack Vector Frequency',
            data: [38, 22, 15, 15, 10], // Example percentages
            backgroundColor: ['rgba(0, 255, 255, 0.7)', 'rgba(138, 43, 226, 0.7)', 'rgba(255, 77, 77, 0.7)', 'rgba(255, 165, 0, 0.7)', 'rgba(54, 162, 235, 0.7)'],
            borderColor: '#0a0a1a', borderWidth: 2, hoverOffset: 8, hoverBorderColor: '#ffffff'
        }]
    };
    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#cccccc', font: { family: "'Poppins', sans-serif", size: 11 }, padding: 15, usePointStyle: true, } },
            tooltip: {
                backgroundColor: 'rgba(10, 10, 26, 0.9)', titleColor: '#00ffff', bodyColor: '#cccccc',
                borderColor: 'rgba(0, 255, 255, 0.5)', borderWidth: 1, padding: 10, usePointStyle: true,
                callbacks: { label: function(context) { return ` ${context.label || ''}: ${context.parsed || 0}%`; } }
            },
            title: { display: false }
        },
        animation: { animateScale: true, animateRotate: true }
    };

    try { new Chart(ctx, { type: 'doughnut', data: chartData, options: chartOptions }); console.log(`Chart "${canvasId}" initialized.`); }
    catch(error) { console.error(`Error initializing chart #${canvasId}:`, error); }
}

/**
 * Creates the AI Detection Trend chart (Line).
 */
function createDetectionTrendChart(canvasId) {
    const ctx = document.getElementById(canvasId);
     if (!ctx) { console.error(`Chart Error: Canvas element #${canvasId} not found.`); return; }

    const chartData = {
        labels: ['Q3 \'24', 'Q4 \'24', 'Q1 \'25', 'Q2 \'25', 'Q3 \'25', 'Q4 \'25'],
        datasets: [{
            label: 'AI Detection Rate', data: [78, 81, 86, 89, 93, 96], // Example trend (%)
            fill: true, backgroundColor: 'rgba(0, 119, 255, 0.25)', borderColor: 'rgba(0, 119, 255, 1)',
            borderWidth: 2, tension: 0.4, pointBackgroundColor: 'rgba(0, 119, 255, 1)', pointBorderColor: '#ffffff',
            pointRadius: 4, pointHoverRadius: 7, pointHoverBackgroundColor: '#ffffff', pointHoverBorderColor: 'rgba(0, 119, 255, 1)'
        }]
    };
     const chartOptions = {
         responsive: true, maintainAspectRatio: false,
         scales: {
             y: { beginAtZero: false, min: 70, max: 100, ticks: { color: '#cccccc', font: { family: "'Poppins', sans-serif" }, callback: function(v) { return v + '%'; } }, grid: { color: 'rgba(0, 255, 255, 0.1)' } },
             x: { ticks: { color: '#cccccc', font: { family: "'Poppins', sans-serif" } }, grid: { color: 'rgba(0, 255, 255, 0.1)' } }
         },
         plugins: {
             legend: { display: false },
             tooltip: {
                 backgroundColor: 'rgba(10, 10, 26, 0.9)', titleColor: '#00ffff', bodyColor: '#cccccc',
                 borderColor: 'rgba(0, 255, 255, 0.5)', borderWidth: 1, padding: 10,
                 callbacks: { label: function(context) { return `${context.dataset.label || ''}: ${context.parsed.y}%`; } }
             },
             title: { display: false }
         },
         interaction: { mode: 'index', intersect: false, }
     };
     try { new Chart(ctx, { type: 'line', data: chartData, options: chartOptions }); console.log(`Chart "${canvasId}" initialized.`); }
     catch(error) { console.error(`Error initializing chart #${canvasId}:`, error); }
}
console.log("charts.js loaded: Dashboard chart functions available.");
