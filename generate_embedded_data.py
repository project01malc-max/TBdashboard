import openpyxl
import json
import os

def parse_cell(v):
    if v is None or v == '':
        return 0
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except:
        return 0

def find_row_offset(rows, start_idx, search_str, max_offset=50):
    lower = search_str.lower()
    for i in range(max_offset + 1):
        if start_idx + i >= len(rows):
            break
        row = rows[start_idx + i] or []
        for c in row:
            if c is not None and lower in str(c).lower():
                return i
    return -1

def numeric_values(row, from_col=0, to_col=None):
    out = []
    if not row:
        return out
    end = len(row) if to_col is None else min(to_col, len(row))
    for c in range(from_col, end):
        v = row[c]
        if v is not None and v != '':
            if isinstance(v, (int, float)):
                out.append(int(v) if float(v).is_integer() else float(v))
            elif isinstance(v, str):
                s = v.strip()
                try:
                    f = float(s)
                    out.append(int(f) if f.is_integer() else f)
                except:
                    pass
    return out

def nv(nums, i):
    return nums[i] if nums and len(nums) > i else 0

def find_col_by_text(row, includes, excludes=None, from_col=0):
    if not row:
        return -1
    for c in range(from_col, len(row)):
        v = str(row[c] or '').lower()
        if not v:
            continue
        if all(s in v for s in includes) and not any(s in v for s in (excludes or [])):
            return c
    return -1

def value_after_label(row, label_substr):
    if not row:
        return None
    idx = find_col_by_text(row, [label_substr])
    if idx < 0:
        return None
    for i in range(idx + 1, len(row)):
        v = row[i]
        if v is not None and str(v).strip() != '':
            return str(v).strip()
    return None

def sum_objects(a, b):
    if not a and not b:
        return None
    if not a:
        return b
    if not b:
        return a
    if isinstance(a, list) or isinstance(b, list):
        arr_a = a if isinstance(a, list) else []
        arr_b = b if isinstance(b, list) else []
        max_l = max(len(arr_a), len(arr_b))
        res = []
        for i in range(max_l):
            va = arr_a[i] if i < len(arr_a) else 0
            vb = arr_b[i] if i < len(arr_b) else 0
            res.append(va + vb)
        return res
    if isinstance(a, dict) or isinstance(b, dict):
        keys = set(list((a or {}).keys()) + list((b or {}).keys()))
        res = {}
        for k in keys:
            va = (a or {}).get(k)
            vb = (b or {}).get(k)
            if isinstance(va, (int, float)) or isinstance(vb, (int, float)):
                res[k] = (va or 0) + (vb or 0)
            elif isinstance(va, list) or isinstance(vb, list):
                res[k] = sum_objects(va, vb)
            elif isinstance(va, dict) or isinstance(vb, dict):
                res[k] = sum_objects(va, vb)
            else:
                res[k] = va if va is not None else vb
        return res
    return a if a is not None else b

def ensure_consolidated_block6(target):
    if not target or 'consolidated' not in target or not target['consolidated']:
        return
    c6 = target['consolidated'].get('block6')
    if not c6:
        return
    c6_total = (c6.get('hh_total_lt5', 0) or 0) + (c6.get('hh_total_gt5', 0) or 0)
    if c6_total == 0 and 'q1' in target and 'q2' in target and 'q3' in target and 'q4' in target:
        if target['q1'] and target['q2'] and target['q3'] and target['q4']:
            target['consolidated']['block6'] = sum_objects(
                target['q1']['block6'],
                sum_objects(target['q2']['block6'], sum_objects(target['q3']['block6'], target['q4']['block6']))
            )

