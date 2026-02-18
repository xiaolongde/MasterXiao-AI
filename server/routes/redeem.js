/**
 * 兑换码路由
 */
import express from 'express';
import { RedeemCode } from '../database/models/index.js';
import { saveDatabase } from '../database/index.js';

const router = express.Router();

/**
 * 验证兑换码
 * POST /api/redeem/verify
 * Body: { code: string }
 */
router.post('/verify', (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: '请提供兑换码'
            });
        }

        const result = RedeemCode.verify(code);

        res.json({
            success: result.valid,
            message: result.message,
            data: result.data || null
        });
    } catch (error) {
        console.error('验证兑换码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 使用兑换码
 * POST /api/redeem/use
 * Body: { code: string }
 */
router.post('/use', (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: '请提供兑换码'
            });
        }

        // 先验证
        const verifyResult = RedeemCode.verify(code);
        if (!verifyResult.valid) {
            return res.json({
                success: false,
                message: verifyResult.message
            });
        }

        // 使用兑换码
        const used = RedeemCode.use(code);
        if (used) {
            saveDatabase();
            res.json({
                success: true,
                message: '兑换码使用成功'
            });
        } else {
            res.json({
                success: false,
                message: '兑换码使用失败'
            });
        }
    } catch (error) {
        console.error('使用兑换码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 获取兑换码列表（管理员）
 * GET /api/redeem/list
 */
router.get('/list', (req, res) => {
    try {
        const { status, source, limit = 100, offset = 0 } = req.query;
        const codes = RedeemCode.findAll({
            status,
            source,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: codes
        });
    } catch (error) {
        console.error('获取兑换码列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 创建单个兑换码（管理员）
 * POST /api/redeem/create
 */
router.post('/create', (req, res) => {
    try {
        const { code, type, max_uses, expires_at, source, remark } = req.body;

        // 如果没有提供code，自动生成
        const finalCode = code || RedeemCode.generateCode('XHS');

        // 检查是否已存在
        if (RedeemCode.findByCode(finalCode)) {
            return res.status(400).json({
                success: false,
                message: '兑换码已存在'
            });
        }

        const created = RedeemCode.create({
            code: finalCode,
            type: type || 'single',
            max_uses: max_uses || 1,
            expires_at,
            source: source || 'admin',
            remark
        });

        saveDatabase();

        res.json({
            success: true,
            message: '创建成功',
            data: created
        });
    } catch (error) {
        console.error('创建兑换码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 批量创建兑换码（管理员）
 * POST /api/redeem/batch-create
 */
router.post('/batch-create', (req, res) => {
    try {
        const { count = 10, type, max_uses, expires_at, source, prefix } = req.body;

        if (count > 1000) {
            return res.status(400).json({
                success: false,
                message: '单次最多创建1000个兑换码'
            });
        }

        const codes = RedeemCode.createBatch(count, {
            type: type || 'single',
            max_uses: max_uses || 1,
            expires_at,
            source: source || 'xhs',
            prefix: prefix || 'XHS'
        });

        saveDatabase();

        res.json({
            success: true,
            message: `成功创建 ${codes.length} 个兑换码`,
            data: codes
        });
    } catch (error) {
        console.error('批量创建兑换码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 删除兑换码（管理员）
 * DELETE /api/redeem/:id
 */
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        RedeemCode.delete(parseInt(id));
        saveDatabase();

        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('删除兑换码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 更新兑换码状态（管理员）
 * PUT /api/redeem/:id/status
 */
router.put('/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'disabled', 'expired', 'used'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值'
            });
        }

        RedeemCode.updateStatus(parseInt(id), status);
        saveDatabase();

        res.json({
            success: true,
            message: '状态更新成功'
        });
    } catch (error) {
        console.error('更新兑换码状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

export default router;
