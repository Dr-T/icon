const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// 启用CORS和JSON解析中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 设置OpenAI API配置
const API_URL = 'https://newapi.tx88.eu.org/v1/images/generations';
const API_KEY = 'sk-b4RY4HvkSdSR4s1uY8myVXxmo6PXZ68Yh2eANajWaf3xO5bg';

// 处理Logo生成请求
app.post('/generate-logo', async (req, res) => {
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