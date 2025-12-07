@echo off
chcp 65001 >nul
echo ========================================
echo    部署到 Hugging Face Spaces
echo ========================================
echo.

REM 檢查是否在正確的目錄
if not exist "index.html" (
    echo ❌ 錯誤：找不到 index.html
    echo 請確保在專案根目錄執行此腳本
    pause
    exit /b 1
)

echo ✅ 檢查必要文件...
set "missing_files="

if not exist "app.js" set "missing_files=%missing_files% app.js"
if not exist "google-vision-ocr.js" set "missing_files=%missing_files% google-vision-ocr.js"
if not exist "image-alignment.js" set "missing_files=%missing_files% image-alignment.js"
if not exist "image-processor.js" set "missing_files=%missing_files% image-processor.js"
if not exist "worker-pool.js" set "missing_files=%missing_files% worker-pool.js"

if not "%missing_files%"=="" (
    echo ❌ 缺少必要文件：%missing_files%
    pause
    exit /b 1
)

echo ✅ 所有必要文件都存在
echo.

REM 備份原 README 並使用 HF_README
echo 📝 準備 README.md...
if exist "README.md" (
    if not exist "README_original.md" (
        echo    備份原 README.md -> README_original.md
        copy "README.md" "README_original.md" >nul
    )
)

if exist "HF_README.md" (
    echo    使用 HF_README.md 作為 README.md
    copy /Y "HF_README.md" "README.md" >nul
) else (
    echo ❌ 錯誤：找不到 HF_README.md
    pause
    exit /b 1
)

echo.
echo ⚠️  重要提醒：API Key 安全性
echo ========================================
echo 目前 index.html 中包含了一個 API Key。
echo 為了安全，建議：
echo.
echo 1. 移除 index.html 中的預設 API Key
echo 2. 或到 Google Cloud Console 撤銷該 Key
echo.
echo 是否繼續部署？
echo.
choice /C YN /M "繼續 (Y) 或 取消 (N)"
if errorlevel 2 (
    echo 已取消部署
    pause
    exit /b 0
)

echo.
echo 🔧 初始化 Git...
if not exist ".git" (
    git init
    echo ✅ Git 已初始化
) else (
    echo ✅ Git 已存在
)

echo.
echo 📦 添加遠端倉庫...
git remote remove hf 2>nul
git remote add hf https://huggingface.co/spaces/lain2147/c1c2
echo ✅ 已添加 Hugging Face 遠端

echo.
echo 📂 添加文件到 Git...
git add index.html
git add app.js
git add google-vision-ocr.js
git add image-alignment.js
git add image-processor.js
git add worker-pool.js
git add README.md
git add .spacesignore
echo ✅ 文件已添加

echo.
echo 💾 提交更改...
git commit -m "🚀 部署 BOM 表 OCR 辨識工具到 Hugging Face Spaces"
if errorlevel 1 (
    echo ⚠️  沒有新的更改需要提交
)

echo.
echo 🚀 推送到 Hugging Face...
echo.
echo ⚠️  注意：
echo    - 請輸入您的 Hugging Face 用戶名
echo    - 密碼請使用 Access Token（從 https://huggingface.co/settings/tokens 獲取）
echo.

git push hf main

if errorlevel 1 (
    echo.
    echo ❌ 推送失敗
    echo.
    echo 可能的原因：
    echo 1. 認證失敗 - 請確認用戶名和 Token 正確
    echo 2. Space 不存在 - 請先在 Hugging Face 創建 Space
    echo 3. 網路問題 - 請檢查網路連線
    echo.
    echo 詳細步驟請參考 DEPLOY_TO_HF.md
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 部署成功！
echo ========================================
echo.
echo 🌐 訪問您的 Space：
echo    https://huggingface.co/spaces/lain2147/c1c2
echo.
echo 📝 後續步驟：
echo    1. 訪問 Space 確認功能正常
echo    2. 測試 OCR 辨識功能
echo    3. 檢查 README 顯示是否正確
echo    4. 考慮移除 index.html 中的預設 API Key
echo.
echo ========================================

pause
