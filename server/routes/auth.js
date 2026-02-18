/**
 * 用户认证路由
 * 按照《注册登录文档》设计实现
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { users, verificationCodes, smsRateLimit } from '../services/dataStore.js';
import { SessionMatchRecord } from '../database/models/index.js';
import { getNowLocal } from '../database/index.js';

const router = express.Router();

/**
 * POST /api/auth/send-sms
 * 发送短信验证码
 * 文档 3.4
 */
router.post('/send-sms', asyncHandler(async (req, res) => {
    const { phone, type = 'login' } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        throw new AppError('请输入有效的手机号', 400, 'INVALID_PHONE');
    }

    if (!['register', 'login', 'reset'].includes(type)) {
        throw new AppError('无效的验证码类型', 400, 'INVALID_TYPE');
    }

    // 频率限制：60秒内只能发送1次，每天最多5次
    const rateKey = phone;
    const rateData = smsRateLimit.get(rateKey) || { count: 0, lastSentAt: 0, dailyCount: 0, dailyResetAt: 0 };
    const now = Date.now();

    // 重置每日计数
    if (now - rateData.dailyResetAt > 24 * 60 * 60 * 1000) {
        rateData.dailyCount = 0;
        rateData.dailyResetAt = now;
    }

    // 60秒频率限制
    if (now - rateData.lastSentAt < 60 * 1000) {
        const wait = Math.ceil((60 * 1000 - (now - rateData.lastSentAt)) / 1000);
        throw new AppError(`请${wait}秒后再试`, 429, 'RATE_LIMITED');
    }

    // 每日次数限制
    if (rateData.dailyCount >= 5) {
        throw new AppError('今日验证码发送次数已达上限', 429, 'DAILY_LIMIT');
    }

    // 注册类型检查：手机号已注册则提示
    if (type === 'register' && users.has(phone)) {
        throw new AppError('该手机号已注册，请直接登录', 400, 'PHONE_EXISTS');
    }

    // 生成6位验证码（固定为 123456，接入短信服务商后改回随机）
    const code = '123456';

    // 存储验证码（5分钟有效）
    verificationCodes.set(`${phone}_${type}`, {
        code,
        type,
        expires: now + 5 * 60 * 1000,
        attempts: 0,
        used: false
    });

    // 更新频率限制
    rateData.lastSentAt = now;
    rateData.dailyCount++;
    smsRateLimit.set(rateKey, rateData);

    // TODO: 实际发送短信（接入短信服务商）
    console.log(`[${global.getTimestamp()}] 📱 验证码发送到 ${phone}: ${code} (类型: ${type})`);

    res.json({
        success: true,
        message: '验证码已发送',
        code
    });
}));

// 兼容旧接口 POST /api/auth/send-code
router.post('/send-code', asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        throw new AppError('请输入有效的手机号', 400, 'INVALID_PHONE');
    }

    const code = '123456';

    verificationCodes.set(`${phone}_login`, {
        code,
        type: 'login',
        expires: Date.now() + 5 * 60 * 1000,
        attempts: 0,
        used: false
    });

    console.log(`[${global.getTimestamp()}] 📱 验证码发送到 ${phone}: ${code}`);

    res.json({
        success: true,
        message: '验证码已发送',
        code
    });
}));

/**
 * 验证短信验证码（内部方法）
 */
function verifySmsCode(phone, code, type) {
    const key = `${phone}_${type}`;
    const stored = verificationCodes.get(key);

    if (!stored) {
        // 兼容旧格式 key
        const oldStored = verificationCodes.get(phone);
        if (oldStored && oldStored.code === code && Date.now() <= oldStored.expires) {
            verificationCodes.delete(phone);
            return true;
        }
        throw new AppError('验证码错误', 400, 'INVALID_CODE');
    }

    if (stored.used) {
        throw new AppError('验证码已使用', 400, 'CODE_USED');
    }

    if (Date.now() > stored.expires) {
        verificationCodes.delete(key);
        throw new AppError('验证码已过期，请重新获取', 400, 'CODE_EXPIRED');
    }

    stored.attempts++;
    if (stored.attempts > 5) {
        verificationCodes.delete(key);
        throw new AppError('验证码错误次数过多，请重新获取', 400, 'TOO_MANY_ATTEMPTS');
    }

    if (stored.code !== code) {
        // 回写 attempts 增加
        stored.used = false;
        verificationCodes.set(key, stored);
        throw new AppError('验证码错误', 400, 'INVALID_CODE');
    }

    // 标记已使用并删除
    verificationCodes.delete(key);
    return true;
}

/**
 * POST /api/auth/register
 * 用户注册
 * 文档 3.2
 */
