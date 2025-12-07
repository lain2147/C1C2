// 簡化版前端邏輯：上傳 / 預覽 / 手動輸入 / DeepSeek 或 Tesseract OCR / 匯出 Excel

let images = [];
let manualComponents = [];
let ocrResults = [];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);
  document.getElementById('analyzeBtn').addEventListener('click', analyzeImage);
});

// 處理檔案上傳
function handleFileUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (evt) => addImage(evt.target.result);
    reader.readAsDataURL(file);
  });
}

// 加入圖片並更新畫面
function addImage(src) {
  images.push(src);
  updateGallery();
  document.getElementById('analyzeBtn').style.display = 'inline-block';
}

function removeImage(index) {
  images.splice(index, 1);
  updateGallery();
  if (images.length === 0) {
    document.getElementById('analyzeBtn').style.display = 'none';
  }
}

function updateGallery() {
  const previewSection = document.getElementById('previewSection');
  const gallery = document.getElementById('imagesGallery');
  const count = document.getElementById('imageCount');

  if (images.length === 0) {
    previewSection.classList.remove('active');
    gallery.innerHTML = '';
    count.textContent = '0 張';
    return;
  }

  previewSection.classList.add('active');
  count.textContent = `${images.length} 張`;
  gallery.innerHTML = '';

  images.forEach((src, idx) => {
    const item = document.createElement('div');
    item.className = 'image-item';

    const img = document.createElement('img');
    img.src = src;
    img.alt = `圖片 ${idx + 1}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeImage(idx);
    };

    const label = document.createElement('div');
    label.className = 'image-number';
    label.textContent = `#${idx + 1}`;

    item.appendChild(img);
    item.appendChild(removeBtn);
    item.appendChild(label);
    gallery.appendChild(item);
  });
}

function showStatus(msg, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = msg;
  status.className = `status active ${type}`;
}
function hideStatus() {
  const status = document.getElementById('status');
  status.className = 'status';
}

function updateProgress(p) {
  const bar = document.getElementById('progressBar');
  const fill = document.getElementById('progressBarFill');
  bar.classList.add('active');
  fill.style.width = `${Math.round(p * 100)}%`;
}

// OCR 主流程
async function analyzeImage() {
  if (images.length === 0 && manualComponents.length === 0) {
    showStatus('請先上傳圖片或手動輸入零件編號', 'error');
    return;
  }

  try {
    // 開始前先清空舊結果
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('resultsSection').classList.remove('active');

    ocrResults = [];
    updateProgress(0.05);
    showStatus('開始辨識...', 'info');
    document.getElementById('progressDetails').classList.add('active');
    updateStep(1, 'completed');
    updateStep(2, 'processing');

    const engine = getSelectedOCREngine();
    const processedImages = [...images];

    if (processedImages.length === 0) {
      showStatus('沒有圖片可辨識', 'error');
      return;
    }

    if (engine === 'deepseek') {
      const config = getDeepseekConfig();
      if (!config.endpoint) {
        showStatus('請填入 DeepSeek 代理端點', 'error');
        return;
      }
      const ocr = new DeepSeekOCR(config.endpoint, config.apiKey);
      const results = await ocr.recognizeImages(processedImages, (done, total) => {
        updateProgress(0.1 + (done / total) * 0.8);
        showStatus(`DeepSeek 辨識中 ${done}/${total}`, 'info');
      });
      results.forEach((r, i) => ocrResults.push({ imageIndex: i + 1, text: r.text || '' }));
    } else {
      // Tesseract 串行辨識
      for (let i = 0; i < processedImages.length; i++) {
        showStatus(`Tesseract 辨識中 ${i + 1}/${processedImages.length}`, 'info');
        updateProgress(0.1 + ((i + 1) / processedImages.length) * 0.8);
        const { data } = await Tesseract.recognize(processedImages[i], 'eng');
        ocrResults.push({ imageIndex: i + 1, text: data.text || '' });
      }
    }

    // 加入手動輸入的元件資訊到結果
    if (manualComponents.length > 0) {
      ocrResults.push({
        imageIndex: 0,
        text: `手動輸入：${manualComponents.map((c) => c.fullName).join(', ')}`
      });
    }

    updateStep(2, 'completed');
    updateStep(3, 'completed');
    updateProgress(1);
    showStatus('辨識完成', 'success');
    displayResults();
  } catch (err) {
    console.error(err);
    showStatus(`辨識失敗：${err.message || err}`, 'error');
  } finally {
    setTimeout(() => document.getElementById('progressBar').classList.remove('active'), 800);
  }
}

function updateStep(step, status) {
  const icon = document.getElementById(`step${step}Icon`);
  if (!icon) return;
  icon.className = `progress-step-icon ${status}`;
  if (status === 'completed') icon.textContent = '✓';
  else if (status === 'processing') icon.textContent = '…';
  else icon.textContent = step;
}

