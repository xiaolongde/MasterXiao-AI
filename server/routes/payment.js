/**
 * 支付路由
 * 处理下单、支付和核销
 * 订单写入数据库（client_orders 表），订单ID使用 uuid.v4 保证唯一
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import { orders, users } from '../services/dataStore.js';
import { generateQRCode, generateRedeemCode } from '../services/paymentService.js';
import { getNowLocal } from '../database/index.js';

const router = express.Router();

// 商品价格配置
const PRODUCTS = {
    'test-basic': { price: 19.9, name: '基础测试', credits: 1 },
    'test-standard': { price: 19.9, name: '标准测试', credits: 1 },
    'test-premium': { price: 49.9, name: '高级测试', credits: 3 },
    'credits-5': { price: 88, name: '5次测试包', credits: 5 },
    'credits-10': { price: 168, name: '10次测试包', credits: 10 }
};

/**
 * POST /api/payment/create-order
 * 创建预订单并生成支付二维码
 * 订单ID使用 uuid.v4，初始状态为 paying（支付中）
 */
router.post('/create-order', optionalAuth, asyncHandler(async (req, res) => {
    const { productId, paymentMethod, testType } = req.body;

    if (!productId || !paymentMethod) {
        throw new AppError('缺少必要参数', 400, 'MISSING_FIELDS');
    }

    if (paymentMethod !== 'alipay') {
        throw new AppError('目前仅支持支付宝支付', 400, 'INVALID_PAYMENT_METHOD');
    }

    const product = PRODUCTS[productId];
    if (!product) {
        throw new AppError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
    }

    // 使用 uuid.v4 生成唯一订单ID
    const orderId = uuidv4();

    // 30分钟后过期
    const expiresAt = (() => {
        const d = new Date(Date.now() + 30 * 60 * 1000 + 8 * 60 * 60 * 1000);
        return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    })();

    // 创建预订单，初始状态为 paying（支付中）
    const order = {
        id: orderId,
        userId: req.user?.userId || null,
        productId,
        productName: product.name,
        amount: product.price,
        credits: product.credits,
        paymentMethod,
        testType: testType || null,
        status: 'paying',  // 初始状态：支付中
        redeemCode: null,
        paymentId: null,
        createdAt: getNowLocal(),
        paidAt: null,
        redeemedAt: null,
        expiresAt
    };

    // 写入数据库
    orders.set(orderId, order);

    console.log(`[${global.getTimestamp()}] 📝 创建预订单: ${orderId}, 商品: ${product.name}, 金额: ¥${product.price}, 状态: paying`);

    // 生成支付二维码
    let qrCodeData = null;
    try {
        qrCodeData = await generateQRCode({
            orderId,
            amount: product.price,
            productName: product.name,
            paymentMethod
        });
    } catch (err) {
        console.warn(`[${global.getTimestamp()}] ⚠️ 生成二维码失败: ${err.message}`);
    }

    res.json({
        success: true,
        data: {
            orderId,
            amount: product.price,
            productName: product.name,
            paymentMethod,
            status: 'paying',
            qrCode: qrCodeData?.qrCode || null,
            paymentUrl: qrCodeData?.paymentUrl || null,
            expiresAt: order.expiresAt
        }
    });
}));

/**
 * GET /api/payment/order/:orderId
 * 查询订单状态
 * 支持轮询，会自动检测过期订单
 */
router.get('/order/:orderId', optionalAuth, asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = orders.get(orderId);

    if (!order) {
        throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    // 自动检测订单是否过期（仅对 paying 状态的订单）
    if (order.status === 'paying' && order.expiresAt) {
        const now = getNowLocal();
        if (now > order.expiresAt) {
            order.status = 'expired';
            orders.set(orderId, order);
            console.log(`[${global.getTimestamp()}] ⏰ 订单 ${orderId} 已过期`);
        }
    }

    res.json({
        success: true,
        data: {
            orderId: order.id,
            status: order.status,
            amount: order.amount,
            productName: order.productName,
            paymentMethod: order.paymentMethod,
            redeemCode: order.status === 'paid' ? order.redeemCode : null,
            createdAt: order.createdAt,
            paidAt: order.paidAt,
            expiresAt: order.expiresAt
        }
    });
}));

/**
 * POST /api/payment/notify
 * 支付回调通知（支付宝/微信）
 * 实际生产环境需要验签
 */