router.post('/register', asyncHandler(async (req, res) => {
    const { phone, smsCode, password, inviteCode, sessionId } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        throw new AppError('请输入有效的手机号', 400, 'INVALID_PHONE');
    }

    if (!smsCode) {
        throw new AppError('请输入验证码', 400, 'MISSING_CODE');
    }

    // 检查手机号是否已注册
    if (users.has(phone)) {
        throw new AppError('该手机号已注册，请直接登录', 400, 'PHONE_EXISTS');
    }

    // 验证验证码
    verifySmsCode(phone, smsCode, 'register');

    // 创建用户
    const userId = uuidv4();
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const user = {
        id: userId,
        phone,
        passwordHash,
        nickname: `用户${phone.slice(-4)}`,
        avatar: null,
        status: 1,
        registerSource: 'web',
        registerSessionId: sessionId || null,
        createdAt: getNowLocal(),
        updatedAt: getNowLocal(),
        lastLoginTime: getNowLocal(),
        testCount: 0,
        inviteCode: generateInviteCode(),
        invitedBy: null,
        credits: 1 // 新用户赠送1次免费测试
    };

    // 处理邀请码
    if (inviteCode) {
        let inviter = null;
        users.forEach(u => {
            if (u.inviteCode === inviteCode.toUpperCase()) {
                inviter = u;
            }
        });
        if (inviter) {
            user.invitedBy = inviteCode.toUpperCase();
            inviter.credits = (inviter.credits || 0) + 1;
            user.credits = (user.credits || 0) + 1;
            // 回写邀请人的积分变更
            users.set(inviter.phone, inviter);
        }
    }

    users.set(phone, user);
    console.log(`[${global.getTimestamp()}] 🎉 新用户注册: ${phone}`);

    // 用 sessionId 批量更新匹配记录表中 user_id 为空的记录，关联到新用户
    if (sessionId) {
        try {
            SessionMatchRecord.batchUpdateUserIdBySession(sessionId, userId);
            console.log(`[${global.getTimestamp()}] 📝 已将 sessionId=${sessionId} 的匹配记录关联到用户 ${userId}`);
        } catch (err) {
            console.error(`[${global.getTimestamp()}] 批量更新匹配记录 userId 失败:`, err.message);
        }
    }

    // 生成 JWT
    const token = generateToken({
        userId: user.id,
        phone: user.phone
    });

    const expiresIn = 7 * 24 * 60 * 60; // 7天

    // 注册后生成新的 sessionId 返回给前端
    const newSessionId = uuidv4();

    res.json({
        code: 200,
        message: '注册成功',
        success: true,
        data: {
            userId: user.id,
            token,
            expiresIn,
            sessionId: newSessionId,
            userInfo: {
                phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
                nickname: user.nickname,
                avatar: user.avatar
            },
            user: {
                id: user.id,
                phone: user.phone,
                nickname: user.nickname,
                avatar: user.avatar,
                credits: user.credits
            }
        }
    });
}));

/**
 * POST /api/auth/quick-login
 * 手机号快速登录（未注册自动注册）
 * 用户输入手机号，验证码可选，直接登录
 */
router.post('/quick-login', asyncHandler(async (req, res) => {
    const { phone, smsCode, sessionId } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        throw new AppError('请输入有效的手机号', 400, 'INVALID_PHONE');
    }

    // 如果传了验证码则验证（可选）
    if (smsCode) {
        try {
            verifySmsCode(phone, smsCode, 'login');
        } catch (e) {
            // 也尝试兼容 register 类型
            try {
                verifySmsCode(phone, smsCode, 'register');
            } catch (e2) {
                throw new AppError('验证码错误', 400, 'INVALID_CODE');
            }
        }
    }

    let user = users.get(phone);
    let isNewUser = false;

    if (!user) {
        // 未注册 -> 自动注册
        isNewUser = true;
        user = {
            id: uuidv4(),
            phone,
            passwordHash: null,
            nickname: `用户${phone.slice(-4)}`,
            avatar: null,
            status: 1,
            registerSource: 'web',
            registerSessionId: sessionId || null,
            createdAt: getNowLocal(),
            updatedAt: getNowLocal(),
            lastLoginTime: getNowLocal(),
            testCount: 0,
            inviteCode: generateInviteCode(),
            invitedBy: null,
            credits: 1 // 新用户赠送1次免费测试
        };
        users.set(phone, user);
        console.log(`[${global.getTimestamp()}] 🎉 新用户快速登录注册: ${phone}`);

        // 关联 sessionId 的匹配记录
        if (sessionId) {
            try {
                SessionMatchRecord.batchUpdateUserIdBySession(sessionId, user.id);
                console.log(`[${global.getTimestamp()}] 📝 已将 sessionId=${sessionId} 的匹配记录关联到用户 ${user.id}`);
            } catch (err) {
                console.error(`[${global.getTimestamp()}] 批量更新匹配记录 userId 失败:`, err.message);
            }
        }
    } else {
        // 已注册用户检查状态
        if (user.status === 0) {
            throw new AppError('该账号已被禁用', 403, 'ACCOUNT_DISABLED');
        }
        user.lastLoginTime = getNowLocal();
        users.set(phone, user);
    }

    // 生成 JWT
    const token = generateToken({
        userId: user.id,
        phone: user.phone
    });

    const expiresIn = 7 * 24 * 60 * 60; // 7天

    // 新用户注册后生成新的 sessionId 返回给前端更新本地会话
    const newSessionId = isNewUser ? uuidv4() : undefined;

    res.json({
        success: true,
        code: 200,
        message: isNewUser ? '注册并登录成功' : '登录成功',
        data: {
            token,
            expiresIn,
            isNewUser,
            ...(newSessionId && { sessionId: newSessionId }),
            user: {
                id: user.id,
                phone: user.phone,
                nickname: user.nickname,
                avatar: user.avatar,
                credits: user.credits
            },
            userInfo: {
                phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
                nickname: user.nickname
            }
        }
    });
}));

