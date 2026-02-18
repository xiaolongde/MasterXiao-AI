/**
 * 小红书引流落地页
 * 从服务端动态获取小红书主题记录表中显示状态的主题列表
 * 
 * 支持URL参数：
 * - /xhs?s=XHS6FTMGXVX  兑换码参数，会传递到后续页面
 */

import { matchTypes as allMatchTypes } from '../data/matchTypes.js';
import { Navbar, HeroBanner } from '../components/Common.js';
import { FeatureCard } from '../components/FeatureCard.js';
import { xhsTopicApi } from '../services/api.js';

// 服务端主题名称 → 本地 matchType id 的映射
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

export class XHSLandingPage {
    constructor() {
        // 初始用空数组，init 后动态填充
        this.matchTypes = [];
        
        // 解析URL参数 - 只判断 s 参数（兑换码）
        const urlParams = new URLSearchParams(window.location.search);
        this.redeemCode = urlParams.get('s');
    }

    render() {
        return `
      <div class="page home-page xhs-landing-page">
        ${Navbar({
            title: '趣味性格测试平台',
            showBack: false,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            
            <!-- 欢迎横幅 -->
            ${HeroBanner({
            icon: '✨',
            title: '发现你的性格契合度',
            subtitle: '探索人际关系的奥秘',
            buttonText: '开始匹配...'
        })}

            <!-- 场景测试标题 -->
            <section class="section-header mt-6 mb-4">
              <h2 class="heading-2 text-center" style="color: var(--color-text-secondary);">
                热门测试
              </h2>
            </section>

            <!-- 功能卡片列表（init后动态填充） -->
            <section class="feature-list" id="xhsFeatureListSection">
              <div style="text-align:center;padding:24px;color:var(--color-text-tertiary);">加载中...</div>
            </section>

            <!-- 底部间距 -->
            <div class="mt-8 safe-area-bottom"></div>
          </div>
        </main>
      </div>
    `;
    }

    async init() {
        try {
            const result = await xhsTopicApi.getList();
            if (result.code === 200 && result.data && result.data.length > 0) {
                const matchTypeMap = {};
                allMatchTypes.forEach(t => { matchTypeMap[t.id] = t; matchTypeMap[t.title] = t; });

                this.matchTypes = [];
                for (const topic of result.data) {
                    const id = nameToIdMap[topic.topic_name];
                    const matchType = id ? matchTypeMap[id] : matchTypeMap[topic.topic_name];
                    if (matchType) {
                        this.matchTypes.push(matchType);
                    } else {
                        this.matchTypes.push({
                            id: topic.topic_name,
                            icon: '📂',
                            title: topic.topic_name,
                            description: topic.topic_desc || topic.topic_name,
                            popular: false
                        });
                    }
                }
                this.renderFeatureCards();
            } else {
                const section = document.getElementById('xhsFeatureListSection');
                if (section) section.innerHTML = '<div style="text-align:center;padding:24px;color:var(--color-text-tertiary);">暂无测试主题</div>';
            }
        } catch (e) {
            console.warn('获取小红书主题列表失败:', e.message);
            const section = document.getElementById('xhsFeatureListSection');
            if (section) section.innerHTML = '<div style="text-align:center;padding:24px;color:var(--color-text-tertiary);">加载失败，请刷新重试</div>';
        }
    }

    renderFeatureCards() {
        const section = document.getElementById('xhsFeatureListSection');
        if (!section) return;

        section.innerHTML = this.matchTypes.map((type, index) => `
            <div class="animate-fade-in-up animate-delay-${Math.min((index + 1) * 100, 500)}">
              ${FeatureCard(type, { showBadge: true })}
            </div>
        `).join('');

        section.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.handleFeatureClick(type);
            });
        });

        this.initAnimations();
    }

    attachEvents() {
        this.initAnimations();

        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.handleFeatureClick(type);
            });
        });

        // "开始匹配..." 按钮 → 跳转到 XHS 测试页
        const heroBtn = document.querySelector('[data-action="hero-start"]');
        if (heroBtn) {
            heroBtn.addEventListener('click', () => {
                let url = '/xhs/test';
                if (this.redeemCode) {
                    url += `?s=${encodeURIComponent(this.redeemCode)}`;
                }
                window.router.navigate(url);
            });
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

    navigateToTest(type) {
        let url = `/test/${type}`;
        if (this.redeemCode) {
            url += `?s=${encodeURIComponent(this.redeemCode)}`;
        }
        window.router.navigate(url);
    }

    handleFeatureClick(type) {
        this.navigateToTest(type);
    }
}

export default XHSLandingPage;