function displayResults() {
  const section = document.getElementById('resultsSection');
  const container = document.getElementById('resultsContainer');
  container.innerHTML = '';

  const { list: components, lineGroups } = collectComponents({ dedupe: true });
  if (components.length === 0) {
    container.innerHTML = '<p>未找到有效的零件編號</p>';
    section.classList.add('active');
    return;
  }

  // 建立表格（去掉序號欄，新增同類型/相同規格欄）
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.innerHTML = `
    <thead>
      <tr>
        <th style="border-bottom:1px solid #ddd; padding:8px; text-align:left;">零件編號</th>
        <th style="border-bottom:1px solid #ddd; padding:8px; text-align:left;">同類型 / 相同規格</th>
        <th style="border-bottom:1px solid #ddd; padding:8px; text-align:left;">缺失</th>
        <th style="border-bottom:1px solid #ddd; padding:8px; text-align:left;">來源</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const missingMap = buildMissingMap(components);
  const shownMissing = new Set(); // 只在該前綴第一筆顯示缺失

  const tbody = table.querySelector('tbody');
  components.forEach((c) => {
    const sameTypeRaw = (lineGroups.get(c.lineId) || []).filter((n) => n !== c.full);
    // 去重並依數字排序，讓同行如 R100,R101 或 R102,R103,R104 有序顯示
    const sameType = Array.from(new Set(sameTypeRaw)).sort((a, b) => {
      const [, ap] = a.match(/^([A-Z]+)(\d+)$/) || [];
      const [, bp] = b.match(/^([A-Z]+)(\d+)$/) || [];
      if (ap && bp && a[0] === b[0]) return parseInt(ap, 10) - parseInt(bp, 10);
      return a.localeCompare(b);
    });
    const sameText = sameType.length ? sameType.join(', ') : '—';
    const missingText = shownMissing.has(c.prefix) ? '—' : (missingMap.get(c.prefix) || '—');
    shownMissing.add(c.prefix);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:6px;">${c.full}</td>
      <td style="padding:6px;">${sameText}</td>
      <td style="padding:6px;">${missingText}</td>
      <td style="padding:6px;">${c.source}</td>
    `;
    tbody.appendChild(tr);
  });

  container.appendChild(table);
  section.classList.add('active');
}

// 解析 OCR 與手動輸入成單一排序列表
function collectComponents(options = {}) {
  const dedupe = options.dedupe === true;
  const list = [];
  const lineGroups = new Map(); // lineId -> [full...]
  const priority = ['R', 'C', 'D', 'Q', 'L', 'U'];

  // 來源：OCR（按行解析，並用逗號/分號切段，同行/同段視為同類型/同規格）
  ocrResults.forEach((r) => {
    const text = r.text || '';
    const lines = text.split(/\r?\n/);
    lines.forEach((lineText, idx) => {
      const regex = /([A-Z]{1,3})(\d{1,4})/g;
      let m;
      let found = false;
      const idsInLine = [];
      const lineId = `${r.imageIndex}-${idx}`;
      while ((m = regex.exec(lineText)) !== null) {
        const prefix = m[1].toUpperCase();
        const num = parseInt(m[2], 10);
        if (!num || num <= 0 || num > 9999) continue;
        const full = `${prefix}${num}`;
        list.push({
          prefix,
          number: num,
          full,
          source: r.imageIndex === 0 ? '手動' : `圖片 ${r.imageIndex}`,
          lineId,
        });
        idsInLine.push(full);
        found = true;
      }
      if (found) {
        if (!lineGroups.has(lineId)) lineGroups.set(lineId, []);
        lineGroups.get(lineId).push(...idsInLine);
      }
    });
  });

  // 來源：手動輸入
  manualComponents.forEach((c) => {
    list.push({
      prefix: c.prefix,
      number: c.number,
      full: c.fullName,
      source: '手動',
      lineId: `manual-0`,
    });
    if (!lineGroups.has('manual-0')) lineGroups.set('manual-0', []);
    lineGroups.get('manual-0').push(c.fullName);
  });

  // 排序：類型優先順序 + 數字
  list.sort((a, b) => {
    const pa = priority.indexOf(a.prefix);
    const pb = priority.indexOf(b.prefix);
    const va = pa === -1 ? 999 : pa;
    const vb = pb === -1 ? 999 : pb;
    if (va !== vb) return va - vb;
    if (a.prefix !== b.prefix) return a.prefix.localeCompare(b.prefix);
    return a.number - b.number;
  });

  if (!dedupe) return list;

  // 去除重複的零件編號（保留排序後第一筆）
  const seen = new Set();
  const unique = [];
  list.forEach((item) => {
    const key = item.full;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });
  return { list: unique, lineGroups };
}

