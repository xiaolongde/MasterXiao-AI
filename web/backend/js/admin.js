/**
 * 管理后台主逻辑
 * 包含：仪表盘、用户管理、管理员管理、订单管理、数据管理、券码管理、系统管理
 */

// 动态获取 API 基础地址（自动适配当前访问域名和端口）
function getApiBase() {
    // 管理后台由 Express 同端口静态托管，使用相对路径即可
    // 无论是 localhost、局域网IP、云服务器域名，都能正确访问
    return '/api/admin';
}

const API_BASE = getApiBase();
let currentPage = {};  // 每个模块的当前页码

function getToken() {
    return localStorage.getItem('adminToken');
}

function apiHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

async function apiFetch(url, options = {}) {
    const response = await fetch(API_BASE + url, {
        headers: apiHeaders(),
        ...options
    });
    return response.json();
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    initAdmin();
});

function initAdmin() {
    loadAdminInfo();
    loadMenu();
    startClock();
    initMenuToggle();
    initLogout();
    loadPage('dashboard');
}

async function loadAdminInfo() {
    try {
        const result = await apiFetch('/profile');
        if (result.code === 200) {
            const adminData = result.data;
            localStorage.setItem('adminInfo', JSON.stringify(adminData));
            const adminName = document.getElementById('adminName');
            if (adminName) adminName.textContent = adminData.username;
        }
    } catch (error) {
        console.error('加载管理员信息出错:', error);
    }
}

async function loadMenu() {
    try {
        const result = await apiFetch('/menu');
        if (result.code === 200) {
            renderMenu(result.data);
            initNavigation();
        }
    } catch (error) {
        console.error('加载菜单出错:', error);
    }
}

function renderMenu(menuData) {
    const navMenu = document.getElementById('navMenu');
    navMenu.innerHTML = '';

    menuData.forEach(item => {
        const li = document.createElement('li');
        li.className = 'nav-item';

        if (item.children && item.children.length > 0) {
            li.classList.add('has-submenu');
            li.innerHTML = `
                <a href="#" class="nav-link" data-page="${item.code}">
                    <span class="nav-icon">${item.icon || '📁'}</span>
                    <span class="nav-text">${item.name}</span>
                    <span class="submenu-arrow">▼</span>
                </a>
                <ul class="submenu">
                    ${item.children.map(child => `
                        <li>
                            <a href="#" class="nav-link" data-page="${child.code}">
                                <span class="nav-icon">${child.icon || '📄'}</span>
                                <span class="nav-text">${child.name}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            li.innerHTML = `
                <a href="#" class="nav-link" data-page="${item.code}">
                    <span class="nav-icon">${item.icon || '📄'}</span>
                    <span class="nav-text">${item.name}</span>
                </a>
            `;
        }
        navMenu.appendChild(li);
    });
}

function startClock() {
    const timeElement = document.getElementById('currentTime');
    function updateTime() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        timeElement.textContent = `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
    }
    updateTime();
    setInterval(updateTime, 1000);
}

function initNavigation() {
    document.getElementById('navMenu').addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link[data-page]');
        if (!link) return;
        e.preventDefault();

        const parent = link.parentElement;
        const submenu = link.nextElementSibling;
        if (parent && parent.classList.contains('has-submenu') && submenu && submenu.classList.contains('submenu')) {
            parent.classList.toggle('open');
            return;
        }

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        loadPage(link.dataset.page);

        document.querySelector('.sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });
}

function initMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });

    document.querySelector('.main-content').addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });
}

function initLogout() {
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminInfo');
            window.location.href = 'login.html';
        }
    });
}

// ==================== 页面路由 ====================

const pageTitles = {
    'dashboard': '仪表盘',
    'user:list': '用户列表',
    'admin:list': '管理员列表',
    'order:list': '订单列表',
    'match:list': '匹配记录',
    'coupon:list': '券码列表',
    'coupon:redeem': '兑换记录',
    'system:question': '问题管理',
    'system:topic-category': '主题分类',
    'system:config': '系统配置',
    'xhs:topic-config': '小红书主题配置',
    'xhs:menu-manage': '小红书菜单管理'
};

function loadPage(page) {
    const content = document.getElementById('content');
    const pageTitle = document.getElementById('pageTitle');
    pageTitle.textContent = pageTitles[page] || '管理后台';

    switch (page) {
        case 'dashboard': renderDashboard(); break;
        case 'user:list': renderUserList(); break;
        case 'admin:list': renderAdminList(); break;
        case 'order:list': renderOrderList(); break;
        case 'match:list': renderMatchRecordList(); break;
        case 'coupon:list': renderCouponList(); break;
        case 'coupon:redeem': renderRedeemRecordList(); break;
        case 'system:question': renderQuestionManage(); break;
        case 'system:topic-category': renderTopicCategoryManage(); break;
        case 'system:config': renderSystemConfigManage(); break;
        case 'xhs:topic-config': renderXhsTopicConfig(); break;
        case 'xhs:menu-manage': renderXhsMenuManage(); break;
        default: renderDashboard();
    }
}

// ==================== 仪表盘 ====================

async function renderDashboard() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const result = await apiFetch('/dashboard/stats');
        const stats = result.code === 200 ? result.data : { totalUsers: 0, totalPayments: 0, totalRevenue: 0, totalMatches: 0, totalCoupons: 0 };

        content.innerHTML = `
            <div class="dashboard-stats">
                <div class="stat-card stat-card--clickable" data-goto="user:list" title="查看用户列表"><div class="stat-icon users">👥</div><div class="stat-info"><h3>${stats.totalUsers}</h3><p>注册用户</p></div></div>
                <div class="stat-card stat-card--clickable" data-goto="order:list" title="查看订单列表"><div class="stat-icon orders">📋</div><div class="stat-info"><h3>${stats.totalPayments}</h3><p>总订单数</p></div></div>
                <div class="stat-card"><div class="stat-icon revenue">💰</div><div class="stat-info"><h3>¥${stats.totalRevenue}</h3><p>总收入</p></div></div>
                <div class="stat-card stat-card--clickable" data-goto="match:list" title="查看匹配记录"><div class="stat-icon matches">✨</div><div class="stat-info"><h3>${stats.totalMatches}</h3><p>匹配次数</p></div></div>
                <div class="stat-card stat-card--clickable" data-goto="coupon:list" title="查看券码列表"><div class="stat-icon coupons">🎫</div><div class="stat-info"><h3>${stats.totalCoupons}</h3><p>券码总数</p></div></div>
            </div>
        `;

        // 绑定统计卡片点击跳转
        content.querySelectorAll('.stat-card--clickable').forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.goto;
                if (page) {
                    // 高亮对应菜单项
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    const targetLink = document.querySelector(`.nav-link[data-page="${page}"]`);
                    if (targetLink) {
                        targetLink.classList.add('active');
                        // 展开父菜单
                        const parentItem = targetLink.closest('.has-submenu');
                        if (parentItem) parentItem.classList.add('open');
                    }
                    loadPage(page);
                }
            });
        });
    } catch (error) {
        content.innerHTML = `<div class="error-text">加载仪表盘失败: ${error.message}</div>`;
    }
}

// ==================== 通用分页渲染 ====================

function renderPagination(pagination, onPageChange) {
    const { page, limit, total } = pagination;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    return `
        <div class="pagination">
            <div class="pagination-info">显示 ${total > 0 ? start : 0}-${end} 条，共 ${total} 条</div>
            <div class="pagination-btns">
                <button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="${onPageChange}(${page - 1})">上一页</button>
                ${Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : Math.min(page - 2 + i, totalPages);
                    return p <= totalPages ? `<button class="page-btn ${p === page ? 'active' : ''}" onclick="${onPageChange}(${p})">${p}</button>` : '';
                }).join('')}
                <button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="${onPageChange}(${page + 1})">下一页</button>
            </div>
        </div>
    `;
}

// ==================== 用户管理 ====================

async function renderUserList(page = 1, keyword = '') {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const params = new URLSearchParams({ page, limit: 15, keyword });
        const result = await apiFetch('/users?' + params);

        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        content.innerHTML = `
            <div class="data-card">
                <div class="card-header">
                    <h2>用户列表</h2>
                    <div class="card-actions">
                        <div class="search-box">
                            <span>🔍</span>
                            <input type="text" id="userSearchInput" placeholder="搜索用户名/手机号..." value="${keyword}" onkeydown="if(event.key==='Enter')searchUsers()">
                        </div>
                        <button class="btn btn-primary" onclick="searchUsers()">搜索</button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>用户名称</th>
                                <th>手机号</th>
                                <th>性别</th>
                                <th>注册时间</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.length === 0 ? '<tr><td colspan="7" class="empty-text">暂无数据</td></tr>' : list.map((user, index) => `
                                <tr>
                                    <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                    <td>${user.username || '-'}</td>
                                    <td>${user.phone || '-'}</td>
                                    <td>${user.role === 'male' ? '男' : user.role === 'female' ? '女' : '-'}</td>
                                    <td>${formatDate(user.created_at)}</td>
                                    <td><span class="status-badge ${user.status ? 'success' : 'failed'}">${user.status ? '正常' : '已停用'}</span></td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn edit" onclick="showEditUserModal(${user.id}, '${escape(user.username || '')}', '${user.phone || ''}')">更新</button>
                                            <button class="action-btn ${user.status ? 'delete' : 'view'}" onclick="toggleUserStatus(${user.id}, ${user.status ? 0 : 1})">${user.status ? '停用' : '启用'}</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${renderPagination(pagination, 'goUserPage')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

function searchUsers() {
    const keyword = document.getElementById('userSearchInput')?.value || '';
    renderUserList(1, keyword);
}

function goUserPage(page) {
    const keyword = document.getElementById('userSearchInput')?.value || '';
    renderUserList(page, keyword);
}

async function toggleUserStatus(id, newStatus) {
    const action = newStatus ? '启用' : '停用';
    if (!confirm(`确定要${action}该用户吗？`)) return;
    try {
        const result = await apiFetch(`/users/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        showToast(result.message || action + '成功');
        renderUserList();
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
}

