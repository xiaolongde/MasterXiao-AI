/**
 * 匹配游戏 通用组件集合
 */

/**
 * 导航栏组件
 * @param {object} options - 配置选项
 */
export function Navbar(options = {}) {
    const {
        title = '匹配游戏',
        showBack = false,
        showHistory = false,
        showProfile = true,
        onBack = null
    } = options;

    const backBtn = showBack
        ? '<button class="navbar__back-btn" data-action="back">←</button>'
        : '';

    const historyBtn = showHistory
        ? '<button class="navbar__icon-btn" data-action="history" title="历史记录">🕐</button>'
        : '';

    const profileBtn = showProfile
        ? '<button class="navbar__icon-btn navbar__profile-btn" data-action="profile" title="个人中心">👤</button>'
        : '';

    return `
    <nav class="navbar">
      <div class="navbar__left">
        ${backBtn}
        <div class="navbar__logo">${title}</div>
      </div>
      <div class="navbar__actions">
        ${historyBtn}
        ${profileBtn}
      </div>
    </nav>
  `;
}

/**
 * 欢迎横幅组件
 * @param {object} options - 配置选项
 */
export function HeroBanner(options = {}) {
    const {
        icon = '✨',
        title = '发现你的性格契合度',
        subtitle = '探索人际关系的奥秘',
        buttonText = '开始测试',
        onButtonClick = null
    } = options;

    return `
    <section class="hero-banner">
      <div class="glass-card text-center animate-fade-in-up">
        <div class="hero-banner__icon animate-float">${icon}</div>
        <h1 class="heading-1 mb-2">${title}</h1>
        <p class="body-text-secondary mb-4">${subtitle}</p>
        <button class="btn btn--primary btn--lg" data-action="hero-start">
          <span>✨</span>
          <span>${buttonText}</span>
        </button>
      </div>
    </section>
  `;
}

/**
 * 进度条组件
 * @param {number} current - 当前步骤
 * @param {number} total - 总步骤
 * @param {object} options - 配置选项
 */
export function ProgressBar(current, total, options = {}) {
    const {
        showText = true,
        showSteps = false,
        stepLabel = ''
    } = options;

    const percentage = Math.min((current / total) * 100, 100);

    // 步骤描述在进度条下方显示
    const labelHtml = stepLabel ? `<div class="progress-bar__label">${stepLabel}</div>` : '';

    const textHtml = showText
        ? `<div class="progress-bar__text">${current} / ${total}</div>`
        : '';

    return `
    <div class="progress-bar">
      <div class="progress-bar__track-wrapper">
        <div class="progress-bar__track">
          <div class="progress-bar__fill" style="width: ${percentage}%"></div>
        </div>
      </div>
      ${labelHtml}
      ${textHtml}
    </div>
  `;
}

/**
 * 加载指示器
 * @param {string} text - 加载文本
 */
export function LoadingIndicator(text = '加载中...') {
    return `
    <div class="loading-indicator">
      <div class="loading-dots">
        <span class="loading-dots__dot"></span>
        <span class="loading-dots__dot"></span>
        <span class="loading-dots__dot"></span>
      </div>
      <p class="small-text mt-2">${text}</p>
    </div>
  `;
}

/**
 * 思考指示器（AI 消息专用）
 */
export function ThinkingIndicator() {
    return `
    <div class="thinking-indicator">
      <span class="thinking-dot"></span>
      <span class="thinking-dot"></span>
      <span class="thinking-dot"></span>
    </div>
  `;
}

/**
 * 消息气泡
 * @param {object} message - 消息数据
 */
export function MessageBubble(message) {
    const {
        content,
        role = 'ai', // 'ai' | 'user'
        avatar = null,
        timestamp = null,
        isTyping = false
    } = message;

    const defaultAvatar = role === 'ai' ? '✨' : '👤';
    const avatarIcon = avatar || defaultAvatar;

    const timeHtml = timestamp
        ? `<span class="message__time">${timestamp}</span>`
        : '';

    const contentHtml = isTyping
        ? ThinkingIndicator()
        : `<p class="message__text">${content}</p>`;

    return `
    <div class="message message--${role}">
      <div class="message__avatar">${avatarIcon}</div>
      <div class="message__bubble">
        ${contentHtml}
        ${timeHtml}
      </div>
    </div>
  `;
}

