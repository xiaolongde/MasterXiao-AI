/**
 * 历史记录详情页面
 * 展示单条匹配记录的完整结果
 * 布局与最终结果页一致
 */

import { Navbar, LoadingIndicator } from '../components/Common.js';
import { historyApi } from '../services/api.js';

export class HistoryDetailPage {
    constructor(params) {
        this.recordId = params.id;
        this.record = null;
        this.isLoading = true;
        this.error = null;
    }

    render() {
        return `
      <div class="page history-detail-page">
        ${Navbar({
            title: '记录详情',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            <div id="detail-content">
              ${LoadingIndicator('加载记录详情...')}
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

        // 加载详情
        this.loadDetail();
    }

    /**
     * 从本地存储获取用户标识
     */
    getLocalIdentity() {
        let userId = null;
        let sessionId = null;

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                userId = user.id || user.userId || null;
            } catch (e) { /* ignore */ }
        }

        sessionId = localStorage.getItem('sessionId') || null;
        return { userId, sessionId };
    }

    async loadDetail() {
        try {
            this.isLoading = true;
            const container = document.getElementById('detail-content');
            if (!container) return;

            // 从本地存储获取 userId 或 sessionId
            const { userId, sessionId } = this.getLocalIdentity();

            console.log(`[历史详情] 加载记录 ${this.recordId}, userId: ${userId}, sessionId: ${sessionId ? sessionId.slice(0, 8) + '...' : 'null'}`);

            const result = await historyApi.getRecordDetail(this.recordId, {
                sessionId,
                userId
            });

            if (result.success && result.data) {
                this.record = result.data;
            } else {
                this.error = result.message || '加载失败';
            }

            this.isLoading = false;
            container.innerHTML = this.renderContent();
            this.attachContentEvents();
        } catch (error) {
            console.error('加载记录详情失败:', error);
            this.error = error.message || '网络错误';
            this.isLoading = false;
            const container = document.getElementById('detail-content');
            if (container) {
                container.innerHTML = this.renderError();
                this.attachContentEvents();
            }
        }
    }

    renderContent() {
        if (this.error) {
            return this.renderError();
        }

        if (!this.record) {
            return this.renderError();
        }

        const { question, result, reqData, createTime, status } = this.record;

        // 提取人物信息
        let personA = null;
        let personB = null;
        if (reqData) {
            if (reqData.personA) {
                personA = reqData.personA;
            } else if (reqData.person1_name) {
                personA = { name: reqData.person1_name, birthDate: reqData.person1_birthday };
                personB = { name: reqData.person2_name, birthDate: reqData.person2_birthday };
            }
            if (reqData.personB) {
                personB = reqData.personB;
            }
        }

        // 格式化结果内容
        let resultContent = '';
        if (result) {
            if (typeof result === 'string') {
                resultContent = this.formatMarkdown(result);
            } else if (result.content) {
                resultContent = this.formatMarkdown(result.content);
            } else if (result.text) {
                resultContent = this.formatMarkdown(result.text);
            } else if (result.result) {
                resultContent = this.formatMarkdown(typeof result.result === 'string' ? result.result : JSON.stringify(result.result));
            } else {
                resultContent = this.formatMarkdown(JSON.stringify(result, null, 2));
            }
        }

        // 格式化时间
        const formattedTime = createTime ? new Date(createTime).toLocaleString('zh-CN') : '';

        return `
      <div class="result-content animate-fade-in-up">
        <!-- 记录信息头 -->
        <div class="glass-card mb-4">
          <div class="history-detail-header">
            <div class="history-detail-meta">
              <span class="history-status history-status--success">${status}</span>
              <span class="history-detail-time">${formattedTime}</span>
            </div>
            <h3 class="heading-3 mt-2">${this.escapeHtml(question)}</h3>
          </div>
        </div>

        ${personA && personB ? `
        <!-- 双方信息 -->
        <div class="glass-card persons-card mb-4">
          <div class="persons-row">
            <div class="person-info">
              <span class="person-avatar">${personA.gender === '男' ? '👨' : '👩'}</span>
              <span class="person-name">${personA.name || '你'}</span>
              ${personA.birthDate ? `<span class="person-birth small-text">${personA.birthDate}</span>` : ''}
            </div>
            <div class="vs-badge">VS</div>
            <div class="person-info">
              <span class="person-avatar">${personB.gender === '男' ? '👨' : '👩'}</span>
              <span class="person-name">${personB.name || '对方'}</span>
              ${personB.birthDate ? `<span class="person-birth small-text">${personB.birthDate}</span>` : ''}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- 分析结果 -->
        <div class="glass-card ai-result-card mb-4">
          <h4 class="heading-3 mb-4">🤖 分析报告</h4>
          <div class="ai-content">
            ${resultContent || '<p class="body-text-secondary">暂无分析结果</p>'}
          </div>
        </div>

        <!-- 温馨提示 -->
        <div class="glass-card glass-card--light disclaimer-card mb-4">
          <p class="small-text text-center" style="color: var(--color-text-tertiary);">
            ⚠️ 以上分析仅供娱乐参考，不构成任何决策建议
          </p>
        </div>

        <!-- 底部操作 -->
        <div class="history-detail-actions mb-8">
          <button class="btn btn--outline btn--md" id="back-to-history-btn">
            ← 返回历史记录
          </button>
          <button class="btn btn--primary btn--md" id="back-to-home-btn">
            再来一次
          </button>
        </div>
      </div>
    `;
    }

    renderError() {
        return `
      <div class="history-error text-center mt-8 animate-fade-in-up">
        <div class="history-error__icon">😥</div>
        <p class="body-text-secondary mb-4">${this.error || '记录不存在'}</p>
        <button class="btn btn--outline btn--sm" id="back-to-history-btn">
          返回历史记录
        </button>
      </div>
    `;
    }

    attachContentEvents() {
        const backToHistoryBtn = document.getElementById('back-to-history-btn');
        if (backToHistoryBtn) {
            backToHistoryBtn.addEventListener('click', () => {
                window.router.navigate('/history');
            });
        }

        const backToHomeBtn = document.getElementById('back-to-home-btn');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', () => {
                window.router.navigate('/');
            });
        }
    }

    /**
     * 简化的 Markdown 格式化
     * 将 Markdown 文本转为 HTML
     */
    formatMarkdown(text) {
        if (!text) return '';

        // 过滤 AI 生成的免责声明
        let html = text.split('\n').filter(line => {
            const trimmed = line.trim();
            return !/以上分析由.*生成/.test(trimmed) &&
                   !/内容仅供参考.*切勿全信/.test(trimmed) &&
                   !/人生的主动权.*始终在/.test(trimmed);
        }).join('\n');

        // 处理标题 (## -> h2, ### -> h3 等)
        html = html.replace(/^### (.+)$/gm, '<h4 class="heading-4 mt-4 mb-2">$1</h4>');
        html = html.replace(/^## (.+)$/gm, '<h3 class="heading-3 mt-4 mb-2">$1</h3>');
        html = html.replace(/^# (.+)$/gm, '<h2 class="heading-2 mt-4 mb-2">$1</h2>');

        // 处理粗体
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // 处理斜体
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // 处理列表项
        html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');

        // 将连续的 <li> 包裹在 <ul> 中
        html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="ai-list">$1</ul>');

        // 处理数字列表
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // 处理分隔线
        html = html.replace(/^---$/gm, '<hr class="divider">');

        // 处理段落（非空行，非HTML标签开头）
        html = html.replace(/^(?!<[a-z])((?!\s*$).+)$/gm, '<p class="body-text mb-2">$1</p>');

        // 清理多余的空行
        html = html.replace(/\n{3,}/g, '\n\n');

        return html;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default HistoryDetailPage;