function showEditUserModal(id, username, phone) {
    showModal('编辑用户', `
        <div class="form-group-modal">
            <label>用户名</label>
            <input type="text" id="editUserName" value="${unescape(username)}" />
        </div>
        <div class="form-group-modal">
            <label>手机号</label>
            <input type="text" id="editUserPhone" value="${phone}" />
        </div>
    `, async () => {
        const result = await apiFetch(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                username: document.getElementById('editUserName').value,
                phone: document.getElementById('editUserPhone').value
            })
        });
        showToast(result.message || '更新成功');
        renderUserList();
    });
}

// ==================== 管理员管理 ====================

async function renderAdminList(page = 1) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const result = await apiFetch(`/admins?page=${page}&limit=15`);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        content.innerHTML = `
            <div class="data-card">
                <div class="card-header">
                    <h2>管理员列表</h2>
                    <button class="btn btn-primary" onclick="showCreateAdminModal()">+ 添加管理员</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>登录账号</th>
                                <th>注册时间</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.length === 0 ? '<tr><td colspan="5" class="empty-text">暂无数据</td></tr>' : list.map((admin, index) => `
                                <tr>
                                    <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                    <td>${admin.username} ${admin.is_super_admin ? '<span class="badge-super">超管</span>' : ''}</td>
                                    <td>${formatDate(admin.created_at)}</td>
                                    <td><span class="status-badge ${admin.status ? 'success' : 'failed'}">${admin.status ? '正常' : '已停用'}</span></td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn edit" onclick="showEditAdminModal(${admin.id}, '${admin.username}', '${admin.email || ''}', '${admin.phone || ''}')">更新</button>
                                            ${!admin.is_super_admin ? `<button class="action-btn ${admin.status ? 'delete' : 'view'}" onclick="toggleAdminStatus(${admin.id}, ${admin.status ? 0 : 1})">${admin.status ? '停用' : '启用'}</button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${renderPagination(pagination, 'goAdminPage')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

function goAdminPage(page) { renderAdminList(page); }

function showCreateAdminModal() {
    showModal('添加管理员', `
        <div class="form-group-modal">
            <label>登录账号 <span class="required">*</span></label>
            <input type="text" id="newAdminUsername" placeholder="请输入登录账号" />
        </div>
        <div class="form-group-modal">
            <label>登录密码 <span class="required">*</span></label>
            <input type="password" id="newAdminPassword" placeholder="请输入密码" />
        </div>
    `, async () => {
        const username = document.getElementById('newAdminUsername').value.trim();
        const password = document.getElementById('newAdminPassword').value;
        if (!username || !password) { showToast('请填写完整信息', 'error'); return; }

        const result = await apiFetch('/admins', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        if (result.code === 200) {
            showToast('创建成功');
            renderAdminList();
        } else {
            showToast(result.message || '创建失败', 'error');
        }
    });
}

function showEditAdminModal(id, username, email, phone) {
    showModal('编辑管理员', `
        <div class="form-group-modal">
            <label>登录账号</label>
            <input type="text" id="editAdminUsername" value="${username}" />
        </div>
        <div class="form-group-modal">
            <label>新密码（留空不修改）</label>
            <input type="password" id="editAdminPassword" placeholder="留空不修改密码" />
        </div>
    `, async () => {
        const data = { username: document.getElementById('editAdminUsername').value };
        const pwd = document.getElementById('editAdminPassword').value;
        if (pwd) data.password = pwd;

        const result = await apiFetch(`/admins/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        showToast(result.message || '更新成功');
        renderAdminList();
    });
}

