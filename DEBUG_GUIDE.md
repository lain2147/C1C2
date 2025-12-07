# 調試指南

## 快速診斷檢查清單

當零件識別失敗時，按照以下步驟檢查：

---

## ✅ 步驟1: 檢查圖片是否上傳成功

**打開控制台** (F12)，查看：

```
✓ 正常: 已添加 5 張圖片
❌ 異常: 圖片數量 = 0
```

**解決方案**:
- 確認圖片格式正確（JPEG, PNG）
- 檢查文件路徑是否存在
- 重新上傳圖片

---

## ✅ 步驟2: 檢查圖片預處理

**控制台日誌**:

```
====== 預處理圖片 1/5 ======
步驟1: 正在矯正圖片角度和裁切...
原始圖片尺寸: 1920x1080
檢測到 186 個左側邊緣點
✓ 圖片已矯正 3.42°
步驟2: 圖片較大，正在壓縮...
步驟3: 正在增強圖片品質...
```

**檢查項目**:
- [ ] 圖片尺寸是否合理
- [ ] 矯正角度是否在 ±10° 範圍
- [ ] 預處理是否完成

**常見問題**:
1. **圖片太大** (>10MB)
   - 解決：手動壓縮後再上傳

2. **矯正失敗**
   - 解決：關閉矯正功能 `enableImageAlignment = false`

---

## ✅ 步驟3: 檢查OCR辨識

**控制台日誌**:

```
=== OCR辨識圖片 1 ===
OCR完成，耗時: 2.31秒

OCR辨識圖片 1 的結果:
信心度: 85.32%
文字長度: 1234 字符
```

**檢查項目**:
- [ ] OCR是否成功完成
- [ ] 信心度 > 70%
- [ ] 識別文字長度 > 0

**常見問題**:
1. **信心度低** (<60%)
   - 原因：圖片模糊、光線不佳
   - 解決：重新拍照或調整對比度

2. **文字長度 = 0**
   - 原因：圖片完全空白或OCR引擎失敗
   - 解決：檢查圖片內容

---

## ✅ 步驟4: 檢查零件解析 ⭐ **關鍵步驟**

**控制台日誌**:

```
=== 解析圖片 1 的文字 ===
OCR文字片段: C47,C51,C52,C56(相同規格:560u) R1 R2 R3(10kΩ)...
✓ 識別到 45 個零件: ["C47", "C51", "C52", "C56", ...]
```

**檢查項目**:
- [ ] OCR文字片段是否包含零件編號
- [ ] 正則表達式是否匹配到零件
- [ ] 零件數量 > 0

**常見問題**:

### ❌ 問題: 識別到 0 個零件

**診斷步驟**:

1. **查看OCR文字片段**
   ```
   OCR文字片段: C47,C51,C52,C56...
   ```
   - 如果有零件編號但識別不到 → **正則表達式問題**
   - 如果沒有零件編號 → **OCR問題**

2. **測試正則表達式**

   打開 `test_regex.html` 測試：
   - 輸入OCR文字片段
   - 查看匹配結果
   - 確認正則是否正確

3. **檢查零件編號格式**

   支持的格式：
   ```
   ✅ C47,C51,C52         (逗號分隔)
   ✅ R1 R2 R3           (空格分隔)
   ✅ C10|C15            (管線分隔)
   ✅ (C47,C51)          (括號內)
   ✅ C47: 560u          (帶冒號)
   ✅ C47-560u           (帶破折號)
   ❌ C47&C51            (不支持 &)
   ❌ C47#C51            (不支持 #)
   ```

### ❌ 問題: 識別到的零件數量很少

**可能原因**:

1. **零件編號格式不標準**
   ```
   ❌ 錯誤: c47 (小寫)
   ✅ 正確: C47

   ❌ 錯誤: 47C (數字在前)
   ✅ 正確: C47
   ```

2. **OCR識別錯誤**
   ```
   原始: C47
   識別: C4l (7誤識為l)
   識別: C4? (7誤識為?)
   ```

   **解決**:
   - 提高圖片清晰度
   - 調整OCR參數
   - 手動修正

3. **正則過濾規則**
   ```javascript
   // 檢查是否被過濾
   if (prefix.length > 3) continue;  // 前綴太長
   if (number > 9999) continue;      // 編號太大
   if (number === 0) continue;       // 編號為0
   ```

---

## ✅ 步驟5: 檢查結果顯示

**網頁顯示**:

```
零件類型: 4
零件總數: 152（含重複）
唯一零件: 128
```

**檢查項目**:
- [ ] 零件類型 > 0
- [ ] 零件總數 > 0
- [ ] 唯一零件數量合理

