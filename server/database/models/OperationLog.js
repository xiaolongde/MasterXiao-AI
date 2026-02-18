/**
 * 操作日志模型
 */
import { queryAll, queryOne, execute } from '../index.js';

export const OperationLog = {
    /**
     * 创建操作日志
     */
    create(logData) {
        const { admin_id, module, action, request_data, response_data, ip_address, user_agent, status = 'success', error_message } = logData;
        const result = execute(
            `INSERT INTO operation_logs (admin_id, module, action, request_data, response_data, ip_address, user_agent, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [admin_id, module, action, request_data, response_data, ip_address, user_agent, status, error_message]
        );
        return { id: result.lastInsertRowid, ...logData };
    },

    /**
     * 根据ID查找日志
     */
    findById(id) {
        return queryOne('SELECT * FROM operation_logs WHERE id = ?', [id]);
    },

    /**
     * 获取操作日志列表
     */
    findAll(options = {}) {
        const { admin_id, module, action, status, start_date, end_date, limit = 100, offset = 0 } = options;
        let sql = 'SELECT ol.*, a.username as admin_username FROM operation_logs ol LEFT JOIN admins a ON ol.admin_id = a.id WHERE 1=1';
        const params = [];

        if (admin_id) {
            sql += ' AND ol.admin_id = ?';
            params.push(admin_id);
        }

        if (module) {
            sql += ' AND ol.module = ?';
            params.push(module);
        }

        if (action) {
            sql += ' AND ol.action = ?';
            params.push(action);
        }

        if (status) {
            sql += ' AND ol.status = ?';
            params.push(status);
        }

        if (start_date) {
            sql += ' AND ol.created_at >= ?';
            params.push(start_date);
        }

        if (end_date) {
            sql += ' AND ol.created_at <= ?';
            params.push(end_date);
        }

        sql += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 获取日志统计
     */
    getStats(options = {}) {
        const { start_date, end_date } = options;
        let sql = `
            SELECT
                COUNT(*) as total_count,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
                module,
                action
            FROM operation_logs
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            sql += ' AND created_at >= ?';
            params.push(start_date);
        }

        if (end_date) {
            sql += ' AND created_at <= ?';
            params.push(end_date);
        }

        sql += ' GROUP BY module, action ORDER BY total_count DESC';

        return queryAll(sql, params);
    },

    /**
     * 删除过期日志
     */
    deleteOldLogs(days = 90) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const result = execute('DELETE FROM operation_logs WHERE created_at < ?', [date.toISOString()]);
        return result.changes;
    },

    /**
     * 记录操作日志的便捷方法
     */
    log(adminId, module, action, requestData = null, responseData = null, ipAddress = null, userAgent = null, status = 'success', errorMessage = null) {
        return this.create({
            admin_id: adminId,
            module,
            action,
            request_data: requestData ? JSON.stringify(requestData) : null,
            response_data: responseData ? JSON.stringify(responseData) : null,
            ip_address: ipAddress,
            user_agent: userAgent,
            status,
            error_message: errorMessage
        });
    }
};