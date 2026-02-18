/**
 * 管理员模型
 */
import { queryAll, queryOne, execute } from '../index.js';
import { getNowLocal } from '../index.js';
import bcrypt from 'bcryptjs';

export const Admin = {
    /**
     * 创建管理员
     */
    async create(adminData) {
        const { username, password, email, phone, is_super_admin = 0 } = adminData;
        // 临时使用明文密码
        const result = execute(
            `INSERT INTO admins (username, password, email, phone, is_super_admin) VALUES (?, ?, ?, ?, ?)`,
            [username, password, email, phone, is_super_admin]
        );
        return { id: result.lastInsertRowid, ...adminData, password: undefined };
    },

    /**
     * 根据ID查找管理员
     */
    findById(id) {
        return queryOne('SELECT * FROM admins WHERE id = ?', [id]);
    },

    /**
     * 根据用户名查找管理员
     */
    findByUsername(username) {
        return queryOne('SELECT * FROM admins WHERE username = ?', [username]);
    },

    /**
     * 获取所有管理员
     */
    findAll(options = {}) {
        const { limit = 100, offset = 0, status } = options;
        let sql = 'SELECT id, username, email, phone, is_super_admin, status, failed_login_count, last_login_at, created_at, updated_at FROM admins';
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
     * 更新管理员
     */
    update(id, updateData) {
        const fields = [];
        const params = [];

        Object.keys(updateData).forEach(key => {
            if (key !== 'id' && updateData[key] !== undefined) {
                fields.push(`${key} = ?`);
                params.push(updateData[key]);
            }
        });

        if (fields.length === 0) return false;

        params.push(id);
        const result = execute(
            `UPDATE admins SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params
        );
        return result.changes > 0;
    },

    /**
     * 删除管理员
     */
    delete(id) {
        const result = execute('DELETE FROM admins WHERE id = ?', [id]);
        return result.changes > 0;
    },

    /**
     * 验证密码
     */
    async validatePassword(username, password) {
        const admin = this.findByUsername(username);
        if (!admin) return null;

        // 临时使用明文比较
        return admin.password === password ? admin : null;
    },

    /**
     * 更新最后登录时间
     */
    updateLastLogin(id) {
        return this.update(id, { last_login_at: getNowLocal() });
    },

    /**
     * 增加失败登录次数
     */
    incrementFailedLogin(id) {
        const admin = this.findById(id);
        if (!admin) return false;

        return this.update(id, { failed_login_count: admin.failed_login_count + 1 });
    },

    /**
     * 重置失败登录次数
     */
    resetFailedLogin(id) {
        return this.update(id, { failed_login_count: 0 });
    },

    /**
     * 获取管理员的角色
     */
    getRoles(adminId) {
        const sql = `
            SELECT r.* FROM roles r
            INNER JOIN admin_roles ar ON r.id = ar.role_id
            WHERE ar.admin_id = ?
        `;
        return queryAll(sql, [adminId]);
    },

    /**
     * 获取管理员的权限
     */
    getPermissions(adminId) {
        const sql = `
            SELECT DISTINCT p.* FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            INNER JOIN admin_roles ar ON rp.role_id = ar.role_id
            WHERE ar.admin_id = ?
        `;
        return queryAll(sql, [adminId]);
    },

    /**
     * 分配角色给管理员
     */
    assignRoles(adminId, roleIds) {
        // 先删除现有角色
        execute('DELETE FROM admin_roles WHERE admin_id = ?', [adminId]);

        // 添加新角色
        for (const roleId of roleIds) {
            execute('INSERT INTO admin_roles (admin_id, role_id) VALUES (?, ?)', [adminId, roleId]);
        }
        return true;
    }
};