/**
 * 空状态组件
 * @param {object} options - 配置选项
 */
export function EmptyState(options = {}) {
    const {
        icon = '📭',
        title = '暂无内容',
        description = '',
        actionText = null,
        onAction = null
    } = options;

    const actionHtml = actionText
        ? `<button class="btn btn--primary btn--sm mt-4" data-action="empty-action">${actionText}</button>`
        : '';

    return `
    <div class="empty-state">
      <div class="empty-state__icon">${icon}</div>
      <h3 class="empty-state__title">${title}</h3>
      ${description ? `<p class="empty-state__description">${description}</p>` : ''}
      ${actionHtml}
    </div>
  `;
}

/**
 * 测试方式选择器
 */
export function TestMethodSelector() {
    return `
    <div class="test-method-selector">
      <h3 class="heading-3 mb-4 text-center">选择测试方式</h3>
      
      <div class="flex flex-col gap-3">
        <!-- 生日匹配 -->
        <div class="glass-card glass-card--interactive method-card" data-method="birthday">
          <div class="method-card__icon">🎂</div>
          <div class="method-card__content">
            <h4 class="method-card__title">生日匹配</h4>
            <p class="method-card__description">通过生日特质分析，解读性格关系</p>
          </div>
          <span class="method-card__arrow">→</span>
        </div>
        
        <!-- 直觉塔罗测试 -->
        <div class="glass-card glass-card--interactive method-card" data-method="tarot">
          <div class="method-card__icon">🃏</div>
          <div class="method-card__content">
            <h4 class="method-card__title">直觉塔罗</h4>
            <p class="method-card__description">凭直觉选择卡牌，探索内心的答案</p>
          </div>
          <span class="method-card__arrow">→</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 验证码输入组件
 * @param {number} length - 验证码长度
 */
export function VerificationCodeInput(length = 6) {
    const inputs = Array.from({ length }, (_, i) => `
    <input 
      type="text" 
      maxlength="1" 
      class="code-input__digit" 
      data-index="${i}"
      inputmode="numeric"
      autocomplete="one-time-code"
    >
  `).join('');

    return `
    <div class="code-input">
      <div class="code-input__group">
        ${inputs}
      </div>
      <p class="code-input__hint small-text text-center mt-2">
        请输入6位验证码
      </p>
    </div>
  `;
}

/**
 * 底部操作栏
 * @param {object} options - 配置选项
 */
export function BottomActionBar(options = {}) {
    const {
        primaryText = '确定',
        secondaryText = null,
        primaryDisabled = false,
        showPrice = false,
        price = 0
    } = options;

    const priceHtml = showPrice ? `
    <div class="action-bar__price">
      <span class="price-label">合计</span>
      <span class="price-value">¥ ${price}</span>
    </div>
  ` : '';

    const secondaryHtml = secondaryText ? `
    <button class="btn btn--secondary" data-action="secondary">${secondaryText}</button>
  ` : '';

    return `
    <div class="bottom-action-bar safe-area-bottom">
      ${priceHtml}
      <div class="action-bar__buttons">
        ${secondaryHtml}
        <button class="btn btn--primary btn--full" data-action="primary" ${primaryDisabled ? 'disabled' : ''}>
          ${primaryText}
        </button>
      </div>
    </div>
  `;
}

/**
 * 路由导航工具函数
 * @param {string} path - 目标路径
 * @param {object} state - 传递的状态数据
 */
export function navigateTo(path, state = {}) {
    // 检查全局路由器是否存在
    if (window.router && typeof window.router.navigate === 'function') {
        window.router.navigate(path, state);
    } else {
        // 降级方案：直接更改 location
        console.warn('路由器不可用，使用 location 导航');
        window.location.href = path;
    }
}

// 导出所有组件
export default {
    Navbar,
    HeroBanner,
    ProgressBar,
    LoadingIndicator,
    ThinkingIndicator,
    MessageBubble,
    EmptyState,
    TestMethodSelector,
    VerificationCodeInput,
    BottomActionBar,
    navigateTo
};