**常見問題**:

1. **零件總數 = 0 但控制台顯示有識別**
   - 原因：`allComponents` 未重置
   - 解決：確認 `app.js:220` 有 `allComponents = []`

2. **重複零件未顯示**
   - 原因：邏輯錯誤去重
   - 解決：檢查 `displayResults()` 函數

---

## 調試技巧

### 1. 使用瀏覽器控制台

```javascript
// 查看全局變數
console.log('parsedComponents:', parsedComponents);
console.log('allComponents:', allComponents);
console.log('ocrResults:', ocrResults);

// 查看零件數量
console.log('零件總數:', allComponents.length);
console.log('唯一零件:', new Set(allComponents.map(c => c.fullName)).size);

// 查看零件類型分布
const typeCount = {};
allComponents.forEach(c => {
    typeCount[c.prefix] = (typeCount[c.prefix] || 0) + 1;
});
console.log('零件類型分布:', typeCount);
```

### 2. 臨時修改代碼測試

```javascript
// 在 parseComponentsFromText 函數中添加斷點
console.log('開始解析，文字長度:', text.length);
console.log('前100字符:', text.substring(0, 100));

// 測試正則表達式
const testText = "C47,C51,C52,C56";
const matches = testText.match(/([A-Z]{1,3})(\d{1,4})(?=[,\s\.\|;:\-\)]|$)/g);
console.log('測試匹配:', matches);
```

### 3. 導出原始數據

```javascript
// 在控制台執行，導出OCR原始文字
const ocrText = ocrResults.map(r => r.text).join('\n\n');
console.log('=== OCR原始文字 ===\n', ocrText);

// 複製到剪貼簿
navigator.clipboard.writeText(ocrText);
```

---

## 常見錯誤和解決方案

### 錯誤1: Tesseract未初始化

**錯誤信息**:
```
Error: Tesseract worker not initialized
```

**解決**:
- 確認網絡連接（需下載語言檔）
- 清除瀏覽器快取
- 重新載入頁面

---

### 錯誤2: Canvas exceeded maximum size

**錯誤信息**:
```
Error: Canvas area exceeds the maximum limit
```

**解決**:
```javascript
// 在 image-processor.js 中降低壓縮目標
const maxDimension = 1280; // 改為更小的值
```

---

### 錯誤3: Worker pool timeout

**錯誤信息**:
```
OCR Worker timeout after 120000ms
```

**解決**:
- 圖片太大或太複雜
- 增加超時時間或使用串行處理
```javascript
useParallelProcessing = false; // 關閉並行
```

---

### 錯誤4: 正則匹配失敗

**症狀**: 控制台顯示識別到0個零件

**診斷**:
```javascript
// 在控制台手動測試
const text = "你的OCR文字片段";
const pattern = /([A-Z]{1,3})(\d{1,4})(?=[,\s\.\|;:\-\)]|$)/g;
const matches = [...text.matchAll(pattern)];
console.log('匹配結果:', matches);
```

**解決**:
- 如果匹配失敗，檢查文字格式
- 考慮擴展正則支持更多分隔符

---

## 性能優化建議

### 1. 圖片太多時分批處理

```javascript
// 每次處理10張
const batchSize = 10;
for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    // 處理這批圖片
}
```

### 2. 關閉圖片矯正（如果不需要）

```javascript
enableImageAlignment = false; // 節省15-20%時間
```

### 3. 降低圖片解析度

```javascript
// 在 image-processor.js 中
const maxDimension = 1280; // 從1920降低到1280
```

---

## 測試清單

完整測試流程：

```
□ 1. 上傳圖片
   □ 確認圖片顯示在畫廊
   □ 圖片數量正確

□ 2. 點擊「開始辨識」
   □ 進度條顯示
   □ 步驟指示器更新

□ 3. 查看控制台
   □ 圖片預處理日誌
   □ OCR辨識日誌
   □ 零件解析日誌

□ 4. 查看結果
   □ 零件類型 > 0
   □ 零件總數 > 0
   □ 缺失編號顯示
   □ 相同規格標註

□ 5. 匯出Excel
   □ 下載成功
   □ 包含4個工作表
   □ 數據完整
```

---

## 聯繫支援

如果以上步驟都無法解決問題，請提供：

1. **控制台完整日誌** (F12 → Console → 右鍵 → Save as...)
2. **問題截圖**
3. **測試圖片** (可選)
4. **瀏覽器版本** (Chrome/Edge/Firefox/Safari)
5. **操作系統** (Windows/Mac/Linux)

---

**版本**: v4.2.1
**更新**: 2025-11-24