# ----------------- 2023 Parser -----------------
def parse_block_2023(rows, start_idx):
    if start_idx >= len(rows):
        return None
    header_offset = find_row_offset(rows, start_idx, 'Patients registered during', 5)
    if header_offset < 0:
        header_offset = 2
    header_row = rows[start_idx + header_offset] if start_idx + header_offset < len(rows) else []
    bmu = header_row[4] if len(header_row) > 4 and header_row[4] else 'MANGHOPIR'
    district = str(header_row[11] if len(header_row) > 11 and header_row[11] else 'Central').replace(':', '').strip()
    period = header_row[20] if len(header_row) > 20 and header_row[20] else 'Quarter'
    year = str(header_row[23] if len(header_row) > 23 and header_row[23] else '2023').replace('of Year', '').strip()

    b1_label_offset = find_row_offset(rows, start_idx, 'Block 1:', 12)
    b1_data_start = b1_label_offset + 3 if b1_label_offset >= 0 else header_offset + 7

    def r(idx):
        return rows[start_idx + idx] if start_idx + idx < len(rows) and rows[start_idx + idx] else []

    def parse_b1_row(raw_row):
        def c(idx): return parse_cell(raw_row[idx]) if idx < len(raw_row) else 0
        return {
            'new': c(9), 'relapse': c(11), 'uk': c(13), 'subtotal': c(15),
            'fail': c(17), 'lost': c(19), 'other': c(21), 'total': c(23)
        }
    block1 = {
        'pulm_b_cf': parse_b1_row(r(b1_data_start)),
        'pulm_cd': parse_b1_row(r(b1_data_start + 1)),
        'ep_b_cf': parse_b1_row(r(b1_data_start + 2)),
        'ep_cd': parse_b1_row(r(b1_data_start + 3)),
        'total': parse_b1_row(r(b1_data_start + 4))
    }

    b2_label_offset = find_row_offset(rows, start_idx, 'Block 2:', 20)
    b2_data_start = b2_label_offset + 3 if b2_label_offset >= 0 else b1_data_start + 9
    def parse_b2_row(raw_row):
        def c(idx): return parse_cell(raw_row[idx]) if idx < len(raw_row) else 0
        m_tot = c(23)
        f_tot = c(24)
        return {
            'm_0_4': c(7), 'f_0_4': c(8), 'm_5_14': c(9), 'f_5_14': c(10),
            'm_15_24': c(11), 'f_15_24': c(12), 'm_25_34': c(13), 'f_25_34': c(14),
            'm_35_44': c(15), 'f_35_44': c(16), 'm_45_54': c(17), 'f_45_54': c(18),
            'm_55_64': c(19), 'f_55_64': c(20), 'm_65': c(21), 'f_65': c(22),
            'm_total': m_tot, 'f_total': f_tot, 'grand_total': m_tot + f_tot
        }
    block2 = {
        'pulm_b_cf': parse_b2_row(r(b2_data_start)),
        'pulm_cd': parse_b2_row(r(b2_data_start + 1)),
        'ep_b_cf': parse_b2_row(r(b2_data_start + 2)),
        'ep_cd': parse_b2_row(r(b2_data_start + 3)),
        'total': parse_b2_row(r(b2_data_start + 4))
    }

    b3_label_offset = find_row_offset(rows, start_idx, 'Block 3:', 30)
    b3_data_offset = b3_label_offset + 3 if b3_label_offset >= 0 else b2_data_start + 7
    b3_row = r(b3_data_offset)
    def c3(idx): return parse_cell(b3_row[idx]) if idx < len(b3_row) else 0
    block3 = {
        'opd': c3(0), 'presumptive': c3(1), 'comm_referrals': c3(2),
        'tested_afb': c3(3), 'tested_xpert': c3(4), 'pos_afb': c3(5),
        'pos_xpert': c3(6), 'afb_xpert_combo': c3(7), 'pos_gtot': c3(8),
        'registered_b_plus': c3(9), 'tested_gene_xpert': c3(10)
    }

    # Block 4
    b4_label_offset = find_row_offset(rows, start_idx, 'Block 4', 40)
    b4_base = start_idx + (b4_label_offset if b4_label_offset >= 0 else 35)
    sub1_offset = find_row_offset(rows, b4_base, 'tested for HIV', 8)
    if sub1_offset < 0: sub1_offset = 1
    hiv_row_idx = b4_base + sub1_offset + 1
    hiv_row = rows[hiv_row_idx] if hiv_row_idx < len(rows) and rows[hiv_row_idx] else []

    sub2_offset = find_row_offset(rows, hiv_row_idx, 'tested for TB', 5)
    hivTb_row_idx = hiv_row_idx + 2
    if sub2_offset >= 0:
        hivTb_row_idx = hiv_row_idx + sub2_offset + 1
    hivTb_row = rows[hivTb_row_idx] if hivTb_row_idx < len(rows) and rows[hivTb_row_idx] else []

    def get_num_at_idx(row, num_index, fallback_col):
        if not row: return 0
        nums = []
        for c in range(len(row)):
            val = row[c]
            if val is not None and val != '':
                try:
                    nums.append(float(val))
                except:
                    pass
        if len(nums) > num_index:
            v = nums[num_index]
            return int(v) if v.is_integer() else v
        return parse_cell(row[fallback_col]) if fallback_col < len(row) else 0

    block4 = {
        'tested_hiv': get_num_at_idx(hiv_row, 0, 12),
        'pos_hiv': get_num_at_idx(hiv_row, 1, 14),
        'art': get_num_at_idx(hiv_row, 2, 16),
        'hiv_tested_tb': get_num_at_idx(hivTb_row, 0, 12),
        'hiv_pos_tb': get_num_at_idx(hivTb_row, 1, 14),
        'tb_tx': get_num_at_idx(hivTb_row, 2, 16),
        'tpt_6h_0_4': parse_cell((rows[hivTb_row_idx + 1] if hivTb_row_idx + 1 < len(rows) else [])[20]),
        'tpt_6h_5_14': parse_cell((rows[hivTb_row_idx + 1] if hivTb_row_idx + 1 < len(rows) else [])[22]),
        'tpt_6h_15': parse_cell((rows[hivTb_row_idx + 1] if hivTb_row_idx + 1 < len(rows) else [])[23]),
        'tpt_3hr_0_4': parse_cell((rows[hivTb_row_idx + 2] if hivTb_row_idx + 2 < len(rows) else [])[20]),
        'tpt_3hr_5_14': parse_cell((rows[hivTb_row_idx + 2] if hivTb_row_idx + 2 < len(rows) else [])[22]),
        'tpt_3hr_15': parse_cell((rows[hivTb_row_idx + 2] if hivTb_row_idx + 2 < len(rows) else [])[23]),
        'tpt_3hp_0_4': parse_cell((rows[hivTb_row_idx + 3] if hivTb_row_idx + 3 < len(rows) else [])[20]),
        'tpt_3hp_5_14': parse_cell((rows[hivTb_row_idx + 3] if hivTb_row_idx + 3 < len(rows) else [])[22]),
        'tpt_3hp_15': parse_cell((rows[hivTb_row_idx + 3] if hivTb_row_idx + 3 < len(rows) else [])[23]),
    }

    b5_label_offset = find_row_offset(rows, start_idx, 'Block 5', 40)
    b5_data_start = b5_label_offset + 3 if b5_label_offset >= 0 else b3_data_offset + 9
    def parse_b5_row(raw_row):
        def c(idx): return parse_cell(raw_row[idx]) if idx < len(raw_row) else 0
        return {
            'rif_test': c(5), 'rif_res': c(6),
            'inh_test': c(7), 'inh_res': c(8),
            'flq_test': c(9), 'flq_res': c(10)
        }
    block5 = {
        'new_uk': parse_b5_row(r(b5_data_start)),
        'relapse': parse_b5_row(r(b5_data_start + 1)),
        'prev_tx': parse_b5_row(r(b5_data_start + 2)),
        'total': parse_b5_row(r(b5_data_start + 3))
    }

    b6_label_offset = find_row_offset(rows, start_idx, 'Block 6', 50)
    b6_data_start = b6_label_offset + 3 if b6_label_offset >= 0 else b5_data_start + 6
    ct_val_row = r(b6_data_start)
    ct_reg_3hr = r(b6_data_start + 1)
    ct_reg_3hp = r(b6_data_start + 2)
    def c6(rw, idx): return parse_cell(rw[idx]) if idx < len(rw) else 0

    block6 = {
        'hh_total_lt5': c6(ct_val_row, 12),
        'hh_total_gt5': c6(ct_val_row, 13),
        'screened_lt5': c6(ct_val_row, 14),
        'screened_gt5': c6(ct_val_row, 15),
        'pos_lt5': c6(ct_val_row, 16),
        'pos_gt5': c6(ct_val_row, 17),
        'contacts_tpt_6h': [c6(ct_val_row, 19), c6(ct_val_row, 20), c6(ct_val_row, 21)],
        'contacts_tpt_3hr': [c6(ct_reg_3hr, 19), c6(ct_reg_3hr, 20), c6(ct_reg_3hr, 21)],
        'contacts_tpt_3hp': [c6(ct_reg_3hp, 19), c6(ct_reg_3hp, 20), c6(ct_reg_3hp, 21)],
        'immuno_tpt_6h': [c6(ct_val_row, 22), c6(ct_val_row, 23), c6(ct_val_row, 24)],
        'immuno_tpt_3hr': [c6(ct_reg_3hr, 22), c6(ct_reg_3hr, 23), c6(ct_reg_3hr, 24)],
        'immuno_tpt_3hp': [c6(ct_reg_3hp, 22), c6(ct_reg_3hp, 23), c6(ct_reg_3hp, 24)],
    }

    return {'bmu': bmu, 'district': district, 'period': period, 'year': year,
            'block1': block1, 'block2': block2, 'block3': block3,
            'block4': block4, 'block5': block5, 'block6': block6}

