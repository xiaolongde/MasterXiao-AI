/**
 * 小红书测试页
 * 从 XHS 落地页"开始匹配..."按钮进入
 * 
 * 布局：
 * - 上半部分：从后台小红书菜单管理获取显示状态的菜单列表（可点选）
 * - 下半部分：选择测试方式（生日匹配 / 直觉塔罗）
 * 
 * 支持URL参数：
 * - /xhs/test?s=XHS6FTMGXVX  兑换码参数
 */

import { matchTypes as allMatchTypes, getMatchTypeById } from '../data/matchTypes.js';
import { Navbar } from '../components/Common.js';
import { FeatureCard } from '../components/FeatureCard.js';
import { xhsMenuApi, questionApi, getApiBaseUrl } from '../services/api.js';

// API 配置（动态获取）
const API_BASE = getApiBaseUrl();

// 菜单名称 → 本地 matchType id 的映射
const nameToIdMap = {
    '感情匹配': 'love',
    '合作关系': 'cooperation',
    '合作匹配': 'cooperation',
    '职场关系': 'career',
    '职业匹配': 'career',
    'TA的想法和态度': 'thoughts',
    '职业发展': 'job',
    '城市方向': 'city',
    '城市匹配': 'city',
    '宠物匹配': 'pet',
    '社交魅力': 'peach',
    '人脉分析': 'benefactor',
    'Yes or No': 'yesno',
    '二选一': 'choice'
};

// 问题分类与规则类型的映射
const CATEGORY_RULE_MAP = {
    '综合': 'nianyun',
    '健康类': 'jiankang',
    '事业类': 'shiye',
    '财运类': 'caiyun',
    '感情类': 'ganqing',
    '感情匹配': 'ganqing',
    '投资类': 'gushi',
    '学业类': 'shengxue',
    '其他类': 'qita'
};

export class XHSTestPage {
    constructor() {
        this.menuTypes = [];
        this.selectedType = null; // 用户选中的菜单项

        // 解析URL参数
        const urlParams = new URLSearchParams(window.location.search);
        this.redeemCode = urlParams.get('s');
        this.isVerifying = false;
        this.codeVerified = false;
        this.questions = [];
        this.questionInputEnabled = false;
        this.selectedQuestionId = null;
        this.userInputText = '';
    }

    render() {
        return `
      <div class="page xhs-test-page">
        ${Navbar({
            title: '趣味测试',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}

        <main class="page-content">
          <div class="app-container">

            <!-- 菜单列表（从后台小红书菜单管理获取） -->
            <section class="feature-list mt-4" id="xhsMenuListSection">
              <div style="text-align:center;padding:24px;color:var(--color-text-tertiary);">加载中...</div>
            </section>

            <!-- 测试方式选择 -->
            <section class="xhs-test-method-section mt-6 animate-fade-in-up animate-delay-200">
              <h3 class="heading-3 mb-3 text-center">选择测试方式</h3>

              <div class="glass-card" style="padding: 0; overflow: hidden;">
                <!-- 生日匹配 -->
                <div class="method-card method-card--compact" data-method="birthday" style="padding: 14px 16px; cursor: pointer;">
                  <div class="method-card__icon" style="font-size: 28px;">🎂</div>
                  <div class="method-card__content">
                    <h4 class="method-card__title" style="font-size: 15px; margin-bottom: 2px;">生日匹配</h4>
                    <p class="method-card__description" style="font-size: 12px; margin-bottom: 0;">输入双方生日，通过生日特质分析性格关系</p>
                  </div>
                  <span class="method-card__arrow">→</span>
                </div>

                <!-- 渐变色分隔线 -->
                <div style="height: 1.5px; margin: 0 16px; background: linear-gradient(90deg, transparent, var(--color-primary), #f472b6, transparent);"></div>

                <!-- 直觉塔罗测试 -->
                <div class="method-card method-card--compact" data-method="tarot" style="padding: 14px 16px; cursor: pointer;">
                  <div class="method-card__icon" style="font-size: 28px;">🔮</div>
                  <div class="method-card__content">
                    <h4 class="method-card__title" style="font-size: 15px; margin-bottom: 2px;">直觉塔罗</h4>
                    <p class="method-card__description" style="font-size: 12px; margin-bottom: 0;">凭直觉翻牌，通过卡牌符号解析关系</p>
                  </div>
                  <span class="method-card__arrow">→</span>
                </div>
              </div>
            </section>

            <!-- 性别选择弹框 -->
            <div id="genderModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;">
              <div id="genderModalOverlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);"></div>
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:85%;max-width:360px;background:#fff;border-radius:20px;padding:30px 20px 32px;box-sizing:border-box;animation:fadeScaleIn 0.3s ease;">
                <h3 style="text-align:center;font-size:18px;font-weight:600;color:var(--color-text-primary);margin-bottom:8px;">请选择您的性别</h3>
                <p style="text-align:center;font-size:13px;color:var(--color-text-tertiary);margin-bottom:24px;">性别信息将帮助更准确解读结果</p>
                <div style="display:flex;justify-content:center;gap:40px;">
                  <div class="ts-gender-option" data-gender="male" style="display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;padding:16px 24px;border-radius:16px;border:2px solid transparent;transition:all 0.2s;">
                    <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#60a5fa,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:32px;">👨</div>
                    <span style="font-size:15px;font-weight:500;color:var(--color-text-primary);">男</span>
                  </div>
                  <div class="ts-gender-option" data-gender="female" style="display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;padding:16px 24px;border-radius:16px;border:2px solid transparent;transition:all 0.2s;">
                    <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#f472b6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:32px;">👩</div>
                    <span style="font-size:15px;font-weight:500;color:var(--color-text-primary);">女</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-8 safe-area-bottom"></div>
          </div>
        </main>
      </div>
    `;
    }

