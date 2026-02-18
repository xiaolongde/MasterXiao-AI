/**
 * 小红书主题记录模型
 */
import { queryAll, queryOne, execute, getNowLocal } from '../index.js';

export const XhsTopic = {
    /**
     * 创建小红书主题记录
     */
    create(data) {
        const { topic_category_id, status = 1, sort_order = 0 } = data;
        const now = getNowLocal();
        const result = execute(
            `INSERT INTO xhs_topics (topic_category_id, status, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [topic_category_id, status, sort_order, now, now]
        );
        return { id: result.lastInsertRowid, topic_category_id, status, sort_order, created_at: now, updated_at: now };
    },

    /**
     * 批量创建（接收主题分类ID数组）
     */
    createBatch(topicCategoryIds) {
        const now = getNowLocal();
        const results = [];
        for (const tcId of topicCategoryIds) {
            // 避免重复添加
            const exists = queryOne('SELECT id FROM xhs_topics WHERE topic_category_id = ?', [tcId]);
            if (exists) continue;
            const result = execute(
                `INSERT INTO xhs_topics (topic_category_id, status, sort_order, created_at, updated_at) VALUES (?, 1, 0, ?, ?)`,
                [tcId, now, now]
            );
            results.push({ id: result.lastInsertRowid, topic_category_id: tcId, status: 1 });
        }
        return results;
    },

    /**
     * 根据ID查找
     */
    findById(id) {
        return queryOne('SELECT * FROM xhs_topics WHERE id = ?', [id]);
    },

    /**
     * 根据主题分类ID查找
     */
    findByTopicCategoryId(topicCategoryId) {
        return queryOne('SELECT * FROM xhs_topics WHERE topic_category_id = ?', [topicCategoryId]);
    },

    /**
     * 获取所有小红书主题（联表获取分类名称）
     */
    findAll(options = {}) {
        const { limit = 50, offset = 0, status } = options;
        let sql = `SELECT x.*, tc.name as topic_name, tc.description as topic_desc
                    FROM xhs_topics x
                    LEFT JOIN topic_categories tc ON x.topic_category_id = tc.id
                    WHERE 1=1`;
        const params = [];

        if (status !== undefined && status !== null && status !== '') {
            sql += ' AND x.status = ?';
            params.push(parseInt(status));
        }

        sql += ' ORDER BY x.sort_order ASC, x.id ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 获取所有显示状态的小红书主题（供客户端使用，联表获取分类名称）
     */
    findAllVisible() {
        return queryAll(`
            SELECT x.*, tc.name as topic_name, tc.description as topic_desc
            FROM xhs_topics x
            LEFT JOIN topic_categories tc ON x.topic_category_id = tc.id
            WHERE x.status = 1
            ORDER BY x.sort_order ASC, x.id ASC
        `);
    },

    /**
     * 统计数量
     */
    count(options = {}) {
        const { status } = options;
        let sql = 'SELECT COUNT(*) as count FROM xhs_topics WHERE 1=1';
        const params = [];

        if (status !== undefined && status !== null && status !== '') {
            sql += ' AND status = ?';
            params.push(parseInt(status));
        }

        return queryOne(sql, params)?.count || 0;
    },

    /**
     * 更新
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

        execute(`UPDATE xhs_topics SET ${fields.join(', ')} WHERE id = ?`, params);
        return true;
    },

    /**
     * 删除
     */
    delete(id) {
        execute('DELETE FROM xhs_topics WHERE id = ?', [id]);
        return true;
    }
};

export default XhsTopic;
