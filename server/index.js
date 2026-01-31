/**
 * MasterXiao-AI 后端服务器
 * Express.js 入口文件
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 路由导入
import authRoutes from './routes/auth.js';
import testRoutes from './routes/test.js';
import analysisRoutes from './routes/analysis.js';
import verificationRoutes from './routes/verification.js';
import userRoutes from './routes/user.js';
import paymentRoutes from './routes/payment.js';

// 中间件导入
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件配置 ====================

// CORS 跨域配置
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// JSON 解析
app.use(express.json());

// URL 编码解析
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(requestLogger);

// ==================== API 路由 ====================

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 认证路由
app.use('/api/auth', authRoutes);

// 测试记录路由
app.use('/api/test', testRoutes);

// AI 分析路由
app.use('/api/analysis', analysisRoutes);

// 验证码路由
app.use('/api/verification', verificationRoutes);

// 用户路由
app.use('/api/user', userRoutes);

// 支付路由
app.use('/api/payment', paymentRoutes);

// ==================== 静态文件服务 ====================

// 生产环境下提供前端静态文件
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '../dist')));

    // SPA 回退
    app.get('*', (req, res) => {
        res.sendFile(join(__dirname, '../dist/index.html'));
    });
}

// ==================== 错误处理 ====================

app.use(errorHandler);

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
    console.log(`🚀 MasterXiao-AI 服务器启动成功`);
    console.log(`📍 地址: http://localhost:${PORT}`);
    console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
