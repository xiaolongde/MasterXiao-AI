/**
 * 用户模型
 */
import { queryAll, queryOne, execute } from '../index.js';

export const User = {
    /**
     * 创建用户
     */
    create(userData) {
        const { username, password, email, phone, role = 'user' } = userData;
        const result = execute(
            `INSERT INTO users (username, password, email, phone, role) VALUES (?, ?, ?, ?, ?)`,
            [username, password, email, phone, role]
        );
        return { id: result.lastInsertRowid, ...userData };
    },

    /**
     * 根据ID查找用户
     */
    findById(id) {
        return queryOne('SELECT * FROM users WHERE id = ?', [id]);
    },

    /**
     * 根据用户名查找用户
     */
    findByUsername(username) {
        return queryOne('SELECT * FROM users WHERE username = ?', [username]);
    },

    /**
     * 根据邮箱查找用户
     */
    findByEmail(email) {
        return queryOne('SELECT * FROM users WHERE email = ?', [email]);
    },

    /**
     * 获取所有用户
     */
    findAll(options = {}) {
        const { limit = 100, offset = 0, status } = options;
        let sql = 'SELECT * FROM users';
        const params = [];
        
        if (status !== undefined) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        return queryAll(sql, params);
    },

    /**
     * 更新用户信息
     */
    update(id, userData) {
        const fields = [];
        const values = [];
        
        Object.entries(userData).forEach(([key, value]) => {
            if (value !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        });
        
        if (fields.length === 0) return null;
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        return this.findById(id);
    },

    /**
     * 删除用户
     */
    delete(id) {
        return execute('DELETE FROM users WHERE id = ?', [id]);
    },

    /**
     * 统计用户数量
     */
    count(status) {
        let sql = 'SELECT COUNT(*) as count FROM users';
        const params = [];
        
        if (status !== undefined) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        
        return queryOne(sql, params)?.count || 0;
    }
};

export default User;
