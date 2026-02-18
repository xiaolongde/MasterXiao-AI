/**
 * 数据存储层 - 基于 SQLite 数据库
 * 替代原内存 Map 存储，所有数据持久化到数据库
 */

import { queryAll, queryOne, execute, saveDatabase, getNowLocal } from '../database/index.js';

// ==================== 用户数据（替代 Map<phone, user>）====================

/**
 * 用户数据代理对象，兼容 Map 接口
 * 以 phone 为 key，读写数据库 users 表
 */
export const users = {
    get(phone) {
        const row = queryOne('SELECT * FROM users WHERE phone = ?', [phone]);
        if (!row) return undefined;
        return _rowToUser(row);
    },

    set(phone, user) {
        const existing = queryOne('SELECT id FROM users WHERE phone = ?', [phone]);
        if (existing) {
            // 更新
            execute(`UPDATE users SET 
                uid = ?, username = ?, password_hash = ?, nickname = ?, avatar = ?, 
                gender = ?, birth_date = ?, status = ?, credits = ?, test_count = ?, 
                invite_code = ?, invited_by = ?, register_source = ?, register_session_id = ?,
                last_login_time = ?, email = ?, updated_at = CURRENT_TIMESTAMP
                WHERE phone = ?`, [
                user.id || user.uid, user.nickname || user.username || `用户${phone.slice(-4)}`,
                user.passwordHash || user.password_hash || null,
                user.nickname || `用户${phone.slice(-4)}`, user.avatar || null,
                user.gender || null, user.birthDate || user.birth_date || null,
                user.status !== undefined ? user.status : 1,
                user.credits || 0, user.testCount || user.test_count || 0,
                user.inviteCode || user.invite_code || null,
                user.invitedBy || user.invited_by || null,
                user.registerSource || user.register_source || 'web',
                user.registerSessionId || user.register_session_id || null,
                user.lastLoginTime || user.last_login_time || null,
                user.email || null, phone
            ]);
        } else {
            // 插入 — username 用手机号保证唯一
            const username = phone;
            execute(`INSERT INTO users (uid, username, password, password_hash, phone, nickname, avatar, 
                gender, birth_date, role, status, credits, test_count, invite_code, invited_by, 
                register_source, register_session_id, last_login_time, email)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                user.id || user.uid || null,
                username,
                user.passwordHash || user.password_hash || 'no_password',
                user.passwordHash || user.password_hash || null,
                phone,
                user.nickname || `用户${phone.slice(-4)}`,
                user.avatar || null,
                user.gender || null,
                user.birthDate || user.birth_date || null,
                user.role || 'user',
                user.status !== undefined ? user.status : 1,
                user.credits || 0,
                user.testCount || user.test_count || 0,
                user.inviteCode || user.invite_code || null,
                user.invitedBy || user.invited_by || null,
                user.registerSource || user.register_source || 'web',
                user.registerSessionId || user.register_session_id || null,
                user.lastLoginTime || user.last_login_time || null,
                user.email || null
            ]);
        }
        saveDatabase();
    },

    has(phone) {
        const row = queryOne('SELECT id FROM users WHERE phone = ?', [phone]);
        return !!row;
    },

    delete(phone) {
        execute('DELETE FROM users WHERE phone = ?', [phone]);
        saveDatabase();
        return true;
    },

    forEach(callback) {
        const rows = queryAll('SELECT * FROM users');
        rows.forEach(row => {
            const user = _rowToUser(row);
            callback(user, row.phone);
        });
    },

    values() {
        const rows = queryAll('SELECT * FROM users');
        return rows.map(row => _rowToUser(row));
    },

    get size() {
        const result = queryOne('SELECT COUNT(*) as count FROM users');
        return result?.count || 0;
    }
};

/** 数据库行转换为兼容旧代码的 user 对象 */
function _rowToUser(row) {
    return {
        id: row.uid || String(row.id),
        uid: row.uid || String(row.id),
        dbId: row.id,
        phone: row.phone,
        username: row.username,
        passwordHash: row.password_hash,
        password_hash: row.password_hash,
        nickname: row.nickname || row.username,
        avatar: row.avatar,
        gender: row.gender,
        birthDate: row.birth_date,
        birth_date: row.birth_date,
        email: row.email,
        role: row.role,
        status: row.status,
        credits: row.credits || 0,
        testCount: row.test_count || 0,
        test_count: row.test_count || 0,
        inviteCode: row.invite_code,
        invite_code: row.invite_code,
        invitedBy: row.invited_by,
        invited_by: row.invited_by,
        registerSource: row.register_source,
        register_source: row.register_source,
        registerSessionId: row.register_session_id,
        register_session_id: row.register_session_id,
        lastLoginTime: row.last_login_time,
        last_login_time: row.last_login_time,
        createdAt: row.created_at,
        created_at: row.created_at,
        updatedAt: row.updated_at,
        updated_at: row.updated_at
    };
}

// ==================== 验证码数据（替代 Map<key, codeData>）====================

export const verificationCodes = {
    get(key) {
        // key 格式: "phone_type" 或 "phone"
        const parts = key.split('_');
        let phone, type;
        if (parts.length >= 2) {
            phone = parts[0];
            type = parts.slice(1).join('_');
        } else {
            phone = key;
            type = 'login';
        }
        const row = queryOne(
            'SELECT * FROM verification_codes WHERE phone = ? AND type = ? AND used = 0 ORDER BY id DESC LIMIT 1',
            [phone, type]
        );
        if (!row) return undefined;
        return {
            code: row.code,
            type: row.type,
            expires: new Date(row.expires_at).getTime(),
            attempts: row.attempts,
            used: !!row.used,
            _dbId: row.id
        };
    },

    set(key, data) {
        const parts = key.split('_');
        let phone, type;
        if (parts.length >= 2) {
            phone = parts[0];
            type = parts.slice(1).join('_');
        } else {
            phone = key;
            type = data.type || 'login';
        }
        // 先清除旧的未使用验证码
        execute('DELETE FROM verification_codes WHERE phone = ? AND type = ? AND used = 0', [phone, type]);
        // 插入新验证码
        const expiresAt = new Date(data.expires).toISOString();
        execute(
            'INSERT INTO verification_codes (phone, code, type, attempts, used, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
            [phone, data.code, type, data.attempts || 0, data.used ? 1 : 0, expiresAt]
        );
        saveDatabase();
    },

    delete(key) {
        const parts = key.split('_');
        let phone, type;
        if (parts.length >= 2) {
            phone = parts[0];
            type = parts.slice(1).join('_');
        } else {
            phone = key;
            type = null;
        }
        if (type) {
            execute('DELETE FROM verification_codes WHERE phone = ? AND type = ?', [phone, type]);
        } else {
            execute('DELETE FROM verification_codes WHERE phone = ?', [phone]);
        }
        saveDatabase();
    },

    has(key) {
        return this.get(key) !== undefined;
    }
};

// ==================== 短信频率限制（替代 Map<phone, rateData>）====================

export const smsRateLimit = {
    get(phone) {
        const row = queryOne('SELECT * FROM sms_rate_limits WHERE phone = ?', [phone]);
        if (!row) return undefined;
        return {
            count: 0,
            lastSentAt: row.last_sent_at || 0,
            dailyCount: row.daily_count || 0,
            dailyResetAt: row.daily_reset_at || 0
        };
    },

    set(phone, data) {
        const existing = queryOne('SELECT id FROM sms_rate_limits WHERE phone = ?', [phone]);
        if (existing) {
            execute(
                'UPDATE sms_rate_limits SET last_sent_at = ?, daily_count = ?, daily_reset_at = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?',
                [data.lastSentAt || 0, data.dailyCount || 0, data.dailyResetAt || 0, phone]
            );
        } else {
            execute(
                'INSERT INTO sms_rate_limits (phone, last_sent_at, daily_count, daily_reset_at) VALUES (?, ?, ?, ?)',
                [phone, data.lastSentAt || 0, data.dailyCount || 0, data.dailyResetAt || 0]
            );
        }
        saveDatabase();
    },

    has(phone) {
        return !!queryOne('SELECT id FROM sms_rate_limits WHERE phone = ?', [phone]);
    },

    delete(phone) {
        execute('DELETE FROM sms_rate_limits WHERE phone = ?', [phone]);
        saveDatabase();
    }
};

// ==================== 用户会话（替代 Map<sessionId, sessionData>）====================

export const userSessions = {
    get(sessionId) {
        const row = queryOne('SELECT * FROM user_sessions WHERE session_id = ?', [sessionId]);
        if (!row) return undefined;
        return {
            userId: row.user_id,
            token: row.token,
            expiresAt: row.expires_at,
            createdAt: row.created_at
        };
    },

    set(sessionId, data) {
        const existing = queryOne('SELECT session_id FROM user_sessions WHERE session_id = ?', [sessionId]);
        if (existing) {
            execute(
                'UPDATE user_sessions SET user_id = ?, token = ?, expires_at = ? WHERE session_id = ?',
                [data.userId, data.token, data.expiresAt, sessionId]
            );
        } else {
            execute(
                'INSERT INTO user_sessions (session_id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
                [sessionId, data.userId, data.token, data.expiresAt]
            );
        }
        saveDatabase();
    },

    has(sessionId) {
        return !!queryOne('SELECT session_id FROM user_sessions WHERE session_id = ?', [sessionId]);
    },

    delete(sessionId) {
        execute('DELETE FROM user_sessions WHERE session_id = ?', [sessionId]);
        saveDatabase();
    },

    forEach(callback) {
        const rows = queryAll('SELECT * FROM user_sessions');
        rows.forEach(row => {
            callback({
                userId: row.user_id,
                token: row.token,
                expiresAt: row.expires_at,
                createdAt: row.created_at
            }, row.session_id);
        });
    }
};

// ==================== 用户购买记录（替代 Map<key, purchase>）====================

export const userPurchases = {
    get(key) {
        // key 格式: "userId_testTypeId"
        const [userId, testTypeId] = key.split('_');
        if (!userId || !testTypeId) return undefined;
        const row = queryOne(
            'SELECT * FROM user_purchases WHERE user_id = ? AND test_type_id = ?',
            [userId, testTypeId]
        );
        if (!row) return undefined;
        return {
            userId: row.user_id,
            testTypeId: row.test_type_id,
            isActive: !!row.is_active,
            paymentStatus: row.payment_status,
            orderId: row.order_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    },

    set(key, data) {
        const [userId, testTypeId] = key.split('_');
        if (!userId || !testTypeId) return;
        const existing = queryOne(
            'SELECT id FROM user_purchases WHERE user_id = ? AND test_type_id = ?',
            [userId, testTypeId]
        );
        if (existing) {
            execute(
                'UPDATE user_purchases SET is_active = ?, payment_status = ?, order_id = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND test_type_id = ?',
                [data.isActive ? 1 : 0, data.paymentStatus || 0, data.orderId || null, userId, testTypeId]
            );
        } else {
            execute(
                'INSERT INTO user_purchases (user_id, test_type_id, is_active, payment_status, order_id) VALUES (?, ?, ?, ?, ?)',
                [userId, testTypeId, data.isActive ? 1 : 0, data.paymentStatus || 0, data.orderId || null]
            );
        }
        saveDatabase();
    },

    has(key) {
        return this.get(key) !== undefined;
    },

    delete(key) {
        const [userId, testTypeId] = key.split('_');
        if (!userId || !testTypeId) return;
        execute('DELETE FROM user_purchases WHERE user_id = ? AND test_type_id = ?', [userId, testTypeId]);
        saveDatabase();
    }
};

// ==================== 测试记录（替代 Map<testId, test>）====================

export const tests = {
    get(testId) {
        const row = queryOne('SELECT * FROM tests WHERE id = ?', [testId]);
        if (!row) return undefined;
        return _rowToTest(row);
    },

    set(testId, data) {
        const existing = queryOne('SELECT id FROM tests WHERE id = ?', [testId]);
        if (existing) {
            execute(
                `UPDATE tests SET user_id = ?, type = ?, method = ?, person_a = ?, person_b = ?,
                 hexagram = ?, status = ?, result = ?, completed_at = ? WHERE id = ?`,
                [
                    data.userId || data.user_id || null,
                    data.type, data.method,
                    data.personA ? JSON.stringify(data.personA) : data.person_a || null,
                    data.personB ? JSON.stringify(data.personB) : data.person_b || null,
                    data.hexagram ? (typeof data.hexagram === 'string' ? data.hexagram : JSON.stringify(data.hexagram)) : null,
                    data.status || 'pending',
                    data.result ? JSON.stringify(data.result) : null,
                    data.completedAt || data.completed_at || null,
                    testId
                ]
            );
        } else {
            execute(
                `INSERT INTO tests (id, user_id, type, method, person_a, person_b, hexagram, status, result, completed_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    testId,
                    data.userId || data.user_id || null,
                    data.type, data.method,
                    data.personA ? JSON.stringify(data.personA) : null,
                    data.personB ? JSON.stringify(data.personB) : null,
                    data.hexagram ? (typeof data.hexagram === 'string' ? data.hexagram : JSON.stringify(data.hexagram)) : null,
                    data.status || 'pending',
                    data.result ? JSON.stringify(data.result) : null,
                    data.completedAt || data.completed_at || null
                ]
            );
        }
        saveDatabase();
    },

    has(testId) {
        return !!queryOne('SELECT id FROM tests WHERE id = ?', [testId]);
    },

    delete(testId) {
        execute('DELETE FROM tests WHERE id = ?', [testId]);
        saveDatabase();
    },

    forEach(callback) {
        const rows = queryAll('SELECT * FROM tests');
        rows.forEach(row => {
            callback(_rowToTest(row), row.id);
        });
    },

    values() {
        const rows = queryAll('SELECT * FROM tests');
        return rows.map(row => _rowToTest(row));
    }
};

