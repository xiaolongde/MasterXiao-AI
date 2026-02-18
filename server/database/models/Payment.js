/**
 * 支付记录模型
 */
import { queryAll, queryOne, execute } from '../index.js';

export const Payment = {
    /**
     * 创建支付记录
     */
    create(paymentData) {
        const {
            user_id,
            order_no,
            amount,
            status = 'pending',
            payment_method
        } = paymentData;

        const result = execute(
            `INSERT INTO payments (user_id, order_no, amount, status, payment_method) 
            VALUES (?, ?, ?, ?, ?)`,
            [user_id, order_no, amount, status, payment_method]
        );

        return { id: result.lastInsertRowid, ...paymentData };
    },

    /**
     * 根据ID查找支付记录
     */
    findById(id) {
        return queryOne('SELECT * FROM payments WHERE id = ?', [id]);
    },

    /**
     * 根据订单号查找支付记录
     */
    findByOrderNo(orderNo) {
        return queryOne('SELECT * FROM payments WHERE order_no = ?', [orderNo]);
    },

    /**
     * 获取用户的所有支付记录
     */
    findByUserId(userId, options = {}) {
        const { limit = 50, offset = 0, status } = options;
        let sql = 'SELECT * FROM payments WHERE user_id = ?';
        const params = [userId];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 获取所有支付记录
     */
    findAll(options = {}) {
        const { limit = 100, offset = 0, status, start_date, end_date } = options;
        let sql = 'SELECT * FROM payments';
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }

        if (start_date) {
            conditions.push('created_at >= ?');
            params.push(start_date);
        }

        if (end_date) {
            conditions.push('created_at <= ?');
            params.push(end_date);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 更新支付状态
     */
    updateStatus(orderNo, status, paymentTime = null) {
        const sql = paymentTime
            ? 'UPDATE payments SET status = ?, payment_time = ? WHERE order_no = ?'
            : 'UPDATE payments SET status = ? WHERE order_no = ?';
        
        const params = paymentTime
            ? [status, paymentTime, orderNo]
            : [status, orderNo];

        execute(sql, params);
        return this.findByOrderNo(orderNo);
    },

    /**
     * 删除支付记录
     */
    delete(id) {
        return execute('DELETE FROM payments WHERE id = ?', [id]);
    },

    /**
     * 统计支付数据
     */
    getStats(options = {}) {
        const { start_date, end_date } = options;
        let whereClause = '';
        const params = [];

        if (start_date && end_date) {
            whereClause = ' WHERE created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const totalAmount = queryOne(
            `SELECT SUM(amount) as total FROM payments WHERE status = 'success'${whereClause ? ' AND' + whereClause.substring(6) : ''}`,
            params
        );

        const statusStats = queryAll(
            `SELECT status, COUNT(*) as count, SUM(amount) as amount FROM payments${whereClause} GROUP BY status`,
            params
        );

        const dailyStats = queryAll(
            `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(amount) as amount 
            FROM payments WHERE status = 'success'${whereClause ? ' AND' + whereClause.substring(6) : ''} 
            GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`,
            params
        );

        return {
            totalAmount: totalAmount?.total || 0,
            statusStats,
            dailyStats
        };
    }
};

export default Payment;
