/**
 * 用户路由
 */

import express from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { users, userPurchases } from '../services/dataStore.js';
import { getNowLocal } from '../database/index.js';

const router = express.Router();

/**
 * POST /api/user/check-permission
 * 用户权限验证（登录状态 + 服务购买状态）
 * 文档 3.1
 */
router.post('/check-permission', optionalAuth, asyncHandler(async (req, res) => {
    const { sessionId, testTypeId } = req.body;

    if (!testTypeId) {
        throw new AppError('缺少测试类型参数', 400, 'MISSING_TEST_TYPE');
    }

    // 未登录
    if (!req.user) {
        return res.json({
            code: 200,
            message: 'success',
            data: {
                hasAccess: false,
                needsLogin: true,
                needsPurchase: false,
                testTypeId,
                userId: null,
                userInfo: null
            }
        });
    }

    const user = users.get(req.user.phone);
    if (!user) {
        return res.json({
            code: 200,
            message: 'success',
            data: {
                hasAccess: false,
                needsLogin: true,
                needsPurchase: false,
                testTypeId,
                userId: null,
                userInfo: null
            }
        });
    }

    // 检查是否有免费次数（credits > 0 也算有权限）
    const hasCredits = (user.credits || 0) > 0;

    // 检查购买记录
    const purchaseKey = `${user.id}_${testTypeId}`;
    const purchase = userPurchases.get(purchaseKey);
    const hasPurchase = purchase && purchase.isActive && purchase.paymentStatus === 1;

    const hasAccess = hasCredits || hasPurchase;

    res.json({
        code: 200,
        message: 'success',
        data: {
            hasAccess,
            needsLogin: false,
            needsPurchase: !hasAccess,
            testTypeId,
            userId: user.id,
            userInfo: {
                phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
                nickname: user.nickname
            }
        }
    });
}));

/**
 * PUT /api/user/profile
 * 更新用户资料
 */
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
    const { nickname, avatar, gender, birthDate } = req.body;

    const user = users.get(req.user.phone);

    if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    // 更新字段
    if (nickname !== undefined) {
        if (nickname.length > 20) {
            throw new AppError('昵称不能超过20个字符', 400, 'NICKNAME_TOO_LONG');
        }
        user.nickname = nickname;
    }

    if (avatar !== undefined) {
        user.avatar = avatar;
    }

    if (gender !== undefined) {
        user.gender = gender;
    }

    if (birthDate !== undefined) {
        user.birthDate = birthDate;
    }

    user.updatedAt = getNowLocal();
    users.set(req.user.phone, user);

    res.json({
        success: true,
        message: '资料更新成功',
        data: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            gender: user.gender,
            birthDate: user.birthDate
        }
    });
}));

/**
 * GET /api/user/invite
 * 获取邀请信息
 */
router.get('/invite', authenticate, asyncHandler(async (req, res) => {
    const user = users.get(req.user.phone);

    if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    // 统计邀请人数
    let inviteCount = 0;
    users.forEach(u => {
        if (u.invitedBy === user.inviteCode) {
            inviteCount++;
        }
    });

    res.json({
        success: true,
        data: {
            inviteCode: user.inviteCode,
            inviteCount,
            inviteReward: inviteCount * 1, // 每邀请1人奖励1次免费测试
            inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?invite=${user.inviteCode}`
        }
    });
}));

/**
 * POST /api/user/invite/apply
 * 使用邀请码
 */
router.post('/invite/apply', authenticate, asyncHandler(async (req, res) => {
    const { inviteCode } = req.body;

    if (!inviteCode) {
        throw new AppError('请输入邀请码', 400, 'MISSING_INVITE_CODE');
    }

    const user = users.get(req.user.phone);

    if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    if (user.invitedBy) {
        throw new AppError('您已使用过邀请码', 400, 'ALREADY_INVITED');
    }

    // 查找邀请人
    let inviter = null;
    users.forEach(u => {
        if (u.inviteCode === inviteCode.toUpperCase()) {
            inviter = u;
        }
    });

    if (!inviter) {
        throw new AppError('邀请码无效', 400, 'INVALID_INVITE_CODE');
    }

    if (inviter.id === user.id) {
        throw new AppError('不能使用自己的邀请码', 400, 'SELF_INVITE');
    }

    // 建立邀请关系
    user.invitedBy = inviteCode.toUpperCase();
    users.set(req.user.phone, user);

    // 给邀请人增加奖励
    inviter.credits = (inviter.credits || 0) + 1;
    users.set(inviter.phone, inviter);

    // 给当前用户也加奖励
    user.credits = (user.credits || 0) + 1;
    users.set(req.user.phone, user);

    res.json({
        success: true,
        message: '邀请码使用成功，你和邀请人各获得1次免费测试'
    });
}));

/**
 * GET /api/user/credits
 * 获取用户积分/免费次数
 */
router.get('/credits', authenticate, asyncHandler(async (req, res) => {
    const user = users.get(req.user.phone);

    if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    res.json({
        success: true,
        data: {
            credits: user.credits || 0,
            testCount: user.testCount || 0
        }
    });
}));

export default router;
