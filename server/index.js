/**
 * 匹配游戏 后端服务器
 * Express.js 入口文件
 */

// ==================== 时间格式化工具 ====================
function getTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

// 将时间戳工具添加到global以便其他模块使用
global.getTimestamp = getTimestamp;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 根据 NODE_ENV 加载对应的环境变量文件
// 优先级: .env.production > .env (生产环境)
//         .env > .env.development (开发环境)
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env';
dotenv.config({ path: join(__dirname, '..', envFile) });

// 路由统一入口
import apiRoutes from './routes/index.js';

// 中间件导入
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

// 数据库导入
import { initDatabase, closeDatabase } from './database/index.js';

// 配置导入（用于检查 serverState）
import config from './config/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件配置 ====================

// CORS 跨域配置
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // 测试模式：允许所有请求（方便调试）
        if (config.serverState === 'test') {
            return callback(null, true);
        }
        
        // 开发环境：允许所有请求
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // 生产环境：检查白名单
        if (!origin) return callback(null, true); // 允许无 origin 的请求
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 解析
app.use(express.json());

// URL 编码解析
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(requestLogger);

// ==================== API 路由 ====================

// 统一 API 路由
app.use('/api', apiRoutes);

// ==================== 静态文件服务 ====================

// 管理后台静态文件（开发和生产环境都可访问）
app.use('/admin', express.static(join(__dirname, '../web/backend')));

// 测试结果数据（开发环境）
app.use('/testResult', express.static(join(__dirname, '../testResult')));

// 前端静态文件（所有环境）- 构建输出在 web/client/dist
app.use(express.static(join(__dirname, '../web/client/dist')));

// 开发环境：服务 web/client 目录（用于测试页面）
if (process.env.NODE_ENV === 'development') {
    app.use(express.static(join(__dirname, '../web/client')));
}

// SPA 回退（排除 /api 和 /admin 路径）
app.get(/^(?!\/(api|admin|testResult)).*/, (req, res, next) => {
    const indexPath = join(__dirname, '../web/client/dist/index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            // 如果 dist/index.html 不存在，继续下一个处理器
            next();
        }
    });
});

// ==================== 错误处理 ====================

app.use(errorHandler);

// ==================== 启动服务器 ====================

// 异步启动函数
async function startServer() {
    try {
        // 初始化数据库
        await initDatabase();
        console.log(`[${getTimestamp()}] 📦 SQLite 数据库初始化成功`);

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[${getTimestamp()}] 🚀 匹配游戏 服务器启动成功`);
            console.log(`[${getTimestamp()}] 📍 地址: http://localhost:${PORT}`);
            console.log(`[${getTimestamp()}] 🔧 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`[${getTimestamp()}] 🛠️  后台管理: http://localhost:${PORT}/admin`);
        });
    } catch (error) {
        console.error(`[${getTimestamp()}] ❌ 服务器启动失败:`, error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGINT', () => {
    console.log(`\n[${getTimestamp()}] 🛑 正在关闭服务器...`);
    closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`\n[${getTimestamp()}] 🛑 收到 SIGTERM 信号，正在关闭服务器...`);
    closeDatabase();
    process.exit(0);
});

// 启动服务器
startServer();

export default app;
