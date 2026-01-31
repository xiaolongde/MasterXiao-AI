/**
 * MasterXiao-AI 结果页面
 * 展示AI分析结果
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { getThreePillars, analyzeCompatibility, WUXING } from '../data/bazi.js';
import { Navbar, MessageBubble, BottomActionBar } from '../components/Common.js';
import { typewriter } from '../scripts/utils.js';
import { analysisApi, testApi } from '../services/api.js';

export class ResultPage {
  constructor(params) {
    this.method = params.id; // 'birthday' or 'tarot'
    this.testData = window.appState.get('currentTest');

    if (!this.testData) {
      window.router.navigate('/');
      return;
    }

    this.matchType = getMatchTypeById(this.testData.type);
    this.result = null;
    this.isAnalyzing = true;
  }

  render() {
    return `
      <div class="page result-page">
        ${Navbar({
      title: '分析结果',
      showBack: true,
      showHistory: false,
      showProfile: false
    })}
        
        <main class="page-content">
          <div class="app-container">
            
            <!-- 匹配类型标题 -->
            <section class="result-header mt-4 mb-6 animate-fade-in-up">
              <div class="glass-card text-center">
                <span class="result-header__icon">${this.matchType?.icon || '🔮'}</span>
                <h2 class="heading-2 mb-1">${this.matchType?.title || '匹配分析'}</h2>
                <p class="small-text" style="color: var(--color-text-tertiary);">
                  ${this.method === 'birthday' ? '生日匹配分析' : '六爻卦象分析'}
                </p>
              </div>
            </section>

            <!-- 分析中状态 -->
            <section class="analysis-section" id="analysis-container">
              ${this.isAnalyzing ? this.renderAnalyzing() : this.renderResult()}
            </section>

          </div>
        </main>

        <!-- 底部操作栏 -->
        ${this.renderBottomBar()}
      </div>
    `;
  }

  renderAnalyzing() {
    return `
      <div class="analyzing-state animate-fade-in-up">
        <!-- AI头像消息 -->
        <div class="message message--ai">
          <div class="message__avatar">🔮</div>
          <div class="message__bubble">
            <div class="loading-dots">
              <span class="loading-dots__dot"></span>
              <span class="loading-dots__dot"></span>
              <span class="loading-dots__dot"></span>
            </div>
          </div>
        </div>
        
        <div class="analyzing-tips text-center mt-6">
          <p class="body-text-secondary" id="analyzing-text">正在分析中...</p>
          <div class="analyzing-steps mt-4">
            <div class="step-item active" data-step="1">
              <span class="step-icon">📊</span>
              <span>收集信息</span>
            </div>
            <div class="step-item" data-step="2">
              <span class="step-icon">🧮</span>
              <span>命理计算</span>
            </div>
            <div class="step-item" data-step="3">
              <span class="step-icon">🤖</span>
              <span>AI解读</span>
            </div>
            <div class="step-item" data-step="4">
              <span class="step-icon">📝</span>
              <span>生成报告</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderResult() {
    if (!this.result) return '';

    const { score, conclusion, details, personA, personB } = this.result;

    // 根据分数确定结论类型
    const conclusionType = this.getConclusionType(score);

    return `
      <div class="result-content animate-fade-in-up">
        <!-- 匹配分数 -->
        <div class="glass-card score-card mb-4">
          <div class="score-circle-container">
            <svg class="score-circle" viewBox="0 0 100 100">
              <circle 
                class="score-circle__track" 
                cx="50" cy="50" r="45"
                fill="none" stroke-width="8"
              />
              <circle 
                class="score-circle__fill progress-ring__circle" 
                cx="50" cy="50" r="45"
                fill="none" stroke-width="8"
                stroke-dasharray="${score * 2.83} 283"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="score-value">
              <span class="score-number">${score}</span>
              <span class="score-unit">%</span>
            </div>
          </div>
          <p class="score-label">匹配度</p>
        </div>

        <!-- 结论卡片 -->
        <div class="glass-card conclusion-card mb-4 ${conclusionType.class}">
          <div class="conclusion-icon">${conclusionType.icon}</div>
          <h3 class="heading-3 mb-2">${conclusionType.title}</h3>
          <p class="body-text">${conclusion}</p>
        </div>

        <!-- 详细分析 -->
        <div class="glass-card details-card mb-4">
          <h4 class="heading-3 mb-4">📋 详细分析</h4>
          
          ${this.method === 'birthday' ? this.renderBaziDetails() : this.renderHexagramDetails()}
          
          <div class="analysis-points mt-4">
            ${details.map(detail => `
              <div class="analysis-point ${detail.type}">
                <span class="point-icon">${detail.type === 'positive' ? '✅' : '⚠️'}</span>
                <div class="point-content">
                  <p class="point-title">${detail.title}</p>
                  <p class="point-description">${detail.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- AI 建议 -->
        <div class="glass-card suggestion-card mb-4">
          <h4 class="heading-3 mb-3">💡 AI 建议</h4>
          <div class="suggestion-content" id="suggestion-text">
            ${this.result.suggestion || ''}
          </div>
        </div>

        <!-- 分享提示 -->
        <div class="glass-card glass-card--light share-prompt mb-4">
          <p class="small-text text-center">
            📱 分享给好友，邀请TA一起测试
          </p>
        </div>
      </div>
    `;
  }

  renderBaziDetails() {
    const { personA, personB, pillarsA, pillarsB } = this.result;

    return `
      <div class="bazi-comparison">
        <!-- 人物A -->
        <div class="person-bazi">
          <div class="person-header">
            <span class="person-avatar">${personA.gender === 'male' ? '👨' : '👩'}</span>
            <span class="person-name">${personA.name || '你'}</span>
          </div>
          <div class="pillars-display">
            ${this.renderPillars(pillarsA)}
          </div>
          <div class="elements-display">
            ${this.renderElements(pillarsA.elements)}
          </div>
        </div>
        
        <div class="vs-divider">
          <span>VS</span>
        </div>
        
        <!-- 人物B -->
        <div class="person-bazi">
          <div class="person-header">
            <span class="person-avatar">${personB.gender === 'male' ? '👨' : '👩'}</span>
            <span class="person-name">${personB.name || '对方'}</span>
          </div>
          <div class="pillars-display">
            ${this.renderPillars(pillarsB)}
          </div>
          <div class="elements-display">
            ${this.renderElements(pillarsB.elements)}
          </div>
        </div>
      </div>
    `;
  }

  renderPillars(pillars) {
    return `
      <div class="pillars-row">
        <div class="pillar">
          <span class="pillar-label">年柱</span>
          <span class="pillar-ganzhi">${pillars.year.ganzhi}</span>
        </div>
        <div class="pillar">
          <span class="pillar-label">月柱</span>
          <span class="pillar-ganzhi">${pillars.month.ganzhi}</span>
        </div>
        <div class="pillar">
          <span class="pillar-label">日柱</span>
          <span class="pillar-ganzhi">${pillars.day.ganzhi}</span>
        </div>
      </div>
    `;
  }

  renderElements(elements) {
    return `
      <div class="elements-bar">
        ${Object.entries(elements.distribution).map(([element, count]) => `
          <div class="element-item">
            <span class="element-emoji">${WUXING[element].emoji}</span>
            <span class="element-name">${element}</span>
            <span class="element-count">${count}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderHexagramDetails() {
    const { hexagram } = this.testData;

    return `
      <div class="hexagram-display">
        <div class="hexagram-main">
          <div class="hexagram-symbol text-center">
            <span class="hexagram-icon">${hexagram.upper?.symbol || '☰'}${hexagram.lower?.symbol || '☷'}</span>
            <h4 class="hexagram-name">${hexagram.name}卦</h4>
            <p class="hexagram-meaning">${hexagram.meaning}</p>
          </div>
        </div>
        
        <div class="yaos-detail mt-4">
          <p class="small-text mb-2">六爻详情：</p>
          <div class="yaos-list">
            ${hexagram.yaos?.slice().reverse().map((yao, index) => `
              <div class="yao-row ${yao.isChanging ? 'changing' : ''}">
                <span class="yao-position">${6 - index}爻</span>
                <span class="yao-line">${yao.symbol}</span>
                <span class="yao-info">${yao.name}${yao.isChanging ? '（变爻）' : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${hexagram.hasChanging ? `
          <div class="changed-hexagram mt-4">
            <p class="small-text">变卦：${hexagram.changedHexagram?.lower?.name || ''}${hexagram.changedHexagram?.upper?.name || ''}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  getConclusionType(score) {
    if (score >= 80) {
      return {
        class: 'conclusion--excellent',
        icon: '🌟',
        title: 'A和B互利'
      };
    } else if (score >= 60) {
      return {
        class: 'conclusion--good',
        icon: '👍',
        title: score > 70 ? 'A利B，B不利A' : 'A不利B，B利A'
      };
    } else if (score >= 40) {
      return {
        class: 'conclusion--neutral',
        icon: '⚖️',
        title: 'A和B相互不利'
      };
    } else {
      return {
        class: 'conclusion--caution',
        icon: '⚠️',
        title: 'A和B相互不利'
      };
    }
  }

  renderBottomBar() {
    if (this.isAnalyzing) {
      return '';
    }

    return `
      <div class="bottom-action-bar safe-area-bottom">
        <div class="action-bar__buttons">
          <button class="btn btn--secondary" data-action="share">
            <span>📤</span> 分享
          </button>
          <button class="btn btn--primary" data-action="new-test">
            再测一次
          </button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    // 返回按钮
    const backBtn = document.querySelector('.navbar__back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.router.navigate('/');
      });
    }

    // 分享按钮
    const shareBtn = document.querySelector('[data-action="share"]');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        this.handleShare();
      });
    }

    // 再测一次按钮
    const newTestBtn = document.querySelector('[data-action="new-test"]');
    if (newTestBtn) {
      newTestBtn.addEventListener('click', () => {
        window.router.navigate('/');
      });
    }
  }

  async init() {
    if (!this.testData) return;

    // 模拟分析过程
    await this.simulateAnalysis();

    // 执行实际分析
    if (this.method === 'birthday') {
      this.analyzeBirthday();
    } else {
      this.analyzeHexagram();
    }

    // 更新UI
    this.isAnalyzing = false;
    this.rerender();

    // 打字机效果显示建议
    setTimeout(() => {
      const suggestionEl = document.getElementById('suggestion-text');
      if (suggestionEl && this.result?.suggestion) {
        typewriter(suggestionEl, this.result.suggestion, 30);
      }
    }, 500);
  }

  async simulateAnalysis() {
    const steps = ['1', '2', '3', '4'];
    const texts = [
      '正在收集信息...',
      '正在进行命理计算...',
      'AI正在分析...',
      '正在生成报告...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await this.delay(800);

      const textEl = document.getElementById('analyzing-text');
      if (textEl) {
        textEl.textContent = texts[i];
      }

      const stepEl = document.querySelector(`[data-step="${steps[i]}"]`);
      if (stepEl) {
        stepEl.classList.add('active');
      }
    }

    await this.delay(500);
  }

  analyzeBirthday() {
    const { personA, personB } = this.testData;

    // 计算双方三柱
    const pillarsA = getThreePillars(personA.birthDate);
    const pillarsB = getThreePillars(personB.birthDate);

    // 分析相合度
    const compatibility = analyzeCompatibility(pillarsA, pillarsB);

    this.result = {
      personA,
      personB,
      pillarsA,
      pillarsB,
      score: compatibility.score,
      conclusion: compatibility.conclusion,
      details: compatibility.details,
      suggestion: this.generateSuggestion(compatibility)
    };
  }

  analyzeHexagram() {
    const { hexagram } = this.testData;

    // 基于卦象生成分析结果
    const score = this.calculateHexagramScore(hexagram);

    this.result = {
      hexagram,
      score,
      conclusion: this.getHexagramConclusion(hexagram, score),
      details: this.getHexagramDetails(hexagram),
      suggestion: this.generateHexagramSuggestion(hexagram)
    };
  }

  calculateHexagramScore(hexagram) {
    // 根据卦象计算分数
    const positiveHexagrams = ['乾', '坤', '泰', '同人', '大有', '谦', '咸', '恒', '益', '萃'];
    const negativeHexagrams = ['否', '讼', '剥', '困', '蹇', '睽', '明夷'];

    let score = 60; // 基础分

    if (positiveHexagrams.includes(hexagram.name)) {
      score += 20;
    } else if (negativeHexagrams.includes(hexagram.name)) {
      score -= 15;
    }

    // 变爻影响
    if (hexagram.hasChanging) {
      score += hexagram.changingPositions.length <= 2 ? 5 : -5;
    }

    return Math.max(20, Math.min(95, score));
  }

  getHexagramConclusion(hexagram, score) {
    if (score >= 75) {
      return `${hexagram.name}卦显示双方关系积极向好，有互利共赢的趋势。`;
    } else if (score >= 55) {
      return `${hexagram.name}卦提示需要双方共同努力，关系可以改善。`;
    } else {
      return `${hexagram.name}卦暗示当前时机不太适合，建议谨慎行事。`;
    }
  }

  getHexagramDetails(hexagram) {
    const details = [];

    details.push({
      type: 'positive',
      title: `${hexagram.name}卦象`,
      description: hexagram.meaning
    });

    if (hexagram.upper && hexagram.lower) {
      details.push({
        type: 'positive',
        title: '上下卦分析',
        description: `上卦${hexagram.upper.name}（${hexagram.upper.nature}），下卦${hexagram.lower.name}（${hexagram.lower.nature}）`
      });
    }

    if (hexagram.hasChanging) {
      details.push({
        type: hexagram.changingPositions.length <= 2 ? 'positive' : 'negative',
        title: '变爻分析',
        description: `第${hexagram.changingPositions.join('、')}爻为变爻，表示事情会有变化`
      });
    }

    return details;
  }

  generateSuggestion(compatibility) {
    const { score, details } = compatibility;
    const positives = details.filter(d => d.type === 'positive');
    const negatives = details.filter(d => d.type === 'negative');

    let suggestion = '';

    if (score >= 80) {
      suggestion = '这是一段非常好的缘分！双方在性格和命理上高度契合，建议珍惜这份关系，共同维护。注意保持沟通，互相理解和包容。';
    } else if (score >= 60) {
      suggestion = '整体关系是积极的，但也存在一些需要注意的地方。';
      if (negatives.length > 0) {
        suggestion += `特别是${negatives[0].title}方面，需要双方多一些耐心和理解。`;
      }
      suggestion += '只要用心经营，这段关系会越来越好。';
    } else if (score >= 40) {
      suggestion = '双方存在一定的冲突，但并非不可调和。建议：1) 增加沟通频率；2) 尊重对方的差异；3) 寻找共同兴趣。如果双方都愿意付出努力，关系是可以改善的。';
    } else {
      suggestion = '从命理角度看，双方确实存在较大的冲突。建议在做重要决定前，多观察、多了解对方。如果是合作关系，建议寻找其他机会；如果是感情关系，请谨慎考虑。';
    }

    return suggestion;
  }

  generateHexagramSuggestion(hexagram) {
    return `${hexagram.name}卦的核心含义是"${hexagram.meaning}"。根据卦象提示，当前最重要的是保持平和的心态，不要急于求成。遇事多思考，听从内心的指引。如果有变爻，说明事情会有转机，保持耐心等待合适的时机。`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  rerender() {
    const container = document.getElementById('app');
    container.innerHTML = this.render();
    this.attachEvents();
  }

  handleShare() {
    const shareText = `我刚刚在 MasterXiao AI 进行了${this.matchType?.title}测试，匹配度${this.result?.score}%！快来试试吧~`;

    if (navigator.share) {
      navigator.share({
        title: 'MasterXiao AI 匹配分析',
        text: shareText,
        url: window.location.origin
      });
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(shareText).then(() => {
        window.showToast('链接已复制，快去分享吧！');
      });
    }
  }
}

export default ResultPage;
