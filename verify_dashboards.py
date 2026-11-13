import json
import os

years = ['2023', '2024', '2025', '2026']
for y in years:
    folder = f'Web_Dashboard_{y} - corrected'
    html_file = os.path.join(folder, 'tb_dashboard.html')
    data_file = os.path.join(folder, 'data.js')
    
    # Check data.js
    assert os.path.exists(data_file), f'{data_file} does not exist'
    with open(data_file, 'r', encoding='utf-8') as f:
        data_text = f.read()
    json_part = data_text
    if 'window.TB_EMBEDDED_DATA = ' in json_part:
        json_part = json_part.split('window.TB_EMBEDDED_DATA = ')[1].rstrip(';\n')
    d = json.loads(json_part)
    
    for key in ['blocks', 'karachiBlocks', 'sindhBlocks', 'gbBlocks', 'akBlocks', 'kpkBlocks', 'allProjectBlocks']:
        assert key in d, f'{key} missing in {data_file}'
        assert len(d[key]) == 5, f'{key} has {len(d[key])} items, expected 5'
    
    ap = d['allProjectBlocks']['consolidated']
    cases = ap['block1']['total']['total']
    opd = ap['block3']['opd']
    pres = ap['block3']['presumptive']
    print(f'[{y}] data.js OK: Cases={cases}, OPD={opd}, Presumptive={pres}')
    
    # Check HTML
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()
    assert 'data.js' in html, f'data.js script tag missing in {html_file}'
    
    if y == '2023':
        js_file = os.path.join(folder, 'tb_dashboard.js')
        with open(js_file, 'r', encoding='utf-8') as f:
            js = f.read()
        assert 'loadEmbeddedData' in js, f'loadEmbeddedData missing in {js_file}'
        assert 'ALL_PROJECT' in js, f'ALL_PROJECT missing in {js_file}'
    else:
        assert 'loadEmbeddedData' in html, f'loadEmbeddedData missing in {html_file}'
        assert 'ALL_PROJECT' in html, f'ALL_PROJECT missing in {html_file}'
    print(f'[{y}] HTML & JS integration OK')

print('\nALL CHECKS PASSED!')

