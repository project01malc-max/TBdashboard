/* ============================================
   TB-07 Case Registration Dashboard Logic
   Full version – all cards restored, Card #12 shows HIV tested + positive
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

    // Card 1
    kpiTotalOpd: $('#kpi-total-opd'),
    kpiOpdSouth: $('#kpi-opd-south'),
    kpiOpdNorth: $('#kpi-opd-north'),
    kpiOpdSub: $('#kpi-opd-sub'),

    // Card 2
    kpiPresumptiveRate: $('#kpi-presumptive-rate'),
    kpiPresumptiveSouth: $('#kpi-presumptive-south'),
    kpiPresumptiveNorth: $('#kpi-presumptive-north'),
    kpiPresumptiveSub: $('#kpi-presumptive-sub'),

    // Card 3
    kpiAfbPositive: $('#kpi-afb-positive'),
    kpiAfbPosSouth: $('#kpi-afb-pos-south'),
    kpiAfbPosNorth: $('#kpi-afb-pos-north'),
    kpiAfbPosSub: $('#kpi-afb-pos-sub'),

    // Card 4
    kpiXpertPositive: $('#kpi-xpert-positive'),
    kpiXpertPosSouth: $('#kpi-xpert-pos-south'),
    kpiXpertPosNorth: $('#kpi-xpert-pos-north'),
    kpiXpertPosSub: $('#kpi-xpert-pos-sub'),

    // Card 5
    kpiTotalRegistered: $('#kpi-total-registered'),
    kpiRegPulmBcf: $('#kpi-reg-pulm-bcf'),
    kpiRegPulmCd: $('#kpi-reg-pulm-cd'),
    kpiRegEpBcf: $('#kpi-reg-ep-bcf'),
    kpiRegEpCd: $('#kpi-reg-ep-cd'),

    // Card 6
    kpiBPlusConfirmed: $('#kpi-b-plus-confirmed'),

    // Card 7
    kpiHhTotal: $('#kpi-hh-total'),
    kpiHhSouth: $('#kpi-hh-south'),
    kpiHhNorth: $('#kpi-hh-north'),
    kpiHhSub: $('#kpi-hh-sub'),

    // Card 8
    kpiContactScreened: $('#kpi-contact-screened'),
    kpiContactSouth: $('#kpi-contact-south'),
    kpiContactNorth: $('#kpi-contact-north'),
    kpiContactSub: $('#kpi-contact-sub'),

    // Card 9
    kpiContactDiagnosed: $('#kpi-contact-diagnosed'),
    kpiContactDiagnosedSouth: $('#kpi-contact-diagnosed-south'),
    kpiContactDiagnosedNorth: $('#kpi-contact-diagnosed-north'),
    kpiContactDiagnosedSub: $('#kpi-contact-diagnosed-sub'),

    // Card 10
    kpiChildTb: $('#kpi-childhood-tb'),
    kpiChildSouth: $('#kpi-child-south'),
    kpiChildNorth: $('#kpi-child-north'),
    kpiChildSub: $('#kpi-child-sub'),

    // Card 11
    kpiTptInitiated: $('#kpi-tpt-initiated'),
    kpiTptSouth: $('#kpi-tpt-south'),
    kpiTptNorth: $('#kpi-tpt-north'),
    kpiTptSub: $('#kpi-tpt-sub'),

    // Card 12 – HIV (now shows tested & positive)
    kpiHivScreening: $('#kpi-hiv-screening'),
    kpiHivSouth: $('#kpi-hiv-south'),
    kpiHivNorth: $('#kpi-hiv-north'),
    kpiHivSub: $('#kpi-hiv-sub'),

    // Table bodies
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
     Parser – with correct HIV row detection
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
    const lowerSearch = searchStr.toLowerCase();
    for (let i = 0; i <= maxOffset; i++) {
      const row = rows[startIdx + i] || [];
      for (let c = 0; c < row.length; c++) {
        const v = (row[c] || '').toString().toLowerCase();
        if (v.includes(lowerSearch)) return i;
      }
    }
    return -1;
  }

  function parseBlock(rows, startIdx) {
    if (startIdx >= rows.length) return null;

    let headerOffset = findRowOffset(rows, startIdx, 'Patients registered during', 5);
    if (headerOffset < 0) headerOffset = 2;

    const headerRow = rows[startIdx + headerOffset] || [];
    const bmu = headerRow[4] || 'MANGHOPIR';
    const district = (headerRow[11] || 'Central').replace(/:/g, '').trim();
    const period = headerRow[20] || 'Quarter';
    const year = (headerRow[23] || '2023').toString().replace('of Year', '').trim();

    // Block 1
    const b1LabelOffset = findRowOffset(rows, startIdx, 'Block 1:', 12);
    const b1DataStart = b1LabelOffset >= 0 ? b1LabelOffset + 3 : headerOffset + 7;
    const b1_raw = {
      pulm_b_cf: rows[startIdx + b1DataStart] || [],
      pulm_cd: rows[startIdx + b1DataStart + 1] || [],
      ep_b_cf: rows[startIdx + b1DataStart + 2] || [],
      ep_cd: rows[startIdx + b1DataStart + 3] || [],
      total: rows[startIdx + b1DataStart + 4] || []
    };
    const parseB1Row = (rawRow) => ({
      new: parseCell(rawRow[9]),
      relapse: parseCell(rawRow[11]),
      uk: parseCell(rawRow[13]),
      subtotal: parseCell(rawRow[15]),
      fail: parseCell(rawRow[17]),
      lost: parseCell(rawRow[19]),
      other: parseCell(rawRow[21]),
      total: parseCell(rawRow[23])
    });
    const block1 = {
      pulm_b_cf: parseB1Row(b1_raw.pulm_b_cf),
      pulm_cd: parseB1Row(b1_raw.pulm_cd),
      ep_b_cf: parseB1Row(b1_raw.ep_b_cf),
      ep_cd: parseB1Row(b1_raw.ep_cd),
      total: parseB1Row(b1_raw.total)
    };

    // Block 2
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
      m_0_4: parseCell(rawRow[7]),
      f_0_4: parseCell(rawRow[8]),
      m_5_14: parseCell(rawRow[9]),
      f_5_14: parseCell(rawRow[10]),
      m_15_24: parseCell(rawRow[11]),
      f_15_24: parseCell(rawRow[12]),
      m_25_34: parseCell(rawRow[13]),
      f_25_34: parseCell(rawRow[14]),
      m_35_44: parseCell(rawRow[15]),
      f_35_44: parseCell(rawRow[16]),
      m_45_54: parseCell(rawRow[17]),
      f_45_54: parseCell(rawRow[18]),
      m_55_64: parseCell(rawRow[19]),
      f_55_64: parseCell(rawRow[20]),
      m_65: parseCell(rawRow[21]),
      f_65: parseCell(rawRow[22]),
      m_total: parseCell(rawRow[23]),
      f_total: parseCell(rawRow[24]),
      grand_total: parseCell(rawRow[23]) + parseCell(rawRow[24])
    });
    const block2 = {
      pulm_b_cf: parseB2Row(b2_raw.pulm_b_cf),
      pulm_cd: parseB2Row(b2_raw.pulm_cd),
      ep_b_cf: parseB2Row(b2_raw.ep_b_cf),
      ep_cd: parseB2Row(b2_raw.ep_cd),
      total: parseB2Row(b2_raw.total)
    };

    // Block 3
    const b3LabelOffset = findRowOffset(rows, startIdx, 'Block 3:', 30);
    const b3DataOffset = b3LabelOffset >= 0 ? b3LabelOffset + 3 : b2DataStart + 7;
    const b3_row = rows[startIdx + b3DataOffset] || [];
    const block3 = {
      opd: parseCell(b3_row[0]),
      presumptive: parseCell(b3_row[1]),
      comm_referrals: parseCell(b3_row[2]),
      tested_afb: parseCell(b3_row[3]),
      tested_xpert: parseCell(b3_row[4]),
      pos_afb: parseCell(b3_row[5]),
      pos_xpert: parseCell(b3_row[6]),
      afb_xpert_combo: parseCell(b3_row[7]),
      pos_gtot: parseCell(b3_row[8]),
      registered_b_plus: parseCell(b3_row[9]),
      tested_gene_xpert: parseCell(b3_row[10]),
    };

    // ★★★ HIV: Block 4 parsing based on Excel structure ★★★
    const b4LabelOffset = findRowOffset(rows, startIdx, 'Block 4', 40);
    let b4Base = startIdx + (b4LabelOffset >= 0 ? b4LabelOffset : 35);

    // Subheading 1: "No. of TB patients tested for HIV"
    let sub1Offset = findRowOffset(rows, b4Base, 'tested for HIV', 8);
    if (sub1Offset < 0) sub1Offset = 1;
    const hiv_row_idx = b4Base + sub1Offset + 1; // Value Row 1 (contains 646)
    const hiv_row = rows[hiv_row_idx] || [];

    // Subheading 2: "HIV patient tested for TB"
    let sub2Offset = findRowOffset(rows, hiv_row_idx, 'tested for TB', 5);
    let hivTb_row_idx = hiv_row_idx + 2; // Value Row 2 (contains 5)
    if (sub2Offset >= 0) {
      hivTb_row_idx = hiv_row_idx + sub2Offset + 1;
    }
    const hivTbRow = rows[hivTb_row_idx] || [];

    const getNumAtIdx = (row, numIndex, fallbackCol) => {
      if (!row || !row.length) return 0;
      let nums = [];
      for (let c = 0; c < row.length; c++) {
        const val = row[c];
        if (val !== undefined && val !== null && val !== '') {
          const parsed = parseFloat(val);
          if (!isNaN(parsed)) {
            nums.push(parsed);
          }
        }
      }
      if (nums.length > numIndex) return nums[numIndex];
      return parseCell(row[fallbackCol]);
    };

    const block4 = {
      tested_hiv: getNumAtIdx(hiv_row, 0, 12),     // 646
      pos_hiv: getNumAtIdx(hiv_row, 1, 14),        // 0
      art: getNumAtIdx(hiv_row, 2, 16),            // 0
      hiv_tested_tb: getNumAtIdx(hivTbRow, 0, 12),  // 5
      hiv_pos_tb: getNumAtIdx(hivTbRow, 1, 14),     // 0
      tb_tx: getNumAtIdx(hivTbRow, 2, 16),          // 0
      tpt_6h_0_4: parseCell((rows[hivTb_row_idx + 1] || [])[20]),
      tpt_6h_5_14: parseCell((rows[hivTb_row_idx + 1] || [])[22]),
      tpt_6h_15: parseCell((rows[hivTb_row_idx + 1] || [])[23]),
      tpt_3hr_0_4: parseCell((rows[hivTb_row_idx + 2] || [])[20]),
      tpt_3hr_5_14: parseCell((rows[hivTb_row_idx + 2] || [])[22]),
      tpt_3hr_15: parseCell((rows[hivTb_row_idx + 2] || [])[23]),
      tpt_3hp_0_4: parseCell((rows[hivTb_row_idx + 3] || [])[20]),
      tpt_3hp_5_14: parseCell((rows[hivTb_row_idx + 3] || [])[22]),
      tpt_3hp_15: parseCell((rows[hivTb_row_idx + 3] || [])[23]),
    };

    // Block 5
    const b5LabelOffset = findRowOffset(rows, startIdx, 'Block 5', 40);
    const b5DataStart = b5LabelOffset >= 0 ? b5LabelOffset + 3 : b3DataOffset + 9;
    const parseB5Row = (rawRow) => ({
      rif_test: parseCell(rawRow[5]),
      rif_res: parseCell(rawRow[6]),
      inh_test: parseCell(rawRow[7]),
      inh_res: parseCell(rawRow[8]),
      flq_test: parseCell(rawRow[9]),
      flq_res: parseCell(rawRow[10])
    });
    const block5 = {
      new_uk: parseB5Row(rows[startIdx + b5DataStart] || []),
      relapse: parseB5Row(rows[startIdx + b5DataStart + 1] || []),
      prev_tx: parseB5Row(rows[startIdx + b5DataStart + 2] || []),
      total: parseB5Row(rows[startIdx + b5DataStart + 3] || [])
    };

    // Block 6
    const b6LabelOffset = findRowOffset(rows, startIdx, 'Block 6', 50);
    const b6DataStart = b6LabelOffset >= 0 ? b6LabelOffset + 3 : b5DataStart + 6;
    const ct_val_row = rows[startIdx + b6DataStart] || [];
    const ct_reg_3hr = rows[startIdx + b6DataStart + 1] || [];
    const ct_reg_3hp = rows[startIdx + b6DataStart + 2] || [];
    const block6 = {
      hh_total_lt5: parseCell(ct_val_row[12]),
      hh_total_gt5: parseCell(ct_val_row[13]),
      screened_lt5: parseCell(ct_val_row[14]),
      screened_gt5: parseCell(ct_val_row[15]),
      pos_lt5: parseCell(ct_val_row[16]),
      pos_gt5: parseCell(ct_val_row[17]),
      contacts_tpt_6h: [parseCell(ct_val_row[19]), parseCell(ct_val_row[20]), parseCell(ct_val_row[21])],
      contacts_tpt_3hr: [parseCell(ct_reg_3hr[19]), parseCell(ct_reg_3hr[20]), parseCell(ct_reg_3hr[21])],
      contacts_tpt_3hp: [parseCell(ct_reg_3hp[19]), parseCell(ct_reg_3hp[20]), parseCell(ct_reg_3hp[21])],
      immuno_tpt_6h: [parseCell(ct_val_row[22]), parseCell(ct_val_row[23]), parseCell(ct_val_row[24])],
      immuno_tpt_3hr: [parseCell(ct_reg_3hr[22]), parseCell(ct_reg_3hr[23]), parseCell(ct_reg_3hr[24])],
      immuno_tpt_3hp: [parseCell(ct_reg_3hp[22]), parseCell(ct_reg_3hp[23]), parseCell(ct_reg_3hp[24])],
    };

    return { bmu, district, period, year, block1, block2, block3, block4, block5, block6 };
  }

  /* ────────────────────────────────────────────
     Data Loading
     ──────────────────────────────────────────── */
  function parseWorkbook(wb) {
    const ws = wb.Sheets['MPR'];
    if (!ws) {
      toast('Sheet named "MPR" not found.', 'error');
      return false;
    }
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    state.rawData = rows;
    Object.keys(blockOffsets).forEach(qKey => {
      state.blocks[qKey] = parseBlock(rows, blockOffsets[qKey]);
    });

    const sheets = {
      KARACHI: 'karachiBlocks',
      SINDH: 'sindhBlocks',
      'GILGIT -BALTISTAN': 'gbBlocks',
      'AZAD - KASHMIR': 'akBlocks',
      KPK: 'kpkBlocks',
    };
    Object.keys(sheets).forEach(name => {
      const wsSheet = wb.Sheets[name];
      if (wsSheet) {
        const rowsSheet = XLSX.utils.sheet_to_json(wsSheet, { header: 1, defval: '' });
        const target = state[sheets[name]];
        Object.keys(blockOffsets).forEach(qKey => {
          target[qKey] = parseBlock(rowsSheet, blockOffsets[qKey]);
        });
        console.log(`[parseWorkbook] ${name} sheet parsed.`);
      }
    });

    const allProjectSheet = wb.Sheets['All Project Total - 2023'];
    if (allProjectSheet) {
      const rowsAllProject = XLSX.utils.sheet_to_json(allProjectSheet, { header: 1, defval: '' });
      Object.keys(blockOffsets).forEach(qKey => {
        state.allProjectBlocks[qKey] = parseBlock(rowsAllProject, blockOffsets[qKey]);
      });
      console.log('[parseWorkbook] All Project Total sheet parsed.');
    } else {
      toast('All Project Total sheet not found – using regional sum.', 'warning');
      Object.keys(blockOffsets).forEach(qKey => {
        state.allProjectBlocks[qKey] = getRegionalData(qKey).totalData;
      });
    }

    toast('TB Registry report parsed successfully!', 'success');
    return true;
  }

  function getRegionalData(qKey) {
    const q = qKey || state.activeQuarter;
    const ak = state.akBlocks[q];
    const gb = state.gbBlocks[q];
    const kpk = state.kpkBlocks[q];
    const karachi = state.karachiBlocks[q];
    const sindh = state.sindhBlocks[q];
    const mpr = state.blocks[q];

    const northData = sumObjects(ak, sumObjects(gb, kpk));
    const southData = sumObjects(mpr, sumObjects(karachi, sindh));
    const totalData = sumObjects(northData, southData);

    return { northData, southData, totalData };
  }

  function sumObjects(a, b) {
    if (a === null || a === undefined) return (b !== null && b !== undefined) ? JSON.parse(JSON.stringify(b)) : null;
    if (b === null || b === undefined) return (a !== null && a !== undefined) ? JSON.parse(JSON.stringify(a)) : null;
    if (typeof a === 'number' && typeof b === 'number') return a + b;
    if (Array.isArray(a) && Array.isArray(b)) {
      const maxLen = Math.max(a.length, b.length);
      const result = [];
      for (let i = 0; i < maxLen; i++) {
        const valA = typeof a[i] === 'number' ? a[i] : 0;
        const valB = typeof b[i] === 'number' ? b[i] : 0;
        result.push(valA + valB);
      }
      return result;
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const res = {};
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      keys.forEach(k => { res[k] = sumObjects(a[k], b[k]); });
      return res;
    }
    return a !== undefined ? a : b;
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
      { id: 'gb', key: 'GILGIT -BALTISTAN', label: 'Gilgit-Baltistan', icon: '🏔️', data: state.gbBlocks },
      { id: 'ak', key: 'AZAD - KASHMIR', label: 'Azad Kashmir', icon: '🌲', data: state.akBlocks },
      { id: 'kpk', key: 'KPK', label: 'KPK Report', icon: '⛰️', data: state.kpkBlocks },
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
        btn.title = `${sheet.key} sheet not found`;
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

  /* ────────────────────────────────────────────
     UI Updates
     ──────────────────────────────────────────── */
  function getBlocks() {
    const map = {
      'MPR': state.blocks,
      'KARACHI': state.karachiBlocks,
      'SINDH': state.sindhBlocks,
      'GILGIT -BALTISTAN': state.gbBlocks,
      'AZAD - KASHMIR': state.akBlocks,
      'KPK': state.kpkBlocks,
      'ALL_PROJECT': state.allProjectBlocks,
    };
    return map[state.activeSheet] || state.blocks;
  }

  function getSheetLabel() {
    const map = {
      'MPR': '🦠 MPR',
      'KARACHI': '🏙️ KARACHI',
      'SINDH': '🏜️ SINDH',
      'GILGIT -BALTISTAN': '🏔️ GILGIT-BALTISTAN',
      'AZAD - KASHMIR': '🌲 AZAD KASHMIR',
      'KPK': '⛰️ KPK',
      'ALL_PROJECT': '🌐 ALL PROJECT TOTAL',
    };
    return map[state.activeSheet] || '🦠 MPR';
  }

  function isAllProjectSheet() {
    return state.activeSheet === 'ALL_PROJECT';
  }

  function toggleBreakdownVisibility(show) {
    document.querySelectorAll('.kpi-breakdown').forEach(el => {
      el.style.display = show ? 'flex' : 'none';
    });
  }

  /* ────────────────────────────────────────────
     ★★★ MAIN UPDATE FUNCTION ★★★
     ──────────────────────────────────────────── */
  function updateDashboardView() {
    let blocks = getBlocks();
    let data = blocks[state.activeQuarter];
    if (!data) {
      console.warn('No data for quarter:', state.activeQuarter, 'sheet:', state.activeSheet);
      return;
    }

    let n = data, s = data, t = data;

    if (isAllProjectSheet()) {
      const regional = getRegionalData(state.activeQuarter);
      n = regional.northData || data;
      s = regional.southData || data;
      // data remains All-Project sheet
    }

    const calcRate = (num, den) => den > 0 ? (num / den * 100).toFixed(1) + '%' : '0.0%';
    const getTpt = (b6) => b6 ? (
      (b6.contacts_tpt_6h ? b6.contacts_tpt_6h.reduce((a, b) => a + b, 0) : 0) +
      (b6.contacts_tpt_3hr ? b6.contacts_tpt_3hr.reduce((a, b) => a + b, 0) : 0) +
      (b6.contacts_tpt_3hp ? b6.contacts_tpt_3hp.reduce((a, b) => a + b, 0) : 0)
    ) : 0;
    const getContact = (b6) => b6 ? (b6.screened_lt5 + b6.screened_gt5) : 0;
    const getContactDiagnosed = (b6) => b6 ? (b6.pos_lt5 + b6.pos_gt5) : 0;
    const getMaleChild = (b2) => b2 && b2.total ? (b2.total.m_0_4 + b2.total.m_5_14) : 0;
    const getFemaleChild = (b2) => b2 && b2.total ? (b2.total.f_0_4 + b2.total.f_5_14) : 0;

    // Titles
    const sheetBadge = `<span style="margin-left:10px;padding:2px 10px;background:linear-gradient(135deg,#06b6d4,#0891b2);border-radius:20px;font-size:0.7rem;font-weight:700;letter-spacing:0.05em;vertical-align:middle;">${getSheetLabel()}</span>`;
    dom.facilityTitle.innerHTML = `TB Care Facility (BMU): ${data.bmu}${sheetBadge}`;
    $('#data-summary').textContent = `District: ${data.district} | Year: ${data.year} (${data.period})`;

    const showBreakdown = isAllProjectSheet();
    toggleBreakdownVisibility(showBreakdown);

    // ==========================================
    // Card 1: Total New OPD Consultations
    // ==========================================
    dom.kpiTotalOpd.textContent = data.block3.opd.toLocaleString();
    if (showBreakdown) {
      dom.kpiOpdSouth.textContent = s.block3.opd.toLocaleString();
      dom.kpiOpdNorth.textContent = n.block3.opd.toLocaleString();
      dom.kpiOpdSub.textContent = (n.block3.opd + s.block3.opd).toLocaleString();
    }

    // ==========================================
    // Card 2: Presumptive TB Cases Identified
    // ==========================================
    dom.kpiPresumptiveRate.textContent = `${data.block3.presumptive.toLocaleString()} (${calcRate(data.block3.presumptive, data.block3.opd)})`;
    if (showBreakdown) {
      dom.kpiPresumptiveSouth.textContent = `${s.block3.presumptive.toLocaleString()} (${calcRate(s.block3.presumptive, s.block3.opd)})`;
      dom.kpiPresumptiveNorth.textContent = `${n.block3.presumptive.toLocaleString()} (${calcRate(n.block3.presumptive, n.block3.opd)})`;
      dom.kpiPresumptiveSub.textContent = `${(n.block3.presumptive + s.block3.presumptive).toLocaleString()} (${calcRate(n.block3.presumptive + s.block3.presumptive, n.block3.opd + s.block3.opd)})`;
    }

    // ==========================================
    // Card 3: AFB Positive Cases
    // ==========================================
    const afbPos = data.block3.pos_afb;
    const afbTested = data.block3.tested_afb;
    dom.kpiAfbPositive.textContent = `${afbPos.toLocaleString()} (${calcRate(afbPos, afbTested)} of AFB tested)`;
    if (showBreakdown) {
      const sAfb = s.block3.pos_afb, sTest = s.block3.tested_afb;
      dom.kpiAfbPosSouth.textContent = `${sAfb.toLocaleString()} (${calcRate(sAfb, sTest)} of AFB tested)`;
      const nAfb = n.block3.pos_afb, nTest = n.block3.tested_afb;
      dom.kpiAfbPosNorth.textContent = `${nAfb.toLocaleString()} (${calcRate(nAfb, nTest)} of AFB tested)`;
      const tAfb = nAfb + sAfb, tTest = nTest + sTest;
      dom.kpiAfbPosSub.textContent = `${tAfb.toLocaleString()} (${calcRate(tAfb, tTest)} of AFB tested)`;
    }

    // ==========================================
    // Card 4: GeneXpert Positive Cases
    // ==========================================
    const xpPos = data.block3.pos_xpert;
    const xpTested = data.block3.tested_xpert;
    dom.kpiXpertPositive.textContent = `${xpPos.toLocaleString()} (${calcRate(xpPos, xpTested)} of Xpert tested)`;
    if (showBreakdown) {
      const sXp = s.block3.pos_xpert, sXtest = s.block3.tested_xpert;
      dom.kpiXpertPosSouth.textContent = `${sXp.toLocaleString()} (${calcRate(sXp, sXtest)} of Xpert tested)`;
      const nXp = n.block3.pos_xpert, nXtest = n.block3.tested_xpert;
      dom.kpiXpertPosNorth.textContent = `${nXp.toLocaleString()} (${calcRate(nXp, nXtest)} of Xpert tested)`;
      const tXp = nXp + sXp, tXtest = nXtest + sXtest;
      dom.kpiXpertPosSub.textContent = `${tXp.toLocaleString()} (${calcRate(tXp, tXtest)} of Xpert tested)`;
    }

    // ==========================================
    // Card 5: All TB Cases Registered
    // ==========================================
    const totalReg = data.block1.total.total;
    dom.kpiTotalRegistered.textContent = `${totalReg.toLocaleString()} (${calcRate(totalReg, data.block3.presumptive)})`;
    dom.kpiRegPulmBcf.textContent = data.block1.pulm_b_cf.total.toLocaleString();
    dom.kpiRegPulmCd.textContent = data.block1.pulm_cd.total.toLocaleString();
    dom.kpiRegEpBcf.textContent = data.block1.ep_b_cf.total.toLocaleString();
    dom.kpiRegEpCd.textContent = data.block1.ep_cd.total.toLocaleString();
    if (showBreakdown) {
      const sReg = s.block1.total.total;
      $('#kpi-total-south').textContent = `${sReg.toLocaleString()} (${calcRate(sReg, s.block3.presumptive)})`;
      const nReg = n.block1.total.total;
      $('#kpi-total-north').textContent = `${nReg.toLocaleString()} (${calcRate(nReg, n.block3.presumptive)})`;
      const tReg = nReg + sReg;
      $('#kpi-total-sub').textContent = `${tReg.toLocaleString()} (${calcRate(tReg, n.block3.presumptive + s.block3.presumptive)})`;
    }

    // ==========================================
    // Card 6: B+ Confirmed Cases
    // ==========================================
    const bPlusTotal = data.block3.pos_gtot;
    dom.kpiBPlusConfirmed.textContent = `${bPlusTotal.toLocaleString()} (${calcRate(bPlusTotal, totalReg)})`;
    if (showBreakdown) {
      const sBPlus = s.block3.pos_gtot;
      $('#kpi-bplus-south').textContent = `${sBPlus.toLocaleString()} (${calcRate(sBPlus, s.block1.total.total)})`;
      const nBPlus = n.block3.pos_gtot;
      $('#kpi-bplus-north').textContent = `${nBPlus.toLocaleString()} (${calcRate(nBPlus, n.block1.total.total)})`;
      const tBPlus = nBPlus + sBPlus;
      $('#kpi-bplus-sub').textContent = `${tBPlus.toLocaleString()} (${calcRate(tBPlus, n.block1.total.total + s.block1.total.total)})`;
    }

    // ==========================================
    // ★ Card 7: Total No. of HH of B+PTB ★
    // ==========================================
    const hhTotal = data.block6.hh_total_lt5 + data.block6.hh_total_gt5;
    dom.kpiHhTotal.textContent = hhTotal.toLocaleString();
    if (showBreakdown) {
      const sHh = s.block6.hh_total_lt5 + s.block6.hh_total_gt5;
      dom.kpiHhSouth.textContent = sHh.toLocaleString();
      const nHh = n.block6.hh_total_lt5 + n.block6.hh_total_gt5;
      dom.kpiHhNorth.textContent = nHh.toLocaleString();
      dom.kpiHhSub.textContent = (nHh + sHh).toLocaleString();
    }

    // ==========================================
    // Card 8: HH Contacts Screened
    // ==========================================
    const contactsScreened = getContact(data.block6);
    dom.kpiContactScreened.textContent = `${contactsScreened.toLocaleString()} (${calcRate(contactsScreened, hhTotal)})`;
    if (showBreakdown) {
      const sHh = s.block6.hh_total_lt5 + s.block6.hh_total_gt5;
      const sScreen = getContact(s.block6);
      dom.kpiContactSouth.textContent = `${sScreen.toLocaleString()} (${calcRate(sScreen, sHh)})`;

      const nHh = n.block6.hh_total_lt5 + n.block6.hh_total_gt5;
      const nScreen = getContact(n.block6);
      dom.kpiContactNorth.textContent = `${nScreen.toLocaleString()} (${calcRate(nScreen, nHh)})`;

      const tHh = nHh + sHh;
      const tScreen = nScreen + sScreen;
      dom.kpiContactSub.textContent = `${tScreen.toLocaleString()} (${calcRate(tScreen, tHh)})`;
    }

    // ==========================================
    // Card 9: HH Contacts Diagnosed with Active TB
    // ==========================================
    const contactsDiagnosed = getContactDiagnosed(data.block6);
    dom.kpiContactDiagnosed.textContent = `${contactsDiagnosed.toLocaleString()} (${calcRate(contactsDiagnosed, contactsScreened)})`;
    if (showBreakdown) {
      const sDiag = getContactDiagnosed(s.block6);
      const sScreen = getContact(s.block6);
      dom.kpiContactDiagnosedSouth.textContent = `${sDiag.toLocaleString()} (${calcRate(sDiag, sScreen)})`;
      const nDiag = getContactDiagnosed(n.block6);
      const nScreen = getContact(n.block6);
      dom.kpiContactDiagnosedNorth.textContent = `${nDiag.toLocaleString()} (${calcRate(nDiag, nScreen)})`;
      const tDiag = nDiag + sDiag;
      const tScreen = nScreen + sScreen;
      dom.kpiContactDiagnosedSub.textContent = `${tDiag.toLocaleString()} (${calcRate(tDiag, tScreen)})`;
    }

    // ==========================================
    // Card 10: Childhood TB (<15 Years)
    // ==========================================
    const childTotal = getMaleChild(data.block2) + getFemaleChild(data.block2);
    dom.kpiChildTb.textContent = `${childTotal.toLocaleString()} (${calcRate(childTotal, totalReg)})`;
    if (showBreakdown) {
      const sChild = getMaleChild(s.block2) + getFemaleChild(s.block2);
      const sReg = s.block1.total.total;
      const nChild = getMaleChild(n.block2) + getFemaleChild(n.block2);
      const nReg = n.block1.total.total;
      const tChild = nChild + sChild;
      const tReg = nReg + sReg;
      dom.kpiChildSouth.textContent = `${sChild.toLocaleString()} (${calcRate(sChild, sReg)})`;
      dom.kpiChildNorth.textContent = `${nChild.toLocaleString()} (${calcRate(nChild, nReg)})`;
      dom.kpiChildSub.textContent = `${tChild.toLocaleString()} (${calcRate(tChild, tReg)})`;
    }

    // ==========================================
    // Card 11: Contacts Put on TPT
    // ==========================================
    const tptTotal = getTpt(data.block6);
    dom.kpiTptInitiated.textContent = `${tptTotal.toLocaleString()} (${calcRate(tptTotal, contactsDiagnosed)})`;
    if (showBreakdown) {
      const sDiag = getContactDiagnosed(s.block6);
      const sTpt = getTpt(s.block6);
      dom.kpiTptSouth.textContent = `${sTpt.toLocaleString()} (${calcRate(sTpt, sDiag)})`;
      const nDiag = getContactDiagnosed(n.block6);
      const nTpt = getTpt(n.block6);
      dom.kpiTptNorth.textContent = `${nTpt.toLocaleString()} (${calcRate(nTpt, nDiag)})`;
      const tDiag = nDiag + sDiag;
      const tTpt = nTpt + sTpt;
      dom.kpiTptSub.textContent = `${tTpt.toLocaleString()} (${calcRate(tTpt, tDiag)})`;
    }

    // Card 12 – HIV Screening (shows No. of TB patients tested for HIV & HIV patients tested for TB, no %)
    const hivTested = data.block4.tested_hiv;      // No. of TB patients tested for HIV (646)
    const hivTestedTb = data.block4.hiv_tested_tb;  // HIV patients tested for TB (5)
    dom.kpiHivScreening.innerHTML = `
  <div style="font-size:1rem; line-height:1.5;">
    <div>${hivTested.toLocaleString()}</div>
    <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:6px;">No. of TB patients tested for HIV</div>
    <div>${hivTestedTb.toLocaleString()}</div>
    <div style="font-size:0.7rem;color:var(--text-secondary);">HIV patients tested for TB</div>
  </div>
`;

    if (showBreakdown) {
      const sTested = s.block4.tested_hiv;
      const sTestedTb = s.block4.hiv_tested_tb;
      const nTested = n.block4.tested_hiv;
      const nTestedTb = n.block4.hiv_tested_tb;
      const tTested = (isAllProjectSheet() && data.block4.tested_hiv) ? data.block4.tested_hiv : (sTested + nTested);
      const tTestedTb = (isAllProjectSheet() && data.block4.hiv_tested_tb) ? data.block4.hiv_tested_tb : (sTestedTb + nTestedTb);

      dom.kpiHivSouth.innerHTML = `
        <div>${sTested.toLocaleString()}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);">TB tested for HIV</div>
        <div>${sTestedTb.toLocaleString()}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);">HIV tested for TB</div>
      `;
      dom.kpiHivNorth.innerHTML = `
        <div>${nTested.toLocaleString()}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);">TB tested for HIV</div>
        <div>${nTestedTb.toLocaleString()}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);">HIV tested for TB</div>
      `;
      dom.kpiHivSub.innerHTML = `
        <div>${tTested.toLocaleString()}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);">TB tested for HIV</div>
        <div>${tTestedTb.toLocaleString()}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);">HIV tested for TB</div>
      `;
    }

    // ==========================================
    // Render Tables
    // ==========================================
    renderTableBlock1(data.block1);
    renderTableBlock2(data.block2);
    renderTableBlock3_4(data.block3, data.block4);
    renderTableBlock5(data.block5);
    renderTableBlock6(data.block6);

    // ==========================================
    // Render Charts
    // ==========================================
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
          <td style="text-align: right; background: rgba(255,255,255,0.02);">${dataRow.subtotal.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.fail.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.lost.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.other.toLocaleString()}</td>
          <td style="text-align: right;" ${totalStyle}>${dataRow.total.toLocaleString()}</td>
        </tr>
      `;
    };
    dom.tbodyBlock1.innerHTML = `
      ${rowHTML('Pulmonary: Bacteriologically Confirmed', b1.pulm_b_cf)}
      ${rowHTML('Pulmonary: Clinically Diagnosed', b1.pulm_cd)}
      ${rowHTML('Extra-Pulmonary: Bacteriologically Confirmed', b1.ep_b_cf)}
      ${rowHTML('Extra-Pulmonary: Clinically Diagnosed', b1.ep_cd)}
      ${rowHTML('Total Registered Cases', b1.total, true)}
    `;
  }

  function renderTableBlock2(b2) {
    const rowHTML = (label, d, isTotal = false) => {
      const style = isTotal ? 'style="font-weight: 700; background: rgba(255,255,255,0.02);"' : '';
      return `
        <tr ${style}>
          <td style="font-weight: 500;">${label}</td>
          <td style="text-align: right;">${d.m_0_4}</td><td style="text-align: right;">${d.f_0_4}</td>
          <td style="text-align: right;">${d.m_5_14}</td><td style="text-align: right;">${d.f_5_14}</td>
          <td style="text-align: right;">${d.m_15_24}</td><td style="text-align: right;">${d.f_15_24}</td>
          <td style="text-align: right;">${d.m_25_34}</td><td style="text-align: right;">${d.f_25_34}</td>
          <td style="text-align: right;">${d.m_35_44}</td><td style="text-align: right;">${d.f_35_44}</td>
          <td style="text-align: right;">${d.m_45_54}</td><td style="text-align: right;">${d.f_45_54}</td>
          <td style="text-align: right;">${d.m_55_64}</td><td style="text-align: right;">${d.f_55_64}</td>
          <td style="text-align: right;">${d.m_65}</td><td style="text-align: right;">${d.f_65}</td>
          <td style="text-align: right; background: rgba(255,255,255,0.02);">${d.m_total}</td>
          <td style="text-align: right; background: rgba(255,255,255,0.02);">${d.f_total}</td>
          <td style="text-align: right; background: rgba(6,182,212,0.1); font-weight: bold;">${d.grand_total.toLocaleString()}</td>
        </tr>
      `;
    };
    dom.tbodyBlock2.innerHTML = `
      ${rowHTML('Pulmonary: Bacteriologically Confirmed', b2.pulm_b_cf)}
      ${rowHTML('Pulmonary: Clinically Diagnosed', b2.pulm_cd)}
      ${rowHTML('Extra-Pulmonary: Bacteriologically Confirmed', b2.ep_b_cf)}
      ${rowHTML('Extra-Pulmonary: Clinically Diagnosed', b2.ep_cd)}
      ${rowHTML('Total New, Relapse & UK Cases', b2.total, true)}
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
    const rowHTML = (label, dataRow, isTotal = false) => {
      const style = isTotal ? 'style="font-weight: 700; background: rgba(255,255,255,0.02);"' : '';
      return `
        <tr ${style}>
          <td style="font-weight: 500;">${label}</td>
          <td style="text-align: right;">${dataRow.rif_test.toLocaleString()}</td>
          <td style="text-align: right; color: ${dataRow.rif_res > 0 ? 'var(--accent-6)' : 'inherit'}; font-weight: ${dataRow.rif_res > 0 ? 'bold' : 'normal'};">${dataRow.rif_res.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.inh_test.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.inh_res.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.flq_test.toLocaleString()}</td>
          <td style="text-align: right;">${dataRow.flq_res.toLocaleString()}</td>
        </tr>
      `;
    };
    dom.tbodyBlock5.innerHTML = `
      ${rowHTML('New & History Unknown B+ Cases', b5.new_uk)}
      ${rowHTML('Relapse B+ Cases', b5.relapse)}
      ${rowHTML('Previously Treated (Excl. Relapse)', b5.prev_tx)}
      ${rowHTML('Total B+ Cases Tested for DST', b5.total, true)}
    `;
  }

  function renderTableBlock6(b6) {
    const rowHTML = (label, lt5, gt5, isTotal = false) => {
      const style = isTotal ? 'style="font-weight: 600; background: rgba(255,255,255,0.02);"' : '';
      const totalVal = lt5 + gt5;
      return `
        <tr ${style}>
          <td style="padding-left: ${isTotal ? '12px' : '20px'};">${label}</td>
          <td style="text-align: right;">${lt5.toLocaleString()}</td>
          <td style="text-align: right;">${gt5.toLocaleString()}</td>
          <td style="text-align: right; font-weight: bold; background: rgba(6,182,212,0.06);">${totalVal.toLocaleString()}</td>
        </tr>
      `;
    };
    const tpt6hLt5 = b6.contacts_tpt_6h[0];
    const tpt6hGt5 = b6.contacts_tpt_6h[1] + b6.contacts_tpt_6h[2];
    const tpt3hrLt5 = b6.contacts_tpt_3hr[0];
    const tpt3hrGt5 = b6.contacts_tpt_3hr[1] + b6.contacts_tpt_3hr[2];
    const tpt3hpLt5 = b6.contacts_tpt_3hp[0];
    const tpt3hpGt5 = b6.contacts_tpt_3hp[1] + b6.contacts_tpt_3hp[2];
    const totalContactsLt5 = tpt6hLt5 + tpt3hrLt5 + tpt3hpLt5;
    const totalContactsGt5 = tpt6hGt5 + tpt3hrGt5 + tpt3hpGt5;
    const tpt6hImmLt5 = b6.immuno_tpt_6h[0];
    const tpt6hImmGt5 = b6.immuno_tpt_6h[1] + b6.immuno_tpt_6h[2];
    const tpt3hrImmLt5 = b6.immuno_tpt_3hr[0];
    const tpt3hrImmGt5 = b6.immuno_tpt_3hr[1] + b6.immuno_tpt_3hr[2];
    const tpt3hpImmLt5 = b6.immuno_tpt_3hp[0];
    const tpt3hpImmGt5 = b6.immuno_tpt_3hp[1] + b6.immuno_tpt_3hp[2];
    const totalImmLt5 = tpt6hImmLt5 + tpt3hrImmLt5 + tpt3hpImmLt5;
    const totalImmGt5 = tpt6hImmGt5 + tpt3hrImmGt5 + tpt3hpImmGt5;
    dom.tbodyBlock6.innerHTML = `
      ${rowHTML('Total Households of B+ Index Patients Identified', b6.hh_total_lt5, b6.hh_total_gt5, true)}
      ${rowHTML('Total HH Contacts Screened for TB Symptoms', b6.screened_lt5, b6.screened_gt5, true)}
      ${rowHTML('HH Contacts Diagnosed with Active TB Disease', b6.pos_lt5, b6.pos_gt5, true)}
      <tr style="font-weight: bold; background: rgba(6,182,212,0.04);"><td colspan="4">HH Contacts Put on TPT by Regimen:</td></tr>
      ${rowHTML('Initiated on Regimen: 6H (Isoniazid Daily 6m)', tpt6hLt5, tpt6hGt5)}
      ${rowHTML('Initiated on Regimen: 3HR (Isoniazid + Rifampicin 3m)', tpt3hrLt5, tpt3hrGt5)}
      ${rowHTML('Initiated on Regimen: 3HP (Isoniazid + Rifapentine 3m)', tpt3hpLt5, tpt3hpGt5)}
      <tr style="font-weight: bold; background: rgba(16,185,129,0.06);">
        <td style="padding-left: 20px;">Total Household Contacts Put on TPT</td>
        <td style="text-align: right;">${totalContactsLt5.toLocaleString()}</td>
        <td style="text-align: right;">${totalContactsGt5.toLocaleString()}</td>
        <td style="text-align: right; background: rgba(16,185,129,0.15); color: #10b981;">${(totalContactsLt5 + totalContactsGt5).toLocaleString()}</td>
      </tr>
      <tr style="font-weight: bold; background: rgba(6,182,212,0.04);"><td colspan="4">Immunocompromised Contacts (excl. HH) Put on TPT:</td></tr>
      ${rowHTML('Initiated on Regimen: 6H (HIV- / Immuno-)', tpt6hImmLt5, tpt6hImmGt5)}
      ${rowHTML('Initiated on Regimen: 3HR (HIV- / Immuno-)', tpt3hrImmLt5, tpt3hrImmGt5)}
      ${rowHTML('Initiated on Regimen: 3HP (HIV- / Immuno-)', tpt3hpImmLt5, tpt3hpImmGt5)}
      <tr style="font-weight: bold; background: rgba(255, 255, 255, 0.03);">
        <td style="padding-left: 20px;">Total Immunocompromised Put on TPT</td>
        <td style="text-align: right;">${totalImmLt5.toLocaleString()}</td>
        <td style="text-align: right;">${totalImmGt5.toLocaleString()}</td>
        <td style="text-align: right; background: rgba(6,182,212,0.15); color: var(--accent-1);">${(totalImmLt5 + totalImmGt5).toLocaleString()}</td>
      </tr>
    `;
  }

  /* ────────────────────────────────────────────
     CHART RENDERERS
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
    renderOpdPresumptiveChart(data.block3);
    renderDstChart(data.block5);
    renderHivChart(data.block4);
    renderContactTracingChart(data.block6);

    // North vs South (only for ALL_PROJECT)
    const card = document.getElementById('north-south-comparison-card');
    if (state.activeSheet === 'ALL_PROJECT') {
      card.style.display = 'block';
      const regional = getRegionalData(state.activeQuarter);
      renderNorthSouthComparison(regional.northData, regional.southData);
    } else {
      card.style.display = 'none';
      if (state.charts['northSouthComparison']) {
        state.charts['northSouthComparison'].destroy();
        delete state.charts['northSouthComparison'];
      }
    }
  }

  function renderNorthSouthComparison(northData, southData) {
    const ctx = document.getElementById('chart-north-south-comparison');
    if (!ctx) return;
    const get = (obj, path) => {
      try {
        return path.split('.').reduce((o, key) => o[key], obj) || 0;
      } catch {
        return 0;
      }
    };
    const metrics = [
      { label: 'Total OPD', path: 'block3.opd' },
      { label: 'Presumptive TB', path: 'block3.presumptive' },
      { label: 'AFB Positive', path: 'block3.pos_afb' },
      { label: 'Xpert Positive', path: 'block3.pos_xpert' },
      { label: 'Registered Cases', path: 'block1.total.total' },
      { label: 'B+ Confirmed', path: 'block3.pos_gtot' },
      { label: 'Contacts Screened', path: 'block6' },
      { label: 'HIV Screening', path: 'block4.tested_hiv' },
      { label: 'Childhood TB', path: 'block2.total' }
    ];
    const northValues = metrics.map(m => {
      if (m.label === 'Contacts Screened') {
        const b6 = northData.block6 || {};
        return (b6.screened_lt5 || 0) + (b6.screened_gt5 || 0);
      }
      if (m.label === 'Childhood TB') {
        const b2 = northData.block2 || {};
        const t = b2.total || {};
        return (t.m_0_4 || 0) + (t.m_5_14 || 0) + (t.f_0_4 || 0) + (t.f_5_14 || 0);
      }
      return get(northData, m.path);
    });
    const southValues = metrics.map(m => {
      if (m.label === 'Contacts Screened') {
        const b6 = southData.block6 || {};
        return (b6.screened_lt5 || 0) + (b6.screened_gt5 || 0);
      }
      if (m.label === 'Childhood TB') {
        const b2 = southData.block2 || {};
        const t = b2.total || {};
        return (t.m_0_4 || 0) + (t.m_5_14 || 0) + (t.f_0_4 || 0) + (t.f_5_14 || 0);
      }
      return get(southData, m.path);
    });
    const labels = metrics.map(m => m.label);
    if (state.charts['northSouthComparison']) {
      state.charts['northSouthComparison'].destroy();
    }
    state.charts['northSouthComparison'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'North PK',
            data: northValues,
            backgroundColor: '#ec4899',
            borderColor: '#ec4899',
            borderWidth: 1,
            borderRadius: 4,
            order: 2,
          },
          {
            label: 'South PK',
            data: southValues,
            backgroundColor: '#06b6d4',
            borderColor: '#06b6d4',
            borderWidth: 1,
            borderRadius: 4,
            order: 2,
          },
          {
            type: 'line',
            label: 'North PK Trend',
            data: northValues,
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#ec4899',
            order: 1,
            datalabels: { display: false }
          },
          {
            type: 'line',
            label: 'South PK Trend',
            data: southValues,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#06b6d4',
            order: 1,
            datalabels: { display: false }
          }
        ]
      },
      options: {
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
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}`
            }
          },
          datalabels: {
            color: '#f1f5f9',
            font: { family: 'Inter', size: 11, weight: 'bold' },
            formatter: (value, context) => {
              if (context.datasetIndex < 2 && value > 0) {
                return value.toLocaleString();
              }
              return '';
            },
            anchor: 'end',
            align: 'end',
            offset: 2,
            clip: false
          }
        },
        scales: {
          x: {
            ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: 'rgba(255,255,255,0.06)' },
            beginAtZero: true,
          }
        }
      }
    });
  }

  // --- Other chart functions (identical to original) ---
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
    const blocks = getBlocks();
    const data = blocks[state.activeQuarter];
    const presumptive = data ? data.block3.presumptive : 0;
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
          datalabels: { ...chartDefaults.plugins.datalabels, anchor: 'center', align: 'center' },
          tooltip: {
            ...chartDefaults.plugins.tooltip,
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || '';
                const value = context.raw;
                const categoryTotal = context.dataset.data.reduce((a, b) => a + b, 0);
                const pctOfCategory = categoryTotal > 0 ? ((value / categoryTotal) * 100).toFixed(1) : 0;
                const pctOfPresumptive = presumptive > 0 ? ((value / presumptive) * 100).toFixed(1) : 0;
                return `${label}: ${value.toLocaleString()} (${pctOfCategory}% of category, ${pctOfPresumptive}% of Presumptive)`;
              }
            }
          }
        },
        scales: {
          x: { ...chartDefaults.scales.x, stacked: true },
          y: { ...chartDefaults.scales.y, stacked: true }
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

  function renderOpdPresumptiveChart(b3) {
    destroyChart('opdPresumptive');
    const ctx = document.getElementById('chart-opd-presumptive');
    if (!ctx) return;
    const labels = ['Presumptive Identified', 'Other OPD Visits'];
    const presumptive = b3.presumptive;
    const otherOpd = Math.max(0, b3.opd - b3.presumptive);
    const data = [presumptive, otherOpd];
    state.charts['opdPresumptive'] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['rgba(6, 182, 212, 0.85)', 'rgba(148, 163, 184, 0.3)'],
          borderWidth: 1,
          borderColor: '#1e293b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#e2e8f0', font: { family: 'Inter', size: 11 }, padding: 14 }
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
                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const value = context.raw;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                return ` ${context.label}: ${value.toLocaleString()} (${percentage})`;
              }
            }
          },
          datalabels: {
            color: '#ffffff',
            font: { family: 'Inter', size: 11, weight: 'bold' },
            formatter: (value, context) => {
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              if (total === 0 || value === 0) return '';
              const percentage = ((value / total) * 100).toFixed(1) + '%';
              return `${value.toLocaleString()}\n(${percentage})`;
            },
            textAlign: 'center',
            anchor: 'center',
            align: 'center',
            offset: 0
          }
        },
        scales: {
          x: { display: false },
          y: { display: false }
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
     Auto-load & Event Bindings
     ──────────────────────────────────────────── */
  async function tryAutoLoad() {
    try {
      const res = await fetch('TB-07 All Projects-2023.xlsx');
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
            toast('Auto-loaded TB-07 Projects Sheet 2023 successfully!', 'success');
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
    document.querySelectorAll('.sidebar-nav a[data-section]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = anchor.getAttribute('data-section');
        const sectionEl = document.getElementById(sectionId === 'overview' ? 'overview' : (sectionId === 'charts' ? 'charts' : 'data-tables'));
        document.querySelectorAll('.sidebar-nav a[data-section]').forEach(a => a.classList.remove('active'));
        anchor.classList.add('active');
        if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
      });
    });
    document.querySelectorAll('.tb-table-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tb-table-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const blockNum = tab.dataset.block;
        document.querySelectorAll('.tb-table-content').forEach(content => {
          content.style.display = 'none';
        });
        document.getElementById('table-block-' + blockNum).style.display = 'block';
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

  function init() {
    bindEvents();
    tryAutoLoad();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
