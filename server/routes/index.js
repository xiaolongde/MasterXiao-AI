/**
 * 路由统一入口
 */

import express from 'express';

// 路由导入
import authRoutes from './auth.js';
import testRoutes from './test.js';
import analysisRoutes from './analysis.js';
import birthdayMatchRoutes from './birthdayMatch.js';
import verificationRoutes from './verification.js';
import userRoutes from './user.js';
import paymentRoutes from './payment.js';
import redeemRoutes from './redeem.js';

import matchRecordRoutes from './matchRecord.js';
import tarotRoutes from './tarot.js';
import divinationRoutes from './divination.js';
import adminRoutes from './admin.js';
import historyRoutes from './history.js';
import config from '../config/index.js';
import { getNowLocal } from '../database/index.js';
import { TopicCategory, Question, SystemConfig, XhsTopic, XhsMenu } from '../database/models/index.js';

const router = express.Router();

// 健康检查
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: getNowLocal(),
        version: '1.0.0'
    });
});

// 获取服务端配置（serverState）
router.get('/config/server-state', (req, res) => {
    res.json({
        success: true,
        data: {
            serverState: config.serverState || 'production'
        }
    });
});

// 公共接口：获取主题分类列表（客户端首页用，按序号排序，仅返回启用的）
router.get('/topic-categories', (req, res) => {
    try {
        const list = TopicCategory.findAllEnabled();
        res.json({ code: 200, data: list });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 公共接口：获取某分类下状态启用的题目列表（客户端主题详情页用）
// 同时返回系统配置"问题输入"的状态
router.get('/questions', (req, res) => {
    try {
        const { category } = req.query;
        const list = Question.findAll({ category, status: 1, limit: 100, offset: 0 });
        // 查询系统配置"问题输入"的状态
        const questionInputConfig = SystemConfig.findByName('问题输入');
        const questionInputEnabled = questionInputConfig ? !!questionInputConfig.status : false;
        res.json({ code: 200, data: { list, questionInputEnabled } });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 公共接口：根据名称获取系统配置状态
router.get('/system-configs/by-name/:name', (req, res) => {
    try {
        const config_item = SystemConfig.findByName(req.params.name);
        if (!config_item) return res.json({ code: 200, data: { exists: false, status: 0 } });
        res.json({ code: 200, data: { exists: true, status: config_item.status } });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 公共接口：获取小红书主题列表（显示状态的，联表获取主题分类名称）
router.get('/xhs-topics', (req, res) => {
    try {
        const list = XhsTopic.findAllVisible();
        res.json({ code: 200, data: list });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 公共接口：获取小红书菜单列表（显示状态）
router.get('/xhs-menus', (req, res) => {
    try {
        const list = XhsMenu.findAllVisible();
        res.json({ code: 200, data: list });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 认证路由
router.use('/auth', authRoutes);

// 测试记录路由
router.use('/test', testRoutes);

// AI 分析路由
// router.use('/analysis', analysisRoutes);

// Deepseek 生日匹配分析路由
router.use('/analysis', birthdayMatchRoutes);

// 验证码路由
router.use('/verification', verificationRoutes);

// 用户路由
router.use('/user', userRoutes);

// 支付路由
router.use('/payment', paymentRoutes);

// 兑换码路由
router.use('/redeem', redeemRoutes);

// 匹配记录路由（核销码兑换匹配流程）
router.use('/match/record', matchRecordRoutes);

// 历史记录路由
router.use('/history', historyRoutes);

// 塔罗牌路由
// router.use('/tarot', tarotRoutes);

// 六爻/卦象解读路由
router.use('/divination', divinationRoutes);

// 后台管理路由
router.use('/admin', adminRoutes);

export default router;
