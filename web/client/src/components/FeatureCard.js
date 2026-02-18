/**
 * 匹配游戏 功能卡片组件
 * 用于首页展示匹配类型
 */

/**
 * 渲染单个功能卡片
 * @param {object} matchType - 匹配类型数据
 * @param {object} options - 配置选项
 */
export function FeatureCard(matchType, options = {}) {
    const {
        showPrice = false,
        showBadge = true,
        onClick = null
    } = options;

    const badgeHtml = showBadge && matchType.popular
        ? '<span class="feature-card__badge">热门</span>'
        : '';

    const priceHtml = showPrice
        ? `<span class="feature-card__price">¥${matchType.price}</span>`
        : '';

    return `
    <div class="glass-card glass-card--interactive feature-card" data-type="${matchType.id}">
      ${badgeHtml}
      <div class="feature-card__icon">${matchType.icon}</div>
      <div class="feature-card__content">
        <h3 class="feature-card__title">${matchType.title}</h3>
        <p class="feature-card__description">${matchType.description}</p>
      </div>
      ${priceHtml}
      <span class="feature-card__arrow">→</span>
    </div>
  `;
}

/**
 * 渲染功能卡片网格
 * @param {Array} matchTypes - 匹配类型数组
 * @param {object} options - 配置选项
 */
export function FeatureCardGrid(matchTypes, options = {}) {
    const {
        columns = 1,
        animateIn = true,
        showPrice = false
    } = options;

    const gridClass = columns > 1 ? `grid grid-cols-${columns} gap-3` : 'flex flex-col gap-3';

    return `
    <div class="${gridClass}">
      ${matchTypes.map((type, index) => {
        const delay = animateIn ? `animate-delay-${(index + 1) * 100}` : '';
        const hidden = animateIn ? 'animate-hidden' : '';
        const animation = animateIn ? 'animate-fade-in-up' : '';

        return `
          <div class="${animation} ${delay} ${hidden}">
            ${FeatureCard(type, { showPrice })}
          </div>
        `;
    }).join('')}
    </div>
  `;
}

/**
 * 功能卡片详情（用于测试选择页）
 * @param {object} matchType - 匹配类型数据
 */
export function FeatureCardDetail(matchType) {
    return `
    <div class="glass-card feature-card-detail">
      <div class="feature-card-detail__header">
        <span class="feature-card-detail__icon">${matchType.icon}</span>
        <div>
          <h2 class="heading-2">${matchType.title}</h2>
          <p class="small-text">${matchType.description}</p>
        </div>
      </div>
      
      <div class="divider" style="margin: 8px 0;"></div>
      
      <p class="body-text-secondary" style="margin-bottom: 0;">${matchType.longDescription}</p>
      
    </div>
  `;
}

export default FeatureCard;