    async init() {
        try {
            const result = await xhsMenuApi.getList();
            if (result.code === 200 && result.data && result.data.length > 0) {
                const matchTypeMap = {};
                allMatchTypes.forEach(t => { matchTypeMap[t.id] = t; matchTypeMap[t.title] = t; });

                this.menuTypes = [];
                for (const menu of result.data) {
                    const id = nameToIdMap[menu.name];
                    const matchType = id ? matchTypeMap[id] : matchTypeMap[menu.name];
                    if (matchType) {
                        const item = { ...matchType };
                        // 用后台菜单的 name 作为卡片标题
                        item.title = menu.name;
                        if (menu.description) {
                            item.description = menu.description;
                        }
                        this.menuTypes.push(item);
                    } else {
                        this.menuTypes.push({
                            id: menu.name,
                            icon: '📂',
                            title: menu.name,
                            description: menu.description || menu.name,
                            popular: false
                        });
                    }
                }
                this.renderMenuCards();
            } else {
                const section = document.getElementById('xhsMenuListSection');
                if (section) section.innerHTML = '<div style="text-align:center;padding:24px;color:var(--color-text-tertiary);">暂无测试菜单</div>';
            }
        } catch (e) {
            console.warn('获取小红书菜单列表失败:', e.message);
            const section = document.getElementById('xhsMenuListSection');
            if (section) section.innerHTML = '<div style="text-align:center;padding:24px;color:var(--color-text-tertiary);">加载失败，请刷新重试</div>';
        }
    }