async function toggleAdminStatus(id, newStatus) {
    const action = newStatus ? '启用' : '停用';
    if (!confirm(`确定要${action}该管理员吗？`)) return;
    try {
        const result = await apiFetch(`/admins/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        showToast(result.message || action + '成功');
        renderAdminList();
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
}

// ==================== 订单管理 ====================

async function renderOrderList(page = 1, keyword = '', statusFilter = '') {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const params = new URLSearchParams({ page, limit: 15, keyword });
        if (statusFilter) params.set('status', statusFilter);
        const result = await apiFetch('/orders?' + params);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        content.innerHTML = `
            <div class="data-card">
                <div class="card-header">
                    <h2>订单列表</h2>
                    <div class="card-actions">
                        <div class="search-box">
                            <span>🔍</span>
                            <input type="text" id="orderSearchInput" placeholder="订单ID/用户名..." value="${keyword}" onkeydown="if(event.key==='Enter')searchOrders()">
                        </div>
                        <select id="orderStatusFilter" class="filter-select" onchange="searchOrders()">
                            <option value="">全部状态</option>
                            <option value="paid" ${statusFilter === 'paid' ? 'selected' : ''}>已支付</option>
                            <option value="paying" ${statusFilter === 'paying' ? 'selected' : ''}>支付中</option>
                            <option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>待支付</option>
                            <option value="expired" ${statusFilter === 'expired' ? 'selected' : ''}>已过期</option>
                            <option value="refunded" ${statusFilter === 'refunded' ? 'selected' : ''}>已退款</option>
                        </select>
                        <button class="btn btn-primary" onclick="searchOrders()">搜索</button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>订单ID</th>
                                <th>商品名称</th>
                                <th>购买用户</th>
                                <th>支付方式</th>
                                <th>创建时间</th>
                                <th>支付金额</th>
                                <th>支付状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.length === 0 ? '<tr><td colspan="8" class="empty-text">暂无数据</td></tr>' : list.map((order, index) => `
                                <tr>
                                    <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                    <td title="${order.id || ''}">${order.id ? order.id.substring(0, 8) + '...' : '-'}</td>
                                    <td>${order.product_name || order.test_type || '-'}</td>
                                    <td>${order.user_name || order.user_id || '-'}</td>
                                    <td>${getPaymentMethodText(order.payment_method)}</td>
                                    <td>${formatDate(order.created_at)}</td>
                                    <td>¥${order.amount || 0}</td>
                                    <td><span class="status-badge ${getOrderStatusClass(order.status)}">${getPaymentStatusText(order.status)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${renderPagination(pagination, 'goOrderPage')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

function searchOrders() {
    const keyword = document.getElementById('orderSearchInput')?.value || '';
    const status = document.getElementById('orderStatusFilter')?.value || '';
    renderOrderList(1, keyword, status);
}

function goOrderPage(page) {
    const keyword = document.getElementById('orderSearchInput')?.value || '';
    const status = document.getElementById('orderStatusFilter')?.value || '';
    renderOrderList(page, keyword, status);
}

function getPaymentStatusText(status) {
    const map = { 'paid': '已支付', 'paying': '支付中', 'pending': '待支付', 'expired': '已过期', 'refunded': '已退款' };
    return map[status] || status || '-';
}

function getOrderStatusClass(status) {
    const map = { 'paid': 'success', 'paying': 'pending', 'pending': 'pending', 'expired': 'failed', 'refunded': 'failed' };
    return map[status] || '';
}

function getPaymentMethodText(method) {
    const map = { 'alipay': '支付宝', 'wechat': '微信支付', 'credits': '积分' };
    return map[method] || method || '-';
}

// ==================== 数据管理（匹配记录） ====================

async function renderMatchRecordList(page = 1, statusFilter = '', methodFilter = '', typeFilter = '') {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const params = new URLSearchParams({ page, limit: 15 });
        if (statusFilter !== '') params.set('status', statusFilter);
        if (methodFilter) params.set('method', methodFilter);
        if (typeFilter) params.set('type', typeFilter);
        const result = await apiFetch('/match-records?' + params);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        const statusMap = { 0: '请求中', 1: '成功', 2: '失败' };
        const statusClass = { 0: 'pending', 1: 'success', 2: 'failed' };
        const typeMap = { 'love': '感情匹配', 'work': '职场关系', 'cooperate': '合作关系', 'attitude': 'TA的态度', 'friend': '友情匹配' };
        const methodMap = { 'birthday': '生日匹配', 'tarot': '塔罗牌' };

        content.innerHTML = `
            <div class="data-card">
                <div class="card-header">
                    <h2>匹配记录</h2>
                    <div class="card-actions">
                        <select id="matchTypeFilter" class="filter-select" onchange="filterMatchRecords()">
                            <option value="">全部类型</option>
                            <option value="love" ${typeFilter === 'love' ? 'selected' : ''}>感情匹配</option>
                            <option value="work" ${typeFilter === 'work' ? 'selected' : ''}>职场关系</option>
                            <option value="cooperate" ${typeFilter === 'cooperate' ? 'selected' : ''}>合作关系</option>
                            <option value="attitude" ${typeFilter === 'attitude' ? 'selected' : ''}>TA的态度</option>
                            <option value="friend" ${typeFilter === 'friend' ? 'selected' : ''}>友情匹配</option>
                        </select>
                        <select id="matchMethodFilter" class="filter-select" onchange="filterMatchRecords()">
                            <option value="">全部方式</option>
                            <option value="birthday" ${methodFilter === 'birthday' ? 'selected' : ''}>生日匹配</option>
                            <option value="tarot" ${methodFilter === 'tarot' ? 'selected' : ''}>塔罗牌</option>
                        </select>
                        <select id="matchStatusFilter" class="filter-select" onchange="filterMatchRecords()">
                            <option value="">全部状态</option>
                            <option value="0" ${statusFilter === '0' ? 'selected' : ''}>请求中</option>
                            <option value="1" ${statusFilter === '1' ? 'selected' : ''}>成功</option>
                            <option value="2" ${statusFilter === '2' ? 'selected' : ''}>失败</option>
                        </select>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>用户</th>
                                <th>匹配类型</th>
                                <th>匹配方式</th>
                                <th>创建时间</th>
                                <th>匹配状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.length === 0 ? '<tr><td colspan="7" class="empty-text">暂无数据</td></tr>' : list.map((record, index) => {
                                const displayType = typeMap[record.type] || record.type || record.req_data?.type || '-';
                                const displayMethod = methodMap[record.method] || record.method || record.req_data?.method || '-';
                                return `
                                <tr>
                                    <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                    <td>${record.user_name || '游客'}</td>
                                    <td>${displayType}</td>
                                    <td>${displayMethod}</td>
                                    <td>${formatDate(record.create_date)}</td>
                                    <td><span class="status-badge ${statusClass[record.status] || 'pending'}">${statusMap[record.status] || '未知'}</span></td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn view" onclick="showMatchDetail(${record.id})">查看详情</button>
                                        </div>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
                ${renderPagination(pagination, 'goMatchPage')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

function filterMatchRecords() {
    const status = document.getElementById('matchStatusFilter')?.value || '';
    const method = document.getElementById('matchMethodFilter')?.value || '';
    const type = document.getElementById('matchTypeFilter')?.value || '';
    renderMatchRecordList(1, status, method, type);
}

function goMatchPage(page) {
    const status = document.getElementById('matchStatusFilter')?.value || '';
    const method = document.getElementById('matchMethodFilter')?.value || '';
    const type = document.getElementById('matchTypeFilter')?.value || '';
    renderMatchRecordList(page, status, method, type);
}

async function showMatchDetail(id) {
    try {
        const result = await apiFetch(`/match-records/${id}`);
        if (result.code !== 200) throw new Error(result.message);
        const record = result.data;

        const typeMap = { 'love': '感情匹配', 'work': '职场关系', 'cooperate': '合作关系', 'attitude': 'TA的态度', 'friend': '友情匹配' };
        const methodMap = { 'birthday': '生日匹配', 'tarot': '塔罗牌' };
        const displayType = typeMap[record.type] || record.type || record.req_data?.type || '-';
        const displayMethod = methodMap[record.method] || record.method || record.req_data?.method || '-';

        const reqHtml = record.req_data ? `<pre class="json-preview">${JSON.stringify(record.req_data, null, 2)}</pre>` : '<p>无请求数据</p>';
        const resultHtml = record.result_data ? `<pre class="json-preview">${JSON.stringify(record.result_data, null, 2)}</pre>` : '<p>无结果数据</p>';

        showModal('匹配记录详情', `
            <div class="detail-section">
                <h4>基本信息</h4>
                <p><strong>ID:</strong> ${record.id}</p>
                <p><strong>Session ID:</strong> ${record.session_id}</p>
                <p><strong>用户:</strong> ${record.user_name || '游客'}</p>
                <p><strong>匹配类型:</strong> ${displayType}</p>
                <p><strong>匹配方式:</strong> ${displayMethod}</p>
                <p><strong>状态:</strong> ${['请求中', '成功', '失败'][record.status] || '未知'}</p>
                <p><strong>创建时间:</strong> ${formatDate(record.create_date)}</p>
                <p><strong>更新时间:</strong> ${formatDate(record.update_date)}</p>
            </div>
            <div class="detail-section">
                <h4>请求数据</h4>
                ${reqHtml}
            </div>
            <div class="detail-section">
                <h4>匹配结果</h4>
                ${resultHtml}
            </div>
        `, null, true);
    } catch (error) {
        showToast('加载详情失败: ' + error.message, 'error');
    }
}

// ==================== 券码管理 ====================

async function renderCouponList(page = 1) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const result = await apiFetch(`/coupons?page=${page}&limit=15`);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        const typeMap = { 'single': '单次券码', 'multi': '多次券码' };
        const statusMap = { 'active': '可使用', 'used': '已使用', 'expired': '已过期', 'disabled': '已禁用', 'busy': '使用中' };
        const statusClass = { 'active': 'success', 'used': 'pending', 'expired': 'failed', 'disabled': 'failed', 'busy': 'active' };

        content.innerHTML = `
            <div class="data-card">
                <div class="card-header">
                    <h2>券码列表</h2>
                    <button class="btn btn-primary" onclick="showGenerateCouponModal()">🎫 生成券码</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>券码Code</th>
                                <th>类型</th>
                                <th>使用状态</th>
                                <th>使用次数/总次数</th>
                                <th>来源</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.length === 0 ? '<tr><td colspan="8" class="empty-text">暂无数据</td></tr>' : list.map((coupon, index) => `
                                <tr>
                                    <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                    <td><code class="code-text">${coupon.code}</code></td>
                                    <td>${typeMap[coupon.type] || coupon.type}</td>
                                    <td><span class="status-badge ${statusClass[coupon.status] || 'pending'}">${statusMap[coupon.status] || coupon.status}</span></td>
                                    <td>${coupon.used_count} / ${coupon.max_uses}</td>
                                    <td>${coupon.source || 'admin'}</td>
                                    <td>${formatDate(coupon.created_at)}</td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn edit" onclick="showEditCouponModal(${coupon.id}, '${coupon.type}', ${coupon.max_uses}, '${coupon.status}', '${coupon.remark || ''}')">修改</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${renderPagination(pagination, 'goCouponPage')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

function goCouponPage(page) { renderCouponList(page); }

function showGenerateCouponModal() {
    showModal('生成券码', `
        <div class="form-group-modal">
            <label>类型选择</label>
            <div class="radio-group">
                <label class="radio-label"><input type="radio" name="couponType" value="single" checked onchange="toggleMaxUses()"> 单次券码</label>
                <label class="radio-label"><input type="radio" name="couponType" value="multi" onchange="toggleMaxUses()"> 多次券码</label>
            </div>
        </div>
        <div class="form-group-modal" id="maxUsesGroup" style="display:none;">
            <label>使用次数 (1-100)</label>
            <input type="number" id="couponMaxUses" min="1" max="100" value="5" />
        </div>
        <div class="form-group-modal">
            <label>生成数量 (1-100)</label>
            <input type="number" id="couponCount" min="1" max="100" value="1" />
        </div>
    `, async () => {
        const type = document.querySelector('input[name="couponType"]:checked').value;
        const max_uses = type === 'multi' ? parseInt(document.getElementById('couponMaxUses').value) : 1;
        const count = parseInt(document.getElementById('couponCount').value);

        if (count < 1 || count > 100) { showToast('数量必须在1-100之间', 'error'); return; }
        if (type === 'multi' && (max_uses < 1 || max_uses > 100)) { showToast('使用次数必须在1-100之间', 'error'); return; }

        const result = await apiFetch('/coupons/generate', {
            method: 'POST',
            body: JSON.stringify({ type, max_uses, count })
        });
        if (result.code === 200) {
            showToast(result.message || '生成成功');
            renderCouponList();
        } else {
            showToast(result.message || '生成失败', 'error');
        }
    });
}

// 切换次数输入显示
window.toggleMaxUses = function () {
    const type = document.querySelector('input[name="couponType"]:checked')?.value;
    const group = document.getElementById('maxUsesGroup');
    if (group) group.style.display = type === 'multi' ? 'block' : 'none';
};

function showEditCouponModal(id, type, maxUses, status, remark) {
    showModal('修改券码', `
        <div class="form-group-modal">
            <label>状态</label>
            <select id="editCouponStatus">
                <option value="active" ${status === 'active' ? 'selected' : ''}>可使用</option>
                <option value="disabled" ${status === 'disabled' ? 'selected' : ''}>已禁用</option>
            </select>
        </div>
        <div class="form-group-modal">
            <label>备注</label>
            <textarea id="editCouponRemark" rows="3">${remark}</textarea>
        </div>
    `, async () => {
        const result = await apiFetch(`/coupons/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: document.getElementById('editCouponStatus').value,
                remark: document.getElementById('editCouponRemark').value
            })
        });
        showToast(result.message || '更新成功');
        renderCouponList();
    });
}

