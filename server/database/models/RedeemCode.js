/**
 * 兑换码模型
 */
import { queryAll, queryOne, execute } from '../index.js';

export const RedeemCode = {
    /**
     * 创建兑换码
     */
    create(codeData) {
        const {
            code, //兑换码
            type = 'single',  // single: 单次使用, multi: 多次使用
            max_uses = 1, //最大使用次数
            used_count = 0, //已使用次数
            expires_at = null, //过期时间
            status = 'active',  // active(可使用), busy(使用中)， used(已使用)， expired(已过期)， disabled(已禁用)
            source = 'admin',   // admin: 后台创建, xhs: 小红书
            remark = '' //备注
        } = codeData;

        const result = execute(
            `INSERT INTO redeem_codes (code, type, max_uses, used_count, expires_at, status, source, remark) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [code, type, max_uses, used_count, expires_at, status, source, remark]
        );

        return { id: result.lastInsertRowid, ...codeData };
    },

    /**
     * 根据兑换码查找
     */
    findByCode(code) {
        return queryOne('SELECT * FROM redeem_codes WHERE code = ?', [code]);
    },

    /**
     * 根据ID查找
     */
    findById(id) {
        return queryOne('SELECT * FROM redeem_codes WHERE id = ?', [id]);
    },

    /**
     * 验证兑换码
     * 返回: { valid: boolean, message: string, data?: object }
     */
    verify(code) {
        const record = this.findByCode(code);
        
        if (!record) {
            return { valid: false, message: '兑换码不存在' };
        }

        if (record.status === 'disabled') {
            return { valid: false, message: '兑换码已禁用' };
        }

        if (record.status === 'expired') {
            return { valid: false, message: '兑换码已过期' };
        }

        // 检查是否过期
        if (record.expires_at) {
            const expiresAt = new Date(record.expires_at);
            if (expiresAt < new Date()) {
                // 更新状态为过期
                this.updateStatus(record.id, 'expired');
                return { valid: false, message: '兑换码已过期' };
            }
        }

        // 检查使用次数
        if (record.type === 'single' && record.used_count >= 1) {
            return { valid: false, message: '兑换码已使用' };
        }

        if (record.type === 'multi' && record.used_count >= record.max_uses) {
            return { valid: false, message: '兑换码已达到最大使用次数' };
        }

        return { 
            valid: true, 
            message: '兑换码有效',
            data: {
                id: record.id,
                code: record.code,
                type: record.type,
                remaining: record.type === 'single' ? (1 - record.used_count) : (record.max_uses - record.used_count)
            }
        };
    },

    /**
     * 使用兑换码（增加使用次数）
     */
    use(code) {
        const record = this.findByCode(code);
        if (!record) return false;

        const newCount = record.used_count + 1;
        let newStatus = record.status;

        // 如果是单次使用或达到最大次数，标记为已使用
        if (record.type === 'single' || newCount >= record.max_uses) {
            newStatus = 'used';
        }

        execute(
            `UPDATE redeem_codes SET used_count = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [newCount, newStatus, record.id]
        );

        return true;
    },

    /**
     * 更新状态
     */
    updateStatus(id, status) {
        execute(
            `UPDATE redeem_codes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [status, id]
        );
    },

    /**
     * 获取所有兑换码
     */
    findAll(options = {}) {
        const { limit = 100, offset = 0, status, source } = options;
        let sql = 'SELECT * FROM redeem_codes WHERE 1=1';
        const params = [];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (source) {
            sql += ' AND source = ?';
            params.push(source);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 批量创建兑换码
     */
    createBatch(count, options = {}) {
        const codes = [];
        const {
            type = 'single',
            max_uses = 1,
            expires_at = null,
            source = 'admin',
            prefix = 'XHS'
        } = options;

        for (let i = 0; i < count; i++) {
            const code = this.generateCode(prefix);
            const created = this.create({
                code,
                type,
                max_uses,
                expires_at,
                source
            });
            codes.push(created);
        }

        return codes;
    },

    /**
     * 生成随机兑换码
     */
    generateCode(prefix = 'XHS') {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = prefix;
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    /**
     * 删除兑换码
     */
    delete(id) {
        execute('DELETE FROM redeem_codes WHERE id = ?', [id]);
    }
};

export default RedeemCode;
