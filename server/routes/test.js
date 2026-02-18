/**
 * 测试记录路由
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { tests, users } from '../services/dataStore.js';
import { getNowLocal } from '../database/index.js';

const router = express.Router();

/**
 * POST /api/test/create
 * 创建测试记录
 */
router.post('/create', optionalAuth, asyncHandler(async (req, res) => {
    const { type, method, personA, personB, hexagram } = req.body;

    if (!type || !method) {
        throw new AppError('缺少必要参数', 400, 'MISSING_FIELDS');
    }

    const test = {
        id: uuidv4(),
        userId: req.user?.userId || null,
        type,
        method,
        personA: personA || null,
        personB: personB || null,
        hexagram: hexagram || null,
        status: 'pending', // pending, analyzing, completed, paid
        result: null,
        createdAt: getNowLocal(),
        completedAt: null
    };

    tests.set(test.id, test);

    res.json({
        success: true,
        data: {
            testId: test.id,
            status: test.status
        }
    });
}));

/**
 * GET /api/test/:id
 * 获取测试详情
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const test = tests.get(id);

    if (!test) {
        throw new AppError('测试记录不存在', 404, 'TEST_NOT_FOUND');
    }

    // 如果是其他用户的测试，隐藏敏感信息
    if (test.userId && test.userId !== req.user?.userId) {
        throw new AppError('无权查看此测试', 403, 'FORBIDDEN');
    }

    res.json({
        success: true,
        data: test
    });
}));

/**
 * GET /api/test/history
 * 获取用户测试历史
 */
router.get('/user/history', authenticate, asyncHandler(async (req, res) => {
    const userTests = [];

    tests.forEach((test, id) => {
        if (test.userId === req.user.userId) {
            userTests.push({
                id: test.id,
                type: test.type,
                method: test.method,
                status: test.status,
                createdAt: test.createdAt,
                result: test.status === 'completed' ? {
                    score: test.result?.score
                } : null
            });
        }
    });

    // 按时间倒序
    userTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        success: true,
        data: {
            tests: userTests,
            total: userTests.length
        }
    });
}));

/**
 * POST /api/test/:id/complete
 * 完成测试（内部使用）
 */
router.post('/:id/complete', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { result } = req.body;

    const test = tests.get(id);

    if (!test) {
        throw new AppError('测试记录不存在', 404, 'TEST_NOT_FOUND');
    }

    test.status = 'completed';
    test.result = result;
    test.completedAt = getNowLocal();

    tests.set(id, test);

    // 更新用户测试次数
    if (test.userId) {
        const allUsers = users.values();
        const user = allUsers.find(u => u.id === test.userId);
        if (user) {
            user.testCount = (user.testCount || 0) + 1;
            users.set(user.phone, user);
        }
    }

    res.json({
        success: true,
        data: test
    });
}));

export default router;