// ==================== 兑换记录 ====================

async function renderRedeemRecordList(page = 1) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const result = await apiFetch(`/coupons/redeem-records?page=${page}&limit=15`);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        const statusMap = { 'active': '可使用', 'used': '已使用', 'expired': '已过期', 'disabled': '已禁用', 'busy': '使用中' };

        content.innerHTML = `
            <div class="data-card">
                <div class="card-header">
                    <h2>兑换记录</h2>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>券码</th>
                                <th>类型</th>
                                <th>使用次数</th>
                                <th>兑换状态</th>
                                <th>兑换时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.length === 0 ? '<tr><td colspan="6" class="empty-text">暂无兑换记录</td></tr>' : list.map((record, index) => `
                                <tr>
                                    <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                    <td><code class="code-text">${record.code}</code></td>
                                    <td>${record.type === 'single' ? '单次' : '多次'}</td>
                                    <td>${record.used_count} / ${record.max_uses}</td>
                                    <td><span class="status-badge ${record.status === 'used' ? 'pending' : 'success'}">${statusMap[record.status] || record.status}</span></td>
                                    <td>${formatDate(record.updated_at)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${renderPagination(pagination, 'goRedeemPage')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

function goRedeemPage(page) { renderRedeemRecordList(page); }

// ==================== 系统管理 - 问题管理 ====================

let questionTab = 'list';

async function renderQuestionManage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="data-card">
            <div class="tab-header">
                <button class="tab-btn ${questionTab === 'list' ? 'active' : ''}" onclick="switchQuestionTab('list')">📋 问题列表</button>
                <button class="tab-btn ${questionTab === 'create' ? 'active' : ''}" onclick="switchQuestionTab('create')">➕ 创建问题</button>
                <button class="tab-btn ${questionTab === 'edit' ? 'active' : ''}" id="editTabBtn" style="display:${questionTab === 'edit' ? 'inline-flex' : 'none'}">✏️ 编辑问题</button>
            </div>
            <div id="questionTabContent"></div>
        </div>
    `;

    if (questionTab === 'list') renderQuestionList();
    else if (questionTab === 'create') renderQuestionCreateForm();
    else if (questionTab === 'edit') renderQuestionEditForm();
}

window.switchQuestionTab = function (tab) {
    questionTab = tab;
    renderQuestionManage();
};

async function renderQuestionList(page = 1) {
    const tabContent = document.getElementById('questionTabContent');
    tabContent.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const result = await apiFetch(`/questions?page=${page}&limit=15`);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        tabContent.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>标题</th>
                            <th>分类</th>
                            <th>状态</th>
                            <th>排序</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.length === 0 ? '<tr><td colspan="7" class="empty-text">暂无问题</td></tr>' : list.map((q, index) => `
                            <tr>
                                <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                <td>${q.title}</td>
                                <td>${q.category || 'general'}</td>
                                <td><span class="status-badge ${q.status ? 'success' : 'failed'}">${q.status ? '启用' : '禁用'}</span></td>
                                <td>${q.sort_order || 0}</td>
                                <td>${formatDate(q.created_at)}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn edit" onclick="editQuestion(${q.id})">编辑</button>
                                        <button class="action-btn delete" onclick="deleteQuestion(${q.id})">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${renderPagination(pagination, 'goQuestionPage')}
        `;
    } catch (error) {
        tabContent.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

function goQuestionPage(page) { renderQuestionList(page); }

async function renderQuestionCreateForm() {
    const tabContent = document.getElementById('questionTabContent');
    tabContent.innerHTML = '<div class="loading-text">加载中...</div>';

    // 从接口获取主题分类
    let categories = [];
    try {
        const catResult = await apiFetch('/topic-categories?limit=100');
        if (catResult.code === 200) categories = catResult.data.list || [];
    } catch (e) { /* fallback empty */ }

    tabContent.innerHTML = `
        <div class="form-container">
            <div class="form-group-modal">
                <label>标题 <span class="required">*</span></label>
                <input type="text" id="qTitle" placeholder="请输入问题标题" />
            </div>
            <div class="form-group-modal">
                <label>内容</label>
                <textarea id="qContent" rows="6" placeholder="请输入问题内容"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group-modal">
                    <label>主题分类</label>
                    <select id="qCategory">
                        <option value="general">通用</option>
                        ${categories.map(c => `<option value="${c.name}">${c.name}${c.status ? '' : '（已关闭）'}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group-modal">
                    <label>排序</label>
                    <input type="number" id="qSortOrder" value="0" min="0" />
                </div>
            </div>
            <button class="btn btn-primary" onclick="submitCreateQuestion()">确认创建</button>
        </div>
    `;
}

async function submitCreateQuestion() {
    const title = document.getElementById('qTitle').value.trim();
    const content = document.getElementById('qContent').value;
    const category = document.getElementById('qCategory').value;
    const sort_order = parseInt(document.getElementById('qSortOrder').value) || 0;

    if (!title) { showToast('标题不能为空', 'error'); return; }

    try {
        const result = await apiFetch('/questions', {
            method: 'POST',
            body: JSON.stringify({ title, content, category, sort_order })
        });
        if (result.code === 200) {
            showToast('创建成功');
            questionTab = 'list';
            renderQuestionManage();
        } else {
            showToast(result.message || '创建失败', 'error');
        }
    } catch (error) {
        showToast('创建失败: ' + error.message, 'error');
    }
}

let editingQuestionId = null;

async function editQuestion(id) {
    editingQuestionId = id;
    questionTab = 'edit';

    // 先渲染框架，再填充数据
    renderQuestionManage();

    try {
        const result = await apiFetch(`/questions/${id}`);
        if (result.code !== 200) throw new Error(result.message);
        const q = result.data;

        renderQuestionEditForm(q);
    } catch (error) {
        showToast('加载问题详情失败', 'error');
    }
}

async function renderQuestionEditForm(q = null) {
    const tabContent = document.getElementById('questionTabContent');
    const editTabBtn = document.getElementById('editTabBtn');
    if (editTabBtn) editTabBtn.style.display = 'inline-flex';

    if (!q) {
        tabContent.innerHTML = '<div class="loading-text">加载中...</div>';
        return;
    }

    // 从接口获取主题分类
    let categories = [];
    try {
        const catResult = await apiFetch('/topic-categories?limit=100');
        if (catResult.code === 200) categories = catResult.data.list || [];
    } catch (e) { /* fallback empty */ }

    tabContent.innerHTML = `
        <div class="form-container">
            <div class="form-group-modal">
                <label>标题 <span class="required">*</span></label>
                <input type="text" id="editQTitle" value="${q.title}" />
            </div>
            <div class="form-group-modal">
                <label>内容</label>
                <textarea id="editQContent" rows="6">${q.content || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group-modal">
                    <label>主题分类</label>
                    <select id="editQCategory">
                        <option value="general" ${q.category === 'general' ? 'selected' : ''}>通用</option>
                        ${categories.map(c => `<option value="${c.name}" ${q.category === c.name ? 'selected' : ''}>${c.name}${c.status ? '' : '（已关闭）'}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group-modal">
                    <label>排序</label>
                    <input type="number" id="editQSortOrder" value="${q.sort_order || 0}" min="0" />
                </div>
                <div class="form-group-modal">
                    <label>状态</label>
                    <select id="editQStatus">
                        <option value="1" ${q.status ? 'selected' : ''}>启用</option>
                        <option value="0" ${!q.status ? 'selected' : ''}>禁用</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primary" onclick="submitEditQuestion(${q.id})">保存修改</button>
            <button class="btn btn-secondary" onclick="switchQuestionTab('list')" style="margin-left:12px;">取消</button>
        </div>
    `;
}

async function submitEditQuestion(id) {
    const title = document.getElementById('editQTitle').value.trim();
    const content = document.getElementById('editQContent').value;
    const category = document.getElementById('editQCategory').value;
    const sort_order = parseInt(document.getElementById('editQSortOrder').value) || 0;
    const status = parseInt(document.getElementById('editQStatus').value);

    if (!title) { showToast('标题不能为空', 'error'); return; }

    try {
        const result = await apiFetch(`/questions/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title, content, category, sort_order, status })
        });
        if (result.code === 200) {
            showToast('更新成功');
            questionTab = 'list';
            renderQuestionManage();
        } else {
            showToast(result.message || '更新失败', 'error');
        }
    } catch (error) {
        showToast('更新失败: ' + error.message, 'error');
    }
}