function _rowToTest(row) {
    let personA = row.person_a;
    let personB = row.person_b;
    let hexagram = row.hexagram;
    let result = row.result;
    try { if (personA) personA = JSON.parse(personA); } catch (e) { }
    try { if (personB) personB = JSON.parse(personB); } catch (e) { }
    try { if (hexagram) hexagram = JSON.parse(hexagram); } catch (e) { }
    try { if (result) result = JSON.parse(result); } catch (e) { }

    return {
        id: row.id,
        userId: row.user_id,
        type: row.type,
        method: row.method,
        personA,
        personB,
        hexagram,
        status: row.status,
        result,
        createdAt: row.created_at,
        completedAt: row.completed_at
    };
}

// ==================== 订单记录（替代 Map<orderId, order>）====================

export const orders = {
    get(orderId) {
        const row = queryOne('SELECT * FROM client_orders WHERE id = ?', [orderId]);
        if (!row) return undefined;
        return _rowToOrder(row);
    },

    set(orderId, data) {
        const existing = queryOne('SELECT id FROM client_orders WHERE id = ?', [orderId]);
        if (existing) {
            execute(
                `UPDATE client_orders SET user_id = ?, product_id = ?, product_name = ?, amount = ?,
                 credits = ?, payment_method = ?, test_type = ?, status = ?, redeem_code = ?,
                 payment_id = ?, paid_at = ?, redeemed_at = ?, expires_at = ? WHERE id = ?`,
                [
                    data.userId || data.user_id || null,
                    data.productId || data.product_id || null,
                    data.productName || data.product_name || null,
                    data.amount || 0,
                    data.credits || 0,
                    data.paymentMethod || data.payment_method || null,
                    data.testType || data.test_type || null,
                    data.status || 'pending',
                    data.redeemCode || data.redeem_code || null,
                    data.paymentId || data.payment_id || null,
                    data.paidAt || data.paid_at || null,
                    data.redeemedAt || data.redeemed_at || null,
                    data.expiresAt || data.expires_at || null,
                    orderId
                ]
            );
        } else {
            execute(
                `INSERT INTO client_orders (id, user_id, product_id, product_name, amount, credits,
                 payment_method, test_type, status, redeem_code, payment_id, paid_at, redeemed_at, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    data.userId || data.user_id || null,
                    data.productId || data.product_id || null,
                    data.productName || data.product_name || null,
                    data.amount || 0,
                    data.credits || 0,
                    data.paymentMethod || data.payment_method || null,
                    data.testType || data.test_type || null,
                    data.status || 'pending',
                    data.redeemCode || data.redeem_code || null,
                    data.paymentId || data.payment_id || null,
                    data.paidAt || data.paid_at || null,
                    data.redeemedAt || data.redeemed_at || null,
                    data.expiresAt || data.expires_at || null
                ]
            );
        }
        saveDatabase();
    },

    has(orderId) {
        return !!queryOne('SELECT id FROM client_orders WHERE id = ?', [orderId]);
    },

    delete(orderId) {
        execute('DELETE FROM client_orders WHERE id = ?', [orderId]);
        saveDatabase();
    },

    forEach(callback) {
        const rows = queryAll('SELECT * FROM client_orders');
        rows.forEach(row => {
            callback(_rowToOrder(row), row.id);
        });
    },

    values() {
        const rows = queryAll('SELECT * FROM client_orders');
        return rows.map(row => _rowToOrder(row));
    }
};

function _rowToOrder(row) {
    return {
        id: row.id,
        userId: row.user_id,
        productId: row.product_id,
        productName: row.product_name,
        amount: row.amount,
        credits: row.credits,
        paymentMethod: row.payment_method,
        testType: row.test_type,
        status: row.status,
        redeemCode: row.redeem_code,
        paymentId: row.payment_id,
        createdAt: row.created_at,
        paidAt: row.paid_at,
        redeemedAt: row.redeemed_at,
        expiresAt: row.expires_at
    };
}

// ==================== 定时清理过期数据 ====================
setInterval(() => {
    try {
        const now = getNowLocal();
        // 清理过期验证码
        execute('DELETE FROM verification_codes WHERE expires_at < ?', [now]);
        // 清理过期会话
        execute('DELETE FROM user_sessions WHERE expires_at < ?', [now]);
    } catch (e) {
        // 数据库可能尚未初始化，忽略
    }
}, 60 * 1000); // 每分钟执行一次

export default { users, verificationCodes, userSessions, userPurchases, tests, orders, smsRateLimit };
