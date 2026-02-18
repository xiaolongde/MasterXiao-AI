import express from 'express';
import config from '../config/index.js';
import axios from 'axios';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

/**
 * POST /api/analysis/birthMatch
 * 生日匹配分析 - 流式响应
 */
router.post('/birthMatch', async (req, res) => {
    const { partyA, partyB } = req.body;
    if (!partyA || !partyB) {
        return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: '请提供双方信息' } });
    }
    if (!partyA.birthDate || !partyB.birthDate) {
        return res.status(400).json({ success: false, error: { code: 'MISSING_BIRTHDATE', message: '请提供双方生日' } });
    }

    logger.info('接收到匹配请求参数:', JSON.stringify({ partyA, partyB }, null, 2));

    // 读取提示词文件
    const promptFilePath = join(__dirname, '../prompt/birthdayMatch.md');
    const systemPrompt = readFileSync(promptFilePath, 'utf-8');

    // 构造 prompt
    const prompt = `请根据以下双方信息，分析他们的匹配情况：\nA: 姓名：${partyA.name}，性别：${partyA.gender}，生日：${partyA.birthDate}\nB: 姓名：${partyB.name}，性别：${partyB.gender}，生日：${partyB.birthDate}`;

    logger.info('开始请求 Deepseek API (流式)');
    const startTime = Date.now();

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.flushHeaders();

    try {
        logger.info('正在连接 Deepseek API...');
        
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7,
            stream: true  // 启用流式响应
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.ds_key}`
            },
            timeout: 180000,  // 增加超时到3分钟
            responseType: 'stream'  // axios 流式接收
        });
        
        logger.info('Deepseek API 连接成功，开始接收流式数据...');

        let fullContent = '';
        let paragraphBuffer = '';  // 段落缓冲区

        response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        // 发送剩余缓冲内容
                        if (paragraphBuffer) {
                            res.write(`data: ${JSON.stringify({ content: paragraphBuffer })}\n\n`);
                        }
                        const endTime = Date.now();
                        logger.info(`流式响应完成，用时 ${endTime - startTime} 毫秒`);
                        res.write(`data: [DONE]\n\n`);
                        res.end();
                        return;
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        if (content) {
                            fullContent += content;
                            paragraphBuffer += content;
                            
                            // 遇到连续两个换行符时（段落分隔），发送完整的段落
                            if (paragraphBuffer.includes('\n\n')) {
                                const parts = paragraphBuffer.split('\n\n');
                                // 发送完整的段落（除了最后一个可能不完整的部分）
                                for (let i = 0; i < parts.length - 1; i++) {
                                    res.write(`data: ${JSON.stringify({ content: parts[i] + '\n\n' })}\n\n`);
                                }
                                // 保留最后一个不完整的部分
                                paragraphBuffer = parts[parts.length - 1];
                            }
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
        });

        response.data.on('end', () => {
            if (!res.writableEnded) {
                const endTime = Date.now();
                logger.info(`流式响应结束，用时 ${endTime - startTime} 毫秒`);
                res.write(`data: [DONE]\n\n`);
                res.end();
            }
        });

        response.data.on('error', (error) => {
            const endTime = Date.now();
            logger.error(`流式响应错误，用时 ${endTime - startTime} 毫秒:`, error.message);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        });

    } catch (error) {
        const endTime = Date.now();
        logger.error(`API 请求失败，用时 ${endTime - startTime} 毫秒`);
        logger.error('错误详情:', error.message);
        if (error.response) {
            logger.error('API 响应状态:', error.response.status);
            logger.error('API 响应数据:', JSON.stringify(error.response.data));
        }
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: { message: error.message } });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
});

export default router;
