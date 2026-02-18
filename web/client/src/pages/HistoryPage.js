/**
 * 历史记录列表页面
 * 展示用户的匹配记录历史
 */

import { Navbar, EmptyState, LoadingIndicator } from '../components/Common.js';
import { historyApi } from '../services/api.js';

export class HistoryPage {
    constructor() {
        this.records = [];
        this.total = 0;
        this.page = 1;
        this.pageSize = 20;
        this.isLoading = true;
        this.hasMore = false;
    }

    render() {
        return `
      <div class="page history-page">
        ${Navbar({
            title: '历史记录',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            <div id="history-content">
              ${LoadingIndicator('加载历史记录...')}
            </div>
          </div>
        </main>
      </div>
    `;
    }

    attachEvents() {
        // 返回按钮
        const backBtn = document.querySelector('.navbar__back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.router.back();
            });
        }

        // 加载数据
        this.loadRecords();
    }

    /**
     * 从本地存储获取用户标识
     * 优先获取 userId（已登录用户），其次获取 sessionId
     */
    getLocalIdentity() {
        let userId = null;
        let sessionId = null;

        // 优先从本地存储获取 userId
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                userId = user.id || user.userId || null;
            } catch (e) { /* ignore */ }
        }

        // 获取 sessionId
        sessionId = localStorage.getItem('sessionId') || null;

        console.log(`[历史记录] 本地标识 - userId: ${userId}, sessionId: ${sessionId ? sessionId.slice(0, 8) + '...' : 'null'}`);
        return { userId, sessionId };
    }

    async loadRecords() {
        try {
            this.isLoading = true;
            const container = document.getElementById('history-content');
            if (!container) return;

            // 从本地存储获取 userId 或 sessionId
            const { userId, sessionId } = this.getLocalIdentity();

            // 校验：至少需要一个标识
            if (!userId && !sessionId) {
                this.isLoading = false;
                container.innerHTML = this.renderError('未找到用户标识，请先完成一次测试');
                this.attachContentEvents();
                return;
            }

            // 优先使用 userId 查询，userId 不存在时才使用 sessionId
            const queryParams = { page: this.page, pageSize: this.pageSize };
            if (userId) {
                queryParams.userId = userId;
            } else {
                queryParams.sessionId = sessionId;
            }

            const result = await historyApi.getRecords(queryParams);

            if (result.success && result.data) {
                this.records = result.data.records || [];
                this.total = result.data.total || 0;
                this.hasMore = this.records.length < this.total;
            }

            this.isLoading = false;
            container.innerHTML = this.renderContent();
            this.attachContentEvents();
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.isLoading = false;
            const container = document.getElementById('history-content');
            if (container) {
                container.innerHTML = this.renderError(error.message);
                this.attachContentEvents();
            }
        }
    }

    renderContent() {
        if (this.records.length === 0) {
            return `
        <div class="history-empty animate-fade-in-up">
          ${EmptyState({
                icon: '📭',
                title: '暂无历史记录',
                description: '完成一次匹配测试后，记录将显示在这里',
                actionText: '返回首页'
            })}
        </div>
      `;
        }

        return `
      <div class="history-list animate-fade-in-up">
        <div class="history-table">
          <!-- 表头 -->
          <div class="history-table__header">
            <div class="history-table__cell history-table__cell--no">序号</div>
            <div class="history-table__cell history-table__cell--question">问题</div>
            <div class="history-table__cell history-table__cell--action">测算结果</div>
          </div>
          
          <!-- 表体 -->
          ${this.records.map(record => `
            <div class="history-table__row" data-record-id="${record.id}">
              <div class="history-table__cell history-table__cell--no">${record.serialNumber}</div>
              <div class="history-table__cell history-table__cell--question">
                <span class="history-question-text" title="${this.escapeHtml(record.question)}">
                  ${this.truncateText(record.question, 50)}
                </span>
              </div>
              <div class="history-table__cell history-table__cell--action">
                <span class="history-status history-status--success">${record.status}</span>
                <button class="btn btn--primary btn--xs history-detail-btn" 
                        data-record-id="${record.id}"
                        data-session-id="${record.sessionId || ''}">
                  查看详情
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 分页信息 -->
        <div class="history-pagination">
          <span class="history-pagination__info">共 ${this.total} 条记录</span>
          ${this.hasMore ? `
            <button class="btn btn--outline btn--sm history-load-more">
              加载更多
            </button>
          ` : ''}
        </div>
      </div>
    `;
    }

    renderError(message) {
        return `
      <div class="history-error text-center mt-8 animate-fade-in-up">
        <div class="history-error__icon">😥</div>
        <p class="body-text-secondary mb-4">加载失败：${message || '网络错误'}</p>
        <button class="btn btn--primary btn--sm" id="history-retry-btn">
          重试
        </button>
      </div>
    `;
    }

    attachContentEvents() {
        // 查看详情按钮
        document.querySelectorAll('.history-detail-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recordId = btn.dataset.recordId;
                const sessionId = btn.dataset.sessionId;
                window.router.navigate(`/history/detail/${recordId}`);
            });
        });

        // 返回首页按钮（空状态）
        const emptyActionBtn = document.querySelector('[data-action="empty-action"]');
        if (emptyActionBtn) {
            emptyActionBtn.addEventListener('click', () => {
                window.router.navigate('/');
            });
        }

        // 重试按钮
        const retryBtn = document.getElementById('history-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.loadRecords();
            });
        }

        // 加载更多
        const loadMoreBtn = document.querySelector('.history-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.page++;
                this.loadMoreRecords();
            });
        }
    }

    async loadMoreRecords() {
        try {
            // 从本地存储获取 userId 或 sessionId
            const { userId, sessionId } = this.getLocalIdentity();

            // 优先使用 userId 查询，userId 不存在时才使用 sessionId
            const queryParams = { page: this.page, pageSize: this.pageSize };
            if (userId) {
                queryParams.userId = userId;
            } else {
                queryParams.sessionId = sessionId;
            }

            const result = await historyApi.getRecords(queryParams);

            if (result.success && result.data) {
                this.records = [...this.records, ...(result.data.records || [])];
                this.total = result.data.total || 0;
                this.hasMore = this.records.length < this.total;
            }

            const container = document.getElementById('history-content');
            if (container) {
                container.innerHTML = this.renderContent();
                this.attachContentEvents();
            }
        } catch (error) {
            console.error('加载更多记录失败:', error);
            window.showToast('加载失败，请重试', 'error');
        }
    }

    truncateText(text, maxLen) {
        if (!text) return '';
        return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default HistoryPage;
