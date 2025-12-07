---
title: BOM表OCR辨識工具
emoji: 🔍
colorFrom: purple
colorTo: blue
sdk: static
pinned: false
license: mit
---

# 電子零件BOM表OCR辨識工具

一個基於網頁的 OCR 工具，可以辨識電子零件 BOM 表中的零件編號（如 C1, R1, L1 等），自動找出缺失的序號，並匯出成 Excel 報表。

## ✨ 主要功能

### 🔍 雙引擎 OCR 辨識
- **Google Cloud Vision API**：高精度、快速處理（推薦）
- **Tesseract.js**：完全離線、免費無限制

### 📷 圖片處理
- ✅ 多張圖片支援（批次處理）
- ✅ 圖片畫廊預覽
- ✅ 連續拍照功能
- ✅ 智能圖片矯正（自動偵測傾斜）
- ✅ 可調整預處理選項

### 🎯 智能解析
- ✅ 自動辨識電子零件編號格式（C1, R1, L1, U1, D1, Q1 等）
- ✅ 表格結構識別
- ✅ 相同值分組顯示
- ✅ 缺失零件檢測
- ✅ 相同規格零件標註

### ✏️ 手動輸入
- ✅ 支援從文件複製零件編號
- ✅ 多種分隔符自動識別
- ✅ 與 OCR 結果混合統計

### 📊 Excel 匯出
- ✅ 完整零件清單（含來源標註）
- ✅ 缺號統計
- ✅ 各系列詳細表
- ✅ OCR 原始文字

## 🚀 使用方法

### 1. 選擇 OCR 引擎

#### Google Vision API（推薦）
1. 取得 [Google Cloud Vision API Key](https://console.cloud.google.com/)
2. 輸入 API Key
3. 點擊「測試 API Key」驗證

#### Tesseract.js（離線）
- 不需要 API Key
- 完全在瀏覽器本地運行

### 2. 調整預處理選項

根據圖片品質選擇：
- 自動矯正傾斜角度
- 壓縮大圖片
- 二值化處理
- 增強對比度

### 3. 上傳圖片

- 點擊「上傳圖片」選擇文件
- 或使用「拍照」功能連續拍攝
- 可預覽和刪除不需要的圖片

### 4. 手動輸入（可選）

如果有其他來源的零件清單，可以手動輸入：
```
C1, C2, C3, C5
R10 R11 R15
L1|L2|L3
```

### 5. 開始辨識

點擊「開始辨識」，等待處理完成，查看結果並匯出 Excel。

## 📋 支援的零件格式

工具會自動辨識以下格式：
- 電容：C1, C2, C3...
- 電阻：R1, R2, R3...
- 電感：L1, L2, L3...
- IC：U1, U2, U3...
- 二極體：D1, D2, D3...
- 電晶體：Q1, Q2, Q3...
- 任何「字母+數字」格式

## 💡 使用技巧

### 獲得最佳辨識效果：
1. 使用高解析度、清晰的圖片
2. 確保光線充足，無陰影
3. 黑字白底對比度最佳
4. 系統會自動矯正傾斜（±10°）
5. 避免光線反射

### Google Vision API vs Tesseract.js：

| 功能 | Google Vision | Tesseract.js |
|------|---------------|--------------|
| 辨識準確度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 處理速度 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 離線使用 | ❌ | ✅ |
| 成本 | 有限免費* | 完全免費 |

*Google Vision API：每月前 1,000 個請求免費

## 🔒 隱私說明

### 使用 Tesseract.js：
- 所有處理完全在瀏覽器本地完成
- 不會上傳任何資料到伺服器
- 您的資料完全保密

### 使用 Google Vision API：
- 圖片會傳送到 Google Cloud 進行 OCR 處理
- 請勿上傳敏感或機密資料
- 建議參考 [Google Cloud 隱私政策](https://cloud.google.com/privacy)

## ⚠️ 注意事項

### API Key 安全：
- 請勿公開分享您的 API Key
- 建議在 Google Cloud Console 設定使用限制
- 本工具在客戶端直接調用 API（Key 明文可見）
- **生產環境建議使用後端代理**

### 成本控制：
- Google Vision API 每月前 1,000 個請求免費
- 超過後 $1.50 / 1,000 個請求
- 建議設定預算警報

## 🛠️ 技術架構

- **前端框架**：原生 HTML5 + CSS3 + JavaScript
- **OCR 引擎**：
  - Google Cloud Vision API（雲端）
  - Tesseract.js 5.0（本地）
- **Excel 處理**：SheetJS (xlsx)
- **圖片處理**：Canvas API
- **完全前端**：無需後端伺服器

## 📞 問題回報

如遇到問題，請：
1. 檢查瀏覽器控制台的錯誤訊息
2. 確認 API Key 是否有效（如使用 Google API）
3. 嘗試使用不同的預處理選項
4. 回報問題到 [GitHub Issues](https://github.com/your-repo/issues)

## 📄 授權

MIT License - 僅供個人學習和使用

---

🎉 **立即開始使用！** 上傳您的 BOM 表圖片，體驗高效的 OCR 辨識。
