/**
 * DeepSeek OCR helper
 * 傳送 Base64 圖片到自建的 DeepSeek 代理端點；回傳格式採用 { text, words?, confidence? }。
 * 請確保後端持有金鑰並處理簽名，避免在前端暴露金鑰。
 */
class DeepSeekOCR {
    constructor(endpoint, apiKey) {
        this.endpoint = endpoint;
        this.apiKey = apiKey;
    }

    dataURLToBase64(dataURL) {
        return dataURL.split(',')[1];
    }

    async recognizeImage(imageDataURL) {
        if (!this.endpoint) {
            throw new Error('DeepSeek API 代理端點未設定');
        }

        const base64Image = this.dataURLToBase64(imageDataURL);
        const headers = { 'Content-Type': 'application/json' };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ image: base64Image })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`DeepSeek API 呼叫失敗: ${response.status} ${errText}`);
        }

        const data = await response.json();
        return {
            text: data.text || '',
            words: data.words || [],
            confidence: data.confidence ?? 0
        };
    }

    async recognizeImages(images, onProgress = null) {
        const results = [];
        for (let i = 0; i < images.length; i++) {
            const result = await this.recognizeImage(images[i]);
            results.push(result);
            if (onProgress) {
                onProgress(i + 1, images.length);
            }
        }
        return results;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeepSeekOCR;
}
