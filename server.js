const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const sharp = require('sharp');

const app = express();

// 启用CORS和JSON解析中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 导出app实例供Vercel使用
module.exports = app;

// 从环境变量获取API配置
const API_KEY = process.env.OPENAI_API_KEY || 'sk-b4RY4HvkSdSR4s1uY8myVXxmo6PXZ68Yh2eANajWaf3xO5bg';
const BASE_API_URL = process.env.OPENAI_API_URL || 'https://newapi.tx88.eu.org';
const MODEL = process.env.OPENAI_MODEL || 'dall-e-3';
const API_URL = `${BASE_API_URL}/v1/images/generations`;

// 处理图片尺寸转换
async function resizeImage(imageBuffer, size) {
    return await sharp(imageBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
}

// 获取图片buffer
async function getImageBuffer(url) {
    const response = await fetch(url);
    return await response.buffer();
}

// 处理Logo生成请求
app.post('/generate-logo', async (req, res) => {
    // 验证API密钥是否存在
    if (!API_KEY) {
        return res.status(500).json({ error: 'API密钥未配置，请设置OPENAI_API_KEY环境变量' });
    }

    try {
        const { pluginName, pluginDesc } = req.body;

        // 第一步：生成原始图片
        res.write(JSON.stringify({ status: 'generating', progress: 30, message: '正在生成原始图片...' }) + '\n');

        // 构建提示词
        const prompt = `为名为"${pluginName}"的浏览器插件设计一个专业的logo。这个插件的功能是：${pluginDesc}。设计风格要简洁现代，适合作为浏览器插件的图标使用。`;

        // 设置请求超时
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        // 发送请求到OpenAI API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                n: 1,
                model: MODEL,
                size: '1024x1024',
                response_format: 'url'
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const status = response.status;
            const message = errorData?.error?.message || errorData?.message || `API请求失败: ${status}`;
            return res.status(status).json({ error: message });
        }

        const data = await response.json();
        const originalImageUrl = data.data[0].url;

        // 通知前端原始图片已生成
        res.write(JSON.stringify({ status: 'processing', progress: 60, message: '正在处理图片尺寸...', originalUrl: originalImageUrl }) + '\n');

        // 第二步：处理不同尺寸的图片
        const imageBuffer = await getImageBuffer(originalImageUrl);
        const sizes = [16, 32, 48, 128];
        const resizedImages = [];

        for (let i = 0; i < sizes.length; i++) {
            const size = sizes[i];
            const buffer = await resizeImage(imageBuffer, size);
            resizedImages.push({
                size: `${size}x${size}`,
                data: buffer.toString('base64')
            });

            // 更新压缩进度
            const progress = 60 + Math.floor((i + 1) / sizes.length * 40);
            res.write(JSON.stringify({ status: 'processing', progress, message: `正在生成 ${size}x${size} 尺寸...` }) + '\n');
        }

        // 返回最终结果
        res.write(JSON.stringify({ status: 'completed', progress: 100, message: '处理完成', sizes: resizedImages }) + '\n');
        res.end();

    } catch (error) {
        console.error('Error:', error);
        let errorMessage = '生成Logo时出现错误';
        
        if (error.name === 'AbortError') {
            errorMessage = '请求超时，请稍后重试';
        } else if (error.response) {
            const contentType = error.response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await error.response.json();
                errorMessage = errorData.error?.message || errorData.error || '服务器返回了一个错误';
            } else {
                errorMessage = `API请求失败: HTTP ${error.response.status} - ${error.response.statusText}`;
            }
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMessage = '网络连接失败，请检查您的网络连接';
        } else {
            errorMessage = error.message || errorMessage;
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// 如果不是在Vercel环境中，则启动本地服务器
if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
    });
}