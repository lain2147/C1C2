/**
 * Google Cloud Vision API OCR 辨識模組
 * 使用 Google Vision API 進行高精度 OCR 辨識
 */
class GoogleVisionOCR {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';
    }

    /**
     * 將 Data URL 轉換為 Base64（移除前綴）
     */
    dataURLToBase64(dataURL) {
        // 移除 "data:image/png;base64," 前綴
        return dataURL.split(',')[1];
    }

    /**
     * 辨識單張圖片
     * @param {String} imageDataURL - 圖片的 Data URL
     * @returns {Promise<Object>} OCR 結果
     */
    async recognizeImage(imageDataURL) {
        try {
            const base64Image = this.dataURLToBase64(imageDataURL);

            // 構建請求資料
            const requestBody = {
                requests: [
                    {
                        image: {
                            content: base64Image
                        },
                        features: [
                            {
                                type: 'DOCUMENT_TEXT_DETECTION',  // 使用文檔文字辨識（比 TEXT_DETECTION 更準確）
                                maxResults: 1
                            }
                        ],
                        imageContext: {
                            languageHints: ['en']  // 提示語言為英文
                        }
                    }
                ]
            };

            // 發送 API 請求
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Google Vision API 錯誤: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // 檢查是否有錯誤
            if (data.responses[0].error) {
                throw new Error(`API 錯誤: ${data.responses[0].error.message}`);
            }

            // 解析結果
            return this.parseGoogleVisionResponse(data.responses[0]);

        } catch (error) {
            console.error('Google Vision OCR 失敗:', error);
            throw error;
        }
    }

    /**
     * 解析 Google Vision API 的回應
     * 轉換為與 Tesseract.js 相容的格式
     */
    parseGoogleVisionResponse(response) {
        const fullTextAnnotation = response.fullTextAnnotation;

        if (!fullTextAnnotation) {
            return {
                text: '',
                words: [],
                confidence: 0
            };
        }

        // 提取完整文字
        const text = fullTextAnnotation.text || '';

        // 提取單詞和位置資訊
        const words = [];
        if (fullTextAnnotation.pages && fullTextAnnotation.pages.length > 0) {
            const page = fullTextAnnotation.pages[0];

            if (page.blocks) {
                page.blocks.forEach(block => {
                    if (block.paragraphs) {
                        block.paragraphs.forEach(paragraph => {
                            if (paragraph.words) {
                                paragraph.words.forEach(word => {
                                    const wordText = word.symbols
                                        .map(symbol => symbol.text)
                                        .join('');

                                    const vertices = word.boundingBox.vertices;
                                    const bbox = {
                                        x0: vertices[0].x || 0,
                                        y0: vertices[0].y || 0,
                                        x1: vertices[2].x || 0,
                                        y1: vertices[2].y || 0
                                    };

                                    words.push({
                                        text: wordText,
                                        bbox: bbox,
                                        confidence: word.confidence || 0
                                    });
                                });
                            }
                        });
                    }
                });
            }
        }

        // 計算平均信心度
        const avgConfidence = words.length > 0
            ? words.reduce((sum, w) => sum + (w.confidence || 0), 0) / words.length * 100
            : 0;

        return {
            text: text,
            words: words,
            confidence: avgConfidence
        };
    }

    /**
     * 批次處理多張圖片
     * @param {Array} images - 圖片陣列
     * @param {Function} onProgress - 進度回調
     * @returns {Promise<Array>} 結果陣列
     */
    async recognizeImages(images, onProgress = null) {
        const results = [];

        for (let i = 0; i < images.length; i++) {
            console.log(`\n=== Google Vision OCR 辨識圖片 ${i + 1}/${images.length} ===`);

            try {
                const startTime = Date.now();
                const result = await this.recognizeImage(images[i]);
                const duration = Date.now() - startTime;

                console.log(`✓ 辨識完成，耗時: ${(duration / 1000).toFixed(2)}秒`);
                console.log(`信心度: ${result.confidence.toFixed(1)}%`);

                results.push(result);

                if (onProgress) {
                    onProgress(i + 1, images.length);
                }
            } catch (error) {
                console.error(`圖片 ${i + 1} 辨識失敗:`, error);
                // 返回空結果而不是中斷
                results.push({
                    text: '',
                    words: [],
                    confidence: 0,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 檢查 API Key 是否有效
     */
    async validateApiKey() {
        try {
            // 創建一個 1x1 的測試圖片
            const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

            await this.recognizeImage(testImage);
            return { valid: true, message: 'API Key 驗證成功' };
        } catch (error) {
            return {
                valid: false,
                message: error.message.includes('API_KEY_INVALID')
                    ? 'API Key 無效'
                    : error.message
            };
        }
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleVisionOCR;
}
