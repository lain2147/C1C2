/**
 * 圖片矯正模組 - 基於左側線條的智能矯正
 * 功能：檢測左側邊緣線條、計算旋轉角度、自動矯正和裁切
 */
class ImageAlignment {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.debugMode = false; // 設為true可看到檢測過程
    }

    /**
     * 主處理函數 - 矯正圖片
     * @param {String|Image} imageInput - 圖片Data URL或Image對象
     * @returns {Promise<String>} 矯正後的圖片Data URL
     */
    async alignImage(imageInput) {
        try {
            // 1. 載入圖片
            const img = await this.loadImage(imageInput);
            console.log(`原始圖片尺寸: ${img.width}x${img.height}`);

            // 2. 轉換為灰度圖並二值化
            const binaryData = await this.preprocessForEdgeDetection(img);

            // 3. 檢測左側邊緣線條
            const leftEdges = this.detectLeftEdge(binaryData, img.width, img.height);
            console.log(`檢測到 ${leftEdges.length} 個左側邊緣點`);

            // 4. 計算旋轉角度
            const angle = this.calculateRotationAngle(leftEdges);
            console.log(`計算出旋轉角度: ${angle.toFixed(2)}°`);

            // 5. 旋轉矯正
            let correctedImage = img;
            if (Math.abs(angle) > 0.5) { // 只有角度大於0.5度才矯正
                correctedImage = await this.rotateImage(img, -angle); // 負角度矯正
                console.log(`✓ 圖片已矯正 ${angle.toFixed(2)}°`);
            } else {
                console.log('圖片角度正常，無需矯正');
            }

            // 6. 智能裁切（去除邊緣空白）
            const croppedImage = await this.smartCrop(correctedImage);
            console.log('✓ 圖片已智能裁切');

            return croppedImage;

        } catch (error) {
            console.error('圖片矯正失敗:', error);
            // 失敗時返回原圖
            return typeof imageInput === 'string' ? imageInput : this.imageToDataURL(imageInput);
        }
    }

    /**
     * 載入圖片
     */
    loadImage(input) {
        return new Promise((resolve, reject) => {
            if (input instanceof Image || input instanceof HTMLImageElement) {
                resolve(input);
                return;
            }

            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('圖片載入失敗'));
            img.src = input;
        });
    }

    /**
     * 預處理：轉灰度並二值化，用於邊緣檢測
     */
    async preprocessForEdgeDetection(img) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        // 轉灰度
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = data[i + 1] = data[i + 2] = gray;
        }

        // Otsu二值化
        const threshold = this.calculateOtsuThreshold(data);
        for (let i = 0; i < data.length; i += 4) {
            const value = data[i] > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = value;
        }

        return imageData;
    }

    /**
     * Otsu閾值計算
     */
    calculateOtsuThreshold(data) {
        const histogram = new Array(256).fill(0);
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            histogram[data[i]]++;
        }

        let sum = 0;
        for (let i = 0; i < 256; i++) {
            sum += i * histogram[i];
        }

        let sumB = 0, wB = 0, wF = 0;
        let maxVariance = 0, threshold = 0;

        for (let t = 0; t < 256; t++) {
            wB += histogram[t];
            if (wB === 0) continue;

            wF = pixelCount - wB;
            if (wF === 0) break;

            sumB += t * histogram[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const variance = wB * wF * (mB - mF) * (mB - mF);

            if (variance > maxVariance) {
                maxVariance = variance;
                threshold = t;
            }
        }

        return threshold;
    }

    /**
     * 檢測左側邊緣線條
     * 掃描圖片左側區域，找出邊緣點
     */
    detectLeftEdge(imageData, width, height) {
        const data = imageData.data;
        const edgePoints = [];
        const scanWidth = Math.min(Math.floor(width * 0.15), 150); // 掃描左側15%或最多150像素

        // 從上到下掃描
        for (let y = 0; y < height; y += 5) { // 每5像素取樣一次，提升速度
            let foundEdge = false;

            // 從左到右掃描
            for (let x = 0; x < scanWidth; x++) {
                const idx = (y * width + x) * 4;
                const current = data[idx];

                // 檢測黑到白的變化（找到內容邊緣）
                if (x > 0) {
                    const prevIdx = (y * width + (x - 1)) * 4;
                    const prev = data[prevIdx];

                    // 從黑色（文字/線條）變成白色（背景）
                    if (prev < 128 && current > 128) {
                        edgePoints.push({ x, y });
                        foundEdge = true;
                        break;
                    }
                }
            }

            // 如果整行都是白色，記錄最左側
            if (!foundEdge) {
                for (let x = 0; x < scanWidth; x++) {
                    const idx = (y * width + x) * 4;
                    if (data[idx] < 128) { // 找到第一個黑色像素
                        edgePoints.push({ x, y });
                        break;
                    }
                }
            }
        }

        return edgePoints;
    }

    /**
     * 根據邊緣點計算旋轉角度
     * 使用最小二乘法擬合直線
     */
    calculateRotationAngle(edgePoints) {
        if (edgePoints.length < 10) {
            console.log('邊緣點太少，無法計算角度');
            return 0;
        }

        // 過濾離群點（使用中位數絕對偏差）
        const filteredPoints = this.filterOutliers(edgePoints);
        console.log(`過濾後剩餘 ${filteredPoints.length} 個有效點`);

        if (filteredPoints.length < 10) {
            return 0;
        }

        // 最小二乘法擬合直線: y = mx + b
        const n = filteredPoints.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        filteredPoints.forEach(p => {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumX2 += p.x * p.x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

        // 將斜率轉換為角度（度）
        const angleRad = Math.atan(slope);
        const angleDeg = angleRad * (180 / Math.PI);

        // 限制角度範圍在 -10° 到 10°
        const clampedAngle = Math.max(-10, Math.min(10, angleDeg));

        return clampedAngle;
    }

    /**
     * 過濾離群點
     * 使用MAD (Median Absolute Deviation) 方法
     */
    filterOutliers(points) {
        if (points.length < 10) return points;

        // 計算X座標的中位數
        const xValues = points.map(p => p.x).sort((a, b) => a - b);
        const median = xValues[Math.floor(xValues.length / 2)];

        // 計算絕對偏差
        const deviations = xValues.map(x => Math.abs(x - median));
        const mad = deviations.sort((a, b) => a - b)[Math.floor(deviations.length / 2)];

        // 過濾：保留偏差在3倍MAD以內的點
        const threshold = 3 * (mad || 10); // 如果MAD為0，使用默認值10
        return points.filter(p => Math.abs(p.x - median) <= threshold);
    }

    /**
     * 旋轉圖片
     */
    async rotateImage(img, angle) {
        return new Promise((resolve) => {
            const rad = (angle * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            // 計算旋轉後的畫布大小
            const newWidth = Math.abs(img.width * cos) + Math.abs(img.height * sin);
            const newHeight = Math.abs(img.width * sin) + Math.abs(img.height * cos);

            this.canvas.width = Math.ceil(newWidth);
            this.canvas.height = Math.ceil(newHeight);

            // 清空畫布（白色背景）
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // 移動到中心點
            this.ctx.translate(newWidth / 2, newHeight / 2);

            // 旋轉
            this.ctx.rotate(rad);

            // 繪製圖片
            this.ctx.drawImage(img, -img.width / 2, -img.height / 2);

            // 重置變換
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);

            resolve(this.canvas.toDataURL('image/png'));
        });
    }

    /**
     * 智能裁切 - 去除四周空白
     */
    async smartCrop(imgSrc) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);

                const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;

                // 檢測內容邊界
                const bounds = this.detectContentBounds(data, img.width, img.height);

                // 添加邊距
                const margin = 20;
                const cropX = Math.max(0, bounds.left - margin);
                const cropY = Math.max(0, bounds.top - margin);
                const cropWidth = Math.min(
                    img.width - cropX,
                    bounds.right - bounds.left + margin * 2
                );
                const cropHeight = Math.min(
                    img.height - cropY,
                    bounds.bottom - bounds.top + margin * 2
                );

                // 裁切
                this.canvas.width = cropWidth;
                this.canvas.height = cropHeight;
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(0, 0, cropWidth, cropHeight);

                this.ctx.drawImage(
                    img,
                    cropX, cropY, cropWidth, cropHeight,
                    0, 0, cropWidth, cropHeight
                );

                resolve(this.canvas.toDataURL('image/png'));
            };
            img.src = imgSrc;
        });
    }

    /**
     * 檢測內容邊界
     */
    detectContentBounds(data, width, height) {
        let left = width, right = 0, top = height, bottom = 0;
        const threshold = 250; // 亮度閾值

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

                // 如果不是白色（有內容）
                if (brightness < threshold) {
                    left = Math.min(left, x);
                    right = Math.max(right, x);
                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                }
            }
        }

        return { left, right, top, bottom };
    }

    /**
     * Image轉DataURL
     */
    imageToDataURL(img) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        return this.canvas.toDataURL('image/png');
    }

    /**
     * 批次處理多張圖片
     */
    async alignBatch(images, onProgress = null) {
        const results = [];
        for (let i = 0; i < images.length; i++) {
            console.log(`\n矯正圖片 ${i + 1}/${images.length}...`);
            const aligned = await this.alignImage(images[i]);
            results.push(aligned);

            if (onProgress) {
                onProgress(i + 1, images.length);
            }
        }
        return results;
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageAlignment;
}
