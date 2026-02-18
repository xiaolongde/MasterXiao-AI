/**
 * 主题列表页
 * 从首页"开始匹配"进入，展示所有趣味测试主题
 * 点击主题卡片跳转到对应的测试选择页
 */

import { matchTypes } from '../data/matchTypes.js';
import { Navbar } from '../components/Common.js';
import { FeatureCard } from '../components/FeatureCard.js';
import { topicCategoryApi } from '../services/api.js';

export class TopicListPage {
    constructor() {
        this.matchTypes = matchTypes;
        this.topicCategories = [];
    }

    render() {
        return `
      <div class="page topic-list-page">
        ${Navbar({
            title: '趣味测试',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}

        <main class="page-content">
          <div class="app-container">

            <!-- 功能卡片列表 -->
            <section class="feature-list mt-4" id="topicFeatureListSection">
              ${this.matchTypes.map((type, index) => `
                <div class="animate-fade-in-up animate-delay-${Math.min((index + 1) * 100, 500)} animate-hidden">
                  ${FeatureCard(type, { showBadge: true })}
                </div>
              `).join('')}
            </section>

            <!-- 底部间距 -->
            <div class="mt-8 safe-area-bottom"></div>
          </div>
        </main>
      </div>
    `;
    }

    async init() {
        // 从服务端获取主题分类列表，替换功能卡片
        try {
            const result = await topicCategoryApi.getList();
            if (result.code === 200 && result.data && result.data.length > 0) {
                this.topicCategories = result.data;
                this.renderFeatureCards();
            }
        } catch (e) {
            console.warn('获取主题分类失败，使用本地数据:', e.message);
        }
    }

    /**
     * 根据服务端主题分类重新渲染功能卡片
     */
    renderFeatureCards() {
        const section = document.getElementById('topicFeatureListSection');
        if (!section) return;

        // 将服务端分类映射到本地 matchTypes
        const matchTypeMap = {};
        this.matchTypes.forEach(t => { matchTypeMap[t.id] = t; matchTypeMap[t.title] = t; });

        // 用于按服务端分类名称匹配本地数据
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

        const orderedTypes = [];
        for (const cat of this.topicCategories) {
            const id = nameToIdMap[cat.name];
            const matchType = id ? matchTypeMap[id] : matchTypeMap[cat.name];
            if (matchType) {
                orderedTypes.push(matchType);
            } else {
                // 服务端有但本地没有的分类，创建一个临时条目
                orderedTypes.push({
                    id: cat.name,
                    icon: '📂',
                    title: cat.name,
                    description: cat.name,
                    popular: false
                });
            }
        }

        section.innerHTML = orderedTypes.map((type, index) => `
            <div class="animate-fade-in-up animate-delay-${Math.min((index + 1) * 100, 500)}">
              ${FeatureCard(type, { showBadge: true })}
            </div>
        `).join('');

        // 重新绑定卡片点击事件
        this.bindCardEvents();
    }

    attachEvents() {
        // 初始化动画
        this.initAnimations();

        // 功能卡片点击
        this.bindCardEvents();

        // 返回按钮
        const backBtn = document.querySelector('.navbar__back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.router.back();
            });
        }
    }

    bindCardEvents() {
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.handleFeatureClick(type);
            });
        });
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
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(el => observer.observe(el));
    }

    handleFeatureClick(type) {
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        console.log(`[${timestamp}] 选择了匹配类型: ${type}`);
        // 导航到测试选择页
        window.router.navigate(`/test/${type}`);
    }
}

export default TopicListPage;
