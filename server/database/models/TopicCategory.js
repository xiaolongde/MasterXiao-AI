/**
 * 主题分类模型
 */
import { queryAll, queryOne, execute, getNowLocal } from '../index.js';

export const TopicCategory = {
    /**
     * 创建主题分类
     */
    create(data) {
        const { name, description = '', sort_order = 0, status = 1 } = data;
        const now = getNowLocal();
        const result = execute(
            `INSERT INTO topic_categories (name, description, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, sort_order, status, now, now]
        );
        return { id: result.lastInsertRowid, name, description, sort_order, status, created_at: now, updated_at: now };
    },

    /**
     * 根据ID查找
     */
    findById(id) {
        return queryOne('SELECT * FROM topic_categories WHERE id = ?', [id]);
    },

    /**
     * 根据名称查找
     */
    findByName(name) {
        return queryOne('SELECT * FROM topic_categories WHERE name = ?', [name]);
    },

    /**
     * 获取所有分类（分页）
     */
    findAll(options = {}) {
        const { limit = 50, offset = 0, status, keyword } = options;
        let sql = 'SELECT * FROM topic_categories WHERE 1=1';
        const params = [];

        if (status !== undefined && status !== null && status !== '') {
            sql += ' AND status = ?';
            params.push(parseInt(status));
        }

        if (keyword) {
            sql += ' AND name LIKE ?';
            params.push(`%${keyword}%`);
        }

        sql += ' ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 获取所有启用的分类（按序号排序）— 供客户端使用
     */
    findAllEnabled() {
        return queryAll('SELECT * FROM topic_categories WHERE status = 1 ORDER BY sort_order ASC, id ASC');
    },

    /**
     * 统计数量
     */
    count(options = {}) {
        const { status, keyword } = options;
        let sql = 'SELECT COUNT(*) as count FROM topic_categories WHERE 1=1';
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
     * 更新分类
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

        execute(`UPDATE topic_categories SET ${fields.join(', ')} WHERE id = ?`, params);
        return true;
    },

    /**
     * 删除分类
     */
    delete(id) {
        execute('DELETE FROM topic_categories WHERE id = ?', [id]);
        return true;
    }
};
