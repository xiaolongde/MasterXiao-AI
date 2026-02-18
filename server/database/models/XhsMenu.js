/**
 * 小红书菜单管理模型
 * 菜单包含名称和问题描述（文本域）
 */
import { queryAll, queryOne, execute, getNowLocal } from '../index.js';

export const XhsMenu = {
    /**
     * 创建菜单
     * @param {object} data - { name, description, status }
     * @returns {object} 创建结果
     */
    create(data) {
        const { name, description = '', status = 1 } = data;
        const now = getNowLocal();
        const result = execute(
            'INSERT INTO xhs_menus (name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [name, description, status, now, now]
        );
        return { id: result.lastInsertRowid, name, description, status, created_at: now, updated_at: now };
    },

    /**
     * 根据ID查找菜单
     */
    findById(id) {
        return queryOne('SELECT * FROM xhs_menus WHERE id = ?', [id]);
    },

    /**
     * 获取菜单列表（分页）
     */
    findAll(options = {}) {
        const { limit = 20, offset = 0, status, keyword } = options;
        let sql = 'SELECT * FROM xhs_menus WHERE 1=1';
        const params = [];

        if (status !== undefined && status !== null && status !== '') {
            sql += ' AND status = ?';
            params.push(parseInt(status));
        }

        if (keyword) {
            sql += ' AND name LIKE ?';
            params.push(`%${keyword}%`);
        }

        sql += ' ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 统计菜单数量
     */
    count(options = {}) {
        const { status, keyword } = options;
        let sql = 'SELECT COUNT(*) as count FROM xhs_menus WHERE 1=1';
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
     * 更新菜单
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

        execute(`UPDATE xhs_menus SET ${fields.join(', ')} WHERE id = ?`, params);
        return true;
    },

    /**
     * 删除菜单
     */
    delete(id) {
        execute('DELETE FROM xhs_menus WHERE id = ?', [id]);
        return true;
    },

    /**
     * 获取所有显示状态的菜单
     */
    findAllVisible() {
        return queryAll('SELECT * FROM xhs_menus WHERE status = 1 ORDER BY sort_order ASC, id ASC');
    }
};

export default XhsMenu;
