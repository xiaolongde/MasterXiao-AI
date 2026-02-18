/**
 * 角色模型
 */
import { queryAll, queryOne, execute } from '../index.js';

export const Role = {
    /**
     * 创建角色
     */
    create(roleData) {
        const { code, name, description, data_scope = 'all', is_system_role = 0 } = roleData;
        const result = execute(
            `INSERT INTO roles (code, name, description, data_scope, is_system_role) VALUES (?, ?, ?, ?, ?)`,
            [code, name, description, data_scope, is_system_role]
        );
        return { id: result.lastInsertRowid, ...roleData };
    },

    /**
     * 根据ID查找角色
     */
    findById(id) {
        return queryOne('SELECT * FROM roles WHERE id = ?', [id]);
    },

    /**
     * 根据代码查找角色
     */
    findByCode(code) {
        return queryOne('SELECT * FROM roles WHERE code = ?', [code]);
    },

    /**
     * 获取所有角色
     */
    findAll(options = {}) {
        const { is_system_role } = options;
        let sql = 'SELECT * FROM roles WHERE 1=1';
        const params = [];

        if (is_system_role !== undefined) {
            sql += ' AND is_system_role = ?';
            params.push(is_system_role);
        }

        sql += ' ORDER BY created_at';
        return queryAll(sql, params);
    },

    /**
     * 更新角色
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
            `UPDATE roles SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params
        );
        return result.changes > 0;
    },

    /**
     * 删除角色
     */
    delete(id) {
        const role = this.findById(id);
        if (!role) return false;

        // 不允许删除系统角色
        if (role.is_system_role) {
            throw new Error('无法删除系统角色');
        }

        // 删除管理员角色关联
        execute('DELETE FROM admin_roles WHERE role_id = ?', [id]);

        // 删除角色权限关联
        execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);

        // 删除角色
        const result = execute('DELETE FROM roles WHERE id = ?', [id]);
        return result.changes > 0;
    },

    /**
     * 获取角色的权限
     */
    getPermissions(roleId) {
        const sql = `
            SELECT p.* FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
        `;
        return queryAll(sql, [roleId]);
    },

    /**
     * 分配权限给角色
     */
    assignPermissions(roleId, permissionIds) {
        // 先删除现有权限
        execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

        // 添加新权限
        for (const permissionId of permissionIds) {
            execute('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, permissionId]);
        }
        return true;
    },

    /**
     * 获取角色的管理员
     */
    getAdmins(roleId) {
        const sql = `
            SELECT a.id, a.username, a.email, a.phone, a.status FROM admins a
            INNER JOIN admin_roles ar ON a.id = ar.admin_id
            WHERE ar.role_id = ?
        `;
        return queryAll(sql, [roleId]);
    }
};