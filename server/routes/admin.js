/**
 * 后台管理路由
 * 提供用户管理、管理员管理、订单管理、数据管理、券码管理、系统管理等接口
 */
import express from 'express';
import { User, Admin, Payment, RedeemCode, SessionMatchRecord, OperationLog, Question, TopicCategory, SystemConfig, XhsTopic, XhsMenu } from '../database/models/index.js';
import { queryAll, queryOne, execute, saveDatabase, getNowLocal } from '../database/index.js';

const router = express.Router();

// ==================== 管理员认证 ====================

/**
 * POST /api/admin/login
 * 管理员登录
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
        }

        const admin = await Admin.validatePassword(username, password);
        if (!admin) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        if (!admin.status) {
            return res.status(403).json({ code: 403, message: '账号已被禁用' });
        }

        Admin.updateLastLogin(admin.id);
        saveDatabase();

        res.json({
            code: 200,
            message: '登录成功',
            data: {
                token: 'admin-token-' + admin.id + '-' + Date.now(),
                admin: {
                    id: admin.id,
                    username: admin.username,
                    is_super_admin: admin.is_super_admin
                }
            }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

/**
 * GET /api/admin/profile
 */
router.get('/profile', (req, res) => {
    try {
        const admin = Admin.findByUsername('admin') || {};
        res.json({
            code: 200,
            data: {
                id: admin.id || 1,
                username: admin.username || 'admin',
                email: admin.email || '',
                phone: admin.phone || '',
                is_super_admin: admin.is_super_admin || 1,
                roles: [{ id: 1, code: 'super_admin', name: '超级管理员' }],
                permissions: [{ id: 1, code: 'system:all', name: '所有权限', type: 'menu' }]
            }
        });
    } catch (error) {
        res.json({
            code: 200,
            data: { id: 1, username: 'admin', is_super_admin: 1 }
        });
    }
});

/**
 * GET /api/admin/menu
 */
router.get('/menu', (req, res) => {
    const menuData = [
        { id: 1, code: 'dashboard', name: '仪表盘', type: 'menu', icon: '📊', children: [] },
        {
            id: 2, code: 'user-manage', name: '用户管理', type: 'menu', icon: '👥',
            children: [{ id: 21, code: 'user:list', name: '用户列表', type: 'menu', icon: '👤' }]
        },
        {
            id: 3, code: 'admin-manage', name: '管理员管理', type: 'menu', icon: '🔑',
            children: [{ id: 31, code: 'admin:list', name: '管理员列表', type: 'menu', icon: '👨‍💼' }]
        },
        {
            id: 4, code: 'order-manage', name: '订单管理', type: 'menu', icon: '📋',
            children: [{ id: 41, code: 'order:list', name: '订单列表', type: 'menu', icon: '💰' }]
        },
        {
            id: 5, code: 'data-manage', name: '数据管理', type: 'menu', icon: '📊',
            children: [{ id: 51, code: 'match:list', name: '匹配记录', type: 'menu', icon: '🔗' }]
        },
        {
            id: 6, code: 'coupon-manage', name: '券码管理', type: 'menu', icon: '🎫',
            children: [
                { id: 61, code: 'coupon:list', name: '券码列表', type: 'menu', icon: '🏷️' },
                { id: 62, code: 'coupon:redeem', name: '兑换记录', type: 'menu', icon: '📝' }
            ]
        },
        {
            id: 7, code: 'system-manage', name: '系统管理', type: 'menu', icon: '⚙️',
            children: [
                { id: 71, code: 'system:question', name: '问题管理', type: 'menu', icon: '❓' },
                { id: 72, code: 'system:topic-category', name: '主题分类', type: 'menu', icon: '📂' },
                { id: 73, code: 'system:config', name: '系统配置', type: 'menu', icon: '🔧' }
            ]
        },
        {
            id: 8, code: 'xhs-manage', name: '小红书管理', type: 'menu', icon: '📕',
            children: [
                { id: 81, code: 'xhs:topic-config', name: '主题配置', type: 'menu', icon: '🏷️' },
                { id: 82, code: 'xhs:menu-manage', name: '菜单管理', type: 'menu', icon: '📑' }
            ]
        }
    ];
    res.json({ code: 200, data: menuData });
});

// ==================== 仪表盘统计 ====================

