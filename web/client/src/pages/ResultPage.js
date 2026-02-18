/**
 * 匹配游戏 结果页面
 * 展示AI分析结果
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { getThreePillars, analyzeCompatibility, WUXING } from '../data/bazi.js';
import { Navbar, MessageBubble, BottomActionBar } from '../components/Common.js';
import { typewriter } from '../scripts/utils.js';
import { analysisApi, testApi, matchRecordApi, getApiBaseUrl } from '../services/api.js';

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
    this.streamContent = ''; // 流式内容
    this.useAiAnalysis = true; // 是否使用 AI 分析
    this.isStreamComplete = false; // 流式响应是否完成
    this.isInitialized = false; // 防止重复初始化
    this.abortController = null; // 用于取消请求
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
                <span class="result-header__icon">${this.matchType?.icon || '✨'}</span>
                <h2 class="heading-2 mb-1">${this.matchType?.title || '匹配分析'}</h2>
                <p class="small-text" style="color: var(--color-text-tertiary);">
                  ${this.method === 'birthday' ? '生日匹配分析' : '直觉塔罗分析'}
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
          <div class="message__avatar">✨</div>
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
              <span>特质计算</span>
            </div>
            <div class="step-item" data-step="3">
              <span class="step-icon">🤖</span>
              <span>分析中</span>
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
    if (!this.result && !this.streamContent) return '';

    // AI 流式分析结果
    if (this.useAiAnalysis && this.method === 'birthday') {
      return this.renderAiResult();
    }

    const { score, conclusion, details, personA, personB } = this.result;

    // 根据分数确定结论类型
    const conclusionType = this.getConclusionType(score);

    return `
      <div class="result-content animate-fade-in-up">
        <!-- 匹配分数 -->
        <div class="glass-card score-card mb-4">
          <div class="score-circle-container">
            <svg class="score-circle" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#8B7FD8"/>
                  <stop offset="100%" style="stop-color:#FFB5D8"/>
                </linearGradient>
              </defs>
              <circle 
                class="score-circle__track" 
                cx="50" cy="50" r="45"
                fill="none" stroke-width="8"
              />
              <circle 
                class="score-circle__fill progress-ring__circle" 
                cx="50" cy="50" r="45"
                fill="none" stroke-width="8"
                stroke="url(#scoreGradient)"
                stroke-dasharray="${score * 2.83} 283"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <!-- 分数显示在圆圈中间 -->
            <div class="score-value">
              <span class="score-number-gradient">${score}</span>
              <span class="score-unit-gradient">%</span>
            </div>
          </div>
          <p class="score-label">匹配度</p>
        </div>

        <!-- 结论卡片 -->
        <div class="glass-card conclusion-card-simple mb-4">
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

        <!-- 温馨提示 -->
        <div class="glass-card suggestion-card mb-4">
          <h4 class="heading-3 mb-3">💡 温馨提示</h4>
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

    // 如果没有八字数据，返回空
    if (!pillarsA || !pillarsB) return '';

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
    // 检查是否为新版卡牌数据
    if (this.testData.allCards && this.testData.reading) {
      return this.renderTarotDetails();
    }
    
    // 兼容旧版数据
    const { hexagram } = this.testData;
    if (!hexagram) return '';

    return `
      <div class="hexagram-display">
        <div class="hexagram-main">
          <div class="hexagram-symbol text-center">
            <span class="hexagram-icon">${hexagram.upper?.symbol || '☰'}${hexagram.lower?.symbol || '☷'}</span>
            <h4 class="hexagram-name">${hexagram.name}符号</h4>
            <p class="hexagram-meaning">${hexagram.meaning}</p>
          </div>
        </div>
      </div>
    `;
  }

  renderTarotDetails() {
    const { allCards, reading } = this.testData;
    
    return `
      <div class="tarot-display">
        <!-- 能量类型 -->
        <div class="energy-type text-center mb-4">
          <span class="energy-symbol">${reading.energy.symbol}</span>
          <h4 class="energy-name">${reading.energy.name}</h4>
          <p class="energy-desc small-text">${reading.energy.description}</p>
        </div>
        
        <!-- 抽取的牌 -->
        <div class="tarot-cards-detail mt-4">
          <p class="small-text mb-3" style="color: var(--color-primary);">抽取的卡牌：</p>
          <div class="tarot-cards-grid">
            ${allCards.map((card, index) => `
              <div class="tarot-card-item">
                <div class="card-header">
                  <span class="card-num">${index + 1}</span>
                  <span class="card-symbol">${card.symbol}</span>
                </div>
                <div class="card-body">
                  <p class="card-name">${card.name}</p>
                  <p class="card-position ${card.isUpright ? 'upright' : 'reversed'}">${card.position}</p>
                </div>
                <p class="card-meaning small-text">${card.meaning}</p>
              </div>
            `).join('')}
          </div>
        </div>
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
          <div class="btn-group-left">
            <button class="btn btn--secondary btn--sm" data-action="share">
              <span>📤</span> 分享
            </button>
            <button class="btn btn--secondary btn--sm" data-action="export-png">
              <span>🖼️</span> 导出结果
            </button>
          </div>
          <button class="btn btn--primary btn--sm" data-action="new-test">
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

    // 导出PNG按钮
    const exportPngBtn = document.querySelector('[data-action="export-png"]');
    if (exportPngBtn) {
      exportPngBtn.addEventListener('click', () => {
        this.handleExportPng();
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
    
    // 防止重复初始化
    if (this.isInitialized) {
      console.log('页面已初始化，跳过重复初始化');
      return;
    }
    this.isInitialized = true;

    // 生日匹配使用 AI 流式分析
    if (this.method === 'birthday' && this.useAiAnalysis) {
      await this.analyzeWithAi();
      return;
    }

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
      '正在进行特质计算...',
      '正在分析中...',
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
    // 检查是否为新版卡牌数据
    if (this.testData.reading) {
      const { reading, allCards } = this.testData;
      
      this.result = {
        allCards,
        reading,
        score: reading.score,
        conclusion: reading.reading,
        details: this.getTarotDetails(allCards),
        suggestion: reading.reading + '\n\n' + reading.disclaimer
      };
      return;
    }

    // 兼容旧版数据
    const { hexagram } = this.testData;
    if (!hexagram) {
      this.result = {
        score: 50,
        conclusion: '数据解析异常，请重新测试。',
        details: [],
        suggestion: '建议重新进行测试。'
      };
      return;
    }

    const score = this.calculateHexagramScore(hexagram);

    this.result = {
      hexagram,
      score,
      conclusion: this.getHexagramConclusion(hexagram, score),
      details: this.getHexagramDetails(hexagram),
      suggestion: this.generateHexagramSuggestion(hexagram)
    };
  }

  getTarotDetails(cards) {
    const details = [];
    const uprightCards = cards.filter(c => c.isUpright);
    const reversedCards = cards.filter(c => !c.isUpright);

    if (uprightCards.length > 0) {
      details.push({
        type: 'positive',
        title: `正位牌 (${uprightCards.length}张)`,
        description: uprightCards.map(c => `${c.name}：${c.upright}`).join('；')
      });
    }

    if (reversedCards.length > 0) {
      details.push({
        type: reversedCards.length <= 3 ? 'positive' : 'negative',
        title: `逆位牌 (${reversedCards.length}张)`,
        description: reversedCards.map(c => `${c.name}：${c.reversed}`).join('；')
      });
    }

    return details;
  }

  calculateHexagramScore(hexagram) {
    // 根据符号计算分数
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
      return `${hexagram.name}符号显示双方关系积极向好，有互利共赢的趋势。`;
    } else if (score >= 55) {
      return `${hexagram.name}符号提示需要双方共同努力，关系可以改善。`;
    } else {
      return `${hexagram.name}符号暗示当前时机不太适合，建议谨慎行事。`;
    }
  }

  getHexagramDetails(hexagram) {
    const details = [];

    details.push({
      type: 'positive',
      title: `${hexagram.name}符号`,
      description: hexagram.meaning
    });

    if (hexagram.upper && hexagram.lower) {
      details.push({
        type: 'positive',
        title: '上下符号分析',
        description: `上符号${hexagram.upper.name}（${hexagram.upper.nature}），下符号${hexagram.lower.name}（${hexagram.lower.nature}）`
      });
    }

    if (hexagram.hasChanging) {
      details.push({
        type: hexagram.changingPositions.length <= 2 ? 'positive' : 'negative',
        title: '变化分析',
        description: `第${hexagram.changingPositions.join('、')}轮为变化轮，表示事情会有变化`
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
      suggestion = '这是非常好的契合度！双方在性格特质上高度互补，建议珍惜这份关系，共同维护。注意保持沟通，互相理解和包容。';
    } else if (score >= 60) {
      suggestion = '整体关系是积极的，但也存在一些需要注意的地方。';
      if (negatives.length > 0) {
        suggestion += `特别是${negatives[0].title}方面，需要双方多一些耐心和理解。`;
      }
      suggestion += '只要用心经营，这段关系会越来越好。';
    } else if (score >= 40) {
      suggestion = '双方存在一定的差异，但并非不可调和。建议：1) 增加沟通频率；2) 尊重对方的差异；3) 寻找共同兴趣。如果双方都愿意付出努力，关系是可以改善的。';
    } else {
      suggestion = '从性格分析角度看，双方确实存在较大的差异。建议在做重要决定前，多观察、多了解对方。如果是合作关系，建议寻找其他机会；如果是感情关系，请谨慎考虑。';
    }

    return suggestion;
  }

  generateHexagramSuggestion(hexagram) {
    return `${hexagram.name}符号的核心含义是"${hexagram.meaning}"。根据分析结果提示，当前最重要的是保持平和的心态，不要急于求成。遇事多思考，听从内心的指引。如果有变化，说明事情会有转机，保持耐心等待合适的时机。`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 使用 AI 进行流式分析
   */
  async analyzeWithAi() {
    const { personA, personB } = this.testData;

    // 创建 AbortController 用于取消请求
    this.abortController = new AbortController();

    // 模拟前几步
    const steps = ['1', '2', '3'];
    const texts = [
      '正在收集信息...',
      '正在进行特质计算...',
      '正在请求进行匹配分析...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await this.delay(600);
      const textEl = document.getElementById('analyzing-text');
      if (textEl) textEl.textContent = texts[i];
      const stepEl = document.querySelector(`[data-step="${steps[i]}"]`);
      if (stepEl) stepEl.classList.add('active');
    }

    try {
      await analysisApi.birthMatchStream(
        { partyA: personA, partyB: personB },
        {
          onChunk: (chunk, fullContent) => {
            this.streamContent = fullContent;
            // 更新显示
            if (this.isAnalyzing) {
              // 第一次收到数据，切换到结果展示
              this.isAnalyzing = false;
              const stepEl = document.querySelector('[data-step="4"]');
              if (stepEl) stepEl.classList.add('active');
              // 不要完全重新渲染，只更新必要的部分
              this.updateToResultView();
            } else {
              // 更新流式内容 - 平滑过渡
              this.updateStreamContent();
            }
          },
          onDone: (fullContent) => {
            this.streamContent = fullContent;
            this.isAnalyzing = false;
            this.isStreamComplete = true;
            // 更新匹配记录状态为成功
            this.updateMatchRecordStatus(1, { content: fullContent });
            // 分析成功后才消耗兑换码
            this.consumeRedeemCode();
            // 更新内容，显示完成提示
            const contentEl = document.getElementById('ai-stream-content');
            if (contentEl) {
              contentEl.innerHTML = this.formatMarkdown(this.streamContent) + this.renderCompleteIndicator();
              this.scrollToBottom();
              // 1秒后隐藏完成提示
              setTimeout(() => {
                const completeEl = document.getElementById('stream-complete-indicator');
                if (completeEl) {
                  completeEl.style.opacity = '0';
                  setTimeout(() => completeEl.remove(), 300);
                }
              }, 1000);
            }
            // 流式完成后重新渲染以更新底部按钮状态
            this.rerender();
          },
          onError: (error) => {
            // 如果是用户取消的请求，不显示错误
            if (error.name === 'AbortError') {
              console.log('请求已取消');
              return;
            }
            console.error('AI 分析失败:', error);
            this.streamContent = '分析失败，请稍后重试！';
            this.isAnalyzing = false;
            this.isStreamComplete = true; // 标记为完成，隐藏加载动画
            // 更新匹配记录状态为失败
            this.updateMatchRecordStatus(2, { error: error.message || '分析失败' });
            // 移除加载指示器
            const loadingEl = document.getElementById('stream-loading-indicator');
            if (loadingEl) loadingEl.remove();
            this.rerender();
          },
          signal: this.abortController.signal
        }
      );
    } catch (error) {
      // 如果是用户取消的请求，不显示错误
      if (error.name === 'AbortError') {
        console.log('请求已取消');
        return;
      }
      console.error('AI 分析失败:', error);
      this.streamContent = '分析失败，请稍后重试。';
      this.isAnalyzing = false;
      this.isStreamComplete = true; // 标记为完成，隐藏加载动画
      // 更新匹配记录状态为失败
      this.updateMatchRecordStatus(2, { error: error.message || '分析失败' });
      this.rerender();
    }
  }

  /**
   * 更新到结果视图（不完全重新渲染）
   */
  updateToResultView() {
    const container = document.getElementById('analysis-container');
    if (container) {
      container.innerHTML = this.renderResult();
    }
  }

  /**
   * 渲染 AI 分析结果
   */
  renderAiResult() {
    const { personA, personB } = this.testData;
    const introText = '我将根据您提供的信息，对匹配情况进行详细分析，请稍等...';

    return `
      <div class="result-content animate-fade-in-up">
        <!-- 双方信息 -->
        <div class="glass-card persons-card mb-4">
          <div class="persons-row">
            <div class="person-info">
              <span class="person-avatar">${personA.gender === '男' ? '👨' : '👩'}</span>
              <span class="person-name">${personA.name || '你'}</span>
              <span class="person-birth small-text">${personA.birthDate}</span>
            </div>
            <div class="vs-badge">VS</div>
            <div class="person-info">
              <span class="person-avatar">${personB.gender === '男' ? '👨' : '👩'}</span>
              <span class="person-name">${personB.name || '对方'}</span>
              <span class="person-birth small-text">${personB.birthDate}</span>
            </div>
          </div>
        </div>

        <!-- AI 分析结果 -->
        <div class="glass-card ai-result-card mb-4">
          <h4 class="heading-3 mb-4">🤖 分析报告</h4>
          <p class="ai-intro-text">${introText}</p>
          <div class="ai-content" id="ai-stream-content">
            ${this.formatMarkdown(this.streamContent)}${!this.isStreamComplete ? this.renderLoadingIndicator() : ''}
          </div>
        </div>

        <!-- 温馨提示 -->
        <div class="glass-card glass-card--light disclaimer-card mb-4">
          <p class="small-text text-center" style="color: var(--color-text-tertiary);">
            ⚠️ 以上分析仅供娱乐参考，不构成任何决策建议
          </p>
        </div>
      </div>
    `;
  }

  /**
   * 渲染加载中指示器
   */
  renderLoadingIndicator() {
    return `
      <div class="stream-loading-indicator" id="stream-loading-indicator">
        <span class="loading-dot"></span>
        <span class="loading-text">分析中...</span>
      </div>
    `;
  }
  
  /**
   * 平滑更新流式内容
   */
  updateStreamContent() {
    const contentEl = document.getElementById('ai-stream-content');
    if (!contentEl) return;
    
    const newHtml = this.formatMarkdown(this.streamContent);
    const loadingHtml = this.renderLoadingIndicator();
    
    // 获取当前内容和新内容
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHtml;
    const newElements = Array.from(tempDiv.children);
    
    // 获取当前已有的内容元素（排除loading指示器）
    const currentElements = Array.from(contentEl.children).filter(
      el => !el.classList.contains('stream-loading-indicator')
    );
    
    // 检查是否有新元素添加
    if (newElements.length > currentElements.length) {
      // 有新元素，添加并应用动画
      for (let i = currentElements.length; i < newElements.length; i++) {
        const newEl = newElements[i].cloneNode(true);
        newEl.classList.add('stream-fade-in');
        
        // 在loading指示器前插入
        const loadingEl = contentEl.querySelector('.stream-loading-indicator');
        if (loadingEl) {
          contentEl.insertBefore(newEl, loadingEl);
        } else {
          contentEl.appendChild(newEl);
        }
      }
      
      // 确保loading指示器在最后
      let loadingEl = contentEl.querySelector('.stream-loading-indicator');
      if (!loadingEl) {
        contentEl.insertAdjacentHTML('beforeend', loadingHtml);
      }
    } else if (currentElements.length > 0) {
      // 更新最后一个元素的内容（可能还在继续输出）
      const lastCurrentEl = currentElements[currentElements.length - 1];
      const lastNewEl = newElements[newElements.length - 1];
      if (lastNewEl && lastCurrentEl.innerHTML !== lastNewEl.innerHTML) {
        lastCurrentEl.innerHTML = lastNewEl.innerHTML;
      }
    } else {
      // 初始化
      contentEl.innerHTML = newHtml + loadingHtml;
    }
    
    // 自动滚动到底部
    this.scrollToBottom();
  }

  /**
   * 渲染完成指示器
   */
  renderCompleteIndicator() {
    return `
      <div class="stream-complete-indicator" id="stream-complete-indicator">
        <span class="complete-icon">✅</span>
        <span class="complete-text">已完成</span>
      </div>
    `;
  }

  /**
   * 自动滚动到底部
   */
  scrollToBottom() {
    const contentEl = document.getElementById('ai-stream-content');
    if (contentEl) {
      contentEl.scrollTop = contentEl.scrollHeight;
    }
    // 同时滚动页面
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }

  /**
   * 简单的 Markdown 格式化，支持分块卡片布局
   */
  formatMarkdown(text) {
    if (!text) return '';
    
    // 按主要段落分割内容（使用标题或双换行分隔）
    const sections = this.splitIntoSections(text);
    
    // 将每个段落转换为卡片
    return sections.map((section, index) => {
      const formatted = this.formatSectionContent(section);
      // 检查是否有实际内容（过滤掉只有空白、br标签或空div的内容）
      const textContent = formatted.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
      if (!textContent) return '';
      
      return `
        <div class="analysis-block animate-fade-in-up" style="animation-delay: ${index * 0.1}s;">
          ${formatted}
        </div>
      `;
    }).filter(Boolean).join('');
  }

  /**
   * 将文本按段落/章节分割
   */
  splitIntoSections(text) {
    const sections = [];
    let currentSection = '';
    const lines = text.split('\n');
    
    for (const line of lines) {
      // 跳过"总结"这一行
      if (/^总结[：:.]?\s*$/.test(line.trim()) || /^\*?\*?总结\*?\*?[：:.]?\s*$/.test(line.trim())) {
        continue;
      }

      // 跳过 AI 生成的免责声明（如"以上分析由DeepSeek生成..."）
      if (/以上分析由.*生成/.test(line.trim()) || /内容仅供参考.*切勿全信/.test(line.trim()) || /人生的主动权.*始终在/.test(line.trim())) {
        continue;
      }
      
      // 只在主要章节标题处分割：【标题】格式
      // 不再在甲方/乙方处分割，让它们保持在同一个卡片内
      const isMainHeading = /^【[^】]+】/.test(line);
      
      if (isMainHeading) {
        // 遇到主要标题，保存当前段落并开始新段落
        if (currentSection.trim()) {
          sections.push(currentSection.trim());
        }
        currentSection = line;
      } else {
        currentSection += '\n' + line;
      }
    }
    
    // 添加最后一个段落
    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }
    
    // 如果没有明确分段，按双换行分割
    if (sections.length <= 1 && text.includes('\n\n')) {
      return text.split(/\n\n+/).filter(s => s.trim());
    }
    
    return sections.length > 0 ? sections : [text];
  }

  /**
   * 格式化单个段落内容
   */
  formatSectionContent(section) {
    // 获取标题图标
    const getIcon = (title) => {
      if (title.includes('第一步') || title.includes('坐标') || title.includes('确立')) return '📍';
      if (title.includes('第二步') || title.includes('输出') || title.includes('判定')) return '🔍';
      if (title.includes('第三步') || title.includes('打分') || title.includes('量化')) return '⭐';
      if (title.includes('第四步') || title.includes('判词') || title.includes('结论') || title.includes('综合')) return '🎯';
      if (title.includes('需求') || title.includes('用神') || title.includes('清单')) return '📋';
      if (title.includes('资产') || title.includes('核定')) return '💎';
      if (title.includes('评分') || title.includes('细则')) return '⭐';
      if (title.includes('建议') || title.includes('提示')) return '💡';
      if (title.includes('甲方') || title.includes('乙方')) return '';
      return '📌';
    };

    let formatted = section
      // 第X步格式标题（如：第一步：确立坐标）
      .replace(/^[\*\-]?\s*\*?\*?第([一二三四五六七八九十]+)步[：:]\s*(.+)$/gm, (match, num, title) => {
        const icon = getIcon(`第${num}步`);
        return `<div class="block-header"><span class="block-icon">${icon}</span><span class="block-title">第${num}步：${title}</span></div>`;
      })
      // 甲方/乙方子标题（带emoji显示）
      .replace(/^[\*\-]?\s*\*?\*?([甲乙])方\*?\*?$/gm, (match, party) => {
        const emoji = party === '甲' ? '👨' : '👩';
        return `<div class="person-header"><span class="person-emoji">${emoji}</span><span class="person-label">${party}方</span></div>`;
      })
      // 【xxx】格式标题
      .replace(/^\[([^\]]+)\](?![\(\[])/gm, (match, title) => {
        const icon = getIcon(title);
        return `<div class="block-subheader"><span class="block-icon">${icon}</span><span class="block-subtitle">${title}</span></div>`;
      })
      .replace(/^【([^】]+)】/gm, (match, title) => {
        const icon = getIcon(title);
        return `<div class="block-header"><span class="block-icon">${icon}</span><span class="block-title">${title}</span></div>`;
      })
      // Markdown 标题
      .replace(/^###\s+(.+)$/gm, '<div class="block-header"><span class="block-icon">📌</span><span class="block-title">$1</span></div>')
      .replace(/^##\s+(.+)$/gm, '<div class="block-header"><span class="block-icon">📋</span><span class="block-title">$1</span></div>')
      .replace(/^#\s+(.+)$/gm, '<div class="block-header main-header"><span class="block-icon">📊</span><span class="block-title">$1</span></div>')
      // 中文数字标题（一、二、三）
      .replace(/^([一二三四五六七八九十]+)[、.]\s*(.+)$/gm, '<div class="block-subheader"><span class="block-num">$1</span><span class="block-subtitle">$2</span></div>')
      // 粗体
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // 列表项 - 支持更多格式
      .replace(/^\*\s{3}(.+)$/gm, '<li class="sub-item">$1</li>')
      // 过滤只有符号或空白的列表项
      .replace(/^[-*•]\s*([^\s].*)$/gm, '<li>$1</li>')
      .replace(/^(\d+)[.)、]\s*(.+)$/gm, '<li class="numbered"><span class="list-num">$1.</span> $2</li>')
      // 冒号后内容高亮
      .replace(/([^<>\n]+?)：([^<>\n]+)/g, '<span class="label-text">$1：</span><span class="value-text">$2</span>')
      // 换行处理
      .replace(/\n/g, '<br>');

    // 处理列表包装
    formatted = formatted.replace(/(<li[^>]*>.*?<\/li>)(<br>)?/g, '$1');
    formatted = formatted.replace(/(<li[^>]*>.*?<\/li>)+/g, (match) => {
      return '<ul class="block-list">' + match + '</ul>';
    });
    
    // 清理多余的 <br> 和空白行
    formatted = formatted.replace(/(<br>){2,}/g, '<br>');
    formatted = formatted.replace(/^(<br>|\s)+/, '');
    formatted = formatted.replace(/(<br>|\s)+$/, '');
    // 清理空列表项和只有符号的行
    formatted = formatted.replace(/<li[^>]*>\s*<\/li>/g, '');
    formatted = formatted.replace(/<li[^>]*>\s*[-–—]+\s*<\/li>/g, '');
    formatted = formatted.replace(/<ul class="block-list">\s*<\/ul>/g, '');
    // 清理只有空格、符号的行
    formatted = formatted.replace(/<br>\s*[-–—]+\s*<br>/g, '<br>');
    formatted = formatted.replace(/<br>\s*[•●○]\s*[-–—]*\s*<br>/g, '<br>');
    // 清理标题后的空白行
    formatted = formatted.replace(/(<\/div>)(<br>)+/g, '$1');
    formatted = formatted.replace(/(<br>)+(<div)/g, '$2');
    
    return `<div class="block-content">${formatted}</div>`;
  }

  /**
   * 更新匹配记录状态
   * @param {number} status - 1=成功, 2=失败
   * @param {object} resultData - 结果数据
   */
  async updateMatchRecordStatus(status, resultData = null) {
    const sessionId = this.testData?.sessionId;
    if (!sessionId) {
      console.log('无 sessionId，跳过匹配记录状态更新');
      return;
    }

    // 获取本地 userId，没有则传 null
    let userId = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id || user.userId || null;
      }
    } catch (e) { /* ignore */ }

    try {
      await matchRecordApi.updateStatus(sessionId, userId, status, resultData);
      console.log(`✅ 匹配记录状态已更新为 ${status === 1 ? '成功' : '失败'}`);
    } catch (error) {
      console.error('更新匹配记录状态失败:', error);
      // 不影响用户体验，静默处理
    }
  }

  /**
   * 分析完成后消耗兑换码（更新使用次数和状态）
   */
  async consumeRedeemCode() {
    const redeemCode = window.appState.get('redeemCode');
    if (!redeemCode) {
      console.log('无兑换码，跳过消耗');
      return;
    }

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/redeem/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode })
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ 兑换码已消耗:', redeemCode);
        // 消耗成功后清除，避免重复消耗
        window.appState.set('redeemCode', null);
      } else {
        console.warn('兑换码消耗失败:', result.message);
      }
    } catch (error) {
      console.error('消耗兑换码失败:', error);
      // 不影响用户体验，静默处理
    }
  }

  rerender() {
    const container = document.getElementById('app');
    container.innerHTML = this.render();
    this.attachEvents();
  }

  handleShare() {
    const shareText = `我刚刚在匹配游戏进行了${this.matchType?.title}测试，匹配度${this.result?.score}%！快来试试吧~`;

    if (navigator.share) {
      navigator.share({
        title: '匹配游戏 - 趣味性格测试',
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

  /**
   * 导出PNG长图
   */
  async handleExportPng() {
    // 获取甲方乙方名称和匹配类型
    const personA = this.testData?.personA?.name || '甲方';
    const personB = this.testData?.personB?.name || '乙方';
    const matchTitle = this.matchType?.title || '匹配';
    const fileName = `${personA}_${personB}_${matchTitle}结果.png`;

    // 显示加载提示
    window.showToast('正在生成图片，请稍候...');

    try {
      // 获取要导出的内容区域
      const contentEl = document.querySelector('.page-content');
      if (!contentEl) {
        window.showToast('导出失败：找不到内容区域');
        return;
      }

      // 隐藏底部操作栏
      const bottomBar = document.querySelector('.bottom-action-bar');
      if (bottomBar) {
        bottomBar.style.display = 'none';
      }

      // 添加导出模式样式类（让颜色更深更清晰）
      contentEl.classList.add('export-mode');

      // 动态加载 html2canvas
      const html2canvasModule = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js');
      const html2canvas = html2canvasModule.default;

      // 使用 html2canvas 将内容转为图片
      const canvas = await html2canvas(contentEl, {
        scale: 2, // 提高清晰度
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // 使用CSS背景渐变
        logging: false
      });

      // 移除导出模式样式类
      contentEl.classList.remove('export-mode');

      // 恢复底部操作栏
      if (bottomBar) {
        bottomBar.style.display = '';
      }

      // 将canvas转为PNG并下载
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = imgData;
      link.click();

      window.showToast('图片导出成功！');

    } catch (error) {
      console.error('导出图片失败:', error);
      
      // 移除导出模式样式类
      const contentEl = document.querySelector('.page-content');
      if (contentEl) {
        contentEl.classList.remove('export-mode');
      }
      
      // 恢复底部操作栏
      const bottomBar = document.querySelector('.bottom-action-bar');
      if (bottomBar) {
        bottomBar.style.display = '';
      }

      window.showToast('导出失败，请稍后重试');
    }
  }
}

export default ResultPage;
