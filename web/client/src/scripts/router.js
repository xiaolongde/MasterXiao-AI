/**
 * 匹配游戏 路由系统
 * 简单的 SPA 路由管理器
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentPage = null;
        this.currentParams = {};
        this.history = [];

        // 监听浏览器前进后退
        window.addEventListener('popstate', (e) => {
            this.handleRoute(window.location.pathname + window.location.search, false);
        });
    }

    /**
     * 注册路由
     * @param {string} path - 路由路径，支持 :param 格式参数
     * @param {Function} handler - 页面组件构造函数或工厂函数
     */
    register(path, handler) {
        this.routes.set(path, handler);
        return this;
    }

    /**
     * 导航到指定路径
     * @param {string} path - 目标路径
     * @param {object} state - 传递的状态数据
     */
    navigate(path, state = {}) {
        // 记录历史
        this.history.push({
            path: window.location.pathname,
            state: this.currentParams
        });

        // 更新浏览器历史
        window.history.pushState(state, '', path);

        // 处理路由
        this.handleRoute(path, true);
    }

    /**
     * 返回上一页
     */
    back() {
        if (this.history.length > 0) {
            window.history.back();
        } else {
            this.navigate('/');
        }
    }

    /**
     * 处理路由变化
     * @param {string} path - 当前路径
     * @param {boolean} isForward - 是否为前进（用于动画方向）
     */
    handleRoute(path, isForward = true) {
        // 分离 pathname 和 query string
        const [pathname, queryString] = path.split('?');
        const { handler, params } = this.matchRoute(pathname);

        if (!handler) {
            console.warn(`路由未找到: ${pathname}`);
            // 导航到首页
            if (pathname !== '/') {
                this.navigate('/');
            }
            return;
        }

        // 解析 query string 并合并到 params
        if (queryString) {
            const searchParams = new URLSearchParams(queryString);
            for (const [key, value] of searchParams) {
                params[key] = value;
            }
        }

        this.currentParams = params;

        // 获取页面容器
        const container = document.getElementById('app');
        if (!container) {
            console.error('找不到 #app 容器');
            return;
        }

        // 页面切换动画
        const oldPage = container.querySelector('.page');
        if (oldPage) {
            oldPage.classList.add(isForward ? 'page-exit' : 'page-exit-back');
        }

        // 延迟渲染新页面（等待退出动画）
        setTimeout(() => {
            // 创建页面实例
            let page;
            if (typeof handler === 'function') {
                try {
                    // 尝试作为类构造函数调用
                    page = new handler(params);
                } catch (e) {
                    // 否则作为普通函数调用
                    page = handler(params);
                }
            }

            // 渲染页面
            if (page && typeof page.render === 'function') {
                container.innerHTML = page.render();

                // 添加进入动画
                const newPage = container.querySelector('.page');
                if (newPage) {
                    newPage.classList.add(isForward ? 'page-enter' : 'page-enter-back');
                }

                // 绑定事件
                if (typeof page.attachEvents === 'function') {
                    page.attachEvents();
                }

                // 异步初始化
                if (typeof page.init === 'function') {
                    page.init();
                }

                this.currentPage = page;
            } else if (typeof page === 'string') {
                container.innerHTML = page;
            }

            // 滚动到顶部
            window.scrollTo(0, 0);
        }, oldPage ? 250 : 0);
    }

    /**
     * 匹配路由
     * @param {string} path - 当前路径
     * @returns {object} - { handler, params }
     */
    matchRoute(path) {
        // 首先尝试精确匹配
        if (this.routes.has(path)) {
            return { handler: this.routes.get(path), params: {} };
        }

        // 然后尝试参数匹配
        for (const [routePath, handler] of this.routes) {
            const params = this.extractParams(routePath, path);
            if (params !== null) {
                return { handler, params };
            }
        }

        return { handler: null, params: {} };
    }

    /**
     * 从路径中提取参数
     * @param {string} routePath - 路由模板，如 /test/:type
     * @param {string} actualPath - 实际路径，如 /test/love
     * @returns {object|null} - 参数对象或 null
     */
    extractParams(routePath, actualPath) {
        const routeParts = routePath.split('/').filter(Boolean);
        const actualParts = actualPath.split('/').filter(Boolean);

        if (routeParts.length !== actualParts.length) {
            return null;
        }

        const params = {};

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                // 这是一个参数
                const paramName = routeParts[i].slice(1);
                params[paramName] = decodeURIComponent(actualParts[i]);
            } else if (routeParts[i] !== actualParts[i]) {
                // 不匹配
                return null;
            }
        }

        return params;
    }

    /**
     * 获取当前路由参数
     */
    getParams() {
        return this.currentParams;
    }

    /**
     * 启动路由器
     */
    start() {
        // 处理初始路由（带上 query string，确保首次加载时 URL 参数不丢失）
        const fullPath = window.location.pathname + window.location.search;
        this.handleRoute(fullPath, false);
    }
}

// 创建全局路由实例
const router = new Router();

// 暴露到全局
window.router = router;

export default router;