router.post('/notify', asyncHandler(async (req, res) => {
    const { orderId, paymentId, status } = req.body;

    console.log(`[${global.getTimestamp()}] 📥 收到支付回调:`, { orderId, paymentId, status });

    const order = orders.get(orderId);

    if (!order) {
        return res.send('FAIL');
    }

    if (order.status !== 'paying') {
        return res.send('SUCCESS'); // 已处理过或非支付中状态
    }

    if (status === 'success') {
        // 更新订单状态
        order.status = 'paid';
        order.paidAt = getNowLocal();
        order.paymentId = paymentId;

        // 生成核销码
        order.redeemCode = generateRedeemCode();

        orders.set(orderId, order);

        // 如果有关联用户，增加积分
        if (order.userId) {
            const allUsers = users.values();
            const user = allUsers.find(u => u.id === order.userId);
            if (user) {
                user.credits = (user.credits || 0) + order.credits;
                users.set(user.phone, user);
                console.log(`[${global.getTimestamp()}] ✅ 用户 ${user.phone} 增加 ${order.credits} 次测试机会`);
            }
        }

        console.log(`[${global.getTimestamp()}] ✅ 订单 ${orderId} 支付成功，核销码: ${order.redeemCode}`);
    }

    res.send('SUCCESS');
}));

/**
 * POST /api/payment/simulate-pay
 * 模拟支付（开发环境使用）
 */
router.post('/simulate-pay', asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (process.env.NODE_ENV === 'production') {
        throw new AppError('生产环境不支持模拟支付', 400, 'NOT_ALLOWED');
    }

    const order = orders.get(orderId);

    if (!order) {
        throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status !== 'paying') {
        throw new AppError('订单状态异常，当前状态: ' + order.status, 400, 'INVALID_ORDER_STATUS');
    }

    // 更新订单状态
    order.status = 'paid';
    order.paidAt = getNowLocal();
    order.paymentId = 'SIM_' + Date.now();

    // 生成核销码
    order.redeemCode = generateRedeemCode();

    orders.set(orderId, order);

    // 如果有关联用户，增加积分
    if (order.userId) {
        const allUsers = users.values();
        const user = allUsers.find(u => u.id === order.userId);
        if (user) {
            user.credits = (user.credits || 0) + order.credits;
            users.set(user.phone, user);
        }
    }

    console.log(`[${global.getTimestamp()}] ✅ 模拟支付成功，订单: ${orderId}，核销码: ${order.redeemCode}`);

    res.json({
        success: true,
        data: {
            orderId: order.id,
            status: order.status,
            redeemCode: order.redeemCode,
            paidAt: order.paidAt
        }
    });
}));

/**
 * POST /api/payment/redeem
 * 使用核销码
 */
router.post('/redeem', optionalAuth, asyncHandler(async (req, res) => {
    const { redeemCode } = req.body;

    if (!redeemCode) {
        throw new AppError('请输入核销码', 400, 'MISSING_REDEEM_CODE');
    }

    // 查找对应订单
    let targetOrder = null;
    orders.forEach(order => {
        if (order.redeemCode === redeemCode.toUpperCase() && order.status === 'paid') {
            targetOrder = order;
        }
    });

    if (!targetOrder) {
        throw new AppError('核销码无效或已使用', 400, 'INVALID_REDEEM_CODE');
    }

    // 标记为已核销
    targetOrder.status = 'redeemed';
    targetOrder.redeemedAt = getNowLocal();
    orders.set(targetOrder.id, targetOrder);

    res.json({
        success: true,
        message: '核销成功',
        data: {
            productName: targetOrder.productName,
            credits: targetOrder.credits
        }
    });
}));

/**
 * GET /api/payment/orders
 * 获取用户订单列表
 */
router.get('/orders', authenticate, asyncHandler(async (req, res) => {
    const userOrders = [];

    orders.forEach(order => {
        if (order.userId === req.user.userId) {
            userOrders.push({
                id: order.id,
                productName: order.productName,
                amount: order.amount,
                status: order.status,
                redeemCode: order.status === 'paid' ? order.redeemCode : null,
                createdAt: order.createdAt,
                paidAt: order.paidAt
            });
        }
    });

    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        success: true,
        data: {
            orders: userOrders,
            total: userOrders.length
        }
    });
}));

export default router;
