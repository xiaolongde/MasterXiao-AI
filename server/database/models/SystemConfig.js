/**
 * 系统配置模型
 */
import { queryAll, queryOne, execute, getNowLocal } from '../index.js';

export const SystemConfig = {
    /**
     * 创建配置
     */
    create(data) {
        const { name, status = 1 } = data;
        const now = getNowLocal();
        const result = execute(
            `INSERT INTO system_configs (name, status, created_at, updated_at) VALUES (?, ?, ?, ?)`,
            [name, status, now, now]
        );
        return { id: result.lastInsertRowid, name, status, created_at: now, updated_at: now };
    },

    /**
     * 根据ID查找
     */
    findById(id) {
        return queryOne('SELECT * FROM system_configs WHERE id = ?', [id]);
    },

    /**
     * 根据名称查找
     */
    findByName(name) {
        return queryOne('SELECT * FROM system_configs WHERE name = ?', [name]);
    },

    /**
     * 获取所有配置（分页）
     */
    findAll(options = {}) {
        const { limit = 50, offset = 0, status, keyword } = options;
        let sql = 'SELECT * FROM system_configs WHERE 1=1';
        const params = [];

        if (status !== undefined && status !== null && status !== '') {
            sql += ' AND status = ?';
            params.push(parseInt(status));
        }

        if (keyword) {
            sql += ' AND name LIKE ?';
            params.push(`%${keyword}%`);
        }

        sql += ' ORDER BY id ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 统计数量
     */
    count(options = {}) {
        const { status, keyword } = options;
        let sql = 'SELECT COUNT(*) as count FROM system_configs WHERE 1=1';
        const params = [];

        if (status !== undefined && status !== null && status !== '') {
            sql += ' AND status = ?';
            params.push(parseInt(status));
        }

        if (keyword) {
            sql += ' AND name LIKE ?';
            params.push(`%${keyword}%`);
        }

        return queryOne(sql, params)?.count || 0;
    },

    /**
     * 更新配置
     */
    update(id, data) {
        const fields = [];
        const params = [];

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                params.push(value);
            }
        });

        if (fields.length === 0) return false;

        fields.push('updated_at = ?');
        params.push(getNowLocal());
        params.push(id);

        execute(`UPDATE system_configs SET ${fields.join(', ')} WHERE id = ?`, params);
        return true;
    },

    /**
     * 删除配置
     */
    delete(id) {
        execute('DELETE FROM system_configs WHERE id = ?', [id]);
        return true;
    }
};