# ----------------- 2024 Parser -----------------
def parse_block_2024(rows, start_idx):
    if start_idx >= len(rows):
        return None
    header_offset = find_row_offset(rows, start_idx, 'Patients registered during', 5)
    if header_offset < 0:
        header_offset = 2
    header_row = rows[start_idx + header_offset] if start_idx + header_offset < len(rows) else []
    bmu = header_row[4] if len(header_row) > 4 and header_row[4] else 'MANGHOPIR'
    district = value_after_label(header_row, 'district')
    if not district or ':' in district:
        fallback = value_after_label(header_row, 'central')
        district = fallback if fallback and ':' not in fallback else (district or 'Central')
    district = district.replace(':', '').strip()
    period = 'Quarter'
    for c in header_row:
        if c is not None and 'quarter' in str(c).lower():
            period = str(c)
            break
    year = '2024'
    for c in header_row:
        if c is not None and 'of year' in str(c).lower():
            year = str(c).replace('of year', '').replace('of Year', '').strip()
            break

    b1_label_offset = find_row_offset(rows, start_idx, 'Block 1:', 12)
    b1_data_start = b1_label_offset + 3 if b1_label_offset >= 0 else header_offset + 7

    def r(idx):
        return rows[start_idx + idx] if start_idx + idx < len(rows) and rows[start_idx + idx] else []

    def parse_b1_row(raw_row):
        n = numeric_values(raw_row)
        return {
            'new': nv(n, 0), 'relapse': nv(n, 1), 'uk': nv(n, 2), 'subtotal': nv(n, 3),
            'fail': nv(n, 4), 'lost': nv(n, 5), 'other': nv(n, 6), 'total': nv(n, 7)
        }
    block1 = {
        'pulm_b_cf': parse_b1_row(r(b1_data_start)),
        'pulm_cd': parse_b1_row(r(b1_data_start + 1)),
        'ep_b_cf': parse_b1_row(r(b1_data_start + 2)),
        'ep_cd': parse_b1_row(r(b1_data_start + 3)),
        'total': parse_b1_row(r(b1_data_start + 4))
    }

    b2_label_offset = find_row_offset(rows, start_idx, 'Block 2:', 20)
    b2_data_start = b2_label_offset + 3 if b2_label_offset >= 0 else b1_data_start + 9
    def parse_b2_row(raw_row):
        n = numeric_values(raw_row)[:18]
        return {
            'm_0_4': nv(n, 0), 'f_0_4': nv(n, 1), 'm_5_14': nv(n, 2), 'f_5_14': nv(n, 3),
            'm_15_24': nv(n, 4), 'f_15_24': nv(n, 5), 'm_25_34': nv(n, 6), 'f_25_34': nv(n, 7),
            'm_35_44': nv(n, 8), 'f_35_44': nv(n, 9), 'm_45_54': nv(n, 10), 'f_45_54': nv(n, 11),
            'm_55_64': nv(n, 12), 'f_55_64': nv(n, 13), 'm_65': nv(n, 14), 'f_65': nv(n, 15),
            'm_total': nv(n, 16), 'f_total': nv(n, 17), 'grand_total': nv(n, 16) + nv(n, 17)
        }
    block2 = {
        'pulm_b_cf': parse_b2_row(r(b2_data_start)),
        'pulm_cd': parse_b2_row(r(b2_data_start + 1)),
        'ep_b_cf': parse_b2_row(r(b2_data_start + 2)),
        'ep_cd': parse_b2_row(r(b2_data_start + 3)),
        'total': parse_b2_row(r(b2_data_start + 4))
    }

    b3_label_offset = find_row_offset(rows, start_idx, 'Block 3:', 30)
    b3_data_offset = b3_label_offset + 3 if b3_label_offset >= 0 else b2_data_start + 7
    b3_row = r(b3_data_offset)
    b3_cat_row = r(b3_label_offset + 1) if b3_label_offset >= 0 else []

    opd_col = find_col_by_text(b3_cat_row, ['new opd'])
    presumptive_col = find_col_by_text(b3_cat_row, ['presumptive'], ['community'])
    comm_referrals_col = find_col_by_text(b3_cat_row, ['community'])
    tested_start_col = find_col_by_text(b3_cat_row, ['using'])
    positive_start_col = find_col_by_text(b3_cat_row, ['reported'])
    b_plus_col = find_col_by_text(b3_cat_row, ['registered'], ['gene xpert'])
    gene_xpert_col = find_col_by_text(b3_cat_row, ['gene xpert'])

    tested_end_col = positive_start_col if positive_start_col >= 0 else len(b3_row)
    positive_end_col = b_plus_col if b_plus_col >= 0 else len(b3_row)

    tested_vals = numeric_values(b3_row, tested_start_col if tested_start_col >= 0 else 0, tested_end_col)
    pos_vals = numeric_values(b3_row, positive_start_col if positive_start_col >= 0 else 0, positive_end_col)

    block3 = {
        'opd': parse_cell(b3_row[opd_col]) if opd_col >= 0 and opd_col < len(b3_row) else 0,
        'presumptive': parse_cell(b3_row[presumptive_col]) if presumptive_col >= 0 and presumptive_col < len(b3_row) else 0,
        'comm_referrals': parse_cell(b3_row[comm_referrals_col]) if comm_referrals_col >= 0 and comm_referrals_col < len(b3_row) else 0,
        'tested_afb': nv(tested_vals, 0),
        'tested_xpert': nv(tested_vals, 1),
        'pos_afb': nv(pos_vals, 0),
        'pos_xpert': nv(pos_vals, 1),
        'afb_xpert_combo': nv(pos_vals, 2),
        'pos_gtot': nv(pos_vals, 3),
        'registered_b_plus': parse_cell(b3_row[b_plus_col]) if b_plus_col >= 0 and b_plus_col < len(b3_row) else 0,
        'tested_gene_xpert': parse_cell(b3_row[gene_xpert_col]) if gene_xpert_col >= 0 and gene_xpert_col < len(b3_row) else 0,
    }

    # Block 4
    b4_label_offset = find_row_offset(rows, start_idx, 'Block 4', 40)
    b4_base = start_idx + (b4_label_offset if b4_label_offset >= 0 else 35)
    sub1_offset = find_row_offset(rows, b4_base, 'tested for HIV', 8)
    if sub1_offset < 0: sub1_offset = 1
    hiv_row_idx = b4_base + sub1_offset + 1
    hiv_row = rows[hiv_row_idx] if hiv_row_idx < len(rows) and rows[hiv_row_idx] else []

    sub2_offset = find_row_offset(rows, hiv_row_idx, 'tested for TB', 5)
    hivTb_row_idx = hiv_row_idx + 2
    if sub2_offset >= 0:
        hivTb_row_idx = hiv_row_idx + sub2_offset + 1
    hivTb_row = rows[hivTb_row_idx] if hivTb_row_idx < len(rows) and rows[hivTb_row_idx] else []

    def get_num_at_idx_2024(row, num_index, fallback_col):
        if not row: return 0
        nums = []
        for c in range(12, len(row)):
            val = row[c]
            if val is not None and val != '':
                try:
                    nums.append(float(val))
                except:
                    pass
        if len(nums) > num_index:
            return int(nums[num_index]) if nums[num_index].is_integer() else nums[num_index]
        return parse_cell(row[fallback_col]) if fallback_col < len(row) else 0

    tpt_row = lambda r_idx: numeric_values(rows[r_idx] if r_idx < len(rows) else [])
    t6h = tpt_row(hivTb_row_idx + 1)
    t3hr = tpt_row(hivTb_row_idx + 2)
    t3hp = tpt_row(hivTb_row_idx + 3)

    block4 = {
        'tested_hiv': get_num_at_idx_2024(hiv_row, 0, 12),
        'pos_hiv': get_num_at_idx_2024(hiv_row, 1, 14),
        'art': get_num_at_idx_2024(hiv_row, 2, 16),
        'hiv_tested_tb': get_num_at_idx_2024(hivTb_row, 0, 12),
        'hiv_pos_tb': get_num_at_idx_2024(hivTb_row, 1, 14),
        'tb_tx': get_num_at_idx_2024(hivTb_row, 2, 16),
        'tpt_6h_0_4': nv(t6h, 0),
        'tpt_6h_5_14': nv(t6h, 1),
        'tpt_6h_15': nv(t6h, 2),
        'tpt_3hr_0_4': nv(t3hr, 0),
        'tpt_3hr_5_14': nv(t3hr, 1),
        'tpt_3hr_15': nv(t3hr, 2),
        'tpt_3hp_0_4': nv(t3hp, 0),
        'tpt_3hp_5_14': nv(t3hp, 1),
        'tpt_3hp_15': nv(t3hp, 2),
    }

    # Blocks 5 & 6
    b5_label_offset = find_row_offset(rows, start_idx, 'Block 5', 40)
    b5_data_start = b5_label_offset + 3 if b5_label_offset >= 0 else b3_data_offset + 9
    b56_label_row = r(b5_label_offset) if b5_label_offset >= 0 else []
    b5_header_row = r(b5_label_offset + 1) if b5_label_offset >= 0 else []
    b6_start_col = find_col_by_text(b56_label_row, ['block 6'])
    rif_start_col = find_col_by_text(b5_header_row, ['rifampicin'])

    def parse_b5_row(raw_row):
        n = numeric_values(raw_row, rif_start_col if rif_start_col >= 0 else 0, b6_start_col if b6_start_col >= 0 else None)
        return {
            'rif_test': nv(n, 0), 'rif_res': nv(n, 1),
            'inh_test': nv(n, 2), 'inh_res': nv(n, 3),
            'flq_test': nv(n, 4), 'flq_res': nv(n, 5)
        }
    block5 = {
        'new_uk': parse_b5_row(r(b5_data_start)),
        'relapse': parse_b5_row(r(b5_data_start + 1)),
        'prev_tx': parse_b5_row(r(b5_data_start + 2)),
        'total': parse_b5_row(r(b5_data_start + 3))
    }

    b6_col = b6_start_col if b6_start_col >= 0 else 0
    ct_val_row = r(b5_data_start)
    ct_reg_3hr = r(b5_data_start + 1)
    ct_reg_3hp = r(b5_data_start + 2)

    main_vals = numeric_values(ct_val_row, b6_col)
    hr_vals = numeric_values(ct_reg_3hr, b6_col)
    hp_vals = numeric_values(ct_reg_3hp, b6_col)

    block6 = {
        'hh_total_lt5': nv(main_vals, 0),
        'hh_total_gt5': nv(main_vals, 1) + nv(main_vals, 2),
        'screened_lt5': nv(main_vals, 3),
        'screened_gt5': nv(main_vals, 4) + nv(main_vals, 5),
        'pos_lt5': nv(main_vals, 6),
        'pos_gt5': nv(main_vals, 7) + nv(main_vals, 8),
        'contacts_tpt_6h': [nv(main_vals, 9), nv(main_vals, 10), nv(main_vals, 11)],
        'contacts_tpt_3hr': [nv(hr_vals, 0), nv(hr_vals, 1), nv(hr_vals, 2)],
        'contacts_tpt_3hp': [nv(hp_vals, 0), nv(hp_vals, 1), nv(hp_vals, 2)],
        'immuno_tpt_6h': [nv(main_vals, 12), nv(main_vals, 13), nv(main_vals, 14)],
        'immuno_tpt_3hr': [nv(hr_vals, 3), nv(hr_vals, 4), nv(hr_vals, 5)],
        'immuno_tpt_3hp': [nv(hp_vals, 3), nv(hp_vals, 4), nv(hp_vals, 5)],
    }

    return {'bmu': bmu, 'district': district, 'period': period, 'year': year,
            'block1': block1, 'block2': block2, 'block3': block3,
            'block4': block4, 'block5': block5, 'block6': block6}

