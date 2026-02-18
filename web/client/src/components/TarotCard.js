/**
 * 匹配游戏 卡牙组件
 * 3D 翻转效果的卡牌
 */

export class TarotCard {
    constructor(index, hexagram, options = {}) {
        this.index = index;
        this.hexagram = hexagram;
        this.isFlipped = false;
        this.isSelected = false;
        this.options = {
            size: 'normal', // small, normal, large
            showBackPattern: true,
            ...options
        };
    }

    /**
     * 渲染卡牌 HTML
     */
    render() {
        const sizeClass = this.options.size !== 'normal' ? `tarot-card--${this.options.size}` : '';

        return `
      <div class="tarot-card-wrapper" data-card-index="${this.index}">
        <div class="tarot-card ${sizeClass} ${this.isFlipped ? 'flipped' : ''} ${this.isSelected ? 'selected' : ''}">
          <!-- 卡牌背面 -->
          <div class="tarot-card__face tarot-card__back">
            <div class="tarot-card__pattern">
              <div class="pattern-star pattern-star--1">✦</div>
              <div class="pattern-star pattern-star--2">✧</div>
              <div class="pattern-star pattern-star--3">✦</div>
              <div class="pattern-moon">☽</div>
              <div class="pattern-center">☯</div>
              <div class="pattern-border"></div>
            </div>
          </div>
          
          <!-- 卡牌正面 -->
          <div class="tarot-card__face tarot-card__front">
            <div class="hexagram-symbol">${this.hexagram.symbol}</div>
            <div class="hexagram-name">${this.hexagram.name}</div>
            <div class="hexagram-meaning">${this.hexagram.meaning}</div>
            <div class="hexagram-element">${this.getElementEmoji()}</div>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * 获取五行对应的 emoji
     */
    getElementEmoji() {
        const elementMap = {
            '金': '🔶',
            '木': '🌳',
            '水': '💧',
            '火': '🔥',
            '土': '🏔️'
        };
        return elementMap[this.hexagram.element] || '⭐';
    }

    /**
     * 翻转卡牌
     */
    flip() {
        if (this.isFlipped) return;

        this.isFlipped = true;
        const element = document.querySelector(`[data-card-index="${this.index}"] .tarot-card`);
        if (element) {
            element.classList.add('flipped');
        }

        return this;
    }

    /**
     * 选中卡牌
     */
    select() {
        this.isSelected = true;
        const element = document.querySelector(`[data-card-index="${this.index}"] .tarot-card`);
        if (element) {
            element.classList.add('selected');
        }

        return this;
    }

    /**
     * 取消选中
     */
    deselect() {
        this.isSelected = false;
        const element = document.querySelector(`[data-card-index="${this.index}"] .tarot-card`);
        if (element) {
            element.classList.remove('selected');
        }

        return this;
    }

    /**
     * 获取卡牌数据
     */
    getData() {
        return {
            index: this.index,
            hexagram: this.hexagram,
            isFlipped: this.isFlipped,
            isSelected: this.isSelected
        };
    }
}

/**
 * 卡牌组组件
 * 管理一组卡牌
 */
export class TarotCardGroup {
    constructor(hexagrams, options = {}) {
        this.hexagrams = hexagrams;
        this.cards = [];
        this.selectedCards = [];
        this.options = {
            maxSelect: 6,
            layout: 'grid', // grid, fan, line
            onCardFlip: null,
            onSelectionChange: null,
            ...options
        };

        this.initCards();
    }

    /**
     * 初始化卡牌
     */
    initCards() {
        this.cards = this.hexagrams.map((hex, index) => {
            return new TarotCard(index, hex, { size: this.options.cardSize });
        });
    }

    /**
     * 渲染卡牌组
     */
    render() {
        const layoutClass = `tarot-group--${this.options.layout}`;

        return `
      <div class="tarot-group ${layoutClass}">
        ${this.cards.map(card => card.render()).join('')}
      </div>
    `;
    }

    /**
     * 绑定事件
     */
    attachEvents() {
        const wrappers = document.querySelectorAll('.tarot-card-wrapper');

        wrappers.forEach((wrapper, index) => {
            wrapper.addEventListener('click', () => {
                this.handleCardClick(index);
            });
        });
    }

    /**
     * 处理卡牌点击
     */
    handleCardClick(index) {
        const card = this.cards[index];

        if (!card || card.isFlipped) return;

        if (this.selectedCards.length >= this.options.maxSelect) {
            // 已达到最大选择数量
            return;
        }

        // 翻转并选中卡牌
        card.flip().select();
        this.selectedCards.push(card);

        // 触发回调
        if (this.options.onCardFlip) {
            this.options.onCardFlip(card, this.selectedCards.length);
        }

        if (this.options.onSelectionChange) {
            this.options.onSelectionChange(this.selectedCards);
        }
    }

    /**
     * 获取已选择的卡牌数据
     */
    getSelectedData() {
        return this.selectedCards.map(card => card.getData());
    }

    /**
     * 获取已选择的符号
     */
    getSelectedHexagrams() {
        return this.selectedCards.map(card => card.hexagram);
    }

    /**
     * 重置所有卡牌
     */
    reset() {
        this.cards.forEach(card => {
            card.isFlipped = false;
            card.isSelected = false;
        });
        this.selectedCards = [];

        // 更新 DOM
        document.querySelectorAll('.tarot-card').forEach(el => {
            el.classList.remove('flipped', 'selected');
        });
    }

    /**
     * 是否已完成选择
     */
    isComplete() {
        return this.selectedCards.length >= this.options.maxSelect;
    }
}

export default TarotCard;
