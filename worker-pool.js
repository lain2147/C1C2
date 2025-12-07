/**
 * OCR Worker池管理器
 * 用於並行處理多張圖片，提升處理速度
 */
class OCRWorkerPool {
    constructor(poolSize = 2) {
        this.poolSize = poolSize;
        this.workers = [];
        this.queue = [];
        this.processing = 0;
    }

    /**
     * 初始化Worker池
     */
    async initialize() {
        console.log(`正在初始化 ${this.poolSize} 個 OCR Worker...`);

        for (let i = 0; i < this.poolSize; i++) {
            try {
                const worker = await Tesseract.createWorker('eng', 1, {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`Worker ${i + 1} 進度: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                });

                // 優化Tesseract參數
                await worker.setParameters({
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,|-+µΩ',
                    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                    preserve_interword_spaces: '1',
                });

                this.workers.push({
                    id: i,
                    worker: worker,
                    busy: false
                });

                console.log(`Worker ${i + 1} 初始化完成`);
            } catch (error) {
                console.error(`Worker ${i + 1} 初始化失敗:`, error);
            }
        }

        console.log(`Worker池初始化完成，共 ${this.workers.length} 個Worker`);
    }

    /**
     * 批次處理多張圖片
     * @param {Array} images - 圖片陣列（Data URL）
     * @param {Function} onProgress - 進度回調函數
     * @returns {Promise<Array>} OCR結果陣列
     */
    async processImages(images, onProgress = null) {
        const results = new Array(images.length);
        let completed = 0;

        return new Promise((resolve, reject) => {
            // 為每張圖片創建任務
            images.forEach((image, index) => {
                this.queue.push({
                    image,
                    index,
                    resolve: (result) => {
                        results[index] = result;
                        completed++;

                        if (onProgress) {
                            onProgress(completed, images.length);
                        }

                        // 處理下一個任務
                        this.processNext();

                        // 如果所有任務完成，返回結果
                        if (completed === images.length) {
                            resolve(results);
                        }
                    },
                    reject
                });
            });

            // 啟動處理
            this.processNext();
        });
    }

    /**
     * 處理下一個任務
     */
    async processNext() {
        // 如果隊列為空，返回
        if (this.queue.length === 0) {
            return;
        }

        // 查找空閒的Worker
        const availableWorker = this.workers.find(w => !w.busy);
        if (!availableWorker) {
            return;
        }

        // 從隊列取出任務
        const task = this.queue.shift();
        availableWorker.busy = true;
        this.processing++;

        try {
            const { data } = await availableWorker.worker.recognize(task.image);

            task.resolve({
                text: data.text,
                words: data.words,
                confidence: data.confidence
            });
        } catch (error) {
            console.error(`Worker ${availableWorker.id} 處理失敗:`, error);
            task.reject(error);
        } finally {
            availableWorker.busy = false;
            this.processing--;
        }
    }

    /**
     * 終止所有Worker
     */
    async terminate() {
        console.log('正在終止所有Worker...');

        for (const workerObj of this.workers) {
            try {
                await workerObj.worker.terminate();
            } catch (error) {
                console.error(`終止Worker ${workerObj.id} 失敗:`, error);
            }
        }

        this.workers = [];
        this.queue = [];
        console.log('所有Worker已終止');
    }

    /**
     * 獲取Worker池狀態
     */
    getStatus() {
        return {
            poolSize: this.poolSize,
            activeWorkers: this.workers.filter(w => w.busy).length,
            queueLength: this.queue.length,
            processing: this.processing
        };
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OCRWorkerPool;
}
