/**
 * 匹配记录模型
 */
import { queryAll, queryOne, execute } from '../index.js';

export const MatchRecord = {
    /**
     * 创建匹配记录
     */
    create(recordData) {
        const {
            user_id,
            person1_name,
            person1_birthday,
            person2_name,
            person2_birthday,
            match_type,
            result,
            score
        } = recordData;

        const insertResult = execute(
            `INSERT INTO match_records 
            (user_id, person1_name, person1_birthday, person2_name, person2_birthday, match_type, result, score) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, person1_name, person1_birthday, person2_name, person2_birthday, match_type, result, score]
        );

        return { id: insertResult.lastInsertRowid, ...recordData };
    },

    /**
     * 根据ID查找记录
     */
    findById(id) {
        return queryOne('SELECT * FROM match_records WHERE id = ?', [id]);
    },

    /**
     * 获取用户的所有匹配记录
     */
    findByUserId(userId, options = {}) {
        const { limit = 50, offset = 0 } = options;
        return queryAll(
            'SELECT * FROM match_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, limit, offset]
        );
    },

    /**
     * 获取所有匹配记录
     */
    findAll(options = {}) {
        const { limit = 100, offset = 0, match_type } = options;
        let sql = 'SELECT * FROM match_records';
        const params = [];

        if (match_type) {
            sql += ' WHERE match_type = ?';
            params.push(match_type);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return queryAll(sql, params);
    },

    /**
     * 根据姓名搜索记录
     */
    searchByNames(name1, name2) {
        return queryAll(
            `SELECT * FROM match_records 
            WHERE (person1_name LIKE ? OR person2_name LIKE ?) 
            AND (person1_name LIKE ? OR person2_name LIKE ?)
            ORDER BY created_at DESC`,
            [`%${name1}%`, `%${name1}%`, `%${name2}%`, `%${name2}%`]
        );
    },

    /**
     * 删除记录
     */
    delete(id) {
        return execute('DELETE FROM match_records WHERE id = ?', [id]);
    },

    /**
     * 统计记录数量
     */
    count(options = {}) {
        const { user_id, match_type } = options;
        let sql = 'SELECT COUNT(*) as count FROM match_records';
        const params = [];
        const conditions = [];

        if (user_id) {
            conditions.push('user_id = ?');
            params.push(user_id);
        }

        if (match_type) {
            conditions.push('match_type = ?');
            params.push(match_type);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        return queryOne(sql, params)?.count || 0;
    },

    /**
     * 获取统计数据
     */
    getStats() {
        const totalCount = this.count();
        const typeStats = queryAll(
            'SELECT match_type, COUNT(*) as count FROM match_records GROUP BY match_type'
        );
        const avgScore = queryOne(
            'SELECT AVG(score) as avg_score FROM match_records WHERE score IS NOT NULL'
        );

        return {
            totalCount,
            typeStats,
            avgScore: avgScore?.avg_score || 0
        };
    }
};

export default MatchRecord;
