const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// 启用CORS和JSON解析中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 导出app实例供Vercel使用
module.exports = app;

// 从环境变量获取API配置
const API_KEY = process.env.OPENAI_API_KEY;
const BASE_API_URL = process.env.OPENAI_API_URL || 'https://newapi.tx88.eu.org';
const API_URL = `${BASE_API_URL}/v1/images/generations`;

// 处理Logo生成请求
app.post('/generate-logo', async (req, res) => {
    // 验证API密钥是否存在
    if (!API_KEY) {
        return res.status(500).json({ error: 'API密钥未配置，请设置OPENAI_API_KEY环境变量' });
    }

    try {
        const { pluginName, pluginDesc } = req.body;

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
                model: 'dall-e-3',
                size: '1024x1024',
                response_format: 'url'
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        res.json({ url: data.data[0].url });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: '生成Logo时出现错误' });
    }
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});