/**
 * 权限模型
 */
import { queryAll, queryOne, execute } from '../index.js';

export const Permission = {
    /**
     * 创建权限
     */
    create(permissionData) {
        const { code, name, type, parent_id, route_path, component_path, icon, is_visible = 1 } = permissionData;
        const result = execute(
            `INSERT INTO permissions (code, name, type, parent_id, route_path, component_path, icon, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [code, name, type, parent_id, route_path, component_path, icon, is_visible]
        );
        return { id: result.lastInsertRowid, ...permissionData };
    },

    /**
     * 根据ID查找权限
     */
    findById(id) {
        return queryOne('SELECT * FROM permissions WHERE id = ?', [id]);
    },

    /**
     * 根据代码查找权限
     */
    findByCode(code) {
        return queryOne('SELECT * FROM permissions WHERE code = ?', [code]);
    },

    /**
     * 获取所有权限
     */
    findAll(options = {}) {
        const { type, parent_id, is_visible } = options;
        let sql = 'SELECT * FROM permissions WHERE 1=1';
        const params = [];

        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }

        if (parent_id !== undefined) {
            sql += ' AND parent_id = ?';
            params.push(parent_id);
        }

        if (is_visible !== undefined) {
            sql += ' AND is_visible = ?';
            params.push(is_visible);
        }

        sql += ' ORDER BY parent_id, created_at';
        return queryAll(sql, params);
    },

    /**
     * 获取树形权限结构
     */
    getTree() {
        const allPermissions = this.findAll();
        const permissionMap = {};
        const roots = [];

        // 创建权限映射
        allPermissions.forEach(perm => {
            permissionMap[perm.id] = { ...perm, children: [] };
        });

        // 构建树形结构
        allPermissions.forEach(perm => {
            if (perm.parent_id) {
                if (permissionMap[perm.parent_id]) {
                    permissionMap[perm.parent_id].children.push(permissionMap[perm.id]);
                }
            } else {
                roots.push(permissionMap[perm.id]);
            }
        });

        return roots;
    },

    /**
     * 更新权限
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
            `UPDATE permissions SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params
        );
        return result.changes > 0;
    },

    /**
     * 删除权限
     */
    delete(id) {
        // 检查是否有子权限
        const children = queryAll('SELECT id FROM permissions WHERE parent_id = ?', [id]);
        if (children.length > 0) {
            throw new Error('无法删除包含子权限的权限项');
        }

        // 删除角色权限关联
        execute('DELETE FROM role_permissions WHERE permission_id = ?', [id]);

        // 删除权限
        const result = execute('DELETE FROM permissions WHERE id = ?', [id]);
        return result.changes > 0;
    },

    /**
     * 获取角色的权限
     */
    getByRoleId(roleId) {
        const sql = `
            SELECT p.* FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
        `;
        return queryAll(sql, [roleId]);
    }
};