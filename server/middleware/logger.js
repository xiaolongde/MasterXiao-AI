/**
 * 请求日志中间件
 * 记录所有 API 请求的详细信息
 */

export function requestLogger(req, res, next) {
    const start = Date.now();
    
    // 获取客户端 IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // 请求开始日志（仅对 API 请求记录详情）
    if (req.originalUrl.startsWith('/api')) {
        console.log(`[${global.getTimestamp()}] 📥 ${req.method} ${req.originalUrl}`);
        console.log(`    └─ IP: ${ip}`);
        
        // 记录查询参数
        if (Object.keys(req.query).length > 0) {
            console.log(`    └─ Query: ${JSON.stringify(req.query)}`);
        }
        
        // 记录请求体（排除敏感信息）
        if (req.body && Object.keys(req.body).length > 0) {
            const safeBody = { ...req.body };
            // 隐藏敏感字段
            if (safeBody.password) safeBody.password = '***';
            if (safeBody.token) safeBody.token = '***';
            if (safeBody.code) safeBody.code = '***';
            console.log(`    └─ Body: ${JSON.stringify(safeBody)}`);
        }
    }

    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusEmoji = res.statusCode >= 500 ? '❌' : res.statusCode >= 400 ? '⚠️' : '✅';
        const log = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

        console.log(`[${global.getTimestamp()}] ${statusEmoji} ${log}`);
    });

    next();
}

export default requestLogger;
