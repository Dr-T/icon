// NocoDB集成工具函数
const axios = require('axios');

// 从环境变量获取NocoDB配置
const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN; // 使用xc-token而非xc-auth
const NOCODB_TABLE_ID = process.env.NOCODB_TABLE_ID; // 表ID
const NOCODB_VIEW_ID = process.env.NOCODB_VIEW_ID; // 视图ID

/**
 * 将Logo生成记录保存到NocoDB
 * @param {Object} data - 要保存的数据
 * @param {string} data.plugin_name - 插件名称
 * @param {string} data.plugin_desc - 插件描述
 * @param {string} data.prompt - 生成提示词
 * @param {string} data.original_url - 原始图片URL
 * @param {string} data.status - 状态(success/error/upload)
 * @param {string} data.error_message - 错误信息(如有)
 * @returns {Promise<Object>} - 保存结果
 */
async function saveToNocoDB(data) {
    // 如果未配置NocoDB，则跳过记录
    if (!NOCODB_URL || !NOCODB_TOKEN || !NOCODB_TABLE_ID) {
        console.log('NocoDB未配置，跳过记录');
        return { success: false, message: 'NocoDB未配置' };
    }

    try {
        // 添加创建时间
        const recordData = {
            ...data,
            created_at: new Date().toISOString()
        };

        // 调用NocoDB API保存记录 - 使用v2 API
        const apiUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records`;
        
        const options = {
            method: 'POST',
            url: apiUrl,
            params: NOCODB_VIEW_ID ? { viewId: NOCODB_VIEW_ID } : {},
            headers: {
                'xc-token': NOCODB_TOKEN,
                'Content-Type': 'application/json'
            },
            data: recordData
        };
        
        const response = await axios.request(options);

        console.log('NocoDB记录保存成功:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('保存到NocoDB失败:', error.message);
        // 记录失败不影响主流程
        return { success: false, error: error.message };
    }
}

module.exports = { saveToNocoDB };