require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const sharp = require('sharp');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const upload = multer();

// 导入NocoDB工具函数
const { saveToNocoDB } = require('./utils/nocodb');

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
        res.write(JSON.stringify({ status: 'generating', progress: 30, message: '正在生成原始图片...', showSpinner: true }) + '\n');
        
        console.log('构建提示词...');
        // 构建提示词
        const prompt = `Create a modern, minimalist, flat, clean, and vector logo for an application called '${pluginName}'. 其功能是：${pluginDesc}. The logo should be the only element, centered on a blank monochrome canvas.`;
        
        // 设置请求超时
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        console.log('准备发送API请求到:', API_URL);
        // 发送请求到OpenAI API
        try {
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
            
            console.log('API响应状态:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API响应错误:', errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: errorText };
                }
                const status = response.status;
                const message = errorData?.error?.message || errorData?.message || `API请求失败: ${status}`;
                
                // 记录失败信息到NocoDB
                try {
                    await saveToNocoDB({
                        plugin_name: pluginName,
                        plugin_desc: pluginDesc,
                        prompt: prompt,
                        original_url: '',
                        status: 'error',
                        error_message: message
                    });
                    console.log('Logo生成失败记录已保存到NocoDB');
                } catch (recordError) {
                    console.error('保存失败记录到NocoDB失败:', recordError);
                    // 记录失败不影响主流程
                }
                
                res.write(JSON.stringify({ status: 'error', error: message }) + '\n');
                res.end();
                return;
            }

            const contentType = response.headers.get('content-type');
            console.log('响应Content-Type:', contentType);
            
            const dataText = await response.text();
            console.log('API原始响应数据:', dataText);
            
            let data;
            try {
                data = JSON.parse(dataText);
            } catch (e) {
                console.error('JSON解析错误:', e);
                return res.status(500).json({ error: '无法解析API响应' });
            }
            
            console.log('解析后的API响应数据:', JSON.stringify(data, null, 2));
            
            if (!data.data || !data.data[0] || !data.data[0].url) {
                console.error('API响应格式错误:', data);
                return res.status(500).json({ error: 'API响应格式错误，未找到图片URL' });
            }
            
            const originalImageUrl = data.data[0].url;
            console.log('获取到图片URL:', originalImageUrl);

            // 通知前端原始图片已生成
            res.write(JSON.stringify({ status: 'processing', progress: 60, message: '正在处理图片尺寸...', originalUrl: originalImageUrl }) + '\n');

            console.log('开始下载图片...');
            // 第二步：处理不同尺寸的图片
            try {
                const imageBuffer = await getImageBuffer(originalImageUrl);
                console.log('图片下载成功，大小:', imageBuffer.length, '字节');
                
                const sizes = [16, 32, 48, 128];
                const resizedImages = [];

                for (let i = 0; i < sizes.length; i++) {
                    const size = sizes[i];
                    console.log(`处理 ${size}x${size} 尺寸...`);
                    const buffer = await resizeImage(imageBuffer, size);
                    const fileName = `icon${size}.png`;
                    
                    // 在Vercel环境中跳过文件写入
                    if (process.env.VERCEL !== '1') {
                        try {
                            await fs.writeFile(path.join(__dirname, fileName), buffer);
                            console.log(`文件 ${fileName} 写入成功`);
                        } catch (err) {
                            console.warn(`无法写入文件 ${fileName}:`, err);
                        }
                    }
                    
                    resizedImages.push({
                        size: size,
                        data: buffer.toString('base64'),
                        fileName: fileName
                    });

                    // 更新压缩进度
                    const progress = 60 + Math.floor((i + 1) / sizes.length * 40);
                    res.write(JSON.stringify({ status: 'processing', progress, message: `正在生成 ${size}x${size} 尺寸...` }) + '\n');
                }

                console.log('所有尺寸处理完成，发送完成状态...');
                
                // 记录成功生成的Logo信息到NocoDB
                try {
                    // 使用API返回的revised_prompt而不是原始prompt
                    const revisedPrompt = data.data[0].revised_prompt || prompt;
                    await saveToNocoDB({
                        plugin_name: pluginName,
                        plugin_desc: pluginDesc,
                        prompt: revisedPrompt,
                        original_url: originalImageUrl,
                        status: 'success',
                        error_message: ''
                    });
                    console.log('Logo生成记录已保存到NocoDB');
                } catch (recordError) {
                    console.error('保存记录到NocoDB失败:', recordError);
                    // 记录失败不影响主流程
                }
                
                // 返回最终结果
                res.write(JSON.stringify({ status: 'completed', progress: 100, message: '处理完成', sizes: resizedImages }) + '\n');
                res.end();
            } catch (imageError) {
                console.error('处理图片时出错:', imageError);
                res.status(500).json({ error: '处理图片时出错: ' + imageError.message });
            }
        } catch (fetchError) {
            clearTimeout(timeout);
            console.error('发送API请求时出错:', fetchError);
            throw fetchError; // 向上抛出错误，统一处理
        }
    } catch (error) {
        console.error('生成Logo过程中发生错误:', error);
        let errorMessage = '生成Logo时出现错误';
        
        if (error.name === 'AbortError') {
            errorMessage = '请求超时，请稍后重试';
        } else if (error.response) {
            try {
                const contentType = error.response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await error.response.json();
                    errorMessage = errorData.error?.message || errorData.error || '服务器返回了一个错误';
                } else {
                    errorMessage = `API请求失败: HTTP ${error.response.status} - ${error.response.statusText}`;
                }
            } catch (e) {
                errorMessage = `请求失败: ${error.response.status}`;
            }
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMessage = '网络连接失败，请检查您的网络连接';
        } else {
            errorMessage = error.message || errorMessage;
        }
        
        // 记录错误信息到NocoDB
        try {
            await saveToNocoDB({
                plugin_name: req.body.pluginName || '',
                plugin_desc: req.body.pluginDesc || '',
                prompt: prompt || '',
                original_url: '',
                status: 'error',
                error_message: errorMessage
            });
            console.log('Logo生成错误记录已保存到NocoDB');
        } catch (recordError) {
            console.error('保存错误记录到NocoDB失败:', recordError);
            // 记录失败不影响主流程
        }
        
        if (!res.headersSent) {
            res.write(JSON.stringify({ status: 'error', error: errorMessage }) + '\n');
            res.end();
        }
    }
});

