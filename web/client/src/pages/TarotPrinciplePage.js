/**
 * 直觉卡牌 问事原则页
 * 展示问事原则指引
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar, ProgressBar } from '../components/Common.js';

// 问事原则列表
const principles = [
    {
        icon: '🙏',
        title: '心诚则灵',
        description: '抱着敬畏之心提问，结果才准确',
        tips: ['静心默念所问之事']
    },
    {
        icon: '🎯',
        title: '专注才准',
        description: '三心二意会干扰结果准确性',
        tips: ['找安静环境，排除杂念']
    },
    {
        icon: '🤝',
        title: '动机纯正',
        description: '为趋吉避凶，非满足私欲',
        tips: ['明确真实目的']
    }
];

export class TarotPrinciplePage {
    constructor(params) {
        this.matchType = getMatchTypeById(params.type);
        
        if (!this.matchType) {
            window.router.navigate('/');
            return;
        }
    }

    render() {
        if (!this.matchType) return '';

        return `
      <div class="page tarot-principle-page">
        ${Navbar({
            title: '',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            
            <!-- 进度指示器 -->
            <div class="tarot-progress">
              ${ProgressBar(3, 5, {
                  showText: false,
                  showSteps: true,
                  stepLabel: ''
              })}
            </div>

            <!-- 页面标题 -->
            <section class="principle-header animate-fade-in-up">
              <div class="principle-title-icon">💬</div>
              <h1 class="principle-title">问事原则</h1>
              <p class="principle-subtitle">遵循原则，方能得到准确指引</p>
            </section>

            <!-- 原则列表 -->
            <section class="principle-rules animate-fade-in-up animate-delay-100">
              ${principles.map((principle, index) => `
                <div class="principle-card animate-fade-in-up animate-delay-${(index + 1) * 100}">
                  <div class="principle-card__header">
                    <span class="principle-card__icon">${principle.icon}</span>
                    <h3 class="principle-card__title">${principle.title}</h3>
                  </div>
                  <p class="principle-card__description">${principle.description}</p>
                  <div class="principle-card__tips">
                    ${principle.tips.map(tip => `
                      <div class="principle-tip">
                        <span class="principle-tip__dot">·</span>
                        <span class="principle-tip__text">${tip}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </section>

            <!-- 底部按钮区域 -->
            <section class="principle-footer animate-fade-in-up animate-delay-400">
              <div class="principle-footer__buttons">
                <button class="btn btn--secondary btn--lg prev-btn" id="prevBtn">
                  上一步
                </button>
                <button class="btn btn--primary btn--lg next-btn" id="nextBtn">
                  开始问事 🔮
                </button>
              </div>
            </section>

            <div class="safe-area-bottom"></div>
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

        // 上一步按钮
        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                window.router.back();
            });
        }

        // 下一步按钮
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.handleNext();
            });
        }
    }

    handleNext() {
        // 记录日志
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        console.log(`[${timestamp}] 用户已阅读问事原则，开始问事`);

        // 跳转到洗牌页面
        window.router.navigate(`/test/${this.matchType.id}/tarot/shuffle`);
    }
}

export default TarotPrinciplePage;