    renderMenuCards() {
        const section = document.getElementById('xhsMenuListSection');
        if (!section) return;

        section.innerHTML = this.menuTypes.map((type, index) => `
            <div class="animate-fade-in-up animate-delay-${Math.min((index + 1) * 100, 500)}">
              ${FeatureCard(type, { showBadge: true })}
            </div>
        `).join('');

        // 绑定卡片点击 → 选中该菜单项
        section.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectMenu(card.dataset.type);
            });
        });

        this.initAnimations();
    }

    /**
     * 选中某个菜单项，高亮并记录，同时加载该分类的题目
     */
    selectMenu(typeId) {
        this.selectedType = typeId;
        this.selectedQuestionId = null;
        this.userInputText = '';

        // 高亮选中项
        document.querySelectorAll('#xhsMenuListSection .feature-card').forEach(card => {
            if (card.dataset.type === typeId) {
                card.classList.add('feature-card--selected');
            } else {
                card.classList.remove('feature-card--selected');
            }
        });

        // 加载该分类下的题目（与 TestSelectPage 同逻辑）
        this.loadQuestions(typeId);
    }

    /**
     * 加载选中菜单对应的题目列表
     */
    async loadQuestions(typeId) {
        // 根据 typeId 获取 matchType 的标题作为分类名
        const matchType = this.menuTypes.find(t => t.id === typeId);
        if (!matchType) return;

        const category = matchType.title;
        try {
            const result = await questionApi.getByCategory(category);
            if (result.code === 200 && result.data) {
                this.questions = result.data.list || [];
                this.questionInputEnabled = !!result.data.questionInputEnabled;
            }
        } catch (e) {
            console.warn('获取题目列表失败:', e.message);
            this.questions = [];
        }
    }

    attachEvents() {
        this.initAnimations();

        // 返回按钮
        const backBtn = document.querySelector('.navbar__back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.router.back();
            });
        }

        // 菜单卡片点击
        document.querySelectorAll('#xhsMenuListSection .feature-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectMenu(card.dataset.type);
            });
        });

        // 测试方式卡片点击
        document.querySelectorAll('.method-card').forEach(card => {
            card.addEventListener('click', () => {
                const method = card.dataset.method;
                this.handleMethodSelect(method);
            });
        });

        // 性别选择事件
        document.querySelectorAll('.ts-gender-option').forEach(option => {
            option.addEventListener('click', () => {
                const gender = option.dataset.gender;
                document.querySelectorAll('.ts-gender-option').forEach(opt => {
                    opt.style.borderColor = 'transparent';
                    opt.style.background = '';
                });
                option.style.borderColor = gender === 'male' ? '#3b82f6' : '#ec4899';
                option.style.background = gender === 'male' ? 'rgba(59,130,246,0.08)' : 'rgba(236,72,153,0.08)';

                setTimeout(() => {
                    this.submitTarotWithGender(gender);
                }, 500);
            });
        });

        // 点击遮罩关闭弹框
        const overlay = document.getElementById('genderModalOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hideGenderModal();
            });
        }

        // 添加弹框动画样式
        if (!document.querySelector('#ts-gender-modal-style')) {
            const style = document.createElement('style');
            style.id = 'ts-gender-modal-style';
            style.textContent = `
                @keyframes fadeScaleIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ==================== 与 TestSelectPage 同样的判断逻辑 ====================

    /**
     * 验证兑换码
     */
    async verifyRedeemCode() {
        if (!this.redeemCode) return { valid: true };
        try {
            const response = await fetch(`${API_BASE}/redeem/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: this.redeemCode })
            });
            return await response.json();
        } catch (error) {
            console.error('验证兑换码失败:', error);
            return { valid: false, message: '网络错误，请稍后重试' };
        }
    }

    /**
     * 获取最终选定的问题文本
     */
    getSelectedQuestionText() {
        if (this.userInputText && this.userInputText.trim()) {
            return this.userInputText.trim();
        }
        if (this.selectedQuestionId) {
            const selectedQ = this.questions.find(q => q.id === this.selectedQuestionId);
            return selectedQ ? selectedQ.title : '';
        }
        return '';
    }

    showGenderModal() {
        const modal = document.getElementById('genderModal');
        if (modal) modal.style.display = 'block';
    }

    hideGenderModal() {
        const modal = document.getElementById('genderModal');
        if (modal) modal.style.display = 'none';
        document.querySelectorAll('.ts-gender-option').forEach(opt => {
            opt.style.borderColor = 'transparent';
            opt.style.background = '';
        });
    }

    /**
     * 选择性别后保存数据并跳转
     */
    submitTarotWithGender(gender) {
        const matchType = this.menuTypes.find(t => t.id === this.selectedType);
        const question = this.getSelectedQuestionText();
        const categoryName = matchType ? matchType.title : '综合';
        const ruleType = CATEGORY_RULE_MAP[categoryName] || 'ganqing';

        if (window.appState) {
            window.appState.set('tarotQuestion', question);
            window.appState.set('tarotCategory', categoryName);
            window.appState.set('tarotGender', gender);
            window.appState.set('selectedQuestion', question);
            window.appState.set('questionCategory', categoryName);
            window.appState.set('questionType', ruleType);
            if (this.redeemCode) {
                window.appState.set('redeemCode', this.redeemCode);
            }
        }

        this.hideGenderModal();
        window.router.navigate(`/test/${this.selectedType}/tarot/pick`);
    }

    /**
     * 选择测试方式 —— 与 TestSelectPage.handleMethodSelect 同样的判断
     */
    async handleMethodSelect(method) {
        if (this.isVerifying) return;

        // 1. 必须先选择一个菜单项
        if (!this.selectedType) {
            window.showToast('请先选择一个测试主题', 'error');
            return;
        }

        // 2. 兑换码验证流程
        if (this.redeemCode && !this.codeVerified) {
            this.isVerifying = true;

            const clickedCard = document.querySelector(`.method-card[data-method="${method}"]`);
            if (clickedCard) {
                clickedCard.style.opacity = '0.7';
                clickedCard.style.pointerEvents = 'none';
            }

            const verifyResult = await this.verifyRedeemCode();

            if (clickedCard) {
                clickedCard.style.opacity = '';
                clickedCard.style.pointerEvents = '';
            }

            this.isVerifying = false;

            if (!verifyResult.valid && !verifyResult.success) {
                window.showToast(verifyResult.message || '兑换码无效', 'error');
                return;
            }

            if (window.appState) {
                window.appState.set('redeemCode', this.redeemCode);
            }
            this.codeVerified = true;
        }

        // 3. 导航到下一页
        const typeId = this.selectedType;
        if (method === 'birthday') {
            let url = `/test/${typeId}/birthday`;
            if (this.redeemCode) {
                url += `?s=${encodeURIComponent(this.redeemCode)}`;
            }
            window.router.navigate(url);
        } else if (method === 'tarot') {
            // 弹出性别选择弹框（与 TestSelectPage 一致）
            this.showGenderModal();
        }
    }

    initAnimations() {
        const animatedElements = document.querySelectorAll('.animate-hidden');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('animate-hidden');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        animatedElements.forEach(el => observer.observe(el));
    }
}

export default XHSTestPage;
