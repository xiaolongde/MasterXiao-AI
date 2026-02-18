/**
 * 匹配记录路由
 * 核销码兑换后的匹配记录管理接口
 */
import express from 'express';
import { SessionMatchRecord } from '../database/models/index.js';
import { saveDatabase } from '../database/index.js';

const router = express.Router();

/**
 * 创建匹配记录
 * POST /api/match/record/create
 * Body: { sessionId: string, reqData: object, userId?: string }
 * 
 * 响应: { code: 200, message: 'success', data: { recordId, sessionId } }
 */
router.post('/create', (req, res) => {
    try {
        const { sessionId, reqData, userId, method, type } = req.body;

        // 参数校验
        if (!sessionId) {
            return res.status(400).json({
                code: 40001,
                message: 'SessionId 不能为空',
                data: null
            });
        }

        // 校验 sessionId 格式（至少16个字符）
        if (typeof sessionId !== 'string' || sessionId.length < 16) {
            return res.status(400).json({
                code: 40001,
                message: 'SessionId 格式错误',
                data: null
            });
        }

        if (!reqData) {
            return res.status(400).json({
                code: 400,
                message: '请求数据不能为空',
                data: null
            });
        }

        // 创建新记录
        const record = SessionMatchRecord.create({
            sessionId,
            reqData,
            userId: userId || null,
            method: method || null,
            type: type || null
        });

        saveDatabase();

        res.json({
            code: 200,
            message: 'success',
            data: {
                recordId: record.id,
                sessionId: record.sessionId
            }
        });
    } catch (error) {
        console.error('创建匹配记录失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误: ' + error.message,
            data: null
        });
    }
});

/**
 * 更新匹配记录状态
 * PUT /api/match/record/update-status
 * Body: { sessionId: string, status: number (1 or 2), resultData?: object }
 */
router.put('/update-status', (req, res) => {
    try {
        const { sessionId, status, userId, resultData } = req.body;

        // 参数校验
        if (!sessionId) {
            return res.status(400).json({
                code: 400,
                message: 'SessionId 不能为空',
                data: null
            });
        }

        if (![1, 2].includes(status)) {
            return res.status(400).json({
                code: 400,
                message: '状态值无效，只能为 1（成功）或 2（失败）',
                data: null
            });
        }

        const { id: recordId } = req.body;

        // 检查记录是否存在
        const existing = recordId
            ? SessionMatchRecord.findById(parseInt(recordId))
            : SessionMatchRecord.findBySessionId(sessionId);
        if (!existing) {
            return res.status(404).json({
                code: 404,
                message: '匹配记录不存在',
                data: null
            });
        }
        //检查用户ID是否存在
        if (userId) {
            const userIdExists = SessionMatchRecord.findByUserId(userId);
            if (!userIdExists) {
                return res.status(404).json({
                    code: 404,
                    message: '用户ID不存在',
                    data: null
                });
            }
        }

        // 更新状态
        const updated = SessionMatchRecord.updateStatus(sessionId, status, userId || null, resultData || null, recordId ? parseInt(recordId) : null);

        if (updated) {
            saveDatabase();
            res.json({
                code: 200,
                message: 'success',
                data: {
                    sessionId,
                    status,
                    userId
                }
            });
        } else {
            res.status(500).json({
                code: 500,
                message: '更新失败',
                data: null
            });
        }
    } catch (error) {
        console.error('更新匹配记录状态失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误: ' + error.message,
            data: null
        });
    }
});

/**
 * 查询匹配记录状态
 * GET /api/match/record/status?sessionId=xxx
 */
router.get('/status', (req, res) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({
                code: 400,
                message: 'SessionId 不能为空',
                data: null
            });
        }

        const statusData = SessionMatchRecord.getStatus(sessionId);

        if (!statusData) {
            return res.status(404).json({
                code: 404,
                message: '匹配记录不存在',
                data: null
            });
        }

        res.json({
            code: 200,
            message: 'success',
            data: {
                sessionId: statusData.session_id,
                status: statusData.status,
                updateDate: statusData.update_date
            }
        });
    } catch (error) {
        console.error('查询匹配记录状态失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误',
            data: null
        });
    }
});

/**
 * 查询匹配记录详情
 * GET /api/match/record/detail?sessionId=xxx
 */
router.get('/detail', (req, res) => {
    try {
        const { sessionId, id } = req.query;

        if (!sessionId) {
            return res.status(400).json({
                code: 400,
                message: 'SessionId 不能为空',
                data: null
            });
        }

        const record = SessionMatchRecord.getDetail(sessionId, id ? parseInt(id) : null);

        if (!record) {
            return res.status(404).json({
                code: 404,
                message: '匹配记录不存在',
                data: null
            });
        }

        res.json({
            code: 200,
            message: 'success',
            data: {
                id: record.id,
                sessionId: record.session_id,
                userId: record.user_id,
                status: record.status,
                method: record.method,
                type: record.type,
                reqData: record.req_data,
                resultData: record.result_data,
                createDate: record.create_date,
                updateDate: record.update_date
            }
        });
    } catch (error) {
        console.error('查询匹配记录详情失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误',
            data: null
        });
    }
});

export default router;