# ----------------- 2025 & 2026 Parser -----------------
def parse_block_2025_2026(rows, start_idx, default_year='2025'):
    if start_idx >= len(rows):
        return None
    header_offset = find_row_offset(rows, start_idx, 'Patients registered during', 5)
    if header_offset < 0:
        header_offset = 2
    header_row = rows[start_idx + header_offset] if start_idx + header_offset < len(rows) else []
    bmu = header_row[4] if len(header_row) > 4 and header_row[4] else 'MANGHOPIR'
    district = value_after_label(header_row, 'district')
    if not district or ':' in district:
        fallback = value_after_label(header_row, 'central')
        district = fallback if fallback and ':' not in fallback else (district or 'Central')
    district = district.replace(':', '').strip()
    period = 'Quarter'
    for c in header_row:
        if c is not None and 'quarter' in str(c).lower():
            period = str(c)
            break
    year = default_year
    for c in header_row:
        if c is not None and 'of year' in str(c).lower():
            year = str(c).replace('of year', '').replace('of Year', '').strip()
            break

    b1_label_offset = find_row_offset(rows, start_idx, 'Block 1:', 12)
    b1_data_start = b1_label_offset + 3 if b1_label_offset >= 0 else header_offset + 7

    def r(idx):
        return rows[start_idx + idx] if start_idx + idx < len(rows) and rows[start_idx + idx] else []

    def parse_b1_row(raw_row):
        n = numeric_values(raw_row)
        return {
            'new': nv(n, 0), 'relapse': nv(n, 1), 'uk': nv(n, 2), 'subtotal': nv(n, 3),
            'fail': nv(n, 4), 'lost': nv(n, 5), 'other': nv(n, 6), 'total': nv(n, 7)
        }
    block1 = {
        'pulm_b_cf': parse_b1_row(r(b1_data_start)),
        'pulm_cd': parse_b1_row(r(b1_data_start + 1)),
        'ep_b_cf': parse_b1_row(r(b1_data_start + 2)),
        'ep_cd': parse_b1_row(r(b1_data_start + 3)),
        'total': parse_b1_row(r(b1_data_start + 4))
    }

    b2_label_offset = find_row_offset(rows, start_idx, 'Block 2:', 20)
    b2_data_start = b2_label_offset + 3 if b2_label_offset >= 0 else b1_data_start + 9
    def parse_b2_row(raw_row):
        n = numeric_values(raw_row)[:18]
        return {
            'm_0_4': nv(n, 0), 'f_0_4': nv(n, 1), 'm_5_14': nv(n, 2), 'f_5_14': nv(n, 3),
            'm_15_24': nv(n, 4), 'f_15_24': nv(n, 5), 'm_25_34': nv(n, 6), 'f_25_34': nv(n, 7),
            'm_35_44': nv(n, 8), 'f_35_44': nv(n, 9), 'm_45_54': nv(n, 10), 'f_45_54': nv(n, 11),
            'm_55_64': nv(n, 12), 'f_55_64': nv(n, 13), 'm_65': nv(n, 14), 'f_65': nv(n, 15),
            'm_total': nv(n, 16), 'f_total': nv(n, 17), 'grand_total': nv(n, 16) + nv(n, 17)
        }
    block2 = {
        'pulm_b_cf': parse_b2_row(r(b2_data_start)),
        'pulm_cd': parse_b2_row(r(b2_data_start + 1)),
        'ep_b_cf': parse_b2_row(r(b2_data_start + 2)),
        'ep_cd': parse_b2_row(r(b2_data_start + 3)),
        'total': parse_b2_row(r(b2_data_start + 4))
    }

    b3_label_offset = find_row_offset(rows, start_idx, 'Block 3:', 30)
    b3_data_offset = b3_label_offset + 3 if b3_label_offset >= 0 else b2_data_start + 7
    b3_row = r(b3_data_offset)
    b3_cat_row = r(b3_label_offset + 1) if b3_label_offset >= 0 else []

    opd_col = find_col_by_text(b3_cat_row, ['new opd'])
    presumptive_col = find_col_by_text(b3_cat_row, ['presumptive'], ['community'])
    comm_referrals_col = find_col_by_text(b3_cat_row, ['community'])
    tested_start_col = find_col_by_text(b3_cat_row, ['using'])
    positive_start_col = find_col_by_text(b3_cat_row, ['reported'])
    b_plus_col = find_col_by_text(b3_cat_row, ['registered'], ['gene xpert'])
    gene_xpert_col = find_col_by_text(b3_cat_row, ['gene xpert'])

    tested_end_col = positive_start_col if positive_start_col >= 0 else len(b3_row)
    positive_end_col = b_plus_col if b_plus_col >= 0 else len(b3_row)

    tested_vals = numeric_values(b3_row, tested_start_col if tested_start_col >= 0 else 0, tested_end_col)
    pos_vals = numeric_values(b3_row, positive_start_col if positive_start_col >= 0 else 0, positive_end_col)

    block3 = {
        'opd': parse_cell(b3_row[opd_col]) if opd_col >= 0 and opd_col < len(b3_row) else 0,
        'presumptive': parse_cell(b3_row[presumptive_col]) if presumptive_col >= 0 and presumptive_col < len(b3_row) else 0,
        'comm_referrals': parse_cell(b3_row[comm_referrals_col]) if comm_referrals_col >= 0 and comm_referrals_col < len(b3_row) else 0,
        'tested_afb': nv(tested_vals, 0),
        'tested_xpert': nv(tested_vals, 1),
        'pos_afb': nv(pos_vals, 0),
        'pos_xpert': nv(pos_vals, 1),
        'afb_xpert_combo': nv(pos_vals, 2),
        'pos_gtot': nv(pos_vals, 3),
        'registered_b_plus': parse_cell(b3_row[b_plus_col]) if b_plus_col >= 0 and b_plus_col < len(b3_row) else 0,
        'tested_gene_xpert': parse_cell(b3_row[gene_xpert_col]) if gene_xpert_col >= 0 and gene_xpert_col < len(b3_row) else 0,
    }

    # Block 4
    b4_label_offset = find_row_offset(rows, start_idx, 'Block 4', 40)
    b4_base = start_idx + (b4_label_offset if b4_label_offset >= 0 else 35)
    sub1_offset = find_row_offset(rows, b4_base, 'tested for HIV', 8)
    if sub1_offset < 0: sub1_offset = 1
    hiv_row_idx = b4_base + sub1_offset + 1
    hiv_row = rows[hiv_row_idx] if hiv_row_idx < len(rows) and rows[hiv_row_idx] else []

    sub2_offset = find_row_offset(rows, hiv_row_idx, 'tested for TB', 5)
    hivTb_row_idx = hiv_row_idx + 2
    if sub2_offset >= 0:
        hivTb_row_idx = hiv_row_idx + sub2_offset + 1
    hivTb_row = rows[hivTb_row_idx] if hivTb_row_idx < len(rows) and rows[hivTb_row_idx] else []

    def get_num_at_idx_2025(row, num_index, fallback_col):
        if not row: return 0
        nums = []
        for c in range(len(row)):
            val = row[c]
            if val is not None and val != '':
                try:
                    nums.append(float(val))
                except:
                    pass
        if len(nums) > num_index:
            return int(nums[num_index]) if nums[num_index].is_integer() else nums[num_index]
        return parse_cell(row[fallback_col]) if fallback_col < len(row) else 0

    tpt_row = lambda r_idx: numeric_values(rows[r_idx] if r_idx < len(rows) else [])
    t6h = tpt_row(hivTb_row_idx + 1)
    t3hr = tpt_row(hivTb_row_idx + 2)
    t3hp = tpt_row(hivTb_row_idx + 3)

    block4 = {
        'tested_hiv': get_num_at_idx_2025(hiv_row, 0, 12),
        'pos_hiv': get_num_at_idx_2025(hiv_row, 1, 14),
        'art': get_num_at_idx_2025(hiv_row, 2, 16),
        'hiv_tested_tb': get_num_at_idx_2025(hivTb_row, 0, 12),
        'hiv_pos_tb': get_num_at_idx_2025(hivTb_row, 1, 14),
        'tb_tx': get_num_at_idx_2025(hivTb_row, 2, 16),
        'tpt_6h_0_4': nv(t6h, 0),
        'tpt_6h_5_14': nv(t6h, 1),
        'tpt_6h_15': nv(t6h, 2),
        'tpt_3hr_0_4': nv(t3hr, 0),
        'tpt_3hr_5_14': nv(t3hr, 1),
        'tpt_3hr_15': nv(t3hr, 2),
        'tpt_3hp_0_4': nv(t3hp, 0),
        'tpt_3hp_5_14': nv(t3hp, 1),
        'tpt_3hp_15': nv(t3hp, 2),
    }

    # Blocks 5 & 6
    b5_label_offset = find_row_offset(rows, start_idx, 'Block 5', 40)
    b5_data_start = b5_label_offset + 3 if b5_label_offset >= 0 else b3_data_offset + 9
    b56_label_row = r(b5_label_offset) if b5_label_offset >= 0 else []
    b5_header_row = r(b5_label_offset + 1) if b5_label_offset >= 0 else []
    b6_start_col = find_col_by_text(b56_label_row, ['block 6'])
    rif_start_col = find_col_by_text(b5_header_row, ['rifampicin'])

    def parse_b5_row(raw_row):
        n = numeric_values(raw_row, rif_start_col if rif_start_col >= 0 else 0, b6_start_col if b6_start_col >= 0 else None)
        return {
            'rif_test': nv(n, 0), 'rif_res': nv(n, 1),
            'inh_test': nv(n, 2), 'inh_res': nv(n, 3),
            'flq_test': nv(n, 4), 'flq_res': nv(n, 5)
        }
    block5 = {
        'new_uk': parse_b5_row(r(b5_data_start)),
        'relapse': parse_b5_row(r(b5_data_start + 1)),
        'prev_tx': parse_b5_row(r(b5_data_start + 2)),
        'total': parse_b5_row(r(b5_data_start + 3))
    }

    # Block 6: Dynamic row discovery
    def parse_real_num(v):
        if v is None or v == '': return 0
        if isinstance(v, (int, float)): return int(v) if float(v).is_integer() else float(v)
        s = str(v).strip()
        if not s or any(ch in s for ch in ['-', '/', '+', ':', '>', '<']): return 0
        try:
            fl = float(s)
            return int(fl) if fl.is_integer() else fl
        except:
            return 0

    def extract_b6_row_nums(row, col_start):
        res = []
        if not row: return res
        c_from = col_start if col_start >= 0 else 0
        for c in range(c_from, len(row)):
            val = row[c]
            num = parse_real_num(val)
            if num > 0 or (val is not None and str(val).strip() == '0'):
                res.append(num)
        return res

    b6_col = b6_start_col if b6_start_col >= 0 else 0
    main_vals = []
    hr_vals = []
    hp_vals = []

    for r_cand in range(b5_data_start, min(len(rows), b5_data_start + 8)):
        row_str = ' '.join(str(cell) for cell in (rows[r_cand] or []) if cell is not None).lower()
        if '3hp' in row_str:
            hp_vals = extract_b6_row_nums(rows[r_cand], b6_col)
        elif '3hr' in row_str:
            hr_vals = extract_b6_row_nums(rows[r_cand], b6_col)
        elif not main_vals and any(ch.isdigit() for ch in row_str):
            nums = extract_b6_row_nums(rows[r_cand], b6_col)
            if nums:
                main_vals = nums

    if not main_vals:
        main_vals = extract_b6_row_nums(r(b5_data_start), b6_col)
    if not hr_vals:
        hr_vals = extract_b6_row_nums(r(b5_data_start + 1), b6_col)
    if not hp_vals:
        hp_vals = extract_b6_row_nums(r(b5_data_start + 2), b6_col)

    block6 = {
        'hh_total_lt5': nv(main_vals, 0),
        'hh_total_gt5': nv(main_vals, 1) + nv(main_vals, 2),
        'screened_lt5': nv(main_vals, 3),
        'screened_gt5': nv(main_vals, 4) + nv(main_vals, 5),
        'pos_lt5': nv(main_vals, 6),
        'pos_gt5': nv(main_vals, 7) + nv(main_vals, 8),
        'contacts_tpt_6h': [nv(main_vals, 9), nv(main_vals, 10), nv(main_vals, 11)],
        'contacts_tpt_3hr': [nv(hr_vals, 0), nv(hr_vals, 1), nv(hr_vals, 2)],
        'contacts_tpt_3hp': [nv(hp_vals, 0), nv(hp_vals, 1), nv(hp_vals, 2)],
        'immuno_tpt_6h': [nv(main_vals, 12), nv(main_vals, 13), nv(main_vals, 14)],
        'immuno_tpt_3hr': [nv(hr_vals, 3), nv(hr_vals, 4), nv(hr_vals, 5)],
        'immuno_tpt_3hp': [nv(hp_vals, 3), nv(hp_vals, 4), nv(hp_vals, 5)],
    }

    return {'bmu': bmu, 'district': district, 'period': period, 'year': year,
            'block1': block1, 'block2': block2, 'block3': block3,
            'block4': block4, 'block5': block5, 'block6': block6}

