/* ============================================
   TB-07 Trend Analysis Dashboard (2023-2025)
   Consolidated Data from All Projects
   ============================================ */

(function () {
    'use strict';

    // ===== Consolidated Data (From All Project Total sheets) =====
    const DATA = {
        years: ['2023', '2024', '2025'],

        // Block 1: Case Registration
        totalCases: [12841, 13340, 14813],
        male: [6654, 7023, 7652],
        female: [6100, 6219, 7083],

        // Block 3: Diagnostic Cascade
        presumptive: [54725, 57679, 65788],
        bPlus: [4910, 4436, 5317],
        opd: [2045733, 2201101, 2913637],

        // Block 4: HIV
        hivScreened: [646, 635, 2186],
        hivPositive: [0, 4, 33],
        art: [0, 4, 2],

        // Block 5: DST
        rifTested: [4008, 3763, 4208],
        rifResistant: [17, 12, 19],
        inhTested: [1, 34, 90],
        inhResistant: [1, 0, 0],
        flqTested: [0, 0, 23],
        flqResistant: [2, 0, 0],

        // Block 6: Contact Tracing & TPT
        hhTotal: [5031, 25522, 26002],
        contactsScreened: [17994, 19618, 21486],
        contactsDiagnosed: [3615, 729, 946],
        tptInitiated: [79, 694, 2131],
    };

    // ===== Chart Color Palette =====
    const COLORS = {
        cyan: '#06b6d4',
        cyanBg: 'rgba(6, 182, 212, 0.2)',
        pink: '#ec4899',
        pinkBg: 'rgba(236, 72, 153, 0.2)',
        green: '#10b981',
        greenBg: 'rgba(16, 185, 129, 0.2)',
        amber: '#f59e0b',
        amberBg: 'rgba(245, 158, 11, 0.2)',
        rose: '#f43f5e',
        roseBg: 'rgba(244, 63, 94, 0.2)',
        purple: '#8b5cf6',
        purpleBg: 'rgba(139, 92, 246, 0.2)',
        blue: '#3b82f6',
        blueBg: 'rgba(59, 130, 246, 0.2)',
        grid: 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.06)',
    };

    // ===== Chart Defaults =====
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#94a3b8',
                    font: { family: 'Inter', size: 11 },
                    boxWidth: 12,
                    padding: 14
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17,24,39,0.95)',
                titleFont: { family: 'Inter', size: 12, weight: 'bold' },
                bodyFont: { family: 'Inter', size: 11 },
                padding: 10,
                cornerRadius: 8,
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
            }
        },
        scales: {
            x: {
                ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
                grid: { color: COLORS.grid },
                border: { color: COLORS.border },
                title: {
                    display: true,
                    text: 'Year',
                    color: '#64748b',
                    font: { family: 'Inter', size: 11, weight: '600' },
                    padding: { top: 6 }
                }
            },
            y: {
                ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
                grid: { color: COLORS.grid },
                border: { color: COLORS.border },
                beginAtZero: true,
            }
        }
    };

    // ===== Custom Data Value Labels Plugin =====
    const valueLabelsPlugin = {
        id: 'valueLabelsPlugin',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                if (meta.hidden) return;

                meta.data.forEach((element, index) => {
                    const value = dataset.data[index];
                    if (value === undefined || value === null) return;

                    ctx.save();
                    ctx.font = '600 10px Inter, sans-serif';
                    ctx.fillStyle = dataset.borderColor || dataset.backgroundColor || '#cbd5e1';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';

                    let formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
                    let x = element.x;
                    let y = element.y - 4;

                    // If point or bar top is near canvas top margin, adjust label baseline
                    if (y < 25) {
                        y = element.y + 14;
                        ctx.textBaseline = 'top';
                    }

                    ctx.fillText(formattedValue, x, y);
                    ctx.restore();
                });
            });
        }
    };

    // ===== Chart Instances Registry =====
    const chartInstances = {};

    // ===== Destroy Chart Helper =====
    function destroyChart(key) {
        if (chartInstances[key]) {
            chartInstances[key].destroy();
            delete chartInstances[key];
        }
    }

    // ===== 1. Case Notification Trend =====
    function renderCasesChart() {
        destroyChart('cases');
        const ctx = document.getElementById('chart-cases');
        if (!ctx) return;

        chartInstances['cases'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: DATA.years,
                datasets: [{
                    label: 'Total Cases',
                    data: DATA.totalCases,
                    borderColor: COLORS.cyan,
                    backgroundColor: COLORS.cyanBg,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: COLORS.cyan,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                }]
            },
            plugins: [valueLabelsPlugin],
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    tooltip: {
                        ...chartDefaults.plugins.tooltip,
                        callbacks: {
                            label: function (ctx) {
                                return ' ' + ctx.raw.toLocaleString() + ' cases';
                            }
                        }
                    }
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Registered TB Cases',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' }
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 }
                    }
                }
            }
        });
    }

    // ===== 2. Diagnostic Cascade =====
    function renderDiagnosticChart() {
        destroyChart('diagnostic');
        const ctx = document.getElementById('chart-diagnostic');
        if (!ctx) return;

        chartInstances['diagnostic'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: DATA.years,
                datasets: [{
                    label: 'Presumptive Cases',
                    data: DATA.presumptive,
                    backgroundColor: COLORS.blueBg,
                    borderColor: COLORS.blue,
                    borderWidth: 2,
                    borderRadius: 4,
                }, {
                    label: 'B+ Confirmed',
                    data: DATA.bPlus,
                    backgroundColor: COLORS.greenBg,
                    borderColor: COLORS.green,
                    borderWidth: 2,
                    borderRadius: 4,
                }]
            },
            plugins: [valueLabelsPlugin],
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    tooltip: {
                        ...chartDefaults.plugins.tooltip,
                        callbacks: {
                            label: function (ctx) {
                                return ' ' + ctx.dataset.label + ': ' + ctx.raw.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Number of Patients',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' }
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 }
                    }
                }
            }
        });
    }

    // ===== 3. Drug Resistance =====
    function renderDstChart() {
        destroyChart('dst');
        const ctx = document.getElementById('chart-dst');
        if (!ctx) return;

        chartInstances['dst'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: DATA.years,
                datasets: [{
                    label: 'Rifampicin Resistant',
                    data: DATA.rifResistant,
                    backgroundColor: COLORS.roseBg,
                    borderColor: COLORS.rose,
                    borderWidth: 2,
                    borderRadius: 4,
                }, {
                    label: 'Isoniazid Resistant',
                    data: DATA.inhResistant,
                    backgroundColor: COLORS.amberBg,
                    borderColor: COLORS.amber,
                    borderWidth: 2,
                    borderRadius: 4,
                }, {
                    label: 'Fluoroquinolone Resistant',
                    data: DATA.flqResistant,
                    backgroundColor: COLORS.purpleBg,
                    borderColor: COLORS.purple,
                    borderWidth: 2,
                    borderRadius: 4,
                }]
            },
            plugins: [valueLabelsPlugin],
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    tooltip: {
                        ...chartDefaults.plugins.tooltip,
                        callbacks: {
                            label: function (ctx) {
                                return ' ' + ctx.dataset.label + ': ' + ctx.raw + ' cases';
                            }
                        }
                    }
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Resistant Cases',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' }
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 }
                    }
                }
            }
        });
    }

    // ===== 4. HIV Screening =====
    function renderHivChart() {
        destroyChart('hiv');
        const ctx = document.getElementById('chart-hiv');
        if (!ctx) return;

        chartInstances['hiv'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: DATA.years,
                datasets: [{
                    label: 'TB Patients Tested for HIV',
                    data: DATA.hivScreened,
                    backgroundColor: COLORS.pinkBg,
                    borderColor: COLORS.pink,
                    borderWidth: 2,
                    borderRadius: 4,
                }]
            },
            plugins: [valueLabelsPlugin],
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    tooltip: {
                        ...chartDefaults.plugins.tooltip,
                        callbacks: {
                            label: function (ctx) {
                                return ' ' + ctx.raw.toLocaleString() + ' patients';
                            }
                        }
                    }
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Patients Tested for HIV',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' }
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 }
                    }
                }
            }
        });
    }

    // ===== 5. Contact Tracing =====
    function renderContactChart() {
        destroyChart('contact');
        const ctx = document.getElementById('chart-contact');
        if (!ctx) return;

        chartInstances['contact'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: DATA.years,
                datasets: [{
                    label: 'HH Contacts Screened',
                    data: DATA.contactsScreened,
                    backgroundColor: COLORS.cyanBg,
                    borderColor: COLORS.cyan,
                    borderWidth: 2,
                    borderRadius: 4,
                }, {
                    label: 'Contacts Diagnosed with TB',
                    data: DATA.contactsDiagnosed,
                    backgroundColor: COLORS.roseBg,
                    borderColor: COLORS.rose,
                    borderWidth: 2,
                    borderRadius: 4,
                }]
            },
            plugins: [valueLabelsPlugin],
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    tooltip: {
                        ...chartDefaults.plugins.tooltip,
                        callbacks: {
                            label: function (ctx) {
                                return ' ' + ctx.dataset.label + ': ' + ctx.raw;
                            }
                        }
                    }
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Number of Contacts',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' }
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 }
                    }
                }
            }
        });
    }

    // ===== 6. TPT Initiation =====
    function renderTptChart() {
        destroyChart('tpt');
        const ctx = document.getElementById('chart-tpt');
        if (!ctx) return;

        chartInstances['tpt'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: DATA.years,
                datasets: [{
                    label: 'Contacts on TPT',
                    data: DATA.tptInitiated,
                    backgroundColor: COLORS.greenBg,
                    borderColor: COLORS.green,
                    borderWidth: 2,
                    borderRadius: 4,
                }]
            },
            plugins: [valueLabelsPlugin],
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    tooltip: {
                        ...chartDefaults.plugins.tooltip,
                        callbacks: {
                            label: function (ctx) {
                                return ' ' + ctx.raw + ' contacts';
                            }
                        }
                    }
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Contacts Initiated on TPT',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' }
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 }
                    }
                }
            }
        });
    }

    // ===== Initialize All Charts =====
    function initCharts() {
        renderCasesChart();
        renderDiagnosticChart();
        renderDstChart();
        renderHivChart();
        renderContactChart();
        renderTptChart();
    }

    // ===== Mobile Sidebar Toggle =====
    function initMobileToggle() {
        const toggle = document.getElementById('mobile-toggle');
        const sidebar = document.getElementById('sidebar');

        if (toggle && sidebar) {
            toggle.addEventListener('click', function () {
                sidebar.classList.toggle('visible');
            });

            document.addEventListener('click', function (e) {
                if (!sidebar.contains(e.target) && e.target !== toggle && sidebar.classList.contains('visible')) {
                    sidebar.classList.remove('visible');
                }
            });
        }
    }

    // ===== Navigation Smooth Scroll =====
    function initNavigation() {
        document.querySelectorAll('.nav-link[data-section]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('data-section');
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
                document.querySelectorAll('.nav-link').forEach(function (l) {
                    l.classList.remove('active');
                });
                this.classList.add('active');

                // Close sidebar on mobile
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.remove('visible');
                }
            });
        });
    }

    // ===== Window Resize Handler =====
    function initResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                Object.values(chartInstances).forEach(function (chart) {
                    if (chart && chart.resize) {
                        chart.resize();
                    }
                });
            }, 300);
        });
    }

    // ===== Calculate and Display KPI Metrics =====
    function updateKPIs() {
        const formatNum = (num) => typeof num === 'number' ? num.toLocaleString() : num;
        const formatM = (num) => (num / 1000000).toFixed(2) + 'M';
        const sum = (arr) => arr.reduce((a, b) => a + b, 0);

        // Elements to update dynamically
        const elements = {
            // Card 1: Total Cases
            'kpi-total-2025': formatNum(DATA.totalCases[2]),
            'kpi-total-2023': formatNum(DATA.totalCases[0]),
            'kpi-total-2024': formatNum(DATA.totalCases[1]),
            'kpi-total-2025-sub': formatNum(DATA.totalCases[2]),
            'kpi-total-grand': formatNum(sum(DATA.totalCases)),

            // Card 2: Presumptive Cases
            'kpi-presumptive-2025': formatNum(DATA.presumptive[2]),
            'kpi-presumptive-2023': formatNum(DATA.presumptive[0]),
            'kpi-presumptive-2024': formatNum(DATA.presumptive[1]),
            'kpi-presumptive-2025-sub': formatNum(DATA.presumptive[2]),
            'kpi-presumptive-grand': formatNum(sum(DATA.presumptive)),

            // Card 3: OPD Attendance
            'kpi-opd-2025': formatM(DATA.opd[2]),
            'kpi-opd-2023': formatM(DATA.opd[0]),
            'kpi-opd-2024': formatM(DATA.opd[1]),
            'kpi-opd-2025-sub': formatM(DATA.opd[2]),
            'kpi-opd-grand': formatM(sum(DATA.opd)),

            // Card 4: B+ Confirmed
            'kpi-bplus-2025': formatNum(DATA.bPlus[2]),
            'kpi-bplus-2023': formatNum(DATA.bPlus[0]),
            'kpi-bplus-2024': formatNum(DATA.bPlus[1]),
            'kpi-bplus-2025-sub': formatNum(DATA.bPlus[2]),
            'kpi-bplus-grand': formatNum(sum(DATA.bPlus)),

            // Card 5: Rifampicin Resistant
            'kpi-rr-tb': formatNum(DATA.rifResistant[2]),
            'kpi-rr-2023': formatNum(DATA.rifResistant[0]),
            'kpi-rr-2024': formatNum(DATA.rifResistant[1]),
            'kpi-rr-2025-sub': formatNum(DATA.rifResistant[2]),
            'kpi-rr-grand': formatNum(sum(DATA.rifResistant)),

            // Card 6: HIV Screened
            'kpi-hiv-screened': formatNum(DATA.hivScreened[2]),
            'kpi-hiv-2023': formatNum(DATA.hivScreened[0]),
            'kpi-hiv-2024': formatNum(DATA.hivScreened[1]),
            'kpi-hiv-2025-sub': formatNum(DATA.hivScreened[2]),
            'kpi-hiv-grand': formatNum(sum(DATA.hivScreened)),

            // Card 7: Contacts Screened
            'kpi-contact-screened': formatNum(DATA.contactsScreened[2]),
            'kpi-contact-2023': formatNum(DATA.contactsScreened[0]),
            'kpi-contact-2024': formatNum(DATA.contactsScreened[1]),
            'kpi-contact-2025-sub': formatNum(DATA.contactsScreened[2]),
            'kpi-contact-grand': formatNum(sum(DATA.contactsScreened)),

            // Card 8: TPT Initiated
            'kpi-tpt': formatNum(DATA.tptInitiated[2]),
            'kpi-tpt-2023': formatNum(DATA.tptInitiated[0]),
            'kpi-tpt-2024': formatNum(DATA.tptInitiated[1]),
            'kpi-tpt-2025-sub': formatNum(DATA.tptInitiated[2]),
            'kpi-tpt-grand': formatNum(sum(DATA.tptInitiated)),
        };

        Object.keys(elements).forEach(function (id) {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = elements[id];
            }
        });
    }

    // ===== Initialize Dashboard =====
    function init() {
        updateKPIs();
        initCharts();
        initMobileToggle();
        initNavigation();
        initResizeHandler();

        console.log('✅ TB-07 Trend Analysis Dashboard loaded successfully.');
        console.log('📊 Data summary:', DATA);
    }

    // ===== Run on DOM Ready =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();