// 处理Logo上传请求
app.post('/upload-logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的图片' });
        }

        // 通知前端开始处理
        res.write(JSON.stringify({ status: 'processing', progress: 30, message: '正在处理图片...' }) + '\n');

        // 获取上传的图片buffer
        const imageBuffer = req.file.buffer;

        // 通知前端原始图片已接收
        res.write(JSON.stringify({ status: 'processing', progress: 60, message: '正在生成不同尺寸...', originalUrl: `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}` }) + '\n');

        // 处理不同尺寸的图片
        const sizes = [16, 32, 48, 128];
        const resizedImages = [];

        for (let i = 0; i < sizes.length; i++) {
            const size = sizes[i];
            const buffer = await resizeImage(imageBuffer, size);
            const fileName = `icon${size}.png`;
            
            // 在Vercel环境中跳过文件写入
            if (process.env.VERCEL !== '1') {
                try {
                    await fs.writeFile(path.join(__dirname, fileName), buffer);
                } catch (err) {
                    console.warn(`无法写入文件 ${fileName}:`, err);
                }
            }
            
            resizedImages.push({
                size: size,
                data: buffer.toString('base64'),
                fileName: fileName
            });
            
            // 更新进度
            const progress = 60 + Math.floor((i + 1) / sizes.length * 40);
            res.write(JSON.stringify({ 
                status: 'processing', 
                progress, 
                message: `正在生成 ${size}x${size} 尺寸...` 
            }) + '\n');
        }
        // 记录上传的Logo信息到NocoDB
        try {
            // 获取完整的图片base64数据
            const fullBase64 = imageBuffer.toString('base64');            
            await saveToNocoDB({
                plugin_name: req.body.pluginName || '用户上传',
                plugin_desc: req.body.pluginDesc || '用户上传的Logo',
                prompt: '',
                original_url: `data:${req.file.mimetype};base64,${fullBase64}`,
                status: 'upload',
                error_message: ''
            });
            console.log('Logo上传记录已保存到NocoDB');
        } catch (recordError) {
            console.error('保存上传记录到NocoDB失败:', recordError);
            // 记录失败不影响主流程
        }
        
        // 发送完成消息和处理后的图片
        res.write(JSON.stringify({
            status: 'completed',
            progress: 100,
            message: '处理完成',
            sizes: resizedImages
        }) + '\n');

        res.end();
    } catch (error) {
        console.error('Error processing uploaded image:', error);
        
        // 记录上传失败信息到NocoDB
        try {
            await saveToNocoDB({
                plugin_name: req.body.pluginName || '用户上传',
                plugin_desc: req.body.pluginDesc || '用户上传的Logo',
                prompt: '',
                original_url: '',
                status: 'error',
                error_message: '处理图片时出现错误: ' + (error.message || '')
            });
            console.log('Logo上传失败记录已保存到NocoDB');
        } catch (recordError) {
            console.error('保存上传失败记录到NocoDB失败:', recordError);
            // 记录失败不影响主流程
        }
        
        res.status(500).json({ error: '处理图片时出现错误: ' + (error.message || '') });
    }
});

// 如果不是在Vercel环境中，则启动本地服务器
if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
    });
}