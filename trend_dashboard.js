/* ============================================
   TB-07 Trend Analysis Dashboard (2023-2026)
   Consolidated Data from All Projects
   With Interactive Multi-Select Year Checkboxes
   ============================================ */

(function () {
    'use strict';

    // ===== Consolidated Data (From All Project Total sheets) =====
    const DATA = {
        years: ['2023', '2024', '2025', '2026 (6M)'],
        yearsKey: ['2023', '2024', '2025', '2026'],

        // Block 1: Case Registration
        totalCases: [12841, 13340, 14813, 6466],
        male: [6654, 7023, 7652, 3313],
        female: [6100, 6219, 7083, 3135],

        // Block 3: Diagnostic Cascade
        presumptive: [54725, 57679, 65788, 28282],
        bPlus: [4910, 4436, 5317, 1928],
        opd: [2045733, 2201101, 2913637, 1316743],

        // Block 4: HIV
        hivScreened: [646, 635, 2186, 2186],
        hivPositive: [0, 4, 33, 3],
        art: [0, 4, 2, 2],

        // Block 5: DST
        rifTested: [4008, 3763, 4208, 1790],
        rifResistant: [17, 12, 19, 4],
        inhTested: [1, 34, 90, 30],
        inhResistant: [1, 0, 0, 0],
        flqTested: [0, 0, 23, 0],
        flqResistant: [2, 0, 0, 0],

        // Block 6: Contact Tracing & TPT
        hhTotal: [5031, 25522, 26002, 10489],
        contactsScreened: [17994, 19618, 21486, 7977],
        contactsDiagnosed: [3615, 729, 946, 353],
        tptInitiated: [79, 694, 2131, 605],
        childTb: [1352, 3657, 4746, 1807],
    };

    // Active Selected Years Array (default: all 4 years)
    let selectedYears = ['2023', '2024', '2025', '2026'];

    // Helper functions to get filtered data and labels based on selection
    function getFilteredLabels() {
        return DATA.yearsKey
            .map((y, idx) => selectedYears.includes(y) ? DATA.years[idx] : null)
            .filter(val => val !== null);
    }

    function getFilteredData(dataArray) {
        return DATA.yearsKey
            .map((y, idx) => selectedYears.includes(y) ? dataArray[idx] : null)
            .filter(val => val !== null);
    }

    // ===== Chart Color Palette =====
    const COLORS = {
        cyan: '#06b6d4',
        cyanBg: 'rgba(6, 182, 212, 0.25)',
        pink: '#ec4899',
        pinkBg: 'rgba(236, 72, 153, 0.25)',
        green: '#10b981',
        greenBg: 'rgba(16, 185, 129, 0.25)',
        amber: '#f59e0b',
        amberBg: 'rgba(245, 158, 11, 0.25)',
        rose: '#f43f5e',
        roseBg: 'rgba(244, 63, 94, 0.25)',
        purple: '#8b5cf6',
        purpleBg: 'rgba(139, 92, 246, 0.25)',
        blue: '#3b82f6',
        blueBg: 'rgba(59, 130, 246, 0.25)',
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
                    ctx.fillStyle = Array.isArray(dataset.borderColor) ? dataset.borderColor[index] : (dataset.borderColor || dataset.backgroundColor || '#cbd5e1');
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

        const filteredLabels = getFilteredLabels();
        const filteredData = getFilteredData(DATA.totalCases);

        chartInstances['cases'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: filteredLabels,
                datasets: [{
                    label: 'Total Cases',
                    data: filteredData,
                    borderColor: COLORS.cyan,
                    backgroundColor: COLORS.cyanBg,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: COLORS.cyan,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 9,
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
                                return ' ' + ctx.raw.toLocaleString() + ' cases' + (ctx.label.includes('2026') ? ' (Jan–Jun)' : '');
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

        const filteredLabels = getFilteredLabels();
        const presumptiveData = getFilteredData(DATA.presumptive);
        const bPlusData = getFilteredData(DATA.bPlus);

        chartInstances['diagnostic'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filteredLabels,
                datasets: [{
                    label: 'Presumptive Cases',
                    data: presumptiveData,
                    backgroundColor: COLORS.blueBg,
                    borderColor: COLORS.blue,
                    borderWidth: 2,
                    borderRadius: 4,
                }, {
                    label: 'B+ Confirmed',
                    data: bPlusData,
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

        const filteredLabels = getFilteredLabels();

        chartInstances['dst'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filteredLabels,
                datasets: [{
                    label: 'Rifampicin Resistant',
                    data: getFilteredData(DATA.rifResistant),
                    backgroundColor: COLORS.roseBg,
                    borderColor: COLORS.rose,
                    borderWidth: 2,
                    borderRadius: 4,
                }, {
                    label: 'Isoniazid Resistant',
                    data: getFilteredData(DATA.inhResistant),
                    backgroundColor: COLORS.amberBg,
                    borderColor: COLORS.amber,
                    borderWidth: 2,
                    borderRadius: 4,
                }, {
                    label: 'Fluoroquinolone Resistant',
                    data: getFilteredData(DATA.flqResistant),
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
                labels: getFilteredLabels(),
                datasets: [{
                    label: 'TB Patients Tested for HIV',
                    data: getFilteredData(DATA.hivScreened),
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
                                return ' ' + ctx.raw.toLocaleString() + ' patients' + (ctx.label.includes('2026') ? ' (Jan–Jun)' : '');
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
                labels: getFilteredLabels(),
                datasets: [{
                    label: 'HH Contacts Screened',
                    data: getFilteredData(DATA.contactsScreened),
                    backgroundColor: COLORS.cyanBg,
                    borderColor: COLORS.cyan,
                    borderWidth: 2,
                    borderRadius: 4,
                }, {
                    label: 'Contacts Diagnosed with TB',
                    data: getFilteredData(DATA.contactsDiagnosed),
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
                labels: getFilteredLabels(),
                datasets: [{
                    label: 'Contacts on TPT',
                    data: getFilteredData(DATA.tptInitiated),
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
                                return ' ' + ctx.raw.toLocaleString() + ' contacts' + (ctx.label.includes('2026') ? ' (Jan–Jun)' : '');
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

        ctx.clearRect(0, 0, width, height);
        if (!data || data.length === 0) return;

        if (data.length === 1) {
            // Single point
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.fill();
            ctx.stroke();
            return;
        }

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min === 0 ? 1 : max - min;

        const points = data.map(function (val, idx) {
            const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((val - min) / range) * (height - 2 * padding);
            return { x: x, y: y, val: val };
        });

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
        points.forEach(function (pt, idx) {
            const isLast = (idx === points.length - 1);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, isLast ? 4 : 2.5, 0, Math.PI * 2);
            ctx.fillStyle = isLast ? '#ffffff' : '#e2e8f0';
            ctx.strokeStyle = isLast ? '#38bdf8' : color;
            ctx.lineWidth = isLast ? 2 : 1.5;
            ctx.fill();
            ctx.stroke();
        });
    }

    function renderSparklines() {
        drawSparkline('sparkline-opd', getFilteredData(DATA.opd), '#06b6d4');
        drawSparkline('sparkline-presumptive', getFilteredData(DATA.presumptive), '#3b82f6');
        drawSparkline('sparkline-rr', getFilteredData(DATA.rifResistant), '#f43f5e');
        drawSparkline('sparkline-hivpos', getFilteredData(DATA.hivPositive), '#ec4899');
        drawSparkline('sparkline-total', getFilteredData(DATA.totalCases), '#06b6d4');
        drawSparkline('sparkline-bplus', getFilteredData(DATA.bPlus), '#10b981');
        drawSparkline('sparkline-hh', getFilteredData(DATA.hhTotal), '#8b5cf6');
        drawSparkline('sparkline-contact', getFilteredData(DATA.contactsScreened), '#f59e0b');
        drawSparkline('sparkline-cdiag', getFilteredData(DATA.contactsDiagnosed), '#f43f5e');
        drawSparkline('sparkline-child', getFilteredData(DATA.childTb), '#f59e0b');
        drawSparkline('sparkline-tpt', getFilteredData(DATA.tptInitiated), '#10b981');
        drawSparkline('sparkline-hiv', getFilteredData(DATA.hivScreened), '#8b5cf6');
    }

    // ===== Calculate and Display KPI Metrics =====
    function updateKPIs() {
        const isAll = (selectedYears.length === 4);
        const isSingle = (selectedYears.length === 1);

        // Find latest selected year key and index
        const latestYear = selectedYears[selectedYears.length - 1];
        const latestIdx = DATA.yearsKey.indexOf(latestYear);

        const formatNum = function (num) {
            return typeof num === 'number' ? num.toLocaleString() : num;
        };
        const formatM = function (num) {
            return (num / 1000000).toFixed(2) + 'M';
        };

        // Sum of currently selected years
        const sumSelected = function (arr) {
            return DATA.yearsKey.reduce((acc, y, i) => selectedYears.includes(y) ? acc + arr[i] : acc, 0);
        };

        const getTrend = function(metricArr) {
            if (isSingle) {
                if (latestYear === '2023') return { text: '📌 Baseline (2023)', type: 'flat' };
                const curr = metricArr[latestIdx];
                const prev = metricArr[latestIdx - 1];
                if (latestYear === '2026') {
                    const diff = ((curr * 2 - prev) / prev * 100);
                    return {
                        text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% pace (H1)`,
                        type: curr * 2 >= prev ? 'up' : 'down'
                    };
                }
                const diff = ((curr - prev) / prev * 100);
                return {
                    text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs '${['23','24','25'][latestIdx-1]}`,
                    type: curr >= prev ? 'up' : 'down'
                };
            }
            // Multi-year comparison between latest two in selection
            if (selectedYears.length >= 2) {
                const prevYear = selectedYears[selectedYears.length - 2];
                const prevIdx = DATA.yearsKey.indexOf(prevYear);
                const curr = metricArr[latestIdx];
                const prev = metricArr[prevIdx];
                if (latestYear === '2026') {
                    const diff = ((curr * 2 - prev) / prev * 100);
                    return {
                        text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% pace vs '${prevYear.slice(2)}`,
                        type: curr * 2 >= prev ? 'up' : 'down'
                    };
                }
                const diff = ((curr - prev) / prev * 100);
                return {
                    text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs '${prevYear.slice(2)}`,
                    type: curr >= prev ? 'up' : 'down'
                };
            }
            return { text: 'Selected View', type: 'flat' };
        };

        const getResistanceTrend = function(metricArr) {
            if (isSingle && latestYear === '2023') return { text: '📌 Baseline (2023)', type: 'flat' };
            const curr = metricArr[latestIdx];
            if (selectedYears.length >= 2) {
                const prevYear = selectedYears[selectedYears.length - 2];
                const prevIdx = DATA.yearsKey.indexOf(prevYear);
                const prev = metricArr[prevIdx];
                if (latestYear === '2026') {
                    const diff = ((curr * 2 - prev) / prev * 100);
                    return {
                        text: curr * 2 <= prev ? `✅ ${Math.abs(diff).toFixed(1)}% lower pace` : `⚠️ +${diff.toFixed(1)}% pace`,
                        type: curr * 2 <= prev ? 'up' : 'flat'
                    };
                }
                const diff = ((curr - prev) / prev * 100);
                return {
                    text: curr <= prev ? `✅ ${Math.abs(diff).toFixed(1)}% decrease` : `⚠️ +${diff.toFixed(1)}% increase`,
                    type: curr <= prev ? 'up' : 'flat'
                };
            }
            return { text: curr + ' cases', type: 'up' };
        };

        const el = function (id) {
            return document.getElementById(id);
        };

        // Determine Card label text
        let cardLabelSuffix;
        if (isAll) {
            cardLabelSuffix = '(2026 Jan–Jun)';
        } else if (isSingle) {
            cardLabelSuffix = latestYear === '2026' ? '(2026 Jan–Jun)' : `(${latestYear})`;
        } else {
            cardLabelSuffix = latestYear === '2026' ? '(2026 Jan–Jun)' : `(${latestYear})`;
        }

        function setCard(idPrefix, labelName, arr, isResistance, isMillion) {
            const valEl = el(`kpi-${idPrefix}-2026`);
            const lblEl = el(`label-${idPrefix}`);
            const trendEl = el(`kpi-${idPrefix}-trend`);

            const val = arr[latestIdx];
            if (valEl) valEl.textContent = isMillion ? formatM(val) : formatNum(val);
            if (lblEl) lblEl.textContent = `${labelName} ${cardLabelSuffix}`;

            if (trendEl) {
                let trendInfo;
                if (idPrefix === 'hivpos' && latestIdx === 3) {
                    trendInfo = { text: '3 cases (2 on ART)', type: 'up' };
                } else if (idPrefix === 'tpt' && latestIdx === 3) {
                    trendInfo = { text: '605 in H1 (3HP: 458)', type: 'up' };
                } else if (idPrefix === 'hiv' && latestIdx === 3) {
                    trendInfo = { text: '2,186 in H1 (+100% pace)', type: 'up' };
                } else if (isResistance) {
                    trendInfo = getResistanceTrend(arr);
                } else {
                    trendInfo = getTrend(arr);
                }
                trendEl.textContent = trendInfo.text;
                trendEl.className = 'kpi-trend ' + trendInfo.type;
            }

            // Sub values
            const sub23 = el(`kpi-${idPrefix}-2023`);
            const sub24 = el(`kpi-${idPrefix}-2024`);
            const sub25 = el(`kpi-${idPrefix}-2025`);
            const sub26 = el(`kpi-${idPrefix}-2026-sub`);
            const grand = el(`kpi-${idPrefix}-grand`);

            if (sub23) sub23.textContent = isMillion ? formatM(arr[0]) : formatNum(arr[0]);
            if (sub24) sub24.textContent = isMillion ? formatM(arr[1]) : formatNum(arr[1]);
            if (sub25) sub25.textContent = isMillion ? formatM(arr[2]) : formatNum(arr[2]);
            if (sub26) sub26.textContent = isMillion ? formatM(arr[3]) : formatNum(arr[3]);
            if (grand) grand.textContent = isMillion ? formatM(sumSelected(arr)) : formatNum(sumSelected(arr));
        }

        // Card 1 to 12
        setCard('opd', 'OPD Attendance', DATA.opd, false, true);
        setCard('presumptive', 'Presumptive Cases', DATA.presumptive, false, false);
        setCard('rr', 'Rifampicin Resistant', DATA.rifResistant, true, false);
        setCard('hivpos', 'HIV+ TB Patients', DATA.hivPositive, false, false);
        setCard('total', 'Total Cases', DATA.totalCases, false, false);
        setCard('bplus', 'B+ Confirmed', DATA.bPlus, false, false);
        setCard('hh', 'Total HH of B+PTB', DATA.hhTotal, false, false);
        setCard('contact', 'Contacts Screened', DATA.contactsScreened, false, false);
        setCard('cdiag', 'HH Contacts Diagnosed', DATA.contactsDiagnosed, false, false);
        setCard('child', 'Childhood TB (&lt;15 yrs)', DATA.childTb, false, false);
        setCard('tpt', 'TPT Initiated', DATA.tptInitiated, false, false);
        setCard('hiv', 'HIV Screened', DATA.hivScreened, false, false);

        // Update breakdown styling: highlight selected years and dim unselected
        document.querySelectorAll('.kpi-breakdown-item').forEach(item => {
            const itemYear = item.getAttribute('data-year');
            if (itemYear === 'total') return;
            if (!selectedYears.includes(itemYear)) {
                item.classList.add('dimmed');
                item.classList.remove('current');
            } else if (itemYear === latestYear) {
                item.classList.remove('dimmed');
                item.classList.add('current');
            } else {
                item.classList.remove('dimmed');
                item.classList.remove('current');
            }
        });

        // Update Top Bar Badges and Subtitle
        const subtitleEl = el('trend-subtitle');
        const badgeSpan = el('badge-span');
        const badgeYear = el('badge-year');
        if (subtitleEl) {
            if (isAll) {
                subtitleEl.textContent = 'Consolidated data from All Projects Total sheets (2023–2026)';
            } else if (isSingle) {
                subtitleEl.textContent = `Consolidated data for ${latestYear} — Selected Year Analysis`;
            } else {
                subtitleEl.textContent = `Comparing selected years: ${selectedYears.join(', ')} (Consolidated data)`;
            }
        }
        if (badgeSpan) {
            badgeSpan.textContent = isAll ? '4 Years' : `${selectedYears.length} Years Selected`;
        }
        if (badgeYear) {
            if (isAll) {
                badgeYear.textContent = '2023–2026 (Jan–Jun Semi-Annual)';
            } else {
                badgeYear.textContent = selectedYears.join(', ') + (selectedYears.includes('2026') ? ' (H1)' : '');
            }
        }
    }

    // ===== Multi-Select Checkbox Dropdown Controller =====
    function initMultiSelectDropdown() {
        const btn = document.getElementById('year-dropdown-btn');
        const btnText = document.getElementById('year-dropdown-text');
        const menu = document.getElementById('year-dropdown-menu');
        const chkAll = document.getElementById('chk-all');
        const yearCheckboxes = document.querySelectorAll('.year-chk');
        const btnReset = document.getElementById('btn-reset-years');

        if (!btn || !menu) return;

        // Toggle dropdown open/close
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = menu.classList.contains('visible');
            if (isOpen) {
                menu.classList.remove('visible');
                btn.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            } else {
                menu.classList.add('visible');
                btn.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                menu.classList.remove('visible');
                btn.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });

        function updateDropdownText() {
            if (selectedYears.length === 4) {
                btnText.textContent = 'All Years (2023–2026)';
            } else if (selectedYears.length === 1) {
                btnText.textContent = selectedYears[0] === '2026' ? '2026 (Jan–Jun)' : `${selectedYears[0]} Analysis`;
            } else {
                const shortYears = selectedYears.map(y => "'" + y.slice(2)).join(', ');
                btnText.textContent = `${shortYears} (${selectedYears.length} Years)`;
            }
        }

        function syncFromCheckboxes() {
            const checked = [];
            yearCheckboxes.forEach(chk => {
                if (chk.checked) checked.push(chk.value);
            });

            // Prevent unchecking all: keep at least one
            if (checked.length === 0) {
                return;
            }

            // Maintain chronological order: 2023, 2024, 2025, 2026
            selectedYears = ['2023', '2024', '2025', '2026'].filter(y => checked.includes(y));

            // Sync 'Select All' checkbox
            if (chkAll) {
                chkAll.checked = (selectedYears.length === 4);
            }

            updateDropdownText();
            updateKPIs();
            initCharts();
            renderSparklines();
        }

        // 'Select All' Checkbox
        if (chkAll) {
            chkAll.addEventListener('change', function () {
                const isChecked = chkAll.checked;
                yearCheckboxes.forEach(chk => {
                    chk.checked = isChecked;
                });
                if (isChecked) {
                    selectedYears = ['2023', '2024', '2025', '2026'];
                } else {
                    // Default to latest year if user tries to uncheck all
                    chkAll.checked = false;
                    const lastChk = document.querySelector('.year-chk[value="2026"]');
                    if (lastChk) lastChk.checked = true;
                    selectedYears = ['2026'];
                }
                updateDropdownText();
                updateKPIs();
                initCharts();
                renderSparklines();
            });
        }

        // Individual Year Checkboxes
        yearCheckboxes.forEach(chk => {
            chk.addEventListener('change', function () {
                // Ensure at least one checkbox is checked
                const anyChecked = Array.from(yearCheckboxes).some(c => c.checked);
                if (!anyChecked) {
                    chk.checked = true; // revert unchecking the last item
                    return;
                }
                syncFromCheckboxes();
            });
        });

        // Reset Button
        if (btnReset) {
            btnReset.addEventListener('click', function (e) {
                e.stopPropagation();
                if (chkAll) chkAll.checked = true;
                yearCheckboxes.forEach(chk => chk.checked = true);
                selectedYears = ['2023', '2024', '2025', '2026'];
                updateDropdownText();
                updateKPIs();
                initCharts();
                renderSparklines();
            });
        }
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

    // ===== Initialize Dashboard =====
    function init() {
        updateKPIs();
        renderSparklines();
        initCharts();
        initMultiSelectDropdown();
        initMobileToggle();
        initNavigation();
        initResizeHandler();
        console.log('✅ TB-07 Trend Analysis Dashboard loaded with Checkbox Multi-Select.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