/**
 * POST /api/auth/login
 * 用户登录（验证码或密码）
 * 文档 3.3
 */
router.post('/login', asyncHandler(async (req, res) => {
    const { phone, code, smsCode, password, rememberMe, sessionId } = req.body;

    if (!phone) {
        throw new AppError('请输入手机号', 400, 'MISSING_PHONE');
    }

    const verifyCode = code || smsCode; // 兼容两种字段名

    if (!verifyCode && !password) {
        throw new AppError('请输入验证码或密码', 400, 'MISSING_CREDENTIALS');
    }

    // 验证码登录
    if (verifyCode) {
        verifySmsCode(phone, verifyCode, 'login');
    }
    // 密码登录
    else if (password) {
        const existingUser = users.get(phone);
        if (!existingUser) {
            throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
        }
        if (!existingUser.passwordHash) {
            throw new AppError('该账号未设置密码，请使用验证码登录', 400, 'NO_PASSWORD');
        }
        const isValid = await bcrypt.compare(password, existingUser.passwordHash);
        if (!isValid) {
            throw new AppError('密码错误', 400, 'WRONG_PASSWORD');
        }
    }

    // 查找或创建用户（验证码登录时自动注册）
    let user = users.get(phone);
    let isNewUser = false;

    if (!user) {
        // 新用户 - 自动注册
        isNewUser = true;
        user = {
            id: uuidv4(),
            phone,
            passwordHash: null,
            nickname: `用户${phone.slice(-4)}`,
            avatar: null,
            status: 1,
            registerSource: 'web',
            registerSessionId: sessionId || null,
            createdAt: getNowLocal(),
            updatedAt: getNowLocal(),
            lastLoginTime: getNowLocal(),
            testCount: 0,
            inviteCode: generateInviteCode(),
            invitedBy: null,
            credits: 1
        };
        users.set(phone, user);
        console.log(`[${global.getTimestamp()}] 🎉 新用户注册(登录自动创建): ${phone}`);

        // 关联旧 sessionId 的匹配记录到新用户
        if (sessionId) {
            try {
                SessionMatchRecord.batchUpdateUserIdBySession(sessionId, user.id);
                console.log(`[${global.getTimestamp()}] 📝 已将 sessionId=${sessionId} 的匹配记录关联到用户 ${user.id}`);
            } catch (err) {
                console.error(`[${global.getTimestamp()}] 批量更新匹配记录 userId 失败:`, err.message);
            }
        }
    } else {
        user.lastLoginTime = getNowLocal();
        users.set(phone, user);
    }

    // 新用户注册后生成新的 sessionId 返回给前端
    const newSessionId = isNewUser ? uuidv4() : undefined;

    // 生成 JWT
    const expiresIn = rememberMe ? '30d' : '7d';
    const token = generateToken({
        userId: user.id,
        phone: user.phone
    }, expiresIn);

    res.json({
        success: true,
        code: 200,
        message: isNewUser ? '注册并登录成功' : '登录成功',
        data: {
            token,
            expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
            isNewUser,
            ...(newSessionId && { sessionId: newSessionId }),
            user: {
                id: user.id,
                phone: user.phone,
                nickname: user.nickname,
                avatar: user.avatar,
                credits: user.credits
            },
            userInfo: {
                phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
                nickname: user.nickname
            }
        }
    });
}));

/**
 * POST /api/auth/reset-password
 * 重置密码
 * 文档 3.5
 */
router.post('/reset-password', asyncHandler(async (req, res) => {
    const { phone, smsCode, newPassword, confirmPassword } = req.body;

    if (!phone || !smsCode || !newPassword || !confirmPassword) {
        throw new AppError('请填写完整信息', 400, 'MISSING_FIELDS');
    }

    if (newPassword !== confirmPassword) {
        throw new AppError('两次输入的密码不一致', 400, 'PASSWORD_MISMATCH');
    }

    if (newPassword.length < 6) {
        throw new AppError('密码长度不能少于6位', 400, 'PASSWORD_TOO_SHORT');
    }

    // 验证验证码
    verifySmsCode(phone, smsCode, 'reset');

    const user = users.get(phone);
    if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    // 更新密码
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.updatedAt = getNowLocal();
    users.set(phone, user);

    res.json({
        success: true,
        code: 200,
        message: '密码重置成功，请重新登录'
    });
}));

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
    const user = users.get(req.user.phone);

    if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    res.json({
        success: true,
        data: {
            id: user.id,
            phone: user.phone,
            nickname: user.nickname,
            avatar: user.avatar,
            credits: user.credits,
            testCount: user.testCount,
            inviteCode: user.inviteCode
        }
    });
}));

/**
 * 生成邀请码
 */
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default router;
