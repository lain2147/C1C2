/**
 * BOM表图片预处理器
 * 功能：自动矫正角度、裁切边缘、增强对比度
 */
class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * 主处理函数 - 处理单张图片
     * @param {File|Blob|String} imageInput - 图片文件、Blob或Data URL
     * @param {Object} options - 处理选项
     * @returns {Promise<String>} 处理后的图片Data URL
     */
    async processImage(imageInput, options = {}) {
        const {
            autoRotate = true,      // 自动矫正角度
            autoCrop = true,        // 自动裁切边缘
            enhanceContrast = true, // 增强对比度
            rotationAngle = 0,      // 手动指定旋转角度（度）
            cropMargin = 10         // 裁切边距（像素）
        } = options;

        try {
            // 加载图片
            const img = await this.loadImage(imageInput);

            let processedImage = img;

            // 步骤1：旋转矫正
            if (autoRotate || rotationAngle !== 0) {
                const angle = autoRotate ? await this.detectRotation(img) : rotationAngle;
                if (Math.abs(angle) > 0.5) { // 只有角度大于0.5度才矫正
                    processedImage = await this.rotateImage(processedImage, angle);
                    console.log(`✓ 图片已旋转: ${angle.toFixed(2)}°`);
                }
            }

            // 步骤2：裁切边缘
            if (autoCrop) {
                processedImage = await this.cropImage(processedImage, cropMargin);
                console.log('✓ 图片已裁切边缘');
            }

            // 步骤3：增强对比度
            if (enhanceContrast) {
                processedImage = await this.enhanceImage(processedImage);
                console.log('✓ 图片对比度已增强');
            }

            return processedImage;

        } catch (error) {
            console.error('图片处理失败:', error);
            throw error;
        }
    }

    /**
     * 加载图片
     */
    loadImage(input) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                URL.revokeObjectURL(img.src); // 释放内存
                resolve(img);
            };

            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };

            // 根据输入类型处理
            if (typeof input === 'string') {
                // Data URL
                img.src = input;
            } else if (input instanceof File || input instanceof Blob) {
                // File或Blob
                img.src = URL.createObjectURL(input);
            } else {
                reject(new Error('不支持的图片格式'));
            }
        });
    }

    /**
     * 检测图片旋转角度（简化版）
     * 通过分析图片边缘来估算旋转角度
     */
    async detectRotation(img) {
        // 简化实现：分析图片四个角落的内容分布
        // 返回估算的角度（-45° 到 45°）

        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        // 扫描左边缘，找出文字开始的位置
        const leftEdgeAngles = [];
        const sampleWidth = Math.min(100, Math.floor(img.width * 0.1));
        const sampleHeight = img.height;

        // 简化：假设大多数情况下旋转角度在 -10° 到 10° 之间
        // 这里返回0，实际应用中可以使用更复杂的算法
        return 0; // 暂时返回0，可以后续改进
    }

    /**
     * 旋转图片
     */
    rotateImage(img, angle) {
        return new Promise((resolve) => {
            if (typeof img === 'string') {
                const tempImg = new Image();
                tempImg.onload = () => {
                    resolve(this._rotateImageElement(tempImg, angle));
                };
                tempImg.src = img;
            } else {
                resolve(this._rotateImageElement(img, angle));
            }
        });
    }

    _rotateImageElement(img, angle) {
        const rad = (angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // 计算旋转后的画布大小
        const newWidth = Math.abs(img.width * cos) + Math.abs(img.height * sin);
        const newHeight = Math.abs(img.width * sin) + Math.abs(img.height * cos);

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;

        // 清空画布
        this.ctx.clearRect(0, 0, newWidth, newHeight);

        // 移动到中心点
        this.ctx.translate(newWidth / 2, newHeight / 2);

        // 旋转
        this.ctx.rotate(rad);

        // 绘制图片
        this.ctx.drawImage(img, -img.width / 2, -img.height / 2);

        // 重置变换
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        return this.canvas.toDataURL('image/png');
    }

    /**
     * 裁切图片边缘
     * 移除左右两侧的空白区域
     */
    cropImage(imgSrc, margin = 10) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);

                const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;

                // 检测内容边界
                const bounds = this.detectContentBounds(data, img.width, img.height);

                // 应用裁切（保留一定边距）
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

                // 创建裁切后的画布
                this.canvas.width = cropWidth;
                this.canvas.height = cropHeight;
                this.ctx.clearRect(0, 0, cropWidth, cropHeight);

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
     * 检测图片内容边界
     */
    detectContentBounds(data, width, height) {
        let left = width, right = 0, top = height, bottom = 0;
        const threshold = 250; // 亮度阈值（接近白色）

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

                // 如果不是白色（有内容）
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
     * 增强图片对比度和清晰度 - 优化版本
     * 包含灰度化、对比度增强、二值化等处理
     */
    enhanceImage(imgSrc) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);

                const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;

                // 步骤1: 转换为灰度图（提升OCR速度和准确度）
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = data[i + 1] = data[i + 2] = gray;
                }

                // 步骤2: 增强对比度
                const contrastFactor = 1.5;
                const brightness = 15;

                for (let i = 0; i < data.length; i += 4) {
                    data[i] = this.clamp((data[i] - 128) * contrastFactor + 128 + brightness);
                    data[i + 1] = this.clamp((data[i + 1] - 128) * contrastFactor + 128 + brightness);
                    data[i + 2] = this.clamp((data[i + 2] - 128) * contrastFactor + 128 + brightness);
                }

                // 步骤3: 自适应二值化（使OCR更准确）
                const binaryThreshold = this.calculateOtsuThreshold(data);
                for (let i = 0; i < data.length; i += 4) {
                    const value = data[i] > binaryThreshold ? 255 : 0;
                    data[i] = data[i + 1] = data[i + 2] = value;
                }

                this.ctx.putImageData(imageData, 0, 0);
                resolve(this.canvas.toDataURL('image/png'));
            };
            img.src = imgSrc;
        });
    }

    /**
     * 使用Otsu方法计算最佳二值化阈值
     */
    calculateOtsuThreshold(data) {
        // 构建灰度直方图
        const histogram = new Array(256).fill(0);
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            histogram[data[i]]++;
        }

        // 计算总和
        let sum = 0;
        for (let i = 0; i < 256; i++) {
            sum += i * histogram[i];
        }

        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVariance = 0;
        let threshold = 0;

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
     * 压缩图片到合适大小（提升处理速度）
     */
    compressImage(imgSrc, maxWidth = 1920, maxHeight = 1080, quality = 0.85) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // 计算缩放比例
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                this.canvas.width = width;
                this.canvas.height = height;

                // 使用高质量缩放
                this.ctx.imageSmoothingEnabled = true;
                this.ctx.imageSmoothingQuality = 'high';
                this.ctx.drawImage(img, 0, 0, width, height);

                resolve(this.canvas.toDataURL('image/jpeg', quality));
            };
            img.src = imgSrc;
        });
    }

    /**
     * 限制数值范围在0-255之间
     */
    clamp(value) {
        return Math.max(0, Math.min(255, value));
    }

    /**
     * 批量处理多张图片
     */
    async processBatch(images, options = {}) {
        const results = [];
        for (let i = 0; i < images.length; i++) {
            console.log(`处理图片 ${i + 1}/${images.length}...`);
            const processed = await this.processImage(images[i], options);
            results.push(processed);
        }
        return results;
    }
}

// 导出（如果使用模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageProcessor;
}
