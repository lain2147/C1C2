# 📋 Hugging Face Spaces 部署檢查清單

## 快速部署步驟

### ⚡ 方法一：使用自動化腳本（推薦）

```bash
# Windows 用戶
deploy-to-hf.bat

# 腳本會自動：
# 1. 檢查必要文件
# 2. 備份並替換 README
# 3. 初始化 Git
# 4. 推送到 Hugging Face
```

### 🔧 方法二：手動部署

1. 在 https://huggingface.co/spaces 創建新 Space
2. 上傳以下文件到 Space

---

## ✅ 必要文件清單

### 核心文件（必須）

- [x] **index.html** (55KB)
  - 主頁面
  - 包含所有 UI 和樣式

- [x] **app.js** (48KB)
  - 核心應用邏輯
  - OCR 處理流程
  - 零件解析算法

- [x] **google-vision-ocr.js** (7KB)
  - Google Vision API 整合
  - API 調用封裝

- [x] **image-alignment.js** (11KB)
  - 圖片矯正模組
  - 傾斜偵測和旋轉

- [x] **image-processor.js** (11KB)
  - 圖片預處理
  - 壓縮、增強、二值化

- [x] **worker-pool.js** (5KB)
  - Worker 池管理
  - 並行處理

### 配置文件（必須）

- [x] **README.md**
  - 使用 `HF_README.md` 內容
  - 包含 YAML front matter
  - 說明使用方法

### 可選文件

- [ ] **.spacesignore**
  - 指定不上傳的文件

---

## 🔍 部署前檢查

### 1. 文件完整性

```bash
# 檢查所有必要文件是否存在
dir index.html app.js google-vision-ocr.js image-alignment.js image-processor.js worker-pool.js
```

### 2. API Key 安全性

⚠️ **重要：請務必處理 API Key！**

在 `index.html` 第 512 行：

**目前狀態（不安全）：**
```html
<input type="text" id="googleApiKey"
       value="AIzaSyCAT9w7JJv37BF5qpZwUzBtKNTjWubo5CU"
       ...>
```

**建議修改為：**
```html
<input type="text" id="googleApiKey"
       value=""
       placeholder="請輸入您的 Google Vision API Key"
       ...>
```

**或者：**
1. 立即到 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 撤銷該 Key
2. 生成新的 API Key
3. 設定 HTTP referrer 限制

### 3. README 配置

確認 README.md 開頭包含：

```yaml
---
title: BOM表OCR辨識工具
emoji: 🔍
colorFrom: purple
colorTo: blue
sdk: static
pinned: false
license: mit
---
```

### 4. 功能測試（本地）

在部署前，請在本地測試：

- [ ] 開啟 `index.html`
- [ ] 測試圖片上傳
- [ ] 測試 Tesseract.js OCR（離線）
- [ ] 測試手動輸入功能
- [ ] 測試預處理選項
- [ ] 測試 Excel 匯出
- [ ] 檢查瀏覽器控制台無錯誤

---

## 🚀 部署流程

### Step 1：準備 README

```bash
# 備份原 README
copy README.md README_original.md

# 使用 HF 專用 README
copy HF_README.md README.md
```

### Step 2：初始化 Git（如果需要）

```bash
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

### Step 3：添加遠端

```bash
git remote add hf https://huggingface.co/spaces/lain2147/c1c2
```

### Step 4：提交文件

```bash
# 添加核心文件
git add index.html app.js google-vision-ocr.js
git add image-alignment.js image-processor.js worker-pool.js
git add README.md

