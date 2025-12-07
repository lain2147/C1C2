# 部署到 Hugging Face Spaces 指南

## 📦 準備部署

### 必要文件清單

確保以下文件存在於專案根目錄：

#### ✅ 核心文件
- [x] `index.html` - 主頁面
- [x] `app.js` - 核心應用邏輯
- [x] `google-vision-ocr.js` - Google Vision API 模組
- [x] `image-alignment.js` - 圖片矯正模組
- [x] `image-processor.js` - 圖片預處理模組
- [x] `worker-pool.js` - Worker 池管理

#### ✅ 配置文件
- [x] `HF_README.md` - Hugging Face Spaces 專用 README（需改名為 README.md）

#### 📄 可選文件（建議保留）
- [ ] `GOOGLE_VISION_SETUP.md` - API 設定指南
- [ ] `README.md` - 原始說明文件
- [ ] 其他文檔文件

---

## 🚀 部署步驟

### 方法一：透過 Web UI 部署（推薦新手）

#### 步驟 1：創建 Space

1. 前往 https://huggingface.co/spaces
2. 點擊「Create new Space」
3. 填寫資訊：
   - **Space name**: `c1c2`（或您想要的名稱）
   - **License**: `mit`
   - **Space SDK**: 選擇 `Static`
   - **Space hardware**: `CPU basic - Free`
4. 點擊「Create Space」

#### 步驟 2：上傳文件

1. 在 Space 頁面點擊「Files」標籤
2. 點擊「Add file」>「Upload files」
3. 上傳以下核心文件：
   ```
   index.html
   app.js
   google-vision-ocr.js
   image-alignment.js
   image-processor.js
   worker-pool.js
   ```

#### 步驟 3：配置 README

1. 將 `HF_README.md` 的內容複製
2. 在 Space 中編輯 `README.md`
3. 貼上內容並保存

#### 步驟 4：驗證部署

1. Space 會自動構建（約 1-2 分鐘）
2. 訪問 `https://huggingface.co/spaces/lain2147/c1c2`
3. 測試功能是否正常

---

### 方法二：使用 Git 部署（推薦進階用戶）

#### 步驟 1：設置 Git Repository

```bash
# 初始化 Git（如果尚未初始化）
cd c:\Users\shihaotw\c1c2
git init

# 將 HF_README.md 重命名為 README.md
# （先備份原 README.md）
mv README.md README_original.md
mv HF_README.md README.md
```

#### 步驟 2：連接到 Hugging Face

```bash
# 添加 Hugging Face 遠端
git remote add hf https://huggingface.co/spaces/lain2147/c1c2

# 配置 Git 憑證
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

#### 步驟 3：提交並推送

```bash
# 添加核心文件
git add index.html
git add app.js
git add google-vision-ocr.js
git add image-alignment.js
git add image-processor.js
git add worker-pool.js
git add README.md

# 提交
git commit -m "🚀 部署 BOM 表 OCR 辨識工具到 Hugging Face Spaces"

# 推送到 Hugging Face
git push hf main
```

如果遇到認證問題：
1. 前往 https://huggingface.co/settings/tokens
2. 創建新的 Access Token（權限選擇 `write`）
3. 使用 Token 作為密碼：
   ```bash
   # Username: 您的 HF 用戶名
   # Password: 您的 Access Token
   git push hf main
   ```

---

## 🔧 部署後設定

### 1. 調整 API Key 輸入框

為了安全性，建議在部署版本中：

**選項 A：移除預設 API Key**

編輯 `index.html`，找到第 512 行：
```html
<!-- 修改前 -->
<input type="text" id="googleApiKey"
       value="AIzaSyCAT9w7JJv37BF5qpZwUzBtKNTjWubo5CU"
       ...>

<!-- 修改後 -->
<input type="text" id="googleApiKey"
       value=""
       placeholder="請輸入您的 Google Vision API Key"
       ...>
```

**選項 B：添加環境變數說明**

在 README 中明確說明用戶需要自行準備 API Key。

### 2. 測試所有功能

部署完成後，請測試：
- ✅ 上傳圖片功能
- ✅ Tesseract.js OCR（離線模式）
- ✅ Google Vision API（需用戶提供 Key）
- ✅ 手動輸入零件
- ✅ Excel 匯出
- ✅ 預處理選項調整

### 3. 設定 Space 可見性

在 Space 設定中：
- **Public**：任何人都可以訪問（推薦）
- **Private**：只有您可以訪問

---

## 🐛 常見問題

### Q1：Space 構建失敗
**A：**
- 檢查是否所有必要文件都已上傳
- 確認 README.md 的 YAML front matter 格式正確
- 查看 Space 的 Logs 頁面獲取詳細錯誤

### Q2：頁面顯示空白
**A：**
- 檢查瀏覽器控制台是否有 JavaScript 錯誤
- 確認所有 `.js` 文件的路徑正確
- 驗證 CDN 資源（Tesseract.js, SheetJS）可正常載入

### Q3：Google Vision API 無法使用
**A：**
- 這是預期行為（需用戶自行提供 API Key）
- 在 README 中說明如何取得 API Key
- 建議用戶使用 Tesseract.js（離線模式）

### Q4：文件上傳大小限制
**A：**
- Hugging Face Spaces 對單個文件有大小限制
- 建議在前端進行圖片壓縮
- 已實作：圖片 >2MB 自動壓縮

### Q5：CORS 錯誤
**A：**
- Hugging Face Spaces 支援靜態文件的 CORS
- Google Vision API 調用應該正常工作
- 如有問題，檢查 API Key 的 referrer 限制

---

## 📊 監控與維護

### 使用統計

在 Space 設定中可以查看：
- 訪問次數
- 用戶地區分布
- 使用時間統計

### 更新部署

#### Web UI 方式：
1. 在 Space 頁面點擊「Files」
2. 編輯或上傳新文件
3. Space 會自動重新構建

#### Git 方式：
```bash
# 修改文件後
git add .
git commit -m "更新功能"
git push hf main
```

---

## 💰 成本說明

### Hugging Face Spaces
- **免費層級**：完全免費，無限流量
- **硬體要求**：CPU basic（靜態網站不需要 GPU）
- **儲存空間**：足夠存放所有前端文件

### Google Vision API
- 用戶需自行承擔 API 使用成本
- 每月前 1,000 個請求免費
- 建議在 README 中說明

---

## 🎯 優化建議

### 性能優化
1. 啟用 CDN 加速（Hugging Face 自動處理）
2. 壓縮 JavaScript 文件（可選）
3. 優化圖片預處理算法

### 用戶體驗
1. 添加使用教學影片
2. 提供範例圖片下載
3. 完善錯誤提示訊息

### 安全性
1. 移除硬編碼的 API Key
2. 添加輸入驗證
3. 限制上傳文件大小

---

## 📞 支援

遇到部署問題？
1. 查看 [Hugging Face Spaces 文檔](https://huggingface.co/docs/hub/spaces)
2. 訪問 [Hugging Face 社群論壇](https://discuss.huggingface.co/)
3. 檢查 Space 的 Community 標籤

---

## ✅ 部署檢查清單

在推送到 Hugging Face 前，確認：

- [ ] 所有必要文件已準備
- [ ] README.md 包含正確的 YAML front matter
- [ ] 移除或隱藏敏感的 API Key
- [ ] 測試過所有功能在本地運行正常
- [ ] 文檔清晰說明使用方法
- [ ] 添加適當的 License
- [ ] 設定 Space 可見性（Public/Private）

---

🎉 **準備完成！** 現在可以部署到 Hugging Face Spaces 了。

祝您部署順利！如有任何問題，歡迎回饋。