router.get('/dashboard/stats', (req, res) => {
    try {
        const totalUsers = queryOne('SELECT COUNT(*) as count FROM users')?.count || 0;
        const totalPayments = queryOne('SELECT COUNT(*) as count FROM client_orders')?.count || 0;
        const totalRevenue = queryOne("SELECT SUM(amount) as total FROM client_orders WHERE status = 'paid'")?.total || 0;
        const totalMatches = queryOne('SELECT COUNT(*) as count FROM session_match_records WHERE status = 1')?.count || 0;
        const totalCoupons = queryOne('SELECT COUNT(*) as count FROM redeem_codes')?.count || 0;

        res.json({
            code: 200,
            data: { totalUsers, totalPayments, totalRevenue: Math.round(totalRevenue * 100) / 100, totalMatches, totalCoupons }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 用户管理 ====================

router.get('/users', (req, res) => {
    try {
        const { page = 1, limit = 20, keyword, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let sql = 'SELECT id, username, phone, email, role, status, created_at, updated_at FROM users WHERE 1=1';
        let countSql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
        const params = [];
        const countParams = [];

        if (keyword) {
            sql += ' AND (username LIKE ? OR phone LIKE ?)';
            countSql += ' AND (username LIKE ? OR phone LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
            countParams.push(`%${keyword}%`, `%${keyword}%`);
        }

        if (status !== undefined && status !== '' && status !== null) {
            sql += ' AND status = ?';
            countSql += ' AND status = ?';
            params.push(parseInt(status));
            countParams.push(parseInt(status));
        }

        const total = queryOne(countSql, countParams)?.count || 0;
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        const list = queryAll(sql, params);

        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.put('/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { username, phone, email, role } = req.body;
        const user = User.findById(parseInt(id));
        if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });

        const updateData = {};
        if (username !== undefined) updateData.username = username;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;

        User.update(parseInt(id), updateData);
        saveDatabase();
        res.json({ code: 200, message: '更新成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.put('/users/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = User.findById(parseInt(id));
        if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });

        User.update(parseInt(id), { status: status ? 1 : 0 });
        saveDatabase();
        res.json({ code: 200, message: status ? '已启用' : '已停用' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 管理员管理 ====================

router.get('/admins', (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const total = queryOne('SELECT COUNT(*) as count FROM admins')?.count || 0;
        const list = queryAll(
            'SELECT id, username, email, phone, is_super_admin, status, last_login_at, created_at FROM admins ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [parseInt(limit), offset]
        );
        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.post('/admins', async (req, res) => {
    try {
        const { username, password, email, phone } = req.body;
        if (!username || !password) return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
        if (Admin.findByUsername(username)) return res.status(400).json({ code: 400, message: '用户名已存在' });

        const admin = await Admin.create({ username, password, email, phone });
        saveDatabase();
        res.json({ code: 200, message: '创建成功', data: admin });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.put('/admins/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, phone, password } = req.body;
        const admin = Admin.findById(parseInt(id));
        if (!admin) return res.status(404).json({ code: 404, message: '管理员不存在' });

        const updateData = {};
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (password) updateData.password = password;

        Admin.update(parseInt(id), updateData);
        saveDatabase();
        res.json({ code: 200, message: '更新成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.put('/admins/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const admin = Admin.findById(parseInt(id));
        if (!admin) return res.status(404).json({ code: 404, message: '管理员不存在' });
        if (admin.is_super_admin) return res.status(403).json({ code: 403, message: '不能停用超级管理员' });

        Admin.update(parseInt(id), { status: status ? 1 : 0 });
        saveDatabase();
        res.json({ code: 200, message: status ? '已启用' : '已停用' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 订单管理 ====================

router.get('/orders', (req, res) => {
    try {
        const { page = 1, limit = 20, keyword, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let sql = 'SELECT o.*, u.username as user_name FROM client_orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1';
        let countSql = 'SELECT COUNT(*) as count FROM client_orders WHERE 1=1';
        const params = [];
        const countParams = [];

        if (keyword) {
            sql += ' AND (o.id LIKE ? OR o.product_name LIKE ? OR u.username LIKE ?)';
            countSql += ' AND (id LIKE ? OR product_name LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
            countParams.push(`%${keyword}%`, `%${keyword}%`);
        }

        if (status) {
            sql += ' AND o.status = ?';
            countSql += ' AND status = ?';
            params.push(status);
            countParams.push(status);
        }

        const total = queryOne(countSql, countParams)?.count || 0;
        sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        const list = queryAll(sql, params);

        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 数据管理（匹配记录） ====================

router.get('/match-records', (req, res) => {
    try {
        const { page = 1, limit = 20, status, method, type } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let sql = "SELECT s.*, u.username as user_name, datetime(s.create_date, '+8 hours') as create_date FROM session_match_records s LEFT JOIN users u ON s.user_id = CAST(u.uid AS TEXT) WHERE 1=1";
        let countSql = 'SELECT COUNT(*) as count FROM session_match_records WHERE 1=1';
        const params = [];
        const countParams = [];

        if (status !== undefined && status !== '' && status !== null) {
            sql += ' AND s.status = ?';
            countSql += ' AND status = ?';
            params.push(parseInt(status));
            countParams.push(parseInt(status));
        }

        if (method) {
            sql += ' AND s.method = ?';
            countSql += ' AND method = ?';
            params.push(method);
            countParams.push(method);
        }

        if (type) {
            sql += ' AND s.type = ?';
            countSql += ' AND type = ?';
            params.push(type);
            countParams.push(type);
        }

        const total = queryOne(countSql, countParams)?.count || 0;
        sql += ' ORDER BY s.create_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const list = queryAll(sql, params).map(record => {
            try { if (record.req_data) record.req_data = JSON.parse(record.req_data); } catch (e) { }
            try { if (record.result_data) record.result_data = JSON.parse(record.result_data); } catch (e) { }
            return record;
        });

        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.get('/match-records/:id', (req, res) => {
    try {
        const { id } = req.params;
        const record = queryOne("SELECT s.*, u.username as user_name, datetime(s.create_date, '+8 hours') as create_date FROM session_match_records s LEFT JOIN users u ON s.user_id = CAST(u.uid AS TEXT) WHERE s.id = ?", [parseInt(id)]);
        if (!record) return res.status(404).json({ code: 404, message: '记录不存在' });

        try { if (record.req_data) record.req_data = JSON.parse(record.req_data); } catch (e) { }
        try { if (record.result_data) record.result_data = JSON.parse(record.result_data); } catch (e) { }

        res.json({ code: 200, data: record });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 券码管理 ====================

router.get('/coupons', (req, res) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let sql = 'SELECT * FROM redeem_codes WHERE 1=1';
        let countSql = 'SELECT COUNT(*) as count FROM redeem_codes WHERE 1=1';
        const params = [];
        const countParams = [];

        if (status) { sql += ' AND status = ?'; countSql += ' AND status = ?'; params.push(status); countParams.push(status); }
        if (type) { sql += ' AND type = ?'; countSql += ' AND type = ?'; params.push(type); countParams.push(type); }

        const total = queryOne(countSql, countParams)?.count || 0;
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        const list = queryAll(sql, params);

        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.post('/coupons/generate', (req, res) => {
    try {
        const { type = 'single', max_uses = 1, count = 1 } = req.body;
        if (count < 1 || count > 100) return res.status(400).json({ code: 400, message: '数量必须在1-100之间' });
        if (type === 'multi' && (max_uses < 1 || max_uses > 100)) return res.status(400).json({ code: 400, message: '使用次数必须在1-100之间' });

        const codes = RedeemCode.createBatch(parseInt(count), {
            type, max_uses: type === 'single' ? 1 : parseInt(max_uses), source: 'admin'
        });
        saveDatabase();
        res.json({ code: 200, message: `成功生成 ${codes.length} 个券码`, data: codes });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.put('/coupons/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { type, max_uses, status, remark } = req.body;
        const coupon = RedeemCode.findById(parseInt(id));
        if (!coupon) return res.status(404).json({ code: 404, message: '券码不存在' });

        const fields = [];
        const params = [];
        if (type !== undefined) { fields.push('type = ?'); params.push(type); }
        if (max_uses !== undefined) { fields.push('max_uses = ?'); params.push(parseInt(max_uses)); }
        if (status !== undefined) { fields.push('status = ?'); params.push(status); }
        if (remark !== undefined) { fields.push('remark = ?'); params.push(remark); }

        if (fields.length > 0) {
            fields.push('updated_at = ?');
            params.push(getNowLocal());
            // 把 id 放最后
            params.push(parseInt(id));
            execute(`UPDATE redeem_codes SET ${fields.join(', ')} WHERE id = ?`, params);
            saveDatabase();
        }
        res.json({ code: 200, message: '更新成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.get('/coupons/redeem-records', (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const total = queryOne("SELECT COUNT(*) as count FROM redeem_codes WHERE used_count > 0")?.count || 0;
        const list = queryAll("SELECT * FROM redeem_codes WHERE used_count > 0 ORDER BY updated_at DESC LIMIT ? OFFSET ?", [parseInt(limit), offset]);
        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 系统管理 - 问题管理 ====================

router.get('/questions', (req, res) => {
    try {
        const { page = 1, limit = 20, category, status, keyword } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const total = Question.count({ category, status, keyword });
        const list = Question.findAll({ category, status, keyword, limit: parseInt(limit), offset });
        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.get('/questions/:id', (req, res) => {
    try {
        const question = Question.findById(parseInt(req.params.id));
        if (!question) return res.status(404).json({ code: 404, message: '问题不存在' });
        res.json({ code: 200, data: question });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.post('/questions', (req, res) => {
    try {
        const { title, content, category, sort_order } = req.body;
        if (!title) return res.status(400).json({ code: 400, message: '标题不能为空' });

        const question = Question.create({
            title, content: content || '', category: category || 'general',
            sort_order: sort_order || 0, created_by: 1
        });
        saveDatabase();
        res.json({ code: 200, message: '创建成功', data: question });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.put('/questions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, status, sort_order } = req.body;
        if (!Question.findById(parseInt(id))) return res.status(404).json({ code: 404, message: '问题不存在' });

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (category !== undefined) updateData.category = category;
        if (status !== undefined) updateData.status = parseInt(status);
        if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);

        Question.update(parseInt(id), updateData);
        saveDatabase();
        res.json({ code: 200, message: '更新成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.delete('/questions/:id', (req, res) => {
    try {
        if (!Question.findById(parseInt(req.params.id))) return res.status(404).json({ code: 404, message: '问题不存在' });
        Question.delete(parseInt(req.params.id));
        saveDatabase();
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 系统管理 - 主题分类 ====================

router.get('/topic-categories', (req, res) => {
    try {
        const { page = 1, limit = 20, status, keyword } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const total = TopicCategory.count({ status, keyword });
        const list = TopicCategory.findAll({ status, keyword, limit: parseInt(limit), offset });
        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.post('/topic-categories', (req, res) => {
    try {
        const { name, description, sort_order } = req.body;
        if (!name) return res.status(400).json({ code: 400, message: '分类名称不能为空' });
        if (TopicCategory.findByName(name)) return res.status(400).json({ code: 400, message: '分类名称已存在' });

        const category = TopicCategory.create({ name, description: description || '', sort_order: sort_order || 0 });
        saveDatabase();
        res.json({ code: 200, message: '创建成功', data: category });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.put('/topic-categories/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status, sort_order } = req.body;
        if (!TopicCategory.findById(parseInt(id))) return res.status(404).json({ code: 404, message: '分类不存在' });

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = parseInt(status);
        if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);

        TopicCategory.update(parseInt(id), updateData);
        saveDatabase();
        res.json({ code: 200, message: '更新成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.delete('/topic-categories/:id', (req, res) => {
    try {
        if (!TopicCategory.findById(parseInt(req.params.id))) return res.status(404).json({ code: 404, message: '分类不存在' });
        TopicCategory.delete(parseInt(req.params.id));
        saveDatabase();
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 系统管理 - 系统配置 ====================

router.get('/system-configs', (req, res) => {
    try {
        const { page = 1, limit = 20, status, keyword } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const total = SystemConfig.count({ status, keyword });
        const list = SystemConfig.findAll({ status, keyword, limit: parseInt(limit), offset });
        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.post('/system-configs', (req, res) => {
    try {
        const { name, status } = req.body;
        if (!name) return res.status(400).json({ code: 400, message: '配置名称不能为空' });
        if (SystemConfig.findByName(name)) return res.status(400).json({ code: 400, message: '配置名称已存在' });

        const config = SystemConfig.create({ name, status: status !== undefined ? parseInt(status) : 1 });
        saveDatabase();
        res.json({ code: 200, message: '创建成功', data: config });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.put('/system-configs/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, status } = req.body;
        if (!SystemConfig.findById(parseInt(id))) return res.status(404).json({ code: 404, message: '配置不存在' });

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (status !== undefined) updateData.status = parseInt(status);

        SystemConfig.update(parseInt(id), updateData);
        saveDatabase();
        res.json({ code: 200, message: '更新成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

router.delete('/system-configs/:id', (req, res) => {
    try {
        if (!SystemConfig.findById(parseInt(req.params.id))) return res.status(404).json({ code: 404, message: '配置不存在' });
        SystemConfig.delete(parseInt(req.params.id));
        saveDatabase();
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 小红书主题管理 ====================

// 获取小红书主题列表
router.get('/xhs-topics', (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const total = XhsTopic.count({ status });
        const list = XhsTopic.findAll({ status, limit: parseInt(limit), offset });
        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 批量添加小红书主题（接收主题分类ID数组）
router.post('/xhs-topics/batch', (req, res) => {
    try {
        const { topicCategoryIds } = req.body;
        if (!topicCategoryIds || !Array.isArray(topicCategoryIds) || topicCategoryIds.length === 0) {
            return res.status(400).json({ code: 400, message: '请选择至少一个主题分类' });
        }

        const results = XhsTopic.createBatch(topicCategoryIds.map(id => parseInt(id)));
        saveDatabase();
        res.json({ code: 200, message: `成功添加 ${results.length} 个主题`, data: results });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 修改小红书主题状态（显示/隐藏）
router.put('/xhs-topics/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!XhsTopic.findById(parseInt(id))) return res.status(404).json({ code: 404, message: '记录不存在' });

        XhsTopic.update(parseInt(id), { status: parseInt(status) });
        saveDatabase();
        res.json({ code: 200, message: status ? '已显示' : '已隐藏' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 删除小红书主题
router.delete('/xhs-topics/:id', (req, res) => {
    try {
        if (!XhsTopic.findById(parseInt(req.params.id))) return res.status(404).json({ code: 404, message: '记录不存在' });
        XhsTopic.delete(parseInt(req.params.id));
        saveDatabase();
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 小红书菜单管理 ====================

// 获取小红书菜单列表
router.get('/xhs-menus', (req, res) => {
    try {
        const { page = 1, limit = 20, status, keyword } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const total = XhsMenu.count({ status, keyword });
        const list = XhsMenu.findAll({ status, keyword, limit: parseInt(limit), offset });

        res.json({
            code: 200,
            data: { list, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 获取单个小红书菜单详情
router.get('/xhs-menus/:id', (req, res) => {
    try {
        const menu = XhsMenu.findById(parseInt(req.params.id));
        if (!menu) return res.status(404).json({ code: 404, message: '菜单不存在' });
        res.json({ code: 200, data: menu });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 创建小红书菜单
router.post('/xhs-menus', (req, res) => {
    try {
        const { name, description = '', status = 1 } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ code: 400, message: '菜单名称不能为空' });
        }

        const menu = XhsMenu.create({ name: name.trim(), description, status });
        saveDatabase();
        res.json({ code: 200, message: '创建成功', data: menu });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 更新小红书菜单
router.put('/xhs-menus/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        if (!XhsMenu.findById(parseInt(id))) {
            return res.status(404).json({ code: 404, message: '菜单不存在' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = parseInt(status);

        if (Object.keys(updateData).length > 0) {
            XhsMenu.update(parseInt(id), updateData);
        }

        saveDatabase();
        res.json({ code: 200, message: '更新成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// 删除小红书菜单
router.delete('/xhs-menus/:id', (req, res) => {
    try {
        const menuId = parseInt(req.params.id);
        if (!XhsMenu.findById(menuId)) {
            return res.status(404).json({ code: 404, message: '菜单不存在' });
        }
        XhsMenu.delete(menuId);
        saveDatabase();
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
});

// ==================== 兼容旧接口 ====================

router.get('/roles', (req, res) => {
    const roles = queryAll('SELECT * FROM roles ORDER BY created_at DESC');
    res.json({ code: 200, data: roles });
});

router.get('/permissions', (req, res) => {
    const list = queryAll('SELECT * FROM permissions ORDER BY id ASC');
    res.json({ code: 200, data: { list, tree: [] } });
});

export default router;