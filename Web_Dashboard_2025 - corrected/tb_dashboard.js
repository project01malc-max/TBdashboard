/* ============================================
   TB-07 Case Registration Dashboard Logic
   Application Logic, Excel Parsing, Chart.js
   UPDATED FOR 2025 DATA FORMAT
   ============================================ */

(function () {
  'use strict';

  /* ────────────────────────────────────────────
     State Management
     ──────────────────────────────────────────── */
  const state = {
    blocks: {},
    karachiBlocks: {},
    sindhBlocks: {},
    gbBlocks: {},
    akBlocks: {},
    kpkBlocks: {},
    allProjectBlocks: {},
    activeQuarter: 'consolidated',
    activeSheet: 'MPR',
    charts: {},
    rawData: null,
  };

  /* ────────────────────────────────────────────
     DOM References
     ──────────────────────────────────────────── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    fileInput: $('#file-input'),
    uploadZone: $('#upload-zone'),
    sheetSection: $('#sheet-section'),
    sheetTabs: $('#sheet-tabs'),
    emptyState: $('#empty-state'),
    dashboard: $('#dashboard'),
    spinner: $('#spinner'),
    toastContainer: $('#toast-container'),
    sidebar: $('#sidebar'),
    mobileToggle: $('#mobile-toggle'),

    quarterSelect: $('#quarter-select'),
    facilityTitle: $('#facility-title'),

    kpiTotalRegistered: $('#kpi-total-registered'),
    kpiPresumptiveRate: $('#kpi-presumptive-rate'),
    kpiHivScreening: $('#kpi-hiv-screening'),
    kpiWrdTesting: $('#kpi-wrd-testing'),
    kpiXpertTestingRate: $('#kpi-xpert-testing-rate'),
    kpiContactScreened: $('#kpi-contact-screened'),
    kpiTptInitiated: $('#kpi-tpt-initiated'),
    kpiAfbTestingRate: $('#kpi-afb-testing-rate'),
    kpiXpertPositivity: $('#kpi-xpert-positivity'),
    kpiBPlusConfirmed: $('#kpi-b-plus-confirmed'),

    tbodyBlock1: $('#tbody-block-1'),
    tbodyBlock2: $('#tbody-block-2'),
    tbodyBlock3: $('#tbody-block-3'),
    tbodyBlock4: $('#tbody-block-4'),
    tbodyBlock5: $('#tbody-block-5'),
    tbodyBlock6: $('#tbody-block-6'),

    btnExport: $('#btn-export'),
  };

  /* ────────────────────────────────────────────
     Utility functions
     ──────────────────────────────────────────── */
  function showSpinner() { dom.spinner.classList.add('visible'); }
  function hideSpinner() { dom.spinner.classList.remove('visible'); }

  function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    dom.toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  /* ────────────────────────────────────────────
     Epidemiological Data Parser - 2025 Format
     ──────────────────────────────────────────── */
  const blockOffsets = {
    q1: 0,
    q2: 39,
    q3: 78,
    q4: 117,
    consolidated: 156
  };

  function parseCell(val) {
    if (val === undefined || val === null || val === '') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  function findRowOffset(rows, startIdx, searchStr, maxOffset = 50) {
    for (let i = 0; i <= maxOffset; i++) {
      const row = rows[startIdx + i] || [];
      for (let c = 0; c < row.length; c++) {
        const v = (row[c] || '').toString();
        if (v.includes(searchStr)) return i;
      }
    }
    return -1;
  }

  function parseBlock(rows, startIdx) {
    if (startIdx >= rows.length) return null;

    // Find the header row containing 'Patients registered during'
    let headerOffset = findRowOffset(rows, startIdx, 'Patients registered during', 5);
    if (headerOffset < 0) headerOffset = 2;

    const headerRow = rows[startIdx + headerOffset] || [];
    const bmu = headerRow[4] || 'KMC Leprosy Hospital';
    const district = (headerRow[9] || 'West').replace(/:/g, '').trim();
    const period = headerRow[24] || 'Quarter';
    const year = (headerRow[27] || '2025').toString().replace('of Year', '').trim();

    // --- Block 1: Case Registration Categories ---
    const b1LabelOffset = findRowOffset(rows, startIdx, 'Block 1:', 12);
    const b1DataStart = b1LabelOffset >= 0 ? b1LabelOffset + 3 : headerOffset + 7;

    const b1_raw = {
      pulm_b_cf: rows[startIdx + b1DataStart] || [],
      pulm_cd: rows[startIdx + b1DataStart + 1] || [],
      ep_b_cf: rows[startIdx + b1DataStart + 2] || [],
      ep_cd: rows[startIdx + b1DataStart + 3] || [],
      total: rows[startIdx + b1DataStart + 4] || []
    };

    // 2025 column mapping for Block 1:
    const parseB1Row = (rawRow) => ({
      new: parseCell(rawRow[11]),
      relapse: parseCell(rawRow[13]),
      uk: parseCell(rawRow[15]),
      subtotal: parseCell(rawRow[18]),
      fail: parseCell(rawRow[21]),
      lost: parseCell(rawRow[24]),
      other: parseCell(rawRow[26]),
      total: parseCell(rawRow[28])
    });

    const block1 = {
      pulm_b_cf: parseB1Row(b1_raw.pulm_b_cf),
      pulm_cd: parseB1Row(b1_raw.pulm_cd),
      ep_b_cf: parseB1Row(b1_raw.ep_b_cf),
      ep_cd: parseB1Row(b1_raw.ep_cd),
      total: parseB1Row(b1_raw.total)
    };

    // --- Block 2: Age Group & Gender ---
    const b2LabelOffset = findRowOffset(rows, startIdx, 'Block 2:', 20);
    const b2DataStart = b2LabelOffset >= 0 ? b2LabelOffset + 3 : b1DataStart + 9;

    const b2_raw = {
      pulm_b_cf: rows[startIdx + b2DataStart] || [],
      pulm_cd: rows[startIdx + b2DataStart + 1] || [],
      ep_b_cf: rows[startIdx + b2DataStart + 2] || [],
      ep_cd: rows[startIdx + b2DataStart + 3] || [],
      total: rows[startIdx + b2DataStart + 4] || []
    };

    const parseB2Row = (rawRow) => ({
      m_0_4: parseCell(rawRow[11]),
      f_0_4: parseCell(rawRow[12]),
      m_5_14: parseCell(rawRow[13]),
      f_5_14: parseCell(rawRow[14]),
      m_15_24: parseCell(rawRow[15]),
      f_15_24: parseCell(rawRow[16]),
      m_25_34: parseCell(rawRow[17]),
      f_25_34: parseCell(rawRow[18]),
      m_35_44: parseCell(rawRow[19]),
      f_35_44: parseCell(rawRow[20]),
      m_45_54: parseCell(rawRow[21]),
      f_45_54: parseCell(rawRow[22]),
      m_55_64: parseCell(rawRow[23]),
      f_55_64: parseCell(rawRow[24]),
      m_65: parseCell(rawRow[25]),
      f_65: parseCell(rawRow[26]),
      m_total: parseCell(rawRow[27]),
      f_total: parseCell(rawRow[28]),
      grand_total: parseCell(rawRow[27]) + parseCell(rawRow[28])
    });

    const block2 = {
      pulm_b_cf: parseB2Row(b2_raw.pulm_b_cf),
      pulm_cd: parseB2Row(b2_raw.pulm_cd),
      ep_b_cf: parseB2Row(b2_raw.ep_b_cf),
      ep_cd: parseB2Row(b2_raw.ep_cd),
      total: parseB2Row(b2_raw.total)
    };

    // --- Block 3: Lab Diagnosis ---
    const b3LabelOffset = findRowOffset(rows, startIdx, 'Block 3:', 30);
    const b3DataOffset = b3LabelOffset >= 0 ? b3LabelOffset + 3 : b2DataStart + 7;
    const b3_row = rows[startIdx + b3DataOffset] || [];

    const block3 = {
      opd: parseCell(b3_row[0]),
      presumptive: parseCell(b3_row[1]),
      comm_referrals: parseCell(b3_row[2]),
      tested_afb: parseCell(b3_row[3]),
      tested_xpert: parseCell(b3_row[4]) + parseCell(b3_row[5]),
      pos_afb: parseCell(b3_row[6]),
      afb_xpert_combo: parseCell(b3_row[7]),
      pos_xpert: parseCell(b3_row[8]),
      pos_gtot: parseCell(b3_row[9]),
      registered_b_plus: parseCell(b3_row[10]),
      tested_gene_xpert: parseCell(b3_row[12]),
    };

    // --- Block 4: HIV Activities & TPT ---
    const hiv_data_row = rows[startIdx + b3DataOffset - 1] || [];
    const hiv_h_row = rows[startIdx + b3DataOffset + 1] || [];
    const tpt_6h = rows[startIdx + b3DataOffset + 2] || [];
    const tpt_3hr = rows[startIdx + b3DataOffset + 3] || [];
    const tpt_3hp = rows[startIdx + b3DataOffset + 4] || [];

    const block4 = {
      tested_hiv: parseCell(hiv_data_row[14]),
      pos_hiv: parseCell(hiv_data_row[18]),
      art: parseCell(hiv_data_row[26]),
      hiv_tested_tb: parseCell(hiv_h_row[14]),
      hiv_pos_tb: parseCell(hiv_h_row[18]),
      tb_tx: parseCell(hiv_h_row[22]),

      tpt_6h_0_4: parseCell(tpt_6h[28]),
      tpt_6h_5_14: parseCell(tpt_6h[29]),
      tpt_6h_15: parseCell(tpt_6h[30]),

      tpt_3hr_0_4: parseCell(tpt_3hr[28]),
      tpt_3hr_5_14: parseCell(tpt_3hr[29]),
      tpt_3hr_15: parseCell(tpt_3hr[30]),

      tpt_3hp_0_4: parseCell(tpt_3hp[28]),
      tpt_3hp_5_14: parseCell(tpt_3hp[29]),
      tpt_3hp_15: parseCell(tpt_3hp[30]),
    };

    // --- Block 5: DST Resistance Result ---
    const b5LabelOffset = findRowOffset(rows, startIdx, 'Block 5', 40);
    const b5DataStart = b5LabelOffset >= 0 ? b5LabelOffset + 4 : b3DataOffset + 10;

    const parseB5Row = (rawRow) => ({
      rif_test: parseCell(rawRow[1]) + parseCell(rawRow[7]),
      rif_res: parseCell(rawRow[2]) + parseCell(rawRow[8]),
      inh_test: parseCell(rawRow[3]) + parseCell(rawRow[9]),
      inh_res: parseCell(rawRow[4]) + parseCell(rawRow[10]),
      flq_test: parseCell(rawRow[5]) + parseCell(rawRow[11]),
      flq_res: parseCell(rawRow[6]) + parseCell(rawRow[12])
    });

    const block5 = {
      new_uk: parseB5Row(rows[startIdx + b5DataStart] || []),
      relapse: parseB5Row(rows[startIdx + b5DataStart + 1] || []),
      prev_tx: parseB5Row(rows[startIdx + b5DataStart + 2] || []),
      total: parseB5Row(rows[startIdx + b5DataStart + 3] || [])
    };

    // --- Block 6: Contact Tracing & TPT ---
    const ct_val_row = rows[startIdx + b5LabelOffset + 6] || [];
    const tpt_6h_row = rows[startIdx + b5LabelOffset + 5] || [];
    const tpt_3hr_row = rows[startIdx + b5LabelOffset + 6] || [];
    const tpt_3hp_row = rows[startIdx + b5LabelOffset + 7] || [];

    const block6 = {
      hh_total_lt5: parseCell(ct_val_row[14]),
      hh_total_gt5: parseCell(ct_val_row[15]) + parseCell(ct_val_row[16]),
      screened_lt5: parseCell(ct_val_row[17]),
      screened_gt5: parseCell(ct_val_row[18]) + parseCell(ct_val_row[19]),
      pos_lt5: parseCell(ct_val_row[20]),
      pos_gt5: parseCell(ct_val_row[21]) + parseCell(ct_val_row[22]),

      contacts_tpt_6h: [parseCell(tpt_6h_row[24]), parseCell(tpt_6h_row[25]), parseCell(tpt_6h_row[26])],
      contacts_tpt_3hr: [parseCell(tpt_3hr_row[24]), parseCell(tpt_3hr_row[25]), parseCell(tpt_3hr_row[26])],
      contacts_tpt_3hp: [parseCell(tpt_3hp_row[24]), parseCell(tpt_3hp_row[25]), parseCell(tpt_3hp_row[26])],

      immuno_tpt_6h: [parseCell(tpt_6h_row[27]), parseCell(tpt_6h_row[28]), parseCell(tpt_6h_row[29])],
      immuno_tpt_3hr: [parseCell(tpt_3hr_row[27]), parseCell(tpt_3hr_row[28]), parseCell(tpt_3hr_row[29])],
      immuno_tpt_3hp: [parseCell(tpt_3hp_row[27]), parseCell(tpt_3hp_row[28]), parseCell(tpt_3hp_row[29])],
    };

    return { bmu, district, period, year, block1, block2, block3, block4, block5, block6 };
  }

  /* ────────────────────────────────────────────
     Data Loading & Parsing Orchestrator
     ──────────────────────────────────────────── */
  function parseWorkbook(wb) {
    const ws = wb.Sheets['MPR'];
    if (!ws) {
      toast('Sheet named "MPR" not found in the uploaded workbook.', 'error');
      return false;
    }

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    state.rawData = rows;

    Object.keys(blockOffsets).forEach(qKey => {
      state.blocks[qKey] = parseBlock(rows, blockOffsets[qKey]);
    });

    if (!state.blocks.consolidated) {
      toast('Failed to parse MPR report data.', 'error');
      return false;
    }

    const sheetMap = {
      'KARACHI': 'karachiBlocks',
      'SINDH': 'sindhBlocks',
      'GILGIT BALTISTAN': 'gbBlocks',
      'AZAD KHASHMIR': 'akBlocks',
      'KHYBER PAKHTUNKHWA': 'kpkBlocks',
    };

    Object.keys(sheetMap).forEach(sheetName => {
      const wsSheet = wb.Sheets[sheetName];
      if (wsSheet) {
        const sheetRows = XLSX.utils.sheet_to_json(wsSheet, { header: 1, defval: '' });
        const targetKey = sheetMap[sheetName];
        Object.keys(blockOffsets).forEach(qKey => {
          state[targetKey][qKey] = parseBlock(sheetRows, blockOffsets[qKey]);
        });
        console.log(`[parseWorkbook] ${sheetName} sheet parsed successfully.`);
      }
    });

    const allProjName = Object.keys(wb.Sheets).find(n => n.startsWith('All Project Total')) || 'All Project Total - 2025';
    const wsAllProj = wb.Sheets[allProjName];
    if (wsAllProj) {
      const rowsAllProj = XLSX.utils.sheet_to_json(wsAllProj, { header: 1, defval: '' });
      Object.keys(blockOffsets).forEach(qKey => {
        state.allProjectBlocks[qKey] = parseBlock(rowsAllProj, blockOffsets[qKey]);
      });
      console.log('[parseWorkbook] All Project sheet parsed successfully.');
    }

    toast('Tuberculosis Registry report parsed successfully!', 'success');
    return true;
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return;
    showSpinner();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });

        if (parseWorkbook(wb)) {
          state.activeSheet = 'MPR';
          dom.emptyState.style.display = 'none';
          dom.dashboard.style.display = 'block';
          buildLoadedSheetsTab();
          updateDashboardView();
        }
        hideSpinner();
      } catch (err) {
        hideSpinner();
        toast('Error reading file: ' + err.message, 'error');
        console.error(err);
      }
    };
    reader.onerror = () => {
      hideSpinner();
      toast('File loading error', 'error');
    };
    reader.readAsArrayBuffer(files[0]);
  }

  function buildLoadedSheetsTab() {
    dom.sheetTabs.innerHTML = '';
    dom.sheetSection.style.display = 'block';

    const sheets = [
      { id: 'mpr', key: 'MPR', label: 'MPR Report', icon: '🦠', data: state.blocks },
      { id: 'karachi', key: 'KARACHI', label: 'Karachi Report', icon: '🏙️', data: state.karachiBlocks },
      { id: 'sindh', key: 'SINDH', label: 'Sindh Report', icon: '🏜️', data: state.sindhBlocks },
      { id: 'gb', key: 'GILGIT BALTISTAN', label: 'Gilgit-Baltistan', icon: '🏔️', data: state.gbBlocks },
      { id: 'ak', key: 'AZAD KHASHMIR', label: 'Azad Kashmir', icon: '🌲', data: state.akBlocks },
      { id: 'kpk', key: 'KHYBER PAKHTUNKHWA', label: 'KPK Report', icon: '⛰️', data: state.kpkBlocks },
      { id: 'allproj', key: 'ALL_PROJECT', label: 'All Project Total', icon: '🌐', data: state.allProjectBlocks },
    ];

    sheets.forEach((sheet, index) => {
      const btn = document.createElement('button');
      btn.id = `sheet-btn-${sheet.id}`;
      btn.className = `sheet-tab${index === 0 ? ' active' : ''}`;
      const available = Object.keys(sheet.data).length > 0;
      btn.innerHTML = `
        <span class="tab-icon">${sheet.icon}</span>
        <span>${sheet.label}</span>
        <span class="tab-count">${available ? '5 Blocks' : 'N/A'}</span>
      `;
      if (!available) {
        btn.disabled = true;
        btn.title = `${sheet.key} sheet not found in this workbook`;
        btn.style.opacity = '0.45';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.addEventListener('click', () => {
          if (state.activeSheet === sheet.key) return;
          state.activeSheet = sheet.key;
          document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
          updateDashboardView();
          toast(`Switched to ${sheet.label}`, 'info');
        });
      }
      dom.sheetTabs.appendChild(btn);
    });
  }

  function sumObjects(a, b) {
    if (!a) return b ? JSON.parse(JSON.stringify(b)) : null;
    if (!b) return a ? JSON.parse(JSON.stringify(a)) : null;
    if (typeof a === 'number' && typeof b === 'number') return a + b;
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.map((val, i) => (typeof val === 'number' ? val + (b[i] || 0) : val));
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const res = {};
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      keys.forEach(k => { res[k] = sumObjects(a[k], b[k]); });
      return res;
    }
    return a || b;
  }

  function getRegionalData(qKey) {
    const q = qKey || state.activeQuarter;
    const ak = state.akBlocks[q];
    const gb = state.gbBlocks[q];
    const kpk = state.kpkBlocks[q];
    const karachi = state.karachiBlocks[q];
    const sindh = state.sindhBlocks[q];
    const mpr = state.blocks[q];
    const allProj = state.allProjectBlocks[q];

    const northData = sumObjects(ak, sumObjects(gb, kpk));
    const southData = sumObjects(mpr, sumObjects(karachi, sindh));
    const totalData = allProj || sumObjects(northData, southData);

    return { northData, southData, totalData };
  }

  /* ────────────────────────────────────────────
     UI Updates: KPIs, Tables, & Export
     ──────────────────────────────────────────── */
  function getBlocks() {
    const map = {
      'MPR': state.blocks,
      'KARACHI': state.karachiBlocks,
      'SINDH': state.sindhBlocks,
      'GILGIT BALTISTAN': state.gbBlocks,
      'AZAD KHASHMIR': state.akBlocks,
      'KHYBER PAKHTUNKHWA': state.kpkBlocks,
      'ALL_PROJECT': state.allProjectBlocks,
    };
    return map[state.activeSheet] || state.blocks;
  }

  function getSheetLabel() {
    const map = {
      'MPR': '🦠 MPR',
      'KARACHI': '🏙️ KARACHI',
      'SINDH': '🏜️ SINDH',
      'GILGIT BALTISTAN': '🏔️ GILGIT-BALTISTAN',
      'AZAD KHASHMIR': '🌲 AZAD KASHMIR',
      'KHYBER PAKHTUNKHWA': '⛰️ KPK',
      'ALL_PROJECT': '🌐 ALL PROJECT TOTAL',
    };
    return map[state.activeSheet] || '🦠 MPR';
  }

  /* ────────────────────────────────────────────
     HELPER: Check if current sheet is "All Project Total"
     ──────────────────────────────────────────── */
  function isAllProjectSheet() {
    return state.activeSheet === 'ALL_PROJECT';
  }

  /* ────────────────────────────────────────────
     HELPER: Toggle breakdown visibility
     ──────────────────────────────────────────── */
  function toggleBreakdownVisibility(show) {
    const breakdowns = document.querySelectorAll('.kpi-breakdown');
    breakdowns.forEach(el => {
      el.style.display = show ? 'flex' : 'none';
    });
  }

  function updateDashboardView() {
    const blocks = getBlocks();
    const data = blocks[state.activeQuarter];
    if (!data) {
      console.warn('No data for quarter:', state.activeQuarter, 'sheet:', state.activeSheet);
      return;
    }

    const regional = getRegionalData(state.activeQuarter);
    const n = regional.northData || data;
    const s = regional.southData || data;
    const t = regional.totalData || data;

    const calcRate = (num, den) => den > 0 ? (num / den * 100).toFixed(1) + '%' : '0.0%';
    const getTpt = (b6) => b6 ? (
      (b6.contacts_tpt_6h ? b6.contacts_tpt_6h.reduce((a, b) => a + b, 0) : 0) +
      (b6.contacts_tpt_3hr ? b6.contacts_tpt_3hr.reduce((a, b) => a + b, 0) : 0) +
      (b6.contacts_tpt_3hp ? b6.contacts_tpt_3hp.reduce((a, b) => a + b, 0) : 0)
    ) : 0;
    const getContact = (b6) => b6 ? (b6.screened_lt5 + b6.screened_gt5) : 0;
    const getMaleChild = (b2) => b2 && b2.total ? (b2.total.m_0_4 + b2.total.m_5_14) : 0;
    const getFemaleChild = (b2) => b2 && b2.total ? (b2.total.f_0_4 + b2.total.f_5_14) : 0;
    const getChildTb = (b2) => getMaleChild(b2) + getFemaleChild(b2);
    const getNrk = (b1) => b1.total.new + b1.total.relapse + b1.total.uk;

    // Update Titles
    const sheetBadge = `<span style="margin-left:10px;padding:2px 10px;background:linear-gradient(135deg,#06b6d4,#0891b2);border-radius:20px;font-size:0.7rem;font-weight:700;letter-spacing:0.05em;vertical-align:middle;">${getSheetLabel()}</span>`;
    dom.facilityTitle.innerHTML = `TB Care Facility (BMU): ${data.bmu}${sheetBadge}`;
    $('#data-summary').textContent = `District: ${data.district} | Year: ${data.year} (${data.period})`;

    // Toggle all breakdown visibility based on current sheet
    const showBreakdown = isAllProjectSheet();
    toggleBreakdownVisibility(showBreakdown);

    // ============================================
    // 1. Total Registered
    // ============================================
    dom.kpiTotalRegistered.textContent = data.block1.total.total.toLocaleString();
    if (showBreakdown) {
      if ($('#kpi-total-south')) $('#kpi-total-south').textContent = s.block1.total.total.toLocaleString();
      if ($('#kpi-total-north')) $('#kpi-total-north').textContent = n.block1.total.total.toLocaleString();
      if ($('#kpi-total-sub')) $('#kpi-total-sub').textContent = t.block1.total.total.toLocaleString();
    }

    // ============================================
    // 2. Presumptive Rate
    // ============================================
    dom.kpiPresumptiveRate.textContent = calcRate(data.block3.presumptive, data.block3.opd);
    if (showBreakdown) {
      if ($('#kpi-presumptive-south')) $('#kpi-presumptive-south').textContent = calcRate(s.block3.presumptive, s.block3.opd);
      if ($('#kpi-presumptive-north')) $('#kpi-presumptive-north').textContent = calcRate(n.block3.presumptive, n.block3.opd);
      if ($('#kpi-presumptive-sub')) $('#kpi-presumptive-sub').textContent = calcRate(t.block3.presumptive, t.block3.opd);
    }

    // ============================================
    // 3. HIV Screening Rate
    // ============================================
    dom.kpiHivScreening.textContent = calcRate(data.block4.tested_hiv, data.block1.total.total);
    if (showBreakdown) {
      if ($('#kpi-hiv-south')) $('#kpi-hiv-south').textContent = calcRate(s.block4.tested_hiv, s.block1.total.total);
      if ($('#kpi-hiv-north')) $('#kpi-hiv-north').textContent = calcRate(n.block4.tested_hiv, n.block1.total.total);
      if ($('#kpi-hiv-sub')) $('#kpi-hiv-sub').textContent = calcRate(t.block4.tested_hiv, t.block1.total.total);
    }

    // ============================================
    // 4. GeneXpert Testing Rate (WRD)
    // ============================================
    dom.kpiWrdTesting.textContent = calcRate(data.block3.tested_gene_xpert, getNrk(data.block1));
    if (showBreakdown) {
      if ($('#kpi-wrd-south')) $('#kpi-wrd-south').textContent = calcRate(s.block3.tested_gene_xpert, getNrk(s.block1));
      if ($('#kpi-wrd-north')) $('#kpi-wrd-north').textContent = calcRate(n.block3.tested_gene_xpert, getNrk(n.block1));
      if ($('#kpi-wrd-sub')) $('#kpi-wrd-sub').textContent = calcRate(t.block3.tested_gene_xpert, getNrk(t.block1));
    }

    // ============================================
    // 5. HH Contacts Screened
    // ============================================
    dom.kpiContactScreened.textContent = getContact(data.block6).toLocaleString();
    if (showBreakdown) {
      if ($('#kpi-contact-south')) $('#kpi-contact-south').textContent = getContact(s.block6).toLocaleString();
      if ($('#kpi-contact-north')) $('#kpi-contact-north').textContent = getContact(n.block6).toLocaleString();
      if ($('#kpi-contact-sub')) $('#kpi-contact-sub').textContent = getContact(t.block6).toLocaleString();
    }

    // ============================================
    // 6. Contacts Put on TPT
    // ============================================
    dom.kpiTptInitiated.textContent = getTpt(data.block6).toLocaleString();
    if (showBreakdown) {
      if ($('#kpi-tpt-south')) $('#kpi-tpt-south').textContent = getTpt(s.block6).toLocaleString();
      if ($('#kpi-tpt-north')) $('#kpi-tpt-north').textContent = getTpt(n.block6).toLocaleString();
      if ($('#kpi-tpt-sub')) $('#kpi-tpt-sub').textContent = getTpt(t.block6).toLocaleString();
    }

    // ============================================
    // 7. AFB Testing Rate
    // ============================================
    dom.kpiAfbTestingRate.textContent = calcRate(data.block3.tested_afb, data.block3.presumptive);
    if (showBreakdown) {
      if ($('#kpi-afb-south')) $('#kpi-afb-south').textContent = calcRate(s.block3.tested_afb, s.block3.presumptive);
      if ($('#kpi-afb-north')) $('#kpi-afb-north').textContent = calcRate(n.block3.tested_afb, n.block3.presumptive);
      if ($('#kpi-afb-sub')) $('#kpi-afb-sub').textContent = calcRate(t.block3.tested_afb, t.block3.presumptive);
    }

    // ============================================
    // 8. Xpert Positivity Rate
    // ============================================
    dom.kpiXpertPositivity.textContent = calcRate(data.block3.pos_xpert, data.block3.presumptive);
    if (showBreakdown) {
      if ($('#kpi-xpos-south')) $('#kpi-xpos-south').textContent = calcRate(s.block3.pos_xpert, s.block3.presumptive);
      if ($('#kpi-xpos-north')) $('#kpi-xpos-north').textContent = calcRate(n.block3.pos_xpert, n.block3.presumptive);
      if ($('#kpi-xpos-sub')) $('#kpi-xpos-sub').textContent = calcRate(t.block3.pos_xpert, t.block3.presumptive);
    }

    // ============================================
    // 9. B+ Confirmed Cases
    // ============================================
    dom.kpiBPlusConfirmed.textContent = data.block3.pos_gtot.toLocaleString();
    if (showBreakdown) {
      if ($('#kpi-bplus-south')) $('#kpi-bplus-south').textContent = s.block3.pos_gtot.toLocaleString();
      if ($('#kpi-bplus-north')) $('#kpi-bplus-north').textContent = n.block3.pos_gtot.toLocaleString();
      if ($('#kpi-bplus-sub')) $('#kpi-bplus-sub').textContent = t.block3.pos_gtot.toLocaleString();
    }

    // ============================================
    // 10. Registered Tested Xpert Rate
    // ============================================
    dom.kpiXpertTestingRate.textContent = calcRate(data.block3.tested_gene_xpert, data.block3.presumptive);
    if (showBreakdown) {
      if ($('#kpi-xr-south')) $('#kpi-xr-south').textContent = calcRate(s.block3.tested_gene_xpert, s.block3.presumptive);
      if ($('#kpi-xr-north')) $('#kpi-xr-north').textContent = calcRate(n.block3.tested_gene_xpert, n.block3.presumptive);
      if ($('#kpi-xr-sub')) $('#kpi-xr-sub').textContent = calcRate(t.block3.tested_gene_xpert, t.block3.presumptive);
    }

    // ============================================
    // 11. Childhood TB Cases (<15 Years) WITH PERCENTAGE
    // ============================================
    const childTotal = getChildTb(data.block2);
    const totalRegistered = data.block1.total.total;
    const childPct = (showBreakdown && totalRegistered > 0) ?
      ((childTotal / totalRegistered) * 100).toFixed(1) + '%' : '';

    if ($('#kpi-childhood-tb')) {
      if (showBreakdown && childPct) {
        $('#kpi-childhood-tb').textContent = childTotal.toLocaleString() + ' (' + childPct + ')';
      } else {
        $('#kpi-childhood-tb').textContent = childTotal.toLocaleString();
      }
    }
    if ($('#kpi-child-male')) $('#kpi-child-male').textContent = getMaleChild(data.block2).toLocaleString();
    if ($('#kpi-child-female')) $('#kpi-child-female').textContent = getFemaleChild(data.block2).toLocaleString();
    if ($('#kpi-child-sub')) $('#kpi-child-sub').textContent = childTotal.toLocaleString();

    // Render Data Tables
    renderTableBlock1(data.block1);
    renderTableBlock2(data.block2);
    renderTableBlock3_4(data.block3, data.block4);
    renderTableBlock5(data.block5);
    renderTableBlock6(data.block6);

    // Refresh Charts
    renderCharts(data);
  }

  /* ────────────────────────────────────────────
     TABLE RENDERERS
     ──────────────────────────────────────────── */

  function renderTableBlock1(b1) {
    const rowHTML = (label, dataRow, isTotal = false) => {
      const style = isTotal ? 'style="font-weight: 700; background: rgba(255,255,255,0.02);"' : '';
      const totalStyle = 'style="font-weight: 700; background: rgba(6,182,212,0.1);"';
      return `
        <tr ${style}>
          <td style="font-weight: 500;">${label}</td>
          <td style="text-align: right;">${dataRow.new.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.relapse.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.uk.toLocaleString()}</td>
          <td style="text-align: right; font-weight:600; background: rgba(255,255,255,0.01)">${dataRow.subtotal.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.fail.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.lost.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.other.toLocaleString()}</td>
          <td style="text-align: right;" ${totalStyle}>${dataRow.total.toLocaleString()}</td>
        </tr>
      `;
    };

    dom.tbodyBlock1.innerHTML = `
      ${rowHTML('Pulmonary, Bacteriologically Confirmed', b1.pulm_b_cf)}
      ${rowHTML('Pulmonary, Clinically Diagnosed', b1.pulm_cd)}
      ${rowHTML('Extra Pulmonary, Bacteriologically Confirmed', b1.ep_b_cf)}
      ${rowHTML('Extra Pulmonary, Clinically Diagnosed', b1.ep_cd)}
      ${rowHTML('Total Cases Registered', b1.total, true)}
    `;
  }

  function renderTableBlock2(b2) {
    const rowHTML = (label, r, isTotal = false) => {
      const style = isTotal ? 'style="font-weight: 700; background: rgba(255,255,255,0.02);"' : '';
      const finalStyle = 'style="font-weight: 700; background: rgba(6,182,212,0.1);"';
      return `
        <tr ${style}>
          <td style="font-weight: 500;">${label}</td>
          <td style="text-align: right;">${r.m_0_4}</td><td style="text-align: right;">${r.f_0_4}</td>
          <td style="text-align: right;">${r.m_5_14}</td><td style="text-align: right;">${r.f_5_14}</td>
          <td style="text-align: right;">${r.m_15_24}</td><td style="text-align: right;">${r.f_15_24}</td>
          <td style="text-align: right;">${r.m_25_34}</td><td style="text-align: right;">${r.f_25_34}</td>
          <td style="text-align: right;">${r.m_35_44}</td><td style="text-align: right;">${r.f_35_44}</td>
          <td style="text-align: right;">${r.m_45_54}</td><td style="text-align: right;">${r.f_45_54}</td>
          <td style="text-align: right;">${r.m_55_64}</td><td style="text-align: right;">${r.f_55_64}</td>
          <td style="text-align: right;">${r.m_65}</td><td style="text-align: right;">${r.f_65}</td>
          <td style="text-align: right; font-weight: 600; background: rgba(255,255,255,0.01)">${r.m_total}</td>
          <td style="text-align: right; font-weight: 600; background: rgba(255,255,255,0.01)">${r.f_total}</td>
          <td style="text-align: right;" ${finalStyle}>${r.grand_total.toLocaleString()}</td>
        </tr>
      `;
    };

    dom.tbodyBlock2.innerHTML = `
      ${rowHTML('Pulmonary, Bacteriologically Confirmed', b2.pulm_b_cf)}
      ${rowHTML('Pulmonary, Clinically Diagnosed', b2.pulm_cd)}
      ${rowHTML('Extra Pulmonary, Bacteriologically Confirmed', b2.ep_b_cf)}
      ${rowHTML('Extra Pulmonary, Clinically Diagnosed', b2.ep_cd)}
      ${rowHTML('Total Case Demographics', b2.total, true)}
    `;
  }

  function renderTableBlock3_4(b3, b4) {
    const pct = (num, den) => den > 0 ? ` <span style="color:var(--text-muted);font-size:0.78em;">(${(num / den * 100).toFixed(1)}%)</span>` : '';

    dom.tbodyBlock3.innerHTML = `
      <tr style="background:rgba(6,182,212,0.05)">
        <td style="font-weight:600">Total New OPD Consultations</td>
        <td style="text-align:right;font-weight:700;font-size:1.05em">${b3.opd.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Presumptive TB Cases Identified</td>
        <td style="text-align:right;font-weight:600">${b3.presumptive.toLocaleString()}${pct(b3.presumptive, b3.opd)}</td>
      </tr>
      <tr>
        <td style="padding-left:1.2em;color:var(--text-secondary)">↳ Identified via Community Referrals (LHW)</td>
        <td style="text-align:right">${b3.comm_referrals.toLocaleString()}${pct(b3.comm_referrals, b3.presumptive)}</td>
      </tr>
      <tr style="border-top:1px solid var(--border-color)">
        <td style="font-weight:600">Presumptive Cases Tested — AFB Smear Microscopy</td>
        <td style="text-align:right;font-weight:600">${b3.tested_afb.toLocaleString()}${pct(b3.tested_afb, b3.presumptive)}</td>
      </tr>
      <tr>
        <td style="font-weight:600">Presumptive Cases Tested — GeneXpert WRD</td>
        <td style="text-align:right;font-weight:600">${b3.tested_xpert.toLocaleString()}${pct(b3.tested_xpert, b3.presumptive)}</td>
      </tr>
      <tr style="border-top:1px solid var(--border-color)">
        <td style="padding-left:1.2em;color:var(--text-secondary)">↳ Bacteriologically Confirmed Positive (AFB)</td>
        <td style="text-align:right">${b3.pos_afb.toLocaleString()}${pct(b3.pos_afb, b3.tested_afb)}</td>
      </tr>
      <tr>
        <td style="padding-left:1.2em;color:var(--text-secondary)">↳ Bacteriologically Confirmed Positive (Xpert)</td>
        <td style="text-align:right">${b3.pos_xpert.toLocaleString()}${pct(b3.pos_xpert, b3.tested_xpert)}</td>
      </tr>
      <tr>
        <td style="padding-left:1.2em;color:var(--text-secondary)">↳ Combined Positive (AFB + Xpert)</td>
        <td style="text-align:right">${b3.afb_xpert_combo.toLocaleString()}</td>
      </tr>
      <tr style="background:rgba(6,182,212,0.08);font-weight:700">
        <td>Total Bacteriologically Confirmed (G. Total)</td>
        <td style="text-align:right;color:var(--accent-1);font-size:1.05em">${b3.pos_gtot.toLocaleString()}${pct(b3.pos_gtot, b3.presumptive)}</td>
      </tr>
      <tr style="border-top:1px solid var(--border-color)">
        <td style="font-weight:600">Among All Registered — B+ TB Cases</td>
        <td style="text-align:right;font-weight:600">${b3.registered_b_plus.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Among All (N+R+UK) Registered — Tested by GeneXpert</td>
        <td style="text-align:right">${b3.tested_gene_xpert.toLocaleString()}</td>
      </tr>
    `;

    dom.tbodyBlock4.innerHTML = `
      <tr><td>Registered TB Patients tested for HIV</td><td style="text-align:right;font-weight:600">${b4.tested_hiv.toLocaleString()}</td></tr>
      <tr><td>TB Patients tested positive for HIV</td><td style="text-align:right;font-weight:600;color:var(--accent-6)">${b4.pos_hiv.toLocaleString()}</td></tr>
      <tr><td>HIV Positive TB Patients put on ART</td><td style="text-align:right">${b4.art.toLocaleString()}</td></tr>
      <tr><td>HIV patients screened/tested for TB</td><td style="text-align:right">${b4.hiv_tested_tb.toLocaleString()}</td></tr>
      <tr><td>HIV patients tested positive for active TB</td><td style="text-align:right">${b4.hiv_pos_tb.toLocaleString()}</td></tr>
      <tr><td>TB Positive HIV patients put on TB Tx</td><td style="text-align:right">${b4.tb_tx.toLocaleString()}</td></tr>
      <tr style="font-weight:700;border-top:1px solid var(--border-color);background:rgba(255,255,255,0.02)"><td colspan="2">HIV Positive TB Negative patients initiated on TPT</td></tr>
      <tr><td>Regimen 6H (0-4 yrs / 5-14 yrs / 15+ yrs)</td><td style="text-align:right">${b4.tpt_6h_0_4} / ${b4.tpt_6h_5_14} / ${b4.tpt_6h_15}</td></tr>
      <tr><td>Regimen 3HR (0-4 yrs / 5-14 yrs / 15+ yrs)</td><td style="text-align:right">${b4.tpt_3hr_0_4} / ${b4.tpt_3hr_5_14} / ${b4.tpt_3hr_15}</td></tr>
      <tr><td>Regimen 3HP (0-4 yrs / 5-14 yrs / 15+ yrs)</td><td style="text-align:right">${b4.tpt_3hp_0_4} / ${b4.tpt_3hp_5_14} / ${b4.tpt_3hp_15}</td></tr>
    `;
  }

  function renderTableBlock5(b5) {
    const rowHTML = (label, r, isTotal = false) => {
      const style = isTotal ? 'style="font-weight: 700; background: rgba(255,255,255,0.02);"' : '';
      return `
        <tr ${style}>
          <td style="font-weight: 500;">${label}</td>
          <td style="text-align: right;">${r.rif_test.toLocaleString()}</td>
          <td style="text-align: right; color: ${r.rif_res > 0 ? 'var(--accent-6)' : 'inherit'}; font-weight: ${r.rif_res > 0 ? '600' : 'normal'}">${r.rif_res.toLocaleString()}</td>
          <td style="text-align: right;">${r.inh_test.toLocaleString()}</td>
          <td style="text-align: right; color: ${r.inh_res > 0 ? 'var(--accent-6)' : 'inherit'}; font-weight: ${r.inh_res > 0 ? '600' : 'normal'}">${r.inh_res.toLocaleString()}</td>
          <td style="text-align: right;">${r.flq_test.toLocaleString()}</td>
          <td style="text-align: right; color: ${r.flq_res > 0 ? 'var(--accent-6)' : 'inherit'}; font-weight: ${r.flq_res > 0 ? '600' : 'normal'}">${r.flq_res.toLocaleString()}</td>
        </tr>
      `;
    };

    dom.tbodyBlock5.innerHTML = `
      ${rowHTML('New + History Unknown cases', b5.new_uk)}
      ${rowHTML('Relapse cases', b5.relapse)}
      ${rowHTML('Previously Treated cases (excluding relapse)', b5.prev_tx)}
      ${rowHTML('Total tested and resistant cases', b5.total, true)}
    `;
  }

  function renderTableBlock6(b6) {
    const rowHTML = (label, valLt5, valGt5, isTpt = false) => {
      const total = valLt5 + valGt5;
      const combinedStyle = 'style="font-weight: 700; background: rgba(6,182,212,0.1);"';
      return `
        <tr>
          <td style="font-weight: 500; ${isTpt ? 'padding-left: 20px; font-style: italic;' : ''}">${label}</td>
          <td style="text-align: right;">${valLt5.toLocaleString()}</td>
          <td style="text-align: right;">${valGt5.toLocaleString()}</td>
          <td style="text-align: right;" ${combinedStyle}>${total.toLocaleString()}</td>
        </tr>
      `;
    };

    const tpt6hContactsLt5 = b6.contacts_tpt_6h[0] + b6.contacts_tpt_6h[1];
    const tpt6hContactsGt5 = b6.contacts_tpt_6h[2];
    const tpt3hrContactsLt5 = b6.contacts_tpt_3hr[0] + b6.contacts_tpt_3hr[1];
    const tpt3hrContactsGt5 = b6.contacts_tpt_3hr[2];
    const tpt3hpContactsLt5 = b6.contacts_tpt_3hp[0] + b6.contacts_tpt_3hp[1];
    const tpt3hpContactsGt5 = b6.contacts_tpt_3hp[2];
    const totalContactsLt5 = tpt6hContactsLt5 + tpt3hrContactsLt5 + tpt3hpContactsLt5;
    const totalContactsGt5 = tpt6hContactsGt5 + tpt3hrContactsGt5 + tpt3hpContactsGt5;

    const tpt6hImmLt5 = b6.immuno_tpt_6h[0] + b6.immuno_tpt_6h[1];
    const tpt6hImmGt5 = b6.immuno_tpt_6h[2];
    const tpt3hrImmLt5 = b6.immuno_tpt_3hr[0] + b6.immuno_tpt_3hr[1];
    const tpt3hrImmGt5 = b6.immuno_tpt_3hr[2];
    const tpt3hpImmLt5 = b6.immuno_tpt_3hp[0] + b6.immuno_tpt_3hp[1];
    const tpt3hpImmGt5 = b6.immuno_tpt_3hp[2];
    const totalImmLt5 = tpt6hImmLt5 + tpt3hrImmLt5 + tpt3hpImmLt5;
    const totalImmGt5 = tpt6hImmGt5 + tpt3hrImmGt5 + tpt3hpImmGt5;

    dom.tbodyBlock6.innerHTML = `
      ${rowHTML('Total Household Contacts of Confirmed B+ Cases', b6.hh_total_lt5, b6.hh_total_gt5)}
      ${rowHTML('No. of HH Contacts Screened for TB', b6.screened_lt5, b6.screened_gt5)}
      ${rowHTML('Among screened contacts, No. diagnosed with Active TB', b6.pos_lt5, b6.pos_gt5)}
      
      <tr style="font-weight: 700; background: rgba(255,255,255,0.01)"><td colspan="4">No. of HH Contacts Initiated on TPT (Tuberculosis Preventive Therapy)</td></tr>
      ${rowHTML('Initiated on Regimen: 6H', tpt6hContactsLt5, tpt6hContactsGt5, true)}
      ${rowHTML('Initiated on Regimen: 3HR', tpt3hrContactsLt5, tpt3hrContactsGt5, true)}
      ${rowHTML('Initiated on Regimen: 3HP', tpt3hpContactsLt5, tpt3hpContactsGt5, true)}
      <tr style="font-weight: bold; background: rgba(255, 255, 255, 0.03);">
        <td style="padding-left: 20px;">Total Household Contacts Put on TPT</td>
        <td style="text-align: right;">${totalContactsLt5.toLocaleString()}</td>
        <td style="text-align: right;">${totalContactsGt5.toLocaleString()}</td>
        <td style="text-align: right; background: rgba(6,182,212,0.15); color: var(--accent-1);">${(totalContactsLt5 + totalContactsGt5).toLocaleString()}</td>
      </tr>

      <tr style="font-weight: 700; background: rgba(255,255,255,0.01)"><td colspan="4">HIV Negative / Immunocompromised Contacts Initiated on TPT</td></tr>
      ${rowHTML('Initiated on Regimen: 6H (HIV- / Immuno-)', tpt6hImmLt5, tpt6hImmGt5, true)}
      ${rowHTML('Initiated on Regimen: 3HR (HIV- / Immuno-)', tpt3hrImmLt5, tpt3hrImmGt5, true)}
      ${rowHTML('Initiated on Regimen: 3HP (HIV- / Immuno-)', tpt3hpImmLt5, tpt3hpImmGt5, true)}
      <tr style="font-weight: bold; background: rgba(255, 255, 255, 0.03);">
        <td style="padding-left: 20px;">Total Immunocompromised Put on TPT</td>
        <td style="text-align: right;">${totalImmLt5.toLocaleString()}</td>
        <td style="text-align: right;">${totalImmGt5.toLocaleString()}</td>
        <td style="text-align: right; background: rgba(6,182,212,0.15); color: var(--accent-1);">${(totalImmLt5 + totalImmGt5).toLocaleString()}</td>
      </tr>
    `;
  }

  function exportJSON() {
    const blocks = getBlocks();
    const data = blocks[state.activeQuarter];
    if (!data) {
      toast('No data to export', 'error');
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TB_Registration_${state.activeQuarter}_${data.year}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('JSON report exported successfully!', 'success');
  }

  /* ────────────────────────────────────────────
     DATA VISUALIZATIONS (Chart.js) - Keep all existing chart functions
     ──────────────────────────────────────────── */
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  const CHART_COLORS = {
    male: 'rgba(6, 182, 212, 0.85)',
    female: 'rgba(236, 72, 153, 0.85)',
    new: 'rgba(16, 185, 129, 0.85)',
    relapse: 'rgba(245, 158, 11, 0.85)',
    uk: 'rgba(139, 92, 246, 0.85)',
    prev_tx: 'rgba(244, 63, 94, 0.85)',
    accent: 'rgba(6, 182, 212, 0.85)',
    accent_purple: 'rgba(139, 92, 246, 0.85)',
    grid: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.06)',
  };

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 14 }
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
      datalabels: {
        color: '#e2e8f0',
        font: { family: 'Inter', size: 10, weight: 'bold' },
        formatter: (value) => value > 0 ? value.toLocaleString() : '',
        anchor: 'end',
        align: 'end',
        offset: 2,
        clip: false
      }
    },
    layout: {
      padding: { top: 20, right: 30 }
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
        grid: { color: CHART_COLORS.grid },
        border: { color: CHART_COLORS.border },
      },
      y: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
        grid: { color: CHART_COLORS.grid },
        border: { color: CHART_COLORS.border },
        beginAtZero: true,
      }
    }
  };

  function destroyChart(key) {
    if (state.charts[key]) {
      state.charts[key].destroy();
      delete state.charts[key];
    }
  }

  function renderCharts(data) {
    renderDemographicsChart(data.block2);
    renderCategoriesChart(data.block1);
    renderCascadeChart(data.block3);
    renderOpdPieChart(data.block3);
    renderDstChart(data.block5);
    renderHivChart(data.block4);
    renderContactTracingChart(data.block6);
  }

  function renderDemographicsChart(b2) {
    destroyChart('demographics');
    const ctx = document.getElementById('chart-demographics');
    if (!ctx) return;

    const ageLabels = ['0-4', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65 & Above'];

    const maleData = [
      b2.total.m_0_4, b2.total.m_5_14, b2.total.m_15_24, b2.total.m_25_34,
      b2.total.m_35_44, b2.total.m_45_54, b2.total.m_55_64, b2.total.m_65
    ];
    const femaleData = [
      b2.total.f_0_4, b2.total.f_5_14, b2.total.f_15_24, b2.total.f_25_34,
      b2.total.f_35_44, b2.total.f_45_54, b2.total.f_55_64, b2.total.f_65
    ];

    state.charts['demographics'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ageLabels,
        datasets: [{
          label: 'Male',
          data: maleData,
          backgroundColor: CHART_COLORS.male,
          borderRadius: 4,
          barPercentage: 0.6,
        }, {
          label: 'Female',
          data: femaleData,
          backgroundColor: CHART_COLORS.female,
          borderRadius: 4,
          barPercentage: 0.6,
        }]
      },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: {
          ...chartDefaults.plugins,
          tooltip: {
            ...chartDefaults.plugins.tooltip,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.raw} cases`
            }
          }
        },
        scales: {
          x: {
            ...chartDefaults.scales.x,
            stacked: false,
            title: { display: true, text: 'Number of Cases', color: '#64748b', font: { family: 'Inter', size: 10 } },
            ticks: { ...chartDefaults.scales.x.ticks, stepSize: 1, precision: 0 },
          },
          y: {
            ...chartDefaults.scales.y,
            stacked: false,
            ticks: { ...chartDefaults.scales.y.ticks, color: '#94a3b8' },
          }
        }
      }
    });
  }

  function renderCategoriesChart(b1) {
    destroyChart('categories');
    const ctx = document.getElementById('chart-categories');
    if (!ctx) return;

    const labels = ['Pulmonary (B+)', 'Pulmonary (Clinically)', 'Extra Pulm (B+)', 'Extra Pulm (Clinically)'];
    const rowKeys = ['pulm_b_cf', 'pulm_cd', 'ep_b_cf', 'ep_cd'];

    const newCases = rowKeys.map(k => b1[k].new);
    const relapseCases = rowKeys.map(k => b1[k].relapse);
    const ukCases = rowKeys.map(k => b1[k].uk);
    const prevTx = rowKeys.map(k => b1[k].fail + b1[k].lost + b1[k].other);

    state.charts['categories'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'New (N)', data: newCases, backgroundColor: CHART_COLORS.new, borderRadius: 4 },
          { label: 'Relapse (R)', data: relapseCases, backgroundColor: CHART_COLORS.relapse, borderRadius: 4 },
          { label: 'History Unknown', data: ukCases, backgroundColor: CHART_COLORS.uk, borderRadius: 4 },
          { label: 'Previously Treated', data: prevTx, backgroundColor: CHART_COLORS.prev_tx, borderRadius: 4 }
        ]
      },
      options: {
        ...chartDefaults,
        plugins: {
          ...chartDefaults.plugins,
          datalabels: { ...chartDefaults.plugins.datalabels, anchor: 'center', align: 'center' }
        },
        scales: {
          x: { ...chartDefaults.scales.x, stacked: true },
          y: { ...chartDefaults.scales.y, stacked: true }
        }
      }
    });
  }

  function renderOpdPieChart(b3) {
    destroyChart('opdPie');
    const ctx = document.getElementById('chart-opd-pie');
    if (!ctx) return;

    // Presumptive is a subset of total OPD visits.
    const presumptive = b3.presumptive || 0;
    const otherOpd = Math.max(0, (b3.opd || 0) - presumptive);
    const total = presumptive + otherOpd;

    state.charts['opdPie'] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Presumptive Identified', 'Non-Presumptive New OPD Visits'],
        datasets: [{
          data: [presumptive, otherOpd],
          backgroundColor: [
            'rgba(245, 158, 11, 0.85)', // Presumptive
            'rgba(6, 182, 212, 0.85)'   // Other OPD
          ],
          borderWidth: 1,
          borderColor: 'rgba(17,24,39,1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 14 }
          },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.95)',
            titleFont: { family: 'Inter', size: 12, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 11 },
            padding: 10,
            cornerRadius: 8,
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${val.toLocaleString()} (${pct}%)`;
              }
            }
          },
          datalabels: {
            color: '#fff',
            font: { family: 'Inter', size: 11, weight: 'bold' },
            formatter: (value, context) => {
              if (value === 0) return '';
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${value.toLocaleString()}\n(${pct}%)`;
            },
            textAlign: 'center',
            anchor: 'center',
            align: 'center',
            offset: 0,
            clip: false
          }
        }
      }
    });
  }

  function renderCascadeChart(b3) {
    destroyChart('cascade');
    const ctx = document.getElementById('chart-cascade');
    if (!ctx) return;

    const labels = [
      'New OPD Visits', 'Presumptive Identified', 'LHW Comm Referrals',
      'Tested (AFB)', 'Tested (Xpert WRD)', 'Positive AFB', 'Positive Xpert',
      'AFB + Xpert Pos', 'B+ Confirmed (G.Tot)', 'All Registered B+ Cases', 'Registered Tested Xpert'
    ];

    const counts = [
      b3.opd, b3.presumptive, b3.comm_referrals,
      b3.tested_afb, b3.tested_xpert,
      b3.pos_afb, b3.pos_xpert, b3.afb_xpert_combo,
      b3.pos_gtot, b3.registered_b_plus, b3.tested_gene_xpert
    ];

    const bgColors = [
      'rgba(6, 182, 212, 0.30)', 'rgba(6, 182, 212, 0.50)', 'rgba(6, 182, 212, 0.70)',
      'rgba(59, 130, 246, 0.60)', 'rgba(59, 130, 246, 0.80)',
      'rgba(245, 158, 11, 0.60)', 'rgba(245, 158, 11, 0.75)', 'rgba(245, 158, 11, 0.90)',
      'rgba(16, 185, 129, 0.80)', 'rgba(16, 185, 129, 1.00)', 'rgba(139, 92, 246, 0.80)'
    ];

    state.charts['cascade'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Count',
          data: counts,
          backgroundColor: bgColors,
          borderRadius: 6,
          borderWidth: 0,
          minBarLength: 4,
        }]
      },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: {
          ...chartDefaults.plugins,
          legend: { display: false },
          tooltip: {
            ...chartDefaults.plugins.tooltip,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                const pct = b3.opd > 0 ? ` (${(val / b3.opd * 100).toFixed(1)}% of OPD)` : '';
                return ` ${val.toLocaleString()}${pct}`;
              }
            }
          }
        },
        scales: {
          x: {
            ...chartDefaults.scales.x,
            title: { display: true, text: 'Number of Patients', color: '#64748b', font: { family: 'Inter', size: 10 } },
            ticks: { ...chartDefaults.scales.x.ticks, precision: 0 },
          },
          y: {
            ...chartDefaults.scales.y,
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
          }
        }
      }
    });
  }

  function renderDstChart(b5) {
    destroyChart('dst');
    const ctx = document.getElementById('chart-dst');
    if (!ctx) return;

    const drugs = ['Rifampicin', 'Isoniazid', 'Fluoroquinolone'];
    const tested = [b5.total.rif_test, b5.total.inh_test, b5.total.flq_test];
    const resistant = [b5.total.rif_res, b5.total.inh_res, b5.total.flq_res];

    state.charts['dst'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: drugs,
        datasets: [
          { label: 'Total Tested Result', data: tested, backgroundColor: CHART_COLORS.accent_purple, borderRadius: 4 },
          { label: 'Resistant Cases', data: resistant, backgroundColor: CHART_COLORS.prev_tx, borderRadius: 4 }
        ]
      },
      options: { ...chartDefaults }
    });
  }

  function renderHivChart(b4) {
    destroyChart('hiv');
    const ctx = document.getElementById('chart-tb-hiv');
    if (!ctx) return;

    const labels = ['Screened for HIV', 'Tested Positive', 'Placed on ART'];
    const counts = [b4.tested_hiv, b4.pos_hiv, b4.art];

    state.charts['hiv'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: [CHART_COLORS.male, CHART_COLORS.prev_tx, CHART_COLORS.new],
          borderRadius: 6
        }]
      },
      options: {
        ...chartDefaults,
        plugins: { ...chartDefaults.plugins, legend: { display: false } }
      }
    });
  }

  function renderContactTracingChart(b6) {
    destroyChart('contactTracing');
    const ctx = document.getElementById('chart-contact-tracing');
    if (!ctx) return;

    const labels = ['Total HH of B+ Patients', 'HH Contacts Screened', 'Contacts Diagnosed Active TB', 'Contacts Initiated TPT'];

    const totalTptContacts =
      b6.contacts_tpt_6h.reduce((a, b) => a + b, 0) +
      b6.contacts_tpt_3hr.reduce((a, b) => a + b, 0) +
      b6.contacts_tpt_3hp.reduce((a, b) => a + b, 0);

    const counts = [
      b6.hh_total_lt5 + b6.hh_total_gt5,
      b6.screened_lt5 + b6.screened_gt5,
      b6.pos_lt5 + b6.pos_gt5,
      totalTptContacts
    ];

    state.charts['contactTracing'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: [
            'rgba(139, 92, 246, 0.4)', 'rgba(139, 92, 246, 0.6)',
            'rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 1)'
          ],
          borderRadius: 6
        }]
      },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: { ...chartDefaults.plugins, legend: { display: false } }
      }
    });
  }

  /* ────────────────────────────────────────────
     Auto-load excel files - Look for 2025 file
     ──────────────────────────────────────────── */
  async function tryAutoLoad() {
    try {
      const res = await fetch('TB-07 All Projects-2025.xlsx');
      if (!res.ok) throw new Error('Not found');
      const blob = await res.blob();

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });

          if (parseWorkbook(wb)) {
            dom.emptyState.style.display = 'none';
            dom.dashboard.style.display = 'block';
            buildLoadedSheetsTab();
            updateDashboardView();
            toast('Auto-loaded TB-07 Projects Sheet 2025 successfully!', 'success');
          }
        } catch (err) {
          console.error('Autoload parse error:', err);
        }
      };
      reader.readAsArrayBuffer(blob);
    } catch (err) {
      console.log('Autoload not found, awaiting manual file drop.');
    }
  }

  /* ────────────────────────────────────────────
     Event Bindings
     ──────────────────────────────────────────── */
  function bindEvents() {
    dom.uploadZone.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    dom.uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dom.uploadZone.classList.add('dragover');
    });
    dom.uploadZone.addEventListener('dragleave', () => {
      dom.uploadZone.classList.remove('dragover');
    });
    dom.uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dom.uploadZone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    dom.quarterSelect.addEventListener('change', (e) => {
      state.activeQuarter = e.target.value;
      updateDashboardView();
      toast(`Switched view to ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });

    dom.btnExport.addEventListener('click', exportJSON);

    $$('.sidebar-nav a[data-section]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = anchor.getAttribute('data-section');
        const sectionEl = $('#' + (sectionId === 'overview' ? 'overview' : (sectionId === 'charts' ? 'charts' : 'data-tables')));
        $$('.sidebar-nav a[data-section]').forEach(a => a.classList.remove('active'));
        anchor.classList.add('active');
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    $$('.tb-table-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tb-table-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const blockNum = tab.dataset.block;
        $$('.tb-table-content').forEach(content => {
          content.style.display = 'none';
        });
        $('#table-block-' + blockNum).style.display = 'block';
      });
    });

    dom.mobileToggle.addEventListener('click', () => {
      dom.sidebar.classList.toggle('visible');
    });

    document.addEventListener('click', (e) => {
      if (!dom.sidebar.contains(e.target) && e.target !== dom.mobileToggle && dom.sidebar.classList.contains('visible')) {
        dom.sidebar.classList.remove('visible');
      }
    });
  }

  /* ────────────────────────────────────────────
     Initialization
     ──────────────────────────────────────────── */
  function init() {
    bindEvents();
    tryAutoLoad();
  }

  document.addEventListener('DOMContentLoaded', init);

})();