/**
 * 直觉卡牌 问事禁忌页
 * 展示问事禁忌规则
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar, ProgressBar } from '../components/Common.js';

// 禁忌规则列表
const tabooRules = [
    {
        icon: '🚫',
        title: '只能算自己的事',
        description: '结果只反映提问者本人的气场',
        examples: [
            { text: '帮朋友算', allowed: false },
            { text: '算自己的事', allowed: true }
        ]
    },
    {
        icon: '👨‍👩‍👧',
        title: '至亲除外',
        description: '可帮父母/子女算，需真心关切',
        examples: [
            { text: '帮家人算', allowed: true },
            { text: '帮同事算', allowed: false }
        ]
    },
    {
        icon: '⚖️',
        title: '不算不正之事',
        description: '违背道德的事不会灵验',
        examples: [
            { text: '婚外情', allowed: false },
            { text: '坑害他人', allowed: false }
        ]
    },
    {
        icon: '🚨',
        title: '不算违法之事',
        description: '违法犯罪天理不容',
        examples: [
            { text: '赌博', allowed: false },
            { text: '非法牟利', allowed: false }
        ]
    }
];

export class TarotTabooPage {
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
      <div class="page tarot-taboo-page">
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
              ${ProgressBar(2, 5, {
                  showText: false,
                  showSteps: true,
                  stepLabel: ''
              })}
            </div>

            <!-- 页面标题 -->
            <section class="taboo-header animate-fade-in-up">
              <div class="taboo-title-icon">⚠️</div>
              <h1 class="taboo-title">问事禁忌</h1>
              <p class="taboo-subtitle">请仔细阅读，违反禁忌会影响准确性</p>
            </section>

            <!-- 禁忌规则列表 -->
            <section class="taboo-rules animate-fade-in-up animate-delay-100">
              ${tabooRules.map((rule, index) => `
                <div class="taboo-card animate-fade-in-up animate-delay-${(index + 1) * 100}">
                  <div class="taboo-card__header">
                    <span class="taboo-card__icon">${rule.icon}</span>
                    <h3 class="taboo-card__title">${rule.title}</h3>
                  </div>
                  <p class="taboo-card__description">${rule.description}</p>
                  <div class="taboo-card__examples">
                    ${rule.examples.map(ex => `
                      <span class="taboo-example ${ex.allowed ? 'taboo-example--allowed' : 'taboo-example--forbidden'}">
                        <span class="taboo-example__icon">${ex.allowed ? '✅' : '❌'}</span>
                        <span class="taboo-example__text">${ex.text}</span>
                      </span>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </section>

            <!-- 底部按钮区域 -->
            <section class="taboo-footer animate-fade-in-up animate-delay-500">
              <div class="taboo-footer__buttons">
                <button class="btn btn--secondary btn--lg prev-btn" id="prevBtn">
                  上一步
                </button>
                <button class="btn btn--primary btn--lg next-btn" id="nextBtn">
                  我已了解，下一步
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
        console.log(`[${timestamp}] 用户已阅读问事禁忌，进入下一步`);

        // 跳转到问事原则页面
        window.router.navigate(`/test/${this.matchType.id}/tarot/principle`);
    }
}

export default TarotTabooPage;
