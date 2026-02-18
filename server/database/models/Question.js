/**
 * 问题管理模型
 */
import { queryAll, queryOne, execute } from '../index.js';

export const Question = {
    /**
     * 创建问题
     */
    create(data) {
        const { title, content, category = 'general', status = 1, sort_order = 0, created_by = null } = data;
        const result = execute(
            `INSERT INTO questions (title, content, category, status, sort_order, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
            [title, content, category, status, sort_order, created_by]
        );
        return { id: result.lastInsertRowid, ...data };
    },

    /**
     * 根据ID查找
     */
    findById(id) {
        return queryOne('SELECT * FROM questions WHERE id = ?', [id]);
    },

    /**
     * 获取所有问题（分页）
     */
    findAll(options = {}) {
        const { limit = 20, offset = 0, category, status, keyword } = options;
        let sql = 'SELECT q.*, a.username as creator_name FROM questions q LEFT JOIN admins a ON q.created_by = a.id WHERE 1=1';
        const params = [];

        if (category) {
            sql += ' AND q.category = ?';
            params.push(category);
        }

        if (status !== undefined && status !== null && status !== '') {
            sql += ' AND q.status = ?';
            params.push(parseInt(status));
        }

        if (keyword) {
            sql += ' AND (q.title LIKE ? OR q.content LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        sql += ' ORDER BY q.sort_order ASC, q.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 统计问题数量
     */
    count(options = {}) {
        const { category, status, keyword } = options;
        let sql = 'SELECT COUNT(*) as count FROM questions WHERE 1=1';
        const params = [];

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (status !== undefined && status !== null && status !== '') {
            sql += ' AND status = ?';
            params.push(parseInt(status));
        }

        if (keyword) {
            sql += ' AND (title LIKE ? OR content LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        return queryOne(sql, params)?.count || 0;
    },

    /**
     * 更新问题
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

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const result = execute(
            `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`,
            params
        );
        return result.changes > 0;
    },

    /**
     * 删除问题
     */
    delete(id) {
        const result = execute('DELETE FROM questions WHERE id = ?', [id]);
        return result.changes > 0;
    }
};

export default Question;
