/**
 * 匹配游戏 状态管理
 * 简单的全局状态管理器，支持持久化
 */

class State {
    constructor() {
        this.state = {};
        this.listeners = new Map();
        this.storageKey = 'matching_game_state';

        // 从 localStorage 恢复状态
        this.loadFromStorage();
    }

    /**
     * 获取状态
     * @param {string} key - 状态键
     * @param {any} defaultValue - 默认值
     */
    get(key, defaultValue = null) {
        return key in this.state ? this.state[key] : defaultValue;
    }

    /**
     * 设置状态
     * @param {string} key - 状态键
     * @param {any} value - 状态值
     * @param {boolean} persist - 是否持久化到 localStorage
     */
    set(key, value, persist = false) {
        const oldValue = this.state[key];
        this.state[key] = value;

        // 通知监听器
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(value, oldValue);
            });
        }

        // 持久化
        if (persist) {
            this.saveToStorage();
        }
    }

    /**
     * 更新状态（合并对象）
     * @param {string} key - 状态键
     * @param {object} updates - 更新内容
     * @param {boolean} persist - 是否持久化
     */
    update(key, updates, persist = false) {
        const current = this.get(key, {});
        this.set(key, { ...current, ...updates }, persist);
    }

    /**
     * 删除状态
     * @param {string} key - 状态键
     */
    delete(key) {
        delete this.state[key];
        this.saveToStorage();
    }

    /**
     * 订阅状态变化
     * @param {string} key - 状态键
     * @param {Function} callback - 回调函数
     * @returns {Function} - 取消订阅函数
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);

        // 返回取消订阅函数
        return () => {
            this.listeners.get(key).delete(callback);
        };
    }

    /**
     * 保存到 localStorage
     */
    saveToStorage() {
        try {
            // 只保存需要持久化的数据
            const persistData = {
                user: this.state.user,
                testHistory: this.state.testHistory,
                settings: this.state.settings
            };
            localStorage.setItem(this.storageKey, JSON.stringify(persistData));
        } catch (e) {
            console.warn('保存状态失败:', e);
        }
    }

    /**
     * 从 localStorage 加载
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.state = { ...this.state, ...data };
            }
        } catch (e) {
            console.warn('加载状态失败:', e);
        }
    }

    /**
     * 清除所有状态
     */
    clear() {
        this.state = {};
        localStorage.removeItem(this.storageKey);
    }
}

// 创建全局状态实例
const state = new State();

// 初始化默认状态
state.set('currentTest', null);
state.set('testProgress', { step: 0, total: 0 });

// ==================== SessionId 管理 ====================

/**
 * 生成 UUID v4 格式的唯一 sessionId
 * @returns {string} UUID 格式的字符串
 */
function generateSessionId() {
    // 使用 crypto.randomUUID (现代浏览器支持)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // 回退方案：手动生成 UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * 初始化会话 - 确保 localStorage 中存在唯一的 sessionId
 * 在应用启动时调用
 */
function initSession() {
    if (!localStorage.getItem('sessionId')) {
        const sessionId = generateSessionId();
        localStorage.setItem('sessionId', sessionId);
        console.log('✅ 新会话已创建, sessionId:', sessionId);
    } else {
        console.log('✅ 已有会话, sessionId:', localStorage.getItem('sessionId'));
    }
}

/**
 * 获取当前 sessionId
 * @returns {string}
 */
function getSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

/**
 * 重新生成 sessionId（冲突时调用）
 * @returns {string} 新的 sessionId
 */
function regenerateSessionId() {
    const newSessionId = generateSessionId();
    localStorage.setItem('sessionId', newSessionId);
    console.log('🔄 SessionId 已重新生成:', newSessionId);
    return newSessionId;
}

// 初始化会话
initSession();

// 暴露到全局
window.appState = state;

export { getSessionId, regenerateSessionId, generateSessionId };
export default state;