// 依前綴計算缺失序號（採 README 規則，連續>=3 用範圍，2 個分開，單獨顯示；有限制上限）
function buildMissingMap(components) {
  const limit = { R: 22, C: 50, D: 30, Q: 20 };
  const map = new Map(); // prefix -> missing string
  const byPrefix = new Map();
  components.forEach((c) => {
    if (!byPrefix.has(c.prefix)) byPrefix.set(c.prefix, []);
    byPrefix.get(c.prefix).push(c.number);
  });

  byPrefix.forEach((nums, prefix) => {
    const uniqueNums = Array.from(new Set(nums)).sort((a, b) => a - b);
    if (uniqueNums.length === 0) {
      map.set(prefix, '—');
      return;
    }
    const maxDisplay = limit[prefix] || 100;
    const min = uniqueNums[0];
    const max = Math.min(uniqueNums[uniqueNums.length - 1], maxDisplay);

    const existing = new Set(uniqueNums.filter((n) => n <= maxDisplay));
    const missing = [];
    for (let n = min; n <= max; n++) {
      if (!existing.has(n)) missing.push(n);
    }
    if (missing.length === 0) {
      map.set(prefix, '—');
      return;
    }
    const formatted = formatMissingRanges(missing, prefix, maxDisplay);
    map.set(prefix, formatted);
  });

  return map;
}

function formatMissingRanges(missingNums, prefix, maxDisplay) {
  const res = [];
  let i = 0;
  while (i < missingNums.length) {
    const start = missingNums[i];
    let end = start;
    i++;
    while (i < missingNums.length && missingNums[i] === end + 1) {
      end = missingNums[i];
      i++;
    }
    const span = end - start + 1;
    if (span >= 3) {
      res.push(`${prefix}${start}~${prefix}${end}`);
    } else if (span === 2) {
      res.push(`${prefix}${start}`, `${prefix}${end}`);
    } else {
      res.push(`${prefix}${start}`);
    }
  }
  return res.join(', ');
}

// DeepSeek / Tesseract 選擇
function getSelectedOCREngine() {
  const deepseekRadio = document.getElementById('ocrEngineDeepseek');
  const tesseractRadio = document.getElementById('ocrEngineTesseract');
  if (deepseekRadio && deepseekRadio.checked) return 'deepseek';
  if (tesseractRadio && tesseractRadio.checked) return 'tesseract';
  return 'tesseract';
}
function getDeepseekConfig() {
  return {
    endpoint: document.getElementById('deepseekEndpoint')?.value.trim() || '',
    apiKey: document.getElementById('deepseekApiKey')?.value.trim() || ''
  };
}

// 手動輸入零件編號
function addManualComponents() {
  const input = document.getElementById('manualInput');
  const preview = document.getElementById('manualComponentsPreview');
  if (!input || !input.value.trim()) {
    showStatus('請輸入零件編號', 'error');
    return;
  }
  const text = input.value.trim();
  const normalized = text.replace(/[|，、；;]/g, ',').replace(/\s+/g, ' ');
  const regex = /([A-Z]{1,3})(\d{1,4})/gi;
  const parsed = [];
  let m;
  while ((m = regex.exec(normalized)) !== null) {
    parsed.push({ prefix: m[1].toUpperCase(), number: parseInt(m[2]), fullName: m[1].toUpperCase() + m[2] });
  }
  if (parsed.length === 0) {
    showStatus('未找到有效的零件編號', 'error');
    return;
  }
  manualComponents.push(...parsed);
  preview.innerHTML = `已加入 ${parsed.length} 個：<strong>${parsed.map((c) => c.fullName).join(', ')}</strong>`;
  preview.style.color = '#4caf50';
  input.value = '';
  showStatus(`成功加入 ${parsed.length} 個手動零件`, 'success');
  setTimeout(hideStatus, 1500);
}

// 匯出簡易 Excel（圖片文字列表）
function exportToExcel() {
  if (ocrResults.length === 0) {
    showStatus('沒有可匯出的內容', 'error');
    return;
  }
  const rows = [['圖片編號', 'OCR 文字']];
  ocrResults.forEach((r) => rows.push([`圖片 ${r.imageIndex}`, r.text]));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'OCR結果');
  XLSX.writeFile(wb, `OCR_結果_${new Date().toISOString().slice(0,10)}.xlsx`);
  showStatus('已匯出 Excel', 'success');
  setTimeout(hideStatus, 1500);
}

// 重置
function resetApp() {
  images = [];
  manualComponents = [];
  ocrResults = [];
  updateGallery();
  document.getElementById('resultsSection').classList.remove('active');
  document.getElementById('fileInput').value = '';
  document.getElementById('manualInput').value = '';
  document.getElementById('manualComponentsPreview').textContent = '';
  document.getElementById('analyzeBtn').style.display = 'none';
  hideStatus();
}