async function deleteQuestion(id) {
    if (!confirm('确定要删除该问题吗？')) return;
    try {
        const result = await apiFetch(`/questions/${id}`, { method: 'DELETE' });
        showToast(result.message || '删除成功');
        renderQuestionList();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// ==================== 系统管理 - 主题分类 ====================

async function renderTopicCategoryManage(page = 1) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const result = await apiFetch(`/topic-categories?page=${page}&limit=15`);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        content.innerHTML = `
            <div class="data-card">
                <div class="card-header">
                    <h2>主题分类管理</h2>
                    <button class="btn btn-primary" onclick="showCreateTopicCategoryModal()">+ 新增分类</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>分类名称</th>
                                <th>描述</th>
                                <th>排序</th>
                                <th>状态</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.length === 0 ? '<tr><td colspan="7" class="empty-text">暂无数据</td></tr>' : list.map((item, index) => `
                                <tr>
                                    <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                    <td>${item.name}</td>
                                    <td>${item.description || '-'}</td>
                                    <td>${item.sort_order}</td>
                                    <td><span class="status-badge ${item.status ? 'success' : 'failed'}">${item.status ? '开启' : '关闭'}</span></td>
                                    <td>${formatDate(item.created_at)}</td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn edit" onclick="showEditTopicCategoryModal(${item.id}, '${escape(item.name)}', '${escape(item.description || '')}', ${item.sort_order}, ${item.status})">编辑</button>
                                            <button class="action-btn delete" onclick="deleteTopicCategory(${item.id})">删除</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${renderPagination(pagination, 'goTopicCategoryPage')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

function goTopicCategoryPage(page) { renderTopicCategoryManage(page); }

function showCreateTopicCategoryModal() {
    showModal('新增主题分类', `
        <div class="form-group-modal">
            <label>分类名称 <span class="required">*</span></label>
            <input type="text" id="newTCName" placeholder="请输入分类名称" />
        </div>
        <div class="form-group-modal">
            <label>描述</label>
            <textarea id="newTCDesc" rows="3" placeholder="请输入分类描述（选填）"></textarea>
        </div>
        <div class="form-group-modal">
            <label>排序（数字越小越靠前）</label>
            <input type="number" id="newTCSortOrder" value="0" min="0" />
        </div>
    `, async () => {
        const name = document.getElementById('newTCName').value.trim();
        const description = document.getElementById('newTCDesc').value.trim();
        const sort_order = parseInt(document.getElementById('newTCSortOrder').value) || 0;
        if (!name) { showToast('分类名称不能为空', 'error'); return; }

        const result = await apiFetch('/topic-categories', {
            method: 'POST',
            body: JSON.stringify({ name, description, sort_order })
        });
        if (result.code === 200) {
            showToast('创建成功');
            renderTopicCategoryManage();
        } else {
            showToast(result.message || '创建失败', 'error');
        }
    });
}

function showEditTopicCategoryModal(id, name, description, sortOrder, status) {
    showModal('编辑主题分类', `
        <div class="form-group-modal">
            <label>分类名称 <span class="required">*</span></label>
            <input type="text" id="editTCName" value="${unescape(name)}" />
        </div>
        <div class="form-group-modal">
            <label>描述</label>
            <textarea id="editTCDesc" rows="3">${unescape(description)}</textarea>
        </div>
        <div class="form-group-modal">
            <label>排序</label>
            <input type="number" id="editTCSortOrder" value="${sortOrder}" min="0" />
        </div>
        <div class="form-group-modal">
            <label>状态</label>
            <select id="editTCStatus">
                <option value="1" ${status ? 'selected' : ''}>开启</option>
                <option value="0" ${!status ? 'selected' : ''}>关闭</option>
            </select>
        </div>
    `, async () => {
        const result = await apiFetch(`/topic-categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: document.getElementById('editTCName').value.trim(),
                description: document.getElementById('editTCDesc').value.trim(),
                sort_order: parseInt(document.getElementById('editTCSortOrder').value) || 0,
                status: parseInt(document.getElementById('editTCStatus').value)
            })
        });
        if (result.code === 200) {
            showToast('更新成功');
            renderTopicCategoryManage();
        } else {
            showToast(result.message || '更新失败', 'error');
        }
    });
}

async function deleteTopicCategory(id) {
    if (!confirm('确定要删除该主题分类吗？')) return;
    try {
        const result = await apiFetch(`/topic-categories/${id}`, { method: 'DELETE' });
        showToast(result.message || '删除成功');
        renderTopicCategoryManage();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// ==================== 系统管理 - 系统配置 ====================

async function renderSystemConfigManage(page = 1) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const result = await apiFetch(`/system-configs?page=${page}&limit=15`);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        content.innerHTML = `
            <div class="data-card">
                <div class="card-header">
                    <h2>系统配置</h2>
                    <button class="btn btn-primary" onclick="showCreateSystemConfigModal()">+ 新增配置</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>配置名称</th>
                                <th>状态</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.length === 0 ? '<tr><td colspan="5" class="empty-text">暂无数据</td></tr>' : list.map((item, index) => `
                                <tr>
                                    <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                    <td>${item.name}</td>
                                    <td><span class="status-badge ${item.status ? 'success' : 'failed'}">${item.status ? '开启' : '关闭'}</span></td>
                                    <td>${formatDate(item.created_at)}</td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn ${item.status ? 'delete' : 'view'}" onclick="toggleSystemConfigStatus(${item.id}, ${item.status ? 0 : 1})">${item.status ? '关闭' : '开启'}</button>
                                            <button class="action-btn delete" onclick="deleteSystemConfig(${item.id})">删除</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${renderPagination(pagination, 'goSystemConfigPage')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

function goSystemConfigPage(page) { renderSystemConfigManage(page); }

function showCreateSystemConfigModal() {
    showModal('新增系统配置', `
        <div class="form-group-modal">
            <label>配置名称 <span class="required">*</span></label>
            <input type="text" id="newSCName" placeholder="请输入配置名称" />
        </div>
        <div class="form-group-modal">
            <label>状态</label>
            <select id="newSCStatus">
                <option value="1">开启</option>
                <option value="0">关闭</option>
            </select>
        </div>
    `, async () => {
        const name = document.getElementById('newSCName').value.trim();
        const status = parseInt(document.getElementById('newSCStatus').value);
        if (!name) { showToast('配置名称不能为空', 'error'); return; }

        const result = await apiFetch('/system-configs', {
            method: 'POST',
            body: JSON.stringify({ name, status })
        });
        if (result.code === 200) {
            showToast('创建成功');
            renderSystemConfigManage();
        } else {
            showToast(result.message || '创建失败', 'error');
        }
    });
}

async function toggleSystemConfigStatus(id, newStatus) {
    try {
        const result = await apiFetch(`/system-configs/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        if (result.code === 200) {
            showToast(newStatus ? '已开启' : '已关闭');
            renderSystemConfigManage();
        } else {
            showToast(result.message || '操作失败', 'error');
        }
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
}

async function deleteSystemConfig(id) {
    if (!confirm('确定要删除该配置吗？')) return;
    try {
        const result = await apiFetch(`/system-configs/${id}`, { method: 'DELETE' });
        showToast(result.message || '删除成功');
        renderSystemConfigManage();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// ==================== 小红书主题配置 ====================

let xhsTab = 'list';

async function renderXhsTopicConfig() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="data-card">
            <div class="tab-header">
                <button class="tab-btn ${xhsTab === 'add' ? 'active' : ''}" onclick="switchXhsTab('add')">➕ 增加主题分类</button>
                <button class="tab-btn ${xhsTab === 'list' ? 'active' : ''}" onclick="switchXhsTab('list')">📋 小红书主题列表</button>
            </div>
            <div id="xhsTabContent"></div>
        </div>
    `;

    if (xhsTab === 'add') renderXhsAddTopicTab();
    else renderXhsTopicListTab();
}

window.switchXhsTab = function (tab) {
    xhsTab = tab;
    renderXhsTopicConfig();
};

async function renderXhsAddTopicTab() {
    const tabContent = document.getElementById('xhsTabContent');
    tabContent.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        // 获取所有主题分类
        const catResult = await apiFetch('/topic-categories?limit=100');
        if (catResult.code !== 200) throw new Error(catResult.message);
        const categories = catResult.data.list || [];

        // 获取已添加的小红书主题，用于标记已存在的
        const xhsResult = await apiFetch('/xhs-topics?limit=100');
        const existingIds = new Set();
        if (xhsResult.code === 200 && xhsResult.data.list) {
            xhsResult.data.list.forEach(item => existingIds.add(item.topic_category_id));
        }

        if (categories.length === 0) {
            tabContent.innerHTML = '<div class="empty-text" style="padding:24px;text-align:center;">暂无主题分类，请先在系统管理中添加</div>';
            return;
        }

        tabContent.innerHTML = `
            <div style="padding:16px 0;">
                <p style="margin-bottom:16px;color:var(--text-secondary, #666);font-size:14px;">勾选需要添加到小红书主题列表的分类（已添加的不可重复选择）：</p>
                <div class="xhs-checkbox-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
                    ${categories.map(c => {
                        const isExist = existingIds.has(c.id);
                        return `
                            <label class="xhs-checkbox-item" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;border:1px solid ${isExist ? '#ddd' : '#e5e7eb'};background:${isExist ? '#f9f9f9' : '#fff'};cursor:${isExist ? 'not-allowed' : 'pointer'};opacity:${isExist ? '0.6' : '1'};">
                                <input type="checkbox" name="xhsTopicCheck" value="${c.id}" ${isExist ? 'disabled checked' : ''} style="accent-color:#7c3aed;width:18px;height:18px;" />
                                <span style="font-size:14px;">${c.name} ${isExist ? '<em style="color:#999;font-size:12px;">(已添加)</em>' : ''}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top:20px;text-align:right;">
                    <button class="btn btn-primary" onclick="submitXhsBatchAdd()">批量添加</button>
                </div>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

window.submitXhsBatchAdd = async function () {
    const checkboxes = document.querySelectorAll('input[name="xhsTopicCheck"]:checked:not(:disabled)');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (ids.length === 0) {
        showToast('请至少选择一个未添加的主题分类', 'error');
        return;
    }

    try {
        const result = await apiFetch('/xhs-topics/batch', {
            method: 'POST',
            body: JSON.stringify({ topicCategoryIds: ids })
        });
        if (result.code === 200) {
            showToast(result.message || '添加成功');
            xhsTab = 'list';
            renderXhsTopicConfig();
        } else {
            showToast(result.message || '添加失败', 'error');
        }
    } catch (error) {
        showToast('添加失败: ' + error.message, 'error');
    }
};

async function renderXhsTopicListTab(page = 1) {
    const tabContent = document.getElementById('xhsTabContent');
    tabContent.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const result = await apiFetch(`/xhs-topics?page=${page}&limit=15`);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        tabContent.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>主题名称</th>
                            <th>展示状态</th>
                            <th>添加时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.length === 0 ? '<tr><td colspan="5" class="empty-text">暂无数据，请先添加主题分类</td></tr>' : list.map((item, index) => `
                            <tr>
                                <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                <td>${item.topic_name || '未知分类'}</td>
                                <td><span class="status-badge ${item.status ? 'success' : 'failed'}">${item.status ? '显示' : '隐藏'}</span></td>
                                <td>${formatDate(item.created_at)}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn ${item.status ? 'delete' : 'view'}" onclick="toggleXhsTopicStatus(${item.id}, ${item.status ? 0 : 1})">${item.status ? '隐藏' : '显示'}</button>
                                        <button class="action-btn delete" onclick="deleteXhsTopic(${item.id})">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${renderPagination(pagination, 'goXhsTopicPage')}
        `;
    } catch (error) {
        tabContent.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

window.goXhsTopicPage = function (page) { renderXhsTopicListTab(page); };

window.toggleXhsTopicStatus = async function (id, newStatus) {
    try {
        const result = await apiFetch(`/xhs-topics/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        if (result.code === 200) {
            showToast(newStatus ? '已显示' : '已隐藏');
            renderXhsTopicListTab();
        } else {
            showToast(result.message || '操作失败', 'error');
        }
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
};

window.deleteXhsTopic = async function (id) {
    if (!confirm('确定要从小红书主题列表中删除吗？')) return;
    try {
        const result = await apiFetch(`/xhs-topics/${id}`, { method: 'DELETE' });
        showToast(result.message || '删除成功');
        renderXhsTopicListTab();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
};

// ==================== 小红书菜单管理 ====================

let xhsMenuTab = 'list';
let editingXhsMenuId = null;

async function renderXhsMenuManage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="data-card">
            <div class="tab-header">
                <button class="tab-btn ${xhsMenuTab === 'list' ? 'active' : ''}" onclick="switchXhsMenuTab('list')">📋 菜单列表</button>
                <button class="tab-btn ${xhsMenuTab === 'add' ? 'active' : ''}" onclick="switchXhsMenuTab('add')">➕ 新增菜单</button>
                <button class="tab-btn ${xhsMenuTab === 'edit' ? 'active' : ''}" id="xhsMenuEditTabBtn" style="display:${xhsMenuTab === 'edit' ? 'inline-flex' : 'none'}">✏️ 编辑菜单</button>
            </div>
            <div id="xhsMenuTabContent"></div>
        </div>
    `;

    if (xhsMenuTab === 'add') renderXhsMenuAddForm();
    else if (xhsMenuTab === 'edit') renderXhsMenuEditForm();
    else renderXhsMenuListTab();
}

window.switchXhsMenuTab = function (tab) {
    xhsMenuTab = tab;
    if (tab !== 'edit') editingXhsMenuId = null;
    renderXhsMenuManage();
};

async function renderXhsMenuListTab(page = 1) {
    const tabContent = document.getElementById('xhsMenuTabContent');
    tabContent.innerHTML = '<div class="loading-text">加载中...</div>';

    try {
        const result = await apiFetch(`/xhs-menus?page=${page}&limit=15`);
        if (result.code !== 200) throw new Error(result.message);
        const { list, pagination } = result.data;

        tabContent.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>编号</th>
                            <th>菜单名称</th>
                            <th>问题描述</th>
                            <th>展示状态</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.length === 0 ? '<tr><td colspan="6" class="empty-text">暂无菜单，请点击"新增菜单"添加</td></tr>' : list.map((item, index) => `
                            <tr>
                                <td>${(pagination.page - 1) * pagination.limit + index + 1}</td>
                                <td><strong>${item.name}</strong></td>
                                <td>
                                    <div class="xhs-menu-desc" title="${(item.description || '').replace(/"/g, '&quot;')}">${item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description) : '<span style="color:#999;">暂无描述</span>'}</div>
                                </td>
                                <td><span class="status-badge ${item.status ? 'success' : 'failed'}">${item.status ? '显示' : '隐藏'}</span></td>
                                <td>${formatDate(item.created_at)}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn edit" onclick="editXhsMenu(${item.id})">编辑</button>
                                        <button class="action-btn ${item.status ? 'delete' : 'view'}" onclick="toggleXhsMenuStatus(${item.id}, ${item.status ? 0 : 1})">${item.status ? '隐藏' : '显示'}</button>
                                        <button class="action-btn delete" onclick="deleteXhsMenu(${item.id})">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${renderPagination(pagination, 'goXhsMenuPage')}
        `;
    } catch (error) {
        tabContent.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

window.goXhsMenuPage = function (page) { renderXhsMenuListTab(page); };

async function renderXhsMenuAddForm() {
    const tabContent = document.getElementById('xhsMenuTabContent');

    tabContent.innerHTML = `
        <div class="form-container" style="max-width:700px;">
            <div class="form-group-modal">
                <label>菜单名称 <span class="required">*</span></label>
                <input type="text" id="xhsMenuName" placeholder="请输入菜单名称" maxlength="50" />
            </div>
            <div class="form-group-modal">
                <label>问题描述</label>
                <textarea id="xhsMenuDesc" rows="6" placeholder="请输入问题描述内容" style="width:100%;resize:vertical;"></textarea>
            </div>
            <div class="form-group-modal">
                <label>展示状态</label>
                <select id="xhsMenuStatus">
                    <option value="1" selected>显示</option>
                    <option value="0">隐藏</option>
                </select>
            </div>
            <div style="margin-top:20px;">
                <button class="btn btn-primary" onclick="submitCreateXhsMenu()">确认创建</button>
                <button class="btn btn-secondary" onclick="switchXhsMenuTab('list')" style="margin-left:12px;">取消</button>
            </div>
        </div>
    `;
}

window.submitCreateXhsMenu = async function () {
    const name = document.getElementById('xhsMenuName').value.trim();
    const description = document.getElementById('xhsMenuDesc').value;
    const status = parseInt(document.getElementById('xhsMenuStatus').value);

    if (!name) { showToast('菜单名称不能为空', 'error'); return; }

    try {
        const result = await apiFetch('/xhs-menus', {
            method: 'POST',
            body: JSON.stringify({ name, description, status })
        });
        if (result.code === 200) {
            showToast('创建成功');
            xhsMenuTab = 'list';
            renderXhsMenuManage();
        } else {
            showToast(result.message || '创建失败', 'error');
        }
    } catch (error) {
        showToast('创建失败: ' + error.message, 'error');
    }
};

window.editXhsMenu = async function (id) {
    editingXhsMenuId = id;
    xhsMenuTab = 'edit';
    renderXhsMenuManage();
};

async function renderXhsMenuEditForm() {
    const tabContent = document.getElementById('xhsMenuTabContent');
    const editTabBtn = document.getElementById('xhsMenuEditTabBtn');
    if (editTabBtn) editTabBtn.style.display = 'inline-flex';

    tabContent.innerHTML = '<div class="loading-text">加载中...</div>';

    if (!editingXhsMenuId) {
        tabContent.innerHTML = '<div class="empty-text">请从列表中选择要编辑的菜单</div>';
        return;
    }

    try {
        const result = await apiFetch(`/xhs-menus/${editingXhsMenuId}`);
        if (result.code !== 200) throw new Error(result.message);
        const menu = result.data;
        if (!menu) throw new Error('菜单不存在');

        tabContent.innerHTML = `
            <div class="form-container" style="max-width:700px;">
                <div class="form-group-modal">
                    <label>菜单名称 <span class="required">*</span></label>
                    <input type="text" id="editXhsMenuName" value="${menu.name}" maxlength="50" />
                </div>
                <div class="form-group-modal">
                    <label>问题描述</label>
                    <textarea id="editXhsMenuDesc" rows="6" style="width:100%;resize:vertical;">${menu.description || ''}</textarea>
                </div>
                <div class="form-group-modal">
                    <label>展示状态</label>
                    <select id="editXhsMenuStatus">
                        <option value="1" ${menu.status ? 'selected' : ''}>显示</option>
                        <option value="0" ${!menu.status ? 'selected' : ''}>隐藏</option>
                    </select>
                </div>
                <div style="margin-top:20px;">
                    <button class="btn btn-primary" onclick="submitEditXhsMenu(${menu.id})">保存修改</button>
                    <button class="btn btn-secondary" onclick="switchXhsMenuTab('list')" style="margin-left:12px;">取消</button>
                </div>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = `<div class="error-text">加载失败: ${error.message}</div>`;
    }
}

window.submitEditXhsMenu = async function (id) {
    const name = document.getElementById('editXhsMenuName').value.trim();
    const description = document.getElementById('editXhsMenuDesc').value;
    const status = parseInt(document.getElementById('editXhsMenuStatus').value);

    if (!name) { showToast('菜单名称不能为空', 'error'); return; }

    try {
        const result = await apiFetch(`/xhs-menus/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, description, status })
        });
        if (result.code === 200) {
            showToast('更新成功');
            xhsMenuTab = 'list';
            renderXhsMenuManage();
        } else {
            showToast(result.message || '更新失败', 'error');
        }
    } catch (error) {
        showToast('更新失败: ' + error.message, 'error');
    }
};

window.toggleXhsMenuStatus = async function (id, newStatus) {
    try {
        const result = await apiFetch(`/xhs-menus/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        if (result.code === 200) {
            showToast(newStatus ? '已显示' : '已隐藏');
            renderXhsMenuListTab();
        } else {
            showToast(result.message || '操作失败', 'error');
        }
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
};

window.deleteXhsMenu = async function (id) {
    if (!confirm('确定要删除该菜单吗？')) return;
    try {
        const result = await apiFetch(`/xhs-menus/${id}`, { method: 'DELETE' });
        if (result.code === 200) {
            showToast('删除成功');
            renderXhsMenuListTab();
        } else {
            showToast(result.message || '删除失败', 'error');
        }
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
};

// ==================== 通用弹窗 ====================

function showModal(title, contentHtml, onConfirm, viewOnly = false) {
    // 移除旧弹窗
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">${contentHtml}</div>
            ${!viewOnly ? `
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">取消</button>
                <button class="btn btn-primary" id="modalConfirmBtn">确认</button>
            </div>` : `
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
            </div>`}
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);

    if (onConfirm && !viewOnly) {
        document.getElementById('modalConfirmBtn').addEventListener('click', async () => {
            try {
                await onConfirm();
                overlay.remove();
            } catch (error) {
                showToast('操作失败: ' + error.message, 'error');
            }
        });
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// ==================== 工具函数 ====================

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}:${s}`;
    } catch (e) {
        return dateStr;
    }
}

function escape(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