# 提交
git commit -m "🚀 初始部署"
```

### Step 5：推送到 Hugging Face

```bash
# 推送（會要求輸入用戶名和 Token）
git push hf main
```

**認證資訊：**
- Username: `lain2147`（您的 HF 用戶名）
- Password: **Access Token**（從 https://huggingface.co/settings/tokens 獲取）

---

## ✅ 部署後驗證

### 1. 訪問 Space

https://huggingface.co/spaces/lain2147/c1c2

### 2. 檢查清單

部署完成後，請確認：

- [ ] Space 構建成功（約 1-2 分鐘）
- [ ] 頁面正常載入
- [ ] 所有 UI 元素顯示正常
- [ ] README 內容顯示正確
- [ ] 控制台無 JavaScript 錯誤

### 3. 功能測試

- [ ] 上傳測試圖片
- [ ] Tesseract.js 離線模式可用
- [ ] 預處理選項可調整
- [ ] 手動輸入功能正常
- [ ] Excel 匯出功能正常
- [ ] 統計資訊顯示正確

### 4. 性能測試

- [ ] 頁面載入速度 < 3 秒
- [ ] 圖片上傳響應快速
- [ ] OCR 辨識速度合理
- [ ] 無明顯卡頓

---

## 🐛 常見問題處理

### 問題 1：Space 構建失敗

**原因：**
- README.md 格式錯誤
- 缺少必要文件

**解決：**
```bash
# 檢查 README 的 YAML front matter
# 確保所有必要文件已上傳
```

### 問題 2：頁面空白

**原因：**
- JavaScript 文件路徑錯誤
- CDN 資源無法載入

**解決：**
- 檢查瀏覽器控制台錯誤
- 確認所有 `.js` 文件在根目錄

### 問題 3：推送失敗（403 Forbidden）

**原因：**
- 認證失敗
- Access Token 權限不足

**解決：**
```bash
# 1. 檢查 Token 權限（需要 write 權限）
# 2. 重新輸入正確的 Token
# 3. 確認 Space 名稱正確

# 移除舊的遠端並重新添加
git remote remove hf
git remote add hf https://huggingface.co/spaces/lain2147/c1c2
```

### 問題 4：CORS 錯誤

**原因：**
- Google Vision API referrer 限制

**解決：**
- 在 Google Cloud Console 中添加 Hugging Face 域名
- 或移除 referrer 限制（開發測試用）

---

## 📊 部署後優化

### 1. 監控使用情況

在 Space 設定中查看：
- 訪問次數
- 用戶反饋
- 錯誤日誌

### 2. 收集反饋

在 Space 的 Community 標籤中：
- 查看用戶評論
- 回答問題
- 收集功能建議

### 3. 持續更新

```bash
# 修改代碼後
git add .
git commit -m "更新功能：描述"
git push hf main
```

---

## 🔒 安全性建議

### 生產環境建議：

1. **移除硬編碼的 API Key**
   ```html
   <!-- 不要這樣做 -->
   <input value="AIzaSyCAT9w7JJv37BF5qpZwUzBtKNTjWubo5CU">

   <!-- 應該讓用戶自行輸入 -->
   <input value="" placeholder="請輸入您的 API Key">
   ```

2. **設定 API Key 限制**
   - HTTP referrer: `https://huggingface.co/spaces/lain2147/*`
   - API 限制：只啟用 Cloud Vision API

3. **添加使用說明**
   - 在 README 中說明如何獲取 API Key
   - 提醒用戶保護自己的 Key

4. **考慮後端代理**（進階）
   - 創建後端 API 代理
   - 隱藏真實的 API Key
   - 添加速率限制

---

## 📞 獲取幫助

### 資源連結：

- [Hugging Face Spaces 文檔](https://huggingface.co/docs/hub/spaces)
- [Static Spaces 指南](https://huggingface.co/docs/hub/spaces-sdks-static)
- [社群論壇](https://discuss.huggingface.co/)
- [Discord 社群](https://discord.com/invite/hugging-face)

### 常見錯誤代碼：

- **403**: 認證失敗
- **404**: Space 不存在
- **500**: 伺服器錯誤
- **CORS**: 跨域請求被阻止

---

## ✨ 最終檢查

部署前最後確認：

- [ ] ✅ 所有必要文件已準備
- [ ] ✅ API Key 已移除或隱藏
- [ ] ✅ README 格式正確
- [ ] ✅ 本地測試通過
- [ ] ✅ Git 已正確設定
- [ ] ✅ 了解推送流程
- [ ] ✅ 準備好 Hugging Face Token
- [ ] ✅ 知道如何獲取幫助

---

🎉 **一切就緒！** 現在可以執行 `deploy-to-hf.bat` 開始部署了！

祝您部署順利！
