/**
 * 塔罗牌路由
 * 处理塔罗牌相关接口
 */

import express from 'express';
import aiService from '../services/aiService.js';
import MatchRecord from '../database/models/MatchRecord.js';
import logger from '../utils/logger.js';
import { getNowLocal } from '../database/index.js';

const router = express.Router();

/**
 * POST /api/tarot/interpret
 * 塔罗牌解读接口
 * 
 * 请求体：
 * {
 *   question: string,          // 问题
 *   questionType: string,      // 问题类型（事业/感情/财运等）
 *   selectedCards: [           // 选中的6张牌
 *     { id: number, slot: number, label: string },
 *     ...
 *   ],
 *   userInfo: {                // 用户信息（可选）
 *     gender: string,
 *     birthDate: string
 *   }
 * }
 * 
 * 响应：
 * {
 *   success: true,
 *   data: {
 *     result: string,              // 完整解读结果
 *     professionalVersion: string, // 专业版解读
 *     simpleVersion: string,       // 通俗版解读
 *     aiPrompt: string,            // 使用的提示词
 *     recordId: string             // 保存的记录ID
 *   }
 * }
 */
router.post('/interpret', async (req, res) => {
    try {
        const { question, questionType, selectedCards, userInfo } = req.body;

        console.log('[塔罗解读API] 收到请求:', { question, questionType, cardsCount: selectedCards?.length });

        // 参数验证
        if (!question || !selectedCards || !Array.isArray(selectedCards) || selectedCards.length !== 6) {
            console.log('[塔罗解读API] 参数验证失败');
            return res.status(400).json({
                success: false,
                error: '参数错误：需要问题和6张塔罗牌'
            });
        }

        logger.info(`[塔罗解读] 开始解读，问题: ${question}`);

        // 调用AI服务进行解读
        console.log('[塔罗解读API] 调用 aiService.interpretTarot');
        const interpretResult = await aiService.interpretTarot({
            question,
            questionType: questionType || '综合',
            selectedCards,
            userInfo: userInfo || {}
        });

        console.log('[塔罗解读API] AI解读完成');

        // 保存解读记录到数据库
        const record = await MatchRecord.create({
            type: 'tarot',
            question,
            questionType: questionType || '综合',
            cardData: {
                selectedCards,
                slotLabels: ['目标', '动力', '障碍', '资源', '支持', '结果']
            },
            result: interpretResult.result,
            professionalVersion: interpretResult.professionalVersion,
            simpleVersion: interpretResult.simpleVersion,
            aiPrompt: interpretResult.aiPrompt,
            userInfo: userInfo || {},
            status: 'completed',
            createdAt: getNowLocal()
        });

        logger.info(`[塔罗解读] 解读完成，记录ID: ${record._id}`);

        const responseData = {
            success: true,
            data: {
                result: interpretResult.result,
                professionalVersion: interpretResult.professionalVersion,
                simpleVersion: interpretResult.simpleVersion,
                aiPrompt: interpretResult.aiPrompt,
                recordId: record._id
            }
        };

        console.log('[塔罗解读API] 返回响应');
        res.json(responseData);

    } catch (error) {
        console.error('[塔罗解读API] 错误:', error);
        logger.error(`[塔罗解读] 解读失败: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message || '解读失败，请稍后重试'
        });
    }
});

/**
 * GET /api/tarot/record/:id
 * 获取塔罗解读记录
 */
router.get('/record/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const record = await MatchRecord.findById(id);

        if (!record) {
            return res.status(404).json({
                success: false,
                error: '记录不存在'
            });
        }

        res.json({
            success: true,
            data: record
        });

    } catch (error) {
        logger.error(`[塔罗解读] 获取记录失败: ${error.message}`);
        res.status(500).json({
            success: false,
            error: '获取记录失败'
        });
    }
});

/**
 * GET /api/tarot/history
 * 获取用户的塔罗解读历史
 */
router.get('/history', async (req, res) => {
    try {
        const { userId, limit = 20, skip = 0 } = req.query;

        const query = { type: 'tarot' };
        if (userId) {
            query['userInfo.userId'] = userId;
        }

        const records = await MatchRecord.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .select('-aiPrompt'); // 不返回提示词，减少数据量

        const total = await MatchRecord.countDocuments(query);

        res.json({
            success: true,
            data: {
                records,
                total,
                hasMore: skip + records.length < total
            }
        });

    } catch (error) {
        logger.error(`[塔罗解读] 获取历史失败: ${error.message}`);
        res.status(500).json({
            success: false,
            error: '获取历史失败'
        });
    }
});

/**
 * POST /api/tarot/retry
 * 重新解读（基于已有记录）
 */
router.post('/retry', async (req, res) => {
    try {
        const { recordId } = req.body;

        if (!recordId) {
            return res.status(400).json({
                success: false,
                error: '缺少记录ID'
            });
        }

        const oldRecord = await MatchRecord.findById(recordId);
        if (!oldRecord) {
            return res.status(404).json({
                success: false,
                error: '记录不存在'
            });
        }

        logger.info(`[塔罗解读] 重新解读，原记录ID: ${recordId}`);

        // 使用原记录的数据重新解读
        const interpretResult = await aiService.interpretTarot({
            question: oldRecord.question,
            questionType: oldRecord.questionType,
            selectedCards: oldRecord.cardData.selectedCards,
            userInfo: oldRecord.userInfo
        });

        // 创建新记录
        const newRecord = await MatchRecord.create({
            type: 'tarot',
            question: oldRecord.question,
            questionType: oldRecord.questionType,
            cardData: oldRecord.cardData,
            result: interpretResult.result,
            professionalVersion: interpretResult.professionalVersion,
            simpleVersion: interpretResult.simpleVersion,
            aiPrompt: interpretResult.aiPrompt,
            userInfo: oldRecord.userInfo,
            status: 'completed',
            createdAt: getNowLocal(),
            isRetry: true,
            originalRecordId: recordId
        });

        logger.info(`[塔罗解读] 重新解读完成，新记录ID: ${newRecord._id}`);

        res.json({
            success: true,
            data: {
                result: interpretResult.result,
                professionalVersion: interpretResult.professionalVersion,
                simpleVersion: interpretResult.simpleVersion,
                aiPrompt: interpretResult.aiPrompt,
                recordId: newRecord._id
            }
        });

    } catch (error) {
        logger.error(`[塔罗解读] 重新解读失败: ${error.message}`);
        res.status(500).json({
            success: false,
            error: '重新解读失败'
        });
    }
});

export default router;
