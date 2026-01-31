/**
 * MasterXiao-AI API 服务层
 * 封装所有后端 API 调用
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * 通用请求方法
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json'
    };

    // 添加认证令牌
    const token = localStorage.getItem('auth_token');
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data.error?.message || '请求失败', data.error?.code, response.status);
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError('网络连接失败，请检查网络', 'NETWORK_ERROR', 0);
    }
}

/**
 * API 错误类
 */
export class ApiError extends Error {
    constructor(message, code, status) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

// ==================== 认证 API ====================

export const authApi = {
    /**
     * 发送验证码
     */
    async sendCode(phone) {
        return request('/auth/send-code', {
            method: 'POST',
            body: JSON.stringify({ phone })
        });
    },

    /**
     * 验证码登录
     */
    async login(phone, code) {
        const result = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, code })
        });

        if (result.success && result.data?.token) {
            localStorage.setItem('auth_token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.user));
        }

        return result;
    },

    /**
     * 获取当前用户信息
     */
    async getMe() {
        return request('/auth/me');
    },

    /**
     * 退出登录
     */
    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },

    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return !!localStorage.getItem('auth_token');
    },

    /**
     * 获取本地用户信息
     */
    getLocalUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
};

// ==================== 测试 API ====================

export const testApi = {
    /**
     * 创建测试记录
     */
    async create(data) {
        return request('/test/create', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * 获取测试详情
     */
    async get(testId) {
        return request(`/test/${testId}`);
    },

    /**
     * 获取测试历史
     */
    async getHistory() {
        return request('/test/user/history');
    }
};

// ==================== 分析 API ====================

export const analysisApi = {
    /**
     * 生日匹配分析
     */
    async birthday(data) {
        return request('/analysis/birthday', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * 六爻卦象分析
     */
    async hexagram(data) {
        return request('/analysis/hexagram', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * 获取分析结果
     */
    async getResult(testId) {
        return request(`/analysis/result/${testId}`);
    }
};

// ==================== 用户 API ====================

export const userApi = {
    /**
     * 更新用户资料
     */
    async updateProfile(data) {
        return request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * 获取邀请信息
     */
    async getInviteInfo() {
        return request('/user/invite');
    },

    /**
     * 使用邀请码
     */
    async applyInviteCode(inviteCode) {
        return request('/user/invite/apply', {
            method: 'POST',
            body: JSON.stringify({ inviteCode })
        });
    },

    /**
     * 获取用户积分
     */
    async getCredits() {
        return request('/user/credits');
    }
};

// ==================== 验证 API ====================

export const verificationApi = {
    /**
     * 获取图形验证码
     */
    async getCaptcha(sessionId) {
        return request(`/verification/captcha?sessionId=${sessionId}`);
    },

    /**
     * 验证图形验证码
     */
    async verifyCaptcha(sessionId, answer) {
        return request('/verification/captcha', {
            method: 'POST',
            body: JSON.stringify({ sessionId, answer })
        });
    }
};

// ==================== 支付 API ====================

export const paymentApi = {
    /**
     * 创建订单
     */
    async createOrder(data) {
        return request('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * 获取订单状态
     */
    async getOrderStatus(orderId) {
        return request(`/payment/order/${orderId}`);
    },

    /**
     * 模拟支付（开发环境）
     */
    async simulatePay(orderId) {
        return request('/payment/simulate-pay', {
            method: 'POST',
            body: JSON.stringify({ orderId })
        });
    },

    /**
     * 使用核销码
     */
    async redeem(redeemCode) {
        return request('/payment/redeem', {
            method: 'POST',
            body: JSON.stringify({ redeemCode })
        });
    },

    /**
     * 获取订单列表
     */
    async getOrders() {
        return request('/payment/orders');
    }
};

// 导出默认对象
export default {
    auth: authApi,
    test: testApi,
    analysis: analysisApi,
    user: userApi,
    verification: verificationApi,
    payment: paymentApi
};

