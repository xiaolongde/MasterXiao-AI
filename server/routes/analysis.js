/**
 * AI 分析路由
 */

import express from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';
import { tests } from '../services/dataStore.js';
import { analyzeBirthday, analyzeHexagram } from '../services/aiService.js';
import { getNowLocal } from '../database/index.js';

const router = express.Router();

/**
 * POST /api/analysis/birthday
 * 生日匹配分析
 */
router.post('/birthday', optionalAuth, asyncHandler(async (req, res) => {
    const { testId, personA, personB, matchType } = req.body;

    if (!personA || !personB) {
        throw new AppError('请提供双方信息', 400, 'MISSING_FIELDS');
    }

    if (!personA.birthDate || !personB.birthDate) {
        throw new AppError('请提供双方生日', 400, 'MISSING_BIRTHDATE');
    }

    // 执行分析
    const result = await analyzeBirthday(personA, personB, matchType);

    // 如果有测试ID，更新测试记录
    if (testId) {
        const test = tests.get(testId);
        if (test) {
            test.status = 'completed';
            test.result = result;
            test.completedAt = getNowLocal();
            tests.set(testId, test);
        }
    }

    res.json({
        success: true,
        data: result
    });
}));

/**
 * POST /api/analysis/hexagram
 * 卡牌符号分析
 */
router.post('/hexagram', optionalAuth, asyncHandler(async (req, res) => {
    const { testId, hexagram, matchType, question } = req.body;

    if (!hexagram) {
        throw new AppError('请提供符号信息', 400, 'MISSING_HEXAGRAM');
    }

    // 执行分析
    const result = await analyzeHexagram(hexagram, matchType, question);

    // 如果有测试ID，更新测试记录
    if (testId) {
        const test = tests.get(testId);
        if (test) {
            test.status = 'completed';
            test.result = result;
            test.completedAt = getNowLocal();
            tests.set(testId, test);
        }
    }

    res.json({
        success: true,
        data: result
    });
}));

/**
 * GET /api/analysis/result/:testId
 * 获取分析结果
 */
router.get('/result/:testId', optionalAuth, asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const test = tests.get(testId);

    if (!test) {
        throw new AppError('测试记录不存在', 404, 'TEST_NOT_FOUND');
    }

    if (test.status !== 'completed') {
        throw new AppError('分析尚未完成', 400, 'ANALYSIS_NOT_COMPLETE');
    }

    res.json({
        success: true,
        data: {
            testId: test.id,
            type: test.type,
            method: test.method,
            result: test.result,
            completedAt: test.completedAt
        }
    });
}));

export default router;
