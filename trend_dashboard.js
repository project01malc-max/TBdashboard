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
        childTb: [1352, 3657, 4746],
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
                    padding: 14,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(17,24,39,0.95)',
                titleFont: { family: 'Inter', size: 12, weight: 'bold' },
                bodyFont: { family: 'Inter', size: 11 },
                padding: 10,
                cornerRadius: 8,
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
            },
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
                    padding: { top: 6 },
                },
            },
            y: {
                ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
                grid: { color: COLORS.grid },
                border: { color: COLORS.border },
                beginAtZero: true,
            },
        },
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
                    let x = element.x;
                    let y = element.y - 4;
                    if (y < 25) {
                        y = element.y + 14;
                        ctx.textBaseline = 'top';
                    }
                    ctx.fillText(typeof value === 'number' ? value.toLocaleString() : value, x, y);
                    ctx.restore();
                });
            });
        },
    };

    // ===== Chart Instances Registry =====
    const chartInstances = {};

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
                }],
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
                            },
                        },
                    },
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Registered TB Cases',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' },
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 },
                    },
                },
            },
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
                }],
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
                            },
                        },
                    },
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Number of Patients',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' },
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 },
                    },
                },
            },
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
                }],
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
                            },
                        },
                    },
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Resistant Cases',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' },
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 },
                    },
                },
            },
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
                }],
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
                            },
                        },
                    },
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Patients Tested for HIV',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' },
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 },
                    },
                },
            },
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
                }],
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
                            },
                        },
                    },
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Number of Contacts',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' },
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 },
                    },
                },
            },
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
                }],
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
                            },
                        },
                    },
                },
                scales: {
                    x: { ...chartDefaults.scales.x },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Contacts Initiated on TPT',
                            color: '#64748b',
                            font: { family: 'Inter', size: 11, weight: '600' },
                        },
                        ticks: { ...chartDefaults.scales.y.ticks, precision: 0 },
                    },
                },
            },
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
                renderSparklines();
            }, 300);
        });
    }

    // ===== Sparkline Trend Generator =====
    function drawSparkline(canvasId, data, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = 6;

        if (!data || data.length < 2) return;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min === 0 ? 1 : max - min;

        const points = data.map(function (val, idx) {
            const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((val - min) / range) * (height - 2 * padding);
            return { x: x, y: y, val: val };
        });

        ctx.clearRect(0, 0, width, height);

        // Fill area below trendline
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(points[points.length - 1].x, height);
        ctx.lineTo(points[0].x, height);
        ctx.closePath();

        const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
        fillGradient.addColorStop(0, color + '40');
        fillGradient.addColorStop(1, color + '00');
        ctx.fillStyle = fillGradient;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw data points
        points.forEach(function (pt) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();
        });
    }

    function renderSparklines() {
        drawSparkline('sparkline-opd', DATA.opd, '#06b6d4');
        drawSparkline('sparkline-presumptive', DATA.presumptive, '#3b82f6');
        drawSparkline('sparkline-rr', DATA.rifResistant, '#f43f5e');
        drawSparkline('sparkline-hivpos', DATA.hivPositive, '#ec4899');
        drawSparkline('sparkline-total', DATA.totalCases, '#06b6d4');
        drawSparkline('sparkline-bplus', DATA.bPlus, '#10b981');
        drawSparkline('sparkline-hh', DATA.hhTotal, '#8b5cf6');
        drawSparkline('sparkline-contact', DATA.contactsScreened, '#f59e0b');
        drawSparkline('sparkline-cdiag', DATA.contactsDiagnosed, '#f43f5e');
        drawSparkline('sparkline-child', DATA.childTb, '#f59e0b');
        drawSparkline('sparkline-tpt', DATA.tptInitiated, '#10b981');
        drawSparkline('sparkline-hiv', DATA.hivScreened, '#8b5cf6');
    }

    // ===== Calculate and Display KPI Metrics =====
    function updateKPIs() {
        const formatNum = function (num) {
            return typeof num === 'number' ? num.toLocaleString() : num;
        };
        const formatM = function (num) {
            return (num / 1000000).toFixed(2) + 'M';
        };
        const sum = function (arr) {
            return arr.reduce(function (a, b) { return a + b; }, 0);
        };
        const pctChange = function (current, previous) {
            if (previous === 0) return 'N/A';
            const diff = ((current - previous) / previous * 100);
            const sign = diff > 0 ? '+' : '';
            return sign + diff.toFixed(1) + '%';
        };
        const trendLabel = function (current, previous) {
            if (previous === 0) return '↔️ No Change';
            if (current > previous) return '↗️ +' + pctChange(current, previous);
            if (current < previous) return '↘️ ' + pctChange(current, previous);
            return '↔️ No Change';
        };

        // Elements
        const el = function (id) {
            return document.getElementById(id);
        };

        // Card 1: Total Cases
        const tc23 = DATA.totalCases[0],
            tc24 = DATA.totalCases[1],
            tc25 = DATA.totalCases[2];
        if (el('kpi-total-2025')) el('kpi-total-2025').textContent = formatNum(tc25);
        if (el('kpi-total-2023')) el('kpi-total-2023').textContent = formatNum(tc23);
        if (el('kpi-total-2024')) el('kpi-total-2024').textContent = formatNum(tc24);
        if (el('kpi-total-2025-sub')) el('kpi-total-2025-sub').textContent = formatNum(tc25);
        if (el('kpi-total-grand')) el('kpi-total-grand').textContent = formatNum(sum(DATA.totalCases));
        if (el('kpi-total-trend')) {
            el('kpi-total-trend').textContent = trendLabel(tc25, tc24);
            el('kpi-total-trend').className = 'kpi-trend ' + (tc25 > tc24 ? 'up' : tc25 < tc24 ? 'down' : 'flat');
        }

        // Card 2: Presumptive
        const pr23 = DATA.presumptive[0],
            pr24 = DATA.presumptive[1],
            pr25 = DATA.presumptive[2];
        if (el('kpi-presumptive-2025')) el('kpi-presumptive-2025').textContent = formatNum(pr25);
        if (el('kpi-presumptive-2023')) el('kpi-presumptive-2023').textContent = formatNum(pr23);
        if (el('kpi-presumptive-2024')) el('kpi-presumptive-2024').textContent = formatNum(pr24);
        if (el('kpi-presumptive-2025-sub')) el('kpi-presumptive-2025-sub').textContent = formatNum(pr25);
        if (el('kpi-presumptive-grand')) el('kpi-presumptive-grand').textContent = formatNum(sum(DATA.presumptive));
        if (el('kpi-presumptive-trend')) {
            el('kpi-presumptive-trend').textContent = trendLabel(pr25, pr24);
            el('kpi-presumptive-trend').className = 'kpi-trend ' + (pr25 > pr24 ? 'up' : pr25 < pr24 ? 'down' : 'flat');
        }

        // Card 3: OPD
        const op23 = DATA.opd[0],
            op24 = DATA.opd[1],
            op25 = DATA.opd[2];
        if (el('kpi-opd-2025')) el('kpi-opd-2025').textContent = formatM(op25);
        if (el('kpi-opd-2023')) el('kpi-opd-2023').textContent = formatM(op23);
        if (el('kpi-opd-2024')) el('kpi-opd-2024').textContent = formatM(op24);
        if (el('kpi-opd-2025-sub')) el('kpi-opd-2025-sub').textContent = formatM(op25);
        if (el('kpi-opd-grand')) el('kpi-opd-grand').textContent = formatM(sum(DATA.opd));
        if (el('kpi-opd-trend')) {
            el('kpi-opd-trend').textContent = trendLabel(op25, op24);
            el('kpi-opd-trend').className = 'kpi-trend ' + (op25 > op24 ? 'up' : op25 < op24 ? 'down' : 'flat');
        }

        // Card 4: B+ Confirmed
        const bp23 = DATA.bPlus[0],
            bp24 = DATA.bPlus[1],
            bp25 = DATA.bPlus[2];
        if (el('kpi-bplus-2025')) el('kpi-bplus-2025').textContent = formatNum(bp25);
        if (el('kpi-bplus-2023')) el('kpi-bplus-2023').textContent = formatNum(bp23);
        if (el('kpi-bplus-2024')) el('kpi-bplus-2024').textContent = formatNum(bp24);
        if (el('kpi-bplus-2025-sub')) el('kpi-bplus-2025-sub').textContent = formatNum(bp25);
        if (el('kpi-bplus-grand')) el('kpi-bplus-grand').textContent = formatNum(sum(DATA.bPlus));
        if (el('kpi-bplus-trend')) {
            el('kpi-bplus-trend').textContent = trendLabel(bp25, bp24);
            el('kpi-bplus-trend').className = 'kpi-trend ' + (bp25 > bp24 ? 'up' : bp25 < bp24 ? 'down' : 'flat');
        }

        // Card 5: Rifampicin Resistant
        const rr23 = DATA.rifResistant[0],
            rr24 = DATA.rifResistant[1],
            rr25 = DATA.rifResistant[2];
        if (el('kpi-rr-2025')) el('kpi-rr-2025').textContent = formatNum(rr25);
        if (el('kpi-rr-2023')) el('kpi-rr-2023').textContent = formatNum(rr23);
        if (el('kpi-rr-2024')) el('kpi-rr-2024').textContent = formatNum(rr24);
        if (el('kpi-rr-2025-sub')) el('kpi-rr-2025-sub').textContent = formatNum(rr25);
        if (el('kpi-rr-grand')) el('kpi-rr-grand').textContent = formatNum(sum(DATA.rifResistant));
        if (el('kpi-rr-trend')) {
            el('kpi-rr-trend').textContent = rr25 > rr24 ? '⚠️ +' + ((rr25 - rr24) / rr24 * 100).toFixed(1) + '%' : '✅ ' + ((rr24 - rr25) / rr24 * 100).toFixed(1) + '% decrease';
            el('kpi-rr-trend').className = 'kpi-trend ' + (rr25 > rr24 ? 'flat' : rr25 < rr24 ? 'up' : 'flat');
        }

        // Card 6: HIV Screened
        const hiv23 = DATA.hivScreened[0],
            hiv24 = DATA.hivScreened[1],
            hiv25 = DATA.hivScreened[2];
        if (el('kpi-hiv-2025')) el('kpi-hiv-2025').textContent = formatNum(hiv25);
        if (el('kpi-hiv-2023')) el('kpi-hiv-2023').textContent = formatNum(hiv23);
        if (el('kpi-hiv-2024')) el('kpi-hiv-2024').textContent = formatNum(hiv24);
        if (el('kpi-hiv-2025-sub')) el('kpi-hiv-2025-sub').textContent = formatNum(hiv25);
        if (el('kpi-hiv-grand')) el('kpi-hiv-grand').textContent = formatNum(sum(DATA.hivScreened));
        if (el('kpi-hiv-trend')) {
            el('kpi-hiv-trend').textContent = trendLabel(hiv25, hiv24);
            el('kpi-hiv-trend').className = 'kpi-trend ' + (hiv25 > hiv24 ? 'up' : hiv25 < hiv24 ? 'down' : 'flat');
        }

        // Card 7: Contacts Screened
        const ct23 = DATA.contactsScreened[0],
            ct24 = DATA.contactsScreened[1],
            ct25 = DATA.contactsScreened[2];
        if (el('kpi-contact-2025')) el('kpi-contact-2025').textContent = formatNum(ct25);
        if (el('kpi-contact-2023')) el('kpi-contact-2023').textContent = formatNum(ct23);
        if (el('kpi-contact-2024')) el('kpi-contact-2024').textContent = formatNum(ct24);
        if (el('kpi-contact-2025-sub')) el('kpi-contact-2025-sub').textContent = formatNum(ct25);
        if (el('kpi-contact-grand')) el('kpi-contact-grand').textContent = formatNum(sum(DATA.contactsScreened));
        if (el('kpi-contact-trend')) {
            el('kpi-contact-trend').textContent = trendLabel(ct25, ct24);
            el('kpi-contact-trend').className = 'kpi-trend ' + (ct25 > ct24 ? 'up' : ct25 < ct24 ? 'down' : 'flat');
        }

        // Card 8: TPT Initiated
        const tpt23 = DATA.tptInitiated[0],
            tpt24 = DATA.tptInitiated[1],
            tpt25 = DATA.tptInitiated[2];
        if (el('kpi-tpt-2025')) el('kpi-tpt-2025').textContent = formatNum(tpt25);
        if (el('kpi-tpt-2023')) el('kpi-tpt-2023').textContent = formatNum(tpt23);
        if (el('kpi-tpt-2024')) el('kpi-tpt-2024').textContent = formatNum(tpt24);
        if (el('kpi-tpt-2025-sub')) el('kpi-tpt-2025-sub').textContent = formatNum(tpt25);
        if (el('kpi-tpt-grand')) el('kpi-tpt-grand').textContent = formatNum(sum(DATA.tptInitiated));
        if (el('kpi-tpt-trend')) {
            el('kpi-tpt-trend').textContent = trendLabel(tpt25, tpt24);
            el('kpi-tpt-trend').className = 'kpi-trend ' + (tpt25 > tpt24 ? 'up' : tpt25 < tpt24 ? 'down' : 'flat');
        }

        // Card 9: Childhood TB
        const ch23 = DATA.childTb[0],
            ch24 = DATA.childTb[1],
            ch25 = DATA.childTb[2];
        if (el('kpi-child-2025')) el('kpi-child-2025').textContent = formatNum(ch25);
        if (el('kpi-child-2023')) el('kpi-child-2023').textContent = formatNum(ch23);
        if (el('kpi-child-2024')) el('kpi-child-2024').textContent = formatNum(ch24);
        if (el('kpi-child-2025-sub')) el('kpi-child-2025-sub').textContent = formatNum(ch25);
        if (el('kpi-child-grand')) el('kpi-child-grand').textContent = formatNum(sum(DATA.childTb));
        if (el('kpi-child-trend')) {
            el('kpi-child-trend').textContent = trendLabel(ch25, ch24);
            el('kpi-child-trend').className = 'kpi-trend ' + (ch25 > ch24 ? 'up' : ch25 < ch24 ? 'down' : 'flat');
        }

        // Card 10: HH Total
        const hh23 = DATA.hhTotal[0],
            hh24 = DATA.hhTotal[1],
            hh25 = DATA.hhTotal[2];
        if (el('kpi-hh-2025')) el('kpi-hh-2025').textContent = formatNum(hh25);
        if (el('kpi-hh-2023')) el('kpi-hh-2023').textContent = formatNum(hh23);
        if (el('kpi-hh-2024')) el('kpi-hh-2024').textContent = formatNum(hh24);
        if (el('kpi-hh-2025-sub')) el('kpi-hh-2025-sub').textContent = formatNum(hh25);
        if (el('kpi-hh-grand')) el('kpi-hh-grand').textContent = formatNum(sum(DATA.hhTotal));
        if (el('kpi-hh-trend')) {
            el('kpi-hh-trend').textContent = trendLabel(hh25, hh24);
            el('kpi-hh-trend').className = 'kpi-trend ' + (hh25 > hh24 ? 'up' : hh25 < hh24 ? 'down' : 'flat');
        }

        // Card 11: Contacts Diagnosed
        const cd23 = DATA.contactsDiagnosed[0],
            cd24 = DATA.contactsDiagnosed[1],
            cd25 = DATA.contactsDiagnosed[2];
        if (el('kpi-cdiag-2025')) el('kpi-cdiag-2025').textContent = formatNum(cd25);
        if (el('kpi-cdiag-2023')) el('kpi-cdiag-2023').textContent = formatNum(cd23);
        if (el('kpi-cdiag-2024')) el('kpi-cdiag-2024').textContent = formatNum(cd24);
        if (el('kpi-cdiag-2025-sub')) el('kpi-cdiag-2025-sub').textContent = formatNum(cd25);
        if (el('kpi-cdiag-grand')) el('kpi-cdiag-grand').textContent = formatNum(sum(DATA.contactsDiagnosed));
        if (el('kpi-cdiag-trend')) {
            el('kpi-cdiag-trend').textContent = trendLabel(cd25, cd24);
            el('kpi-cdiag-trend').className = 'kpi-trend ' + (cd25 > cd24 ? 'up' : cd25 < cd24 ? 'down' : 'flat');
        }

        // Card 12: HIV Positive TB Patients
        const hp23 = DATA.hivPositive[0],
            hp24 = DATA.hivPositive[1],
            hp25 = DATA.hivPositive[2];
        if (el('kpi-hivpos-2025')) el('kpi-hivpos-2025').textContent = formatNum(hp25);
        if (el('kpi-hivpos-2023')) el('kpi-hivpos-2023').textContent = formatNum(hp23);
        if (el('kpi-hivpos-2024')) el('kpi-hivpos-2024').textContent = formatNum(hp24);
        if (el('kpi-hivpos-2025-sub')) el('kpi-hivpos-2025-sub').textContent = formatNum(hp25);
        if (el('kpi-hivpos-grand')) el('kpi-hivpos-grand').textContent = formatNum(sum(DATA.hivPositive));
        if (el('kpi-hivpos-trend')) {
            el('kpi-hivpos-trend').textContent = trendLabel(hp25, hp24);
            el('kpi-hivpos-trend').className = 'kpi-trend ' + (hp25 > hp24 ? 'up' : hp25 < hp24 ? 'down' : 'flat');
        }
    }

    // ===== Initialize Dashboard =====
    function init() {
        updateKPIs();
        renderSparklines();
        initCharts();
        initMobileToggle();
        initNavigation();
        initResizeHandler();
        console.log('✅ TB-07 Trend Analysis Dashboard loaded successfully.');
        console.log('📊 Data summary:', DATA);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();