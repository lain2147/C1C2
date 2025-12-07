# 🤖 Agents使用指南

本專案已配置了8個專業的開發輔助Agents，幫助你更高效地開發和維護BOM表OCR辨識工具。

## 📋 Agents清單

### 1. 代碼品質相關

#### `/code-review` - 代碼審查Agent
**功能**：全面審查代碼質量、安全性、性能和最佳實踐
**使用時機**：
- 完成新功能開發後
- 準備提交PR前
- 定期代碼健康檢查

**使用方法**：
```
/code-review
```

**輸出內容**：
- 總體評分（1-10分）
- 問題清單（按嚴重程度分類）
- 具體改進建議
- 代碼示例

---

#### `/create-tests` - 測試生成Agent
**功能**：為項目生成完整的測試套件
**使用時機**：
- 新增功能需要測試
- 提升代碼覆蓋率
- 重構前建立測試保護

**使用方法**：
```
/create-tests
```

**輸出內容**：
- 單元測試代碼
- 集成測試代碼
- UI測試代碼
- 測試配置文件

---

### 2. 開發輔助

#### `/fix-bugs` - Bug診斷與修復Agent
**功能**：自動診斷並修復專案中的bug
**使用時機**：
- 發現bug需要快速定位
- 用戶反饋問題
- 定期bug掃描

**使用方法**：
```
/fix-bugs
```

**輸出內容**：
- Bug清單（含優先級）
- 根本原因分析
- 修復代碼
- 測試驗證步驟

---

#### `/optimize-performance` - 性能優化Agent
**功能**：分析並優化應用性能
**使用時機**：
- 應用感覺緩慢
- 準備上線前優化
- 定期性能審計

**使用方法**：
```
/optimize-performance
```

**輸出內容**：
- 性能分析報告
- 優化建議
- 優化代碼
- 前後對比數據

---

#### `/generate-docs` - 文檔生成Agent
**功能**：生成完整的項目文檔
**使用時機**：
- 新功能需要文檔
- 更新API文檔
- 準備發布版本

**使用方法**：
```
/generate-docs
```

**輸出內容**：
- API文檔
- 用戶手冊
- 開發者文檔
- 部署文檔

---

### 3. 功能開發

#### `/suggest-features` - 功能建議Agent
**功能**：分析並提出有價值的新功能建議
**使用時機**：
- 規劃下一版本
- 尋找產品改進方向
- 競爭力分析

**使用方法**：
```
/suggest-features
```

**輸出內容**：
- Top 10功能建議
- 功能路線圖
- RICE評分
- 實現建議

---

#### `/improve-ui` - UI/UX改進Agent
**功能**：評估並改進用戶界面和體驗
**使用時機**：
- UI視覺更新
- 用戶體驗優化
- 響應式改進

**使用方法**：
```
/improve-ui
```

**輸出內容**：
- UI審計報告
- 改進建議
- 實現代碼
- 前後對比

---

### 4. 部署運維

#### `/prepare-deploy` - 部署準備Agent
**功能**：準備生產環境部署
**使用時機**：
- 準備上線
- 版本發布前
- 部署環境切換

**使用方法**：
```
/prepare-deploy
```

**輸出內容**：
- 部署檢查清單
- 優化後的文件
- 部署配置
- 部署指南

---

## 🎯 最佳實踐

### 開發工作流建議

**1. 開發新功能**
```
開始開發 → 完成代碼 → /code-review → /create-tests → 提交代碼
```

**2. Bug修復流程**
```
發現Bug → /fix-bugs → 修復 → /create-tests → 驗證
```

**3. 性能優化週期**
```
定期執行 → /optimize-performance → 實施優化 → 測試驗證
```

**4. 版本發布流程**
```
/code-review → /create-tests → /generate-docs → /prepare-deploy → 發布
```

### 定期維護計劃

**每週：**
- `/code-review` - 代碼質量檢查
- `/fix-bugs` - Bug掃描

**每月：**
- `/optimize-performance` - 性能審計
- `/improve-ui` - UI/UX評估
- `/suggest-features` - 功能規劃

**發布前：**
- `/code-review` - 全面審查
- `/create-tests` - 測試覆蓋
- `/generate-docs` - 文檔更新
- `/prepare-deploy` - 部署準備

## 💡 使用技巧

### 1. 組合使用
多個agents可以組合使用以獲得更好效果：
```
/code-review
# 根據審查結果修復問題
/fix-bugs
# 添加測試
/create-tests
```

### 2. 迭代優化
不要期望一次性完美，多次迭代使用agents：
```
第1輪：/optimize-performance
# 實施部分優化
第2輪：/optimize-performance
# 繼續優化剩餘項目
```

### 3. 文檔先行
在開發新功能前先規劃：
```
/suggest-features
# 選擇要實現的功能
/improve-ui
# 設計UI/UX
# 開始開發
```

## 🔧 自定義Agents

你也可以創建自己的agents：

1. 在 `.claude/commands/` 目錄創建新的 `.md` 文件
2. 編寫提示詞內容
3. 使用 `/your-command-name` 調用

**示例**：創建自定義的安全檢查agent
```markdown
# 安全檢查Agent

檢查以下安全問題：
- XSS漏洞
- CSRF防護
- 輸入驗證
...
```

保存為 `.claude/commands/security-check.md`
使用 `/security-check` 調用

## 📊 Agents效果評估

定期評估agents的使用效果：
- 代碼質量提升
- Bug數量減少
- 開發效率提高
- 文檔完整性
- 部署成功率

## 🆘 常見問題

**Q: Agents執行時間過長怎麼辦？**
A: 可以指定特定文件或功能模塊進行分析

**Q: Agents建議太多無從下手？**
A: 關注優先級高和容易實現的建議先開始

**Q: 如何知道agents的建議是否正確？**
A: 結合自己的判斷，agents提供建議而非絕對答案

**Q: 可以修改agents的行為嗎？**
A: 可以編輯 `.claude/commands/` 下的相應文件

## 📚 延伸閱讀

- [Claude Code文檔](https://code.claude.com/docs)
- [Slash Commands指南](https://code.claude.com/docs/slash-commands)
- [最佳實踐](https://code.claude.com/docs/best-practices)

---

**提示**：善用這些agents可以大幅提升開發效率和代碼質量！定期使用並根據項目需求調整使用策略。