def parse_full_year(year):
    offsets = {'q1': 0, 'q2': 39, 'q3': 78, 'q4': 117, 'consolidated': 156}
    fn = f'Web_Dashboard_{year} - corrected/TB-07 All Projects-{year}.xlsx'
    wb = openpyxl.load_workbook(fn, data_only=True)
    
    parser = parse_block_2023 if year == '2023' else (parse_block_2024 if year == '2024' else parse_block_2025_2026)
    
    sheet_aliases = {
        'blocks': ['MPR'],
        'karachiBlocks': ['KARACHI'],
        'sindhBlocks': ['SINDH'],
        'gbBlocks': ['GILGIT -BALTISTAN', 'GILGIT BALTISTAN', 'GILGIT-BALTISTAN'],
        'akBlocks': ['AZAD - KASHMIR', 'AZAD KHASHMIR', 'AZAD KASHMIR', 'AZAD-KASHMIR'],
        'kpkBlocks': ['KPK', 'KHYBER PAKHTUNKHWA'],
        'allProjectBlocks': [f'ALL PROJECT TOTAL - {year}', 'ALL PROJECT TOTAL', f'ALL PROJECT TOTAL-{year}']
    }

    def find_sheet(aliases):
        for name in wb.sheetnames:
            clean = name.strip().upper()
            for a in aliases:
                if clean == a.upper() or clean.startswith(a.upper()):
                    return wb[name]
        return None

    state = {}
    for state_key, aliases in sheet_aliases.items():
        ws = find_sheet(aliases)
        target = {}
        if ws:
            rows = list(ws.iter_rows(values_only=True))
            for qk, off in offsets.items():
                if year in ['2025', '2026']:
                    target[qk] = parser(rows, off, year)
                else:
                    target[qk] = parser(rows, off)
            if year in ['2024', '2025', '2026']:
                ensure_consolidated_block6(target)
        else:
            print(f"Warning: Sheet for {state_key} not found in {year}")
        state[state_key] = target

    return state

for y in ['2023', '2024', '2025', '2026']:
    print(f"\nProcessing {y}...")
    data = parse_full_year(y)
    out_path = f'Web_Dashboard_{y} - corrected/data.js'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('/* Auto-generated preloaded TB Registry Data for ' + y + ' */\n')
        f.write('window.TB_EMBEDDED_DATA = ')
        json.dump(data, f, indent=2)
        f.write(';\n')
    print(f"Wrote {out_path} ({os.path.getsize(out_path)} bytes)")
    
    # Print sanity check
    ap = data['allProjectBlocks']['consolidated']
    c_b1 = ap['block1']['total']['total']
    c_opd = ap['block3']['opd']
    c_pres = ap['block3']['presumptive']
    c_m = ap['block2']['total']['m_total']
    c_f = ap['block2']['total']['f_total']
    print(f"Sanity Check {y}: Total Cases={c_b1}, Male={c_m}, Female={c_f}, OPD={c_opd}, Presumptive={c_pres}")

