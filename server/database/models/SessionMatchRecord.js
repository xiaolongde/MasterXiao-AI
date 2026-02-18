/**
 * 会话匹配记录模型
 * 用于追踪核销码兑换后的匹配流程状态
 * 
 * 状态说明：
 * - 0: 请求中（初始状态）
 * - 1: 成功
 * - 2: 失败
 */
import { queryAll, queryOne, execute } from '../index.js';

export const SessionMatchRecord = {
    /**
     * 创建匹配记录
     * @param {object} recordData - { sessionId, reqData, userId, method, type }
     * @returns {object} - { id, sessionId }
     */
    create(recordData) {
        const {
            sessionId,
            reqData,
            userId = null,
            method = null,
            type = null
        } = recordData;

        // 校验 sessionId 格式（UUID v4 格式）
        if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 16) {
            throw new Error('无效的 sessionId 格式');
        }

        // 序列化 reqData
        const reqDataStr = typeof reqData === 'string' ? reqData : JSON.stringify(reqData);

        // 自动从 reqData 中提取 method 和 type（如果未显式传入）
        let finalMethod = method;
        let finalType = type;
        if (!finalMethod || !finalType) {
            try {
                const parsed = typeof reqData === 'string' ? JSON.parse(reqData) : reqData;
                if (!finalMethod && parsed?.method) finalMethod = parsed.method;
                if (!finalType && parsed?.type) finalType = parsed.type;
            } catch (e) { /* ignore */ }
        }

        const result = execute(
            `INSERT INTO session_match_records (session_id, user_id, status, req_data, method, type) 
            VALUES (?, ?, 0, ?, ?, ?)`,
            [sessionId, userId, reqDataStr, finalMethod, finalType]
        );

        return {
            id: result.lastInsertRowid,
            sessionId,
            status: 0,
            method: finalMethod,
            type: finalType
        };
    },

    /**
     * 根据 sessionId 查找记录
     * @param {string} sessionId
     * @returns {object|null}
     */
    findBySessionId(sessionId) {
        const record = queryOne(
            'SELECT * FROM session_match_records WHERE session_id = ?',
            [sessionId]
        );
        if (record && record.req_data) {
            try {
                record.req_data = JSON.parse(record.req_data);
            } catch (e) {
                // 保持原始字符串
            }
        }
        return record;
    },

    /**
     * 根据 ID 查找记录
     * @param {number} id
     * @returns {object|null}
     */
    findById(id) {
        const record = queryOne(
            'SELECT * FROM session_match_records WHERE id = ?',
            [id]
        );
        if (record && record.req_data) {
            try {
                record.req_data = JSON.parse(record.req_data);
            } catch (e) {
                // 保持原始字符串
            }
        }
        return record;
    },

    /**
     * 更新匹配记录状态
     * @param {string} sessionId - 会话ID
     * @param {number} status - 新状态（1=成功, 2=失败）
     * @param {object} resultData - 匹配结果数据（可选）
     * @param {number} id - 记录ID（可选，配合sessionId精确更新）
     * @returns {boolean}
     */
    updateStatus(sessionId, status, userId = null, resultData = null, id = null) {
        // 校验状态值
        if (![1, 2].includes(status)) {
            throw new Error('无效的状态值，只能为 1（成功）或 2（失败）');
        }

        // 先确认记录存在
        let checkSql = 'SELECT * FROM session_match_records WHERE session_id = ?';
        const checkParams = [sessionId];
        if (id) {
            checkSql += ' AND id = ?';
            checkParams.push(id);
        }
        const record = queryOne(checkSql, checkParams);
        if (!record) {
            return false;
        }

        let sql = 'UPDATE session_match_records SET status = ?, update_date = CURRENT_TIMESTAMP';
        const params = [status];

        if (resultData) {
            const resultDataStr = typeof resultData === 'string' ? resultData : JSON.stringify(resultData);
            sql += ', result_data = ?';
            params.push(resultDataStr);
        }
        if (userId) {
            sql += ', user_id = ?';
            params.push(userId);
            //更新未注册之前同一sessionId的其他userId为null的记录
            execute(
                'UPDATE session_match_records SET user_id = ? WHERE session_id = ? AND user_id IS NULL',
                [userId, sessionId]
            );
        }
        sql += ' WHERE session_id = ?';
        params.push(sessionId);
        if (id) {
            sql += ' AND id = ?';
            params.push(id);
        }
        const result = execute(sql, params);
        return result.changes > 0;
    },

    /**
     * 查询记录状态
     * @param {string} sessionId
     * @returns {object|null} - { sessionId, status, update_date }
     */
    getStatus(sessionId) {
        return queryOne(
            'SELECT session_id, status, update_date FROM session_match_records WHERE session_id = ?',
            [sessionId]
        );
    },

    /**
     * 获取记录详情
     * @param {string} sessionId
     * @param {number} id - 记录ID（可选，配合sessionId精确查询）
     * @returns {object|null}
     */
    getDetail(sessionId, id) {
        let sql = 'SELECT * FROM session_match_records WHERE session_id = ?';
        const params = [sessionId];
        if (id !== undefined && id !== null) {
            sql += ' AND id = ?';
            params.push(id);
        }
        const record = queryOne(sql, params);
        if (record) {
            try {
                if (record.req_data) record.req_data = JSON.parse(record.req_data);
            } catch (e) { /* ignore */ }
            try {
                if (record.result_data) record.result_data = JSON.parse(record.result_data);
            } catch (e) { /* ignore */ }
        }
        return record;
    },

    /**
     * 获取所有记录（管理用途）
     * @param {object} options - { limit, offset, status }
     * @returns {Array}
     */
    findAll(options = {}) {
        const { limit = 100, offset = 0, status } = options;
        let sql = 'SELECT * FROM session_match_records';
        const params = [];

        if (status !== undefined && status !== null) {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' ORDER BY create_date DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params).map(record => {
            try {
                if (record.req_data) record.req_data = JSON.parse(record.req_data);
            } catch (e) { /* ignore */ }
            try {
                if (record.result_data) record.result_data = JSON.parse(record.result_data);
            } catch (e) { /* ignore */ }
            return record;
        });
    },

    /**
     * 统计记录数
     * @param {object} options - { status }
     * @returns {number}
     */
    count(options = {}) {
        const { status } = options;
        let sql = 'SELECT COUNT(*) as count FROM session_match_records';
        const params = [];

        if (status !== undefined && status !== null) {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        return queryOne(sql, params)?.count || 0;
    },

    /**
     * 根据 userId 查询记录列表（分页）
     * @param {string} userId
     * @param {object} options - { limit, offset }
     * @returns {{ records: Array, total: number }}
     */
    findByUserId(userId, options = {}) {
        const { limit = 20, offset = 0 } = options;

        const total = queryOne(
            'SELECT COUNT(*) as count FROM session_match_records WHERE user_id = ? AND status = 1',
            [userId]
        )?.count || 0;

        const records = queryAll(
            'SELECT * FROM session_match_records WHERE user_id = ? AND status = 1 ORDER BY create_date DESC LIMIT ? OFFSET ?',
            [userId, limit, offset]
        ).map(record => {
            try {
                if (record.req_data) record.req_data = JSON.parse(record.req_data);
            } catch (e) { /* ignore */ }
            try {
                if (record.result_data) record.result_data = JSON.parse(record.result_data);
            } catch (e) { /* ignore */ }
            return record;
        });

        return { records, total };
    },

    /**
     * 根据 sessionId 前缀模糊查询记录（用于同一设备的记录）
     * @param {string} sessionIdPrefix
     * @param {object} options - { limit, offset }
     * @returns {{ records: Array, total: number }}
     */
    findBySessionPrefix(sessionIdPrefix, options = {}) {
        const { limit = 20, offset = 0 } = options;

        // 使用 OR 条件查询，支持 sessionId 或 userId 维度
        const total = queryOne(
            'SELECT COUNT(*) as count FROM session_match_records WHERE user_id = ? AND status = 1',
            [sessionIdPrefix]
        )?.count || 0;

        const records = queryAll(
            'SELECT * FROM session_match_records WHERE user_id = ? AND status = 1 ORDER BY create_date DESC LIMIT ? OFFSET ?',
            [sessionIdPrefix, limit, offset]
        ).map(record => {
            try {
                if (record.req_data) record.req_data = JSON.parse(record.req_data);
            } catch (e) { /* ignore */ }
            try {
                if (record.result_data) record.result_data = JSON.parse(record.result_data);
            } catch (e) { /* ignore */ }
            return record;
        });

        return { records, total };
    },

    /**
     * 根据多条件查询历史记录
     * @param {object} query - { sessionId, userId }
     * @param {object} options - { limit, offset }
     * @returns {{ records: Array, total: number }}
     */
    findHistory(query = {}, options = {}) {
        const { sessionId, userId } = query;
        const { limit = 20, offset = 0 } = options;

        let whereClauses = ['status = 1'];
        const params = [];

        if (userId && sessionId) {
            // 同时有 userId 和 sessionId，用 OR 查询尽可能多的记录
            whereClauses.push('(user_id = ? OR session_id = ?)');
            params.push(userId, sessionId);
        } else if (userId) {
            whereClauses.push('user_id = ?');
            params.push(userId);
        } else if (sessionId) {
            whereClauses.push('session_id = ?');
            params.push(sessionId);
        } else {
            return { records: [], total: 0 };
        }

        const whereSQL = whereClauses.join(' AND ');

        const total = queryOne(
            `SELECT COUNT(*) as count FROM session_match_records WHERE ${whereSQL}`,
            params
        )?.count || 0;

        const records = queryAll(
            `SELECT * FROM session_match_records WHERE ${whereSQL} ORDER BY create_date DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        ).map(record => {
            try {
                if (record.req_data) record.req_data = JSON.parse(record.req_data);
            } catch (e) { /* ignore */ }
            try {
                if (record.result_data) record.result_data = JSON.parse(record.result_data);
            } catch (e) { /* ignore */ }
            return record;
        });

        return { records, total };
    },

    /**
     * 删除记录
     * @param {number} id
     */
    delete(id) {
        execute('DELETE FROM session_match_records WHERE id = ?', [id]);
    }
};

export default SessionMatchRecord;
