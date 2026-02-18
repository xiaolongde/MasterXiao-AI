/**
 * 直觉卡牌 洗牌页
 * 3D卡片洗牌动画 + 抽牌功能
 * 每张牌的参数与小程序抛掷铜钱保持一致
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar, ProgressBar } from '../components/Common.js';
import { getGuaInfo, generateGuaCode, generateBianGuaCode, getMovingYaoPositions, getLunarDate } from '../utils/guaData.js';

// 卡牌总数
const TOTAL_CARDS = 80;
// 每次摇牌显示的数量（即摇中的牌数）
const CARDS_TO_SHOW = 3;
// 每次需要选择的数量
const CARDS_TO_SELECT = 3;
// 需要抽牌的次数
const DRAW_ROUNDS = 2;

// 爻位置名称（与小程序保持一致）
const YAO_POSITION_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

/**
 * 生成单张牌的爻数据（模拟抛掷铜钱）
 * 参数名与小程序 divination.js 中的 newYao 保持一致
 * @param {number} step - 当前步骤 (1-6)
 * @returns {object} yao 对象
 */
function generateYaoData(step) {
    // 模拟抛掷三枚铜钱，计算背面数量
    const coin1 = Math.random() > 0.5 ? '背' : '字';
    const coin2 = Math.random() > 0.5 ? '背' : '字';
    const coin3 = Math.random() > 0.5 ? '背' : '字';
    const coins = [coin1, coin2, coin3];
    const backCount = coins.filter(c => c === '背').length;
    
    // 根据背面数量确定爻的类型（与小程序逻辑完全一致）
    // 3背=老阳(动)，2背=少阳，1背=少阴，0背=老阴(动)
    let value, isMoving, name, symbol;
    
    switch (backCount) {
        case 3: // 三背 - 老阳（重）- 阳动
            value = 1;
            isMoving = true;
            name = '老阳（三背）';
            symbol = '○';
            break;
        case 2: // 二背一字 - 少阳 - 阳静
            value = 1;
            isMoving = false;
            name = '少阳（二背一字）';
            symbol = '⚊';
            break;
        case 1: // 一背二字 - 少阴 - 阴静
            value = 0;
            isMoving = false;
            name = '少阴（一背二字）';
            symbol = '⚋';
            break;
        case 0: // 三字 - 老阴（交）- 阴动
        default:
            value = 0;
            isMoving = true;
            name = '老阴（三字）';
            symbol = '×';
            break;
    }
    
    const position = YAO_POSITION_NAMES[step - 1];
    
    // 返回与小程序完全一致的数据结构
    return {
        value,        // 爻值 (1=阳, 0=阴)
        isMoving,     // 是否动爻
        name,         // 爻名称
        symbol,       // 爻符号 (○/⚊/⚋/×)
        position,     // 爻位置 (初爻/二爻/三爻/四爻/五爻/上爻)
        step,         // 步骤序号
        backCount,    // 背面数量（用于调试/显示）
        coins         // 三枚铜钱的结果
    };
}

export class TarotShufflePage {
    constructor(params) {
        this.matchType = getMatchTypeById(params.type);
        this.isShuffling = false; // 是否正在洗牌
        this.shuffleCount = 0; // 洗牌次数
        this.hasShuffled = false; // 是否已洗过牌
        this.cards = []; // 卡片数组
        
        // 抽牌相关
        this.drawRound = 0; // 当前抽牌轮次 (0: 未开始, 1: 第一轮, 2: 第二轮)
        this.selectedSlots = []; // 已放入槽位的卡牌ID
        this.showDrawModal = false; // 是否显示抽牌弹框
        this.modalCards = []; // 弹框中显示的6张牌
        this.modalSelectedCards = []; // 弹框中已选择的牌ID
        this.availableCardIds = []; // 可用的卡牌ID池
        
        // 六爻记录（与小程序保持一致的参数名）
        this.yaos = [];       // 六爻数据数组
        this.yaoHistory = []; // 爻历史记录（包含更多信息）
        this.currentStep = 0; // 当前步骤 (0-6)
        
        if (!this.matchType) {
            window.router.navigate('/');
            return;
        }

        // 初始化卡片
        this.initCards();
        // 初始化可用卡牌池
        this.initAvailableCards();
    }

    initCards() {
        // 初始化卡片时就随机铺开
        this.cards = Array.from({ length: TOTAL_CARDS }, (_, index) => {
            const maxSpreadX = 300; // X轴散开范围扩大
            const maxSpreadY = 350; // Y轴散开范围扩大
            const x = (Math.random() - 0.5) * maxSpreadX;
            const y = (Math.random() - 0.5) * maxSpreadY;
            const rotation = (Math.random() - 0.5) * 120; // ±60度，更分散
            
            return {
                id: index,
                x,
                y,
                rotation,
                zIndex: Math.floor(Math.random() * TOTAL_CARDS)
            };
        });
    }

    initAvailableCards() {
        // 初始化所有可用卡牌ID
        this.availableCardIds = Array.from({ length: TOTAL_CARDS }, (_, i) => i);
    }

    render() {
        if (!this.matchType) return '';

        const buttonText = this.getButtonText();
        const isButtonDisabled = this.isShuffling;

        return `
      <div class="page tarot-shuffle-page">
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
              ${ProgressBar(4, 5, {
                  showText: false,
                  showSteps: true,
                  stepLabel: ''
              })}
            </div>

            <!-- 页面标题 -->
            <section class="shuffle-header animate-fade-in-up">
              <h1 class="shuffle-title">洗牌</h1>
              <p class="shuffle-subtitle">点击牌堆，洗牌一次，可重复操作</p>
            </section>

            <!-- 卡牌堆叠区域 -->
            <section class="shuffle-cards-container shuffle-cards-container--large">
              <div class="shuffle-cards shuffle-cards--large" id="shuffleCards">
                ${this.renderCards()}
              </div>
            </section>

            <!-- 洗牌按钮 -->
            <section class="shuffle-actions animate-fade-in-up animate-delay-300">
              <button class="btn btn--primary btn--full btn--lg shuffle-btn ${isButtonDisabled ? 'disabled' : ''}" 
                      id="shuffleBtn" ${isButtonDisabled ? 'disabled' : ''}>
                ${buttonText}
              </button>
            </section>

            <!-- 下一步按钮 -->
            <section class="shuffle-next-hint">
              <button class="btn btn--secondary" id="nextBtn">下一步</button>
            </section>

            <div class="safe-area-bottom"></div>
          </div>
        </main>

        <!-- 抽牌弹框 -->
        ${this.renderDrawModal()}
      </div>
    `;
    }

    getButtonText() {
        if (this.isShuffling) {
            return '洗牌中...';
        }
        return '洗牌';
    }

    renderCards() {
        return this.cards.map(card => `
            <div class="shuffle-card" 
                 data-card-id="${card.id}"
                 style="
                   transform: translate(${card.x}px, ${card.y}px) rotate(${card.rotation}deg);
                   z-index: ${card.zIndex};
                 ">
              <div class="shuffle-card__inner">
                <div class="shuffle-card__pattern">
                  <div class="card-circle"></div>
                  <div class="card-lines"></div>
                </div>
              </div>
            </div>
        `).join('');
    }

    renderCardSlots() {
        // 6个槽位，排成2行3列
        const slots = [];
        for (let i = 0; i < CARDS_TO_SELECT * DRAW_ROUNDS; i++) {
            const hasCard = this.selectedSlots[i] !== undefined;
            slots.push(`
                <div class="card-slot ${hasCard ? 'card-slot--filled' : ''}" data-slot-index="${i}">
                    ${hasCard ? `
                        <div class="card-slot__card">
                            <div class="shuffle-card__inner">
                                <div class="shuffle-card__pattern">
                                    <div class="card-circle"></div>
                                    <div class="card-lines"></div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="card-slot__empty">
                            <span class="card-slot__number">${i + 1}</span>
                        </div>
                    `}
                </div>
            `);
        }
        return slots.join('');
    }

    renderDrawModal() {
        if (!this.showDrawModal) {
            return '<div class="draw-modal" id="drawModal"></div>';
        }

        // 摇中的3张牌直接全部展示，无需手动选择
        const allSelected = this.modalCards.length === CARDS_TO_SELECT;

        return `
            <div class="draw-modal show" id="drawModal">
                <div class="draw-modal__overlay"></div>
                <div class="draw-modal__content">
                    <h3 class="draw-modal__title">摇牌结果</h3>
                    <div class="draw-modal__cards">
                        ${this.modalCards.map((cardId, index) => {
                            return `
                                <div class="draw-modal__card selected" 
                                     data-modal-card-id="${cardId}" data-modal-index="${index}">
                                    <div class="shuffle-card__inner">
                                        <div class="shuffle-card__pattern">
                                            <div class="card-circle"></div>
                                            <div class="card-lines"></div>
                                        </div>
                                    </div>
                                    <div class="draw-modal__card-check">✓</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p class="draw-modal__hint">已摇出 ${CARDS_TO_SELECT} 张牌</p>
                    <button class="btn btn--primary draw-modal__confirm" 
                            id="confirmDrawBtn">
                        确定
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
                window.router.back();
            });
        }

        // 洗牌/抽牌按钮
        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                this.handleButtonClick();
            });
        }

        // 卡牌区域点击
        const cardsContainer = document.getElementById('shuffleCards');
        if (cardsContainer) {
            cardsContainer.addEventListener('click', () => {
                this.handleButtonClick();
            });
            cardsContainer.style.cursor = 'pointer';
        }

        // 下一步按钮
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.handleNext();
            });
        }

        // 弹框事件
        this.attachModalEvents();
    }

    attachModalEvents() {
        // 摇牌结果已自动选中，不需要卡牌点击事件

        // 确定按钮
        const confirmBtn = document.getElementById('confirmDrawBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.handleConfirmDraw();
            });
        }

        // 点击遮罩不关闭（强制确认）
    }

    handleButtonClick() {
        if (this.isShuffling) return;
        // 每次点击都执行洗牌
        this.handleShuffle();
    }

    handleShuffle() {
        if (this.isShuffling) return;

        this.isShuffling = true;
        this.shuffleCount++;

        // 禁用按钮
        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn) {
            shuffleBtn.disabled = true;
            shuffleBtn.classList.add('disabled');
            shuffleBtn.textContent = '洗牌中...';
        }

        // 执行洗牌动画
        this.performShuffleAnimation();
    }

    performShuffleAnimation() {
        const totalDuration = 300; // 总时长300毫秒
        const stages = [
            { duration: 180, speed: 2 },    // 快速洗牌
            { duration: 120, speed: 1 }     // 减速
        ];

        let currentTime = 0;
        let stageIndex = 0;
        const cardElements = document.querySelectorAll('.shuffle-card');

        const animate = () => {
            if (currentTime >= totalDuration) {
                // 动画结束，回弹效果
                this.applyBounceEffect(cardElements);
                return;
            }

            // 计算当前阶段
            let stageDuration = 0;
            for (let i = 0; i <= stageIndex; i++) {
                stageDuration += stages[i].duration;
            }

            if (currentTime >= stageDuration && stageIndex < stages.length - 1) {
                stageIndex++;
            }

            const currentStage = stages[stageIndex];
            const interval = 80 / currentStage.speed;

            // 随机移动卡片
            this.randomizeCards(cardElements);

            currentTime += interval;
            setTimeout(() => requestAnimationFrame(animate), interval);
        };

        animate();
    }

    randomizeCards(cardElements) {
        cardElements.forEach((card, index) => {
            const maxOffsetX = 300; // 扩大X轴范围
            const maxOffsetY = 350; // 扩大Y轴范围
            const x = (Math.random() - 0.5) * maxOffsetX;
            const y = (Math.random() - 0.5) * maxOffsetY;
            const rotation = (Math.random() - 0.5) * 120; // 更大的旋转角度
            const zIndex = Math.floor(Math.random() * TOTAL_CARDS);

            card.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
            card.style.zIndex = zIndex;

            // 更新内部数据
            this.cards[index].x = x;
            this.cards[index].y = y;
            this.cards[index].rotation = rotation;
            this.cards[index].zIndex = zIndex;
        });
    }

    applyBounceEffect(cardElements) {
        // 回弹效果
        cardElements.forEach((card, index) => {
            const currentX = this.cards[index].x;
            const currentY = this.cards[index].y;
            const currentRotation = this.cards[index].rotation;

            card.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
            card.style.transform = `translate(${currentX * 1.15}px, ${currentY * 1.15}px) rotate(${currentRotation * 1.1}deg)`;

            setTimeout(() => {
                const maxSpreadX = 300; // 扩大最终散开范围
                const maxSpreadY = 350; // 扩大最终散开范围
                const finalX = (Math.random() - 0.5) * maxSpreadX;
                const finalY = (Math.random() - 0.5) * maxSpreadY;
                const finalRotation = (Math.random() - 0.5) * 120; // 更大旋转角度
                const finalZIndex = Math.floor(Math.random() * TOTAL_CARDS);

                card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                card.style.transform = `translate(${finalX}px, ${finalY}px) rotate(${finalRotation}deg)`;
                card.style.zIndex = finalZIndex;
                
                this.cards[index].x = finalX;
                this.cards[index].y = finalY;
                this.cards[index].rotation = finalRotation;
                this.cards[index].zIndex = finalZIndex;
            }, 200);

            setTimeout(() => {
                card.style.transition = '';
            }, 700);
        });

        // 恢复按钮状态
        setTimeout(() => {
            this.isShuffling = false;
            this.hasShuffled = true;
            this.updateButtonState();
        }, 700);
    }

    updateButtonState() {
        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn) {
            const isComplete = this.selectedSlots.length >= CARDS_TO_SELECT * DRAW_ROUNDS;
            shuffleBtn.disabled = isComplete;
            shuffleBtn.classList.toggle('disabled', isComplete);
            shuffleBtn.textContent = this.getButtonText();
        }
    }

    openDrawModal() {
        // 从可用卡牌池中随机摇出3张（直接作为摇中的牌）
        this.modalCards = this.getRandomCards(CARDS_TO_SELECT);
        this.modalSelectedCards = [...this.modalCards]; // 全部自动选中
        this.showDrawModal = true;
        this.drawRound++;

        // 更新弹框DOM
        this.updateModalDOM();
    }

    getRandomCards(count) {
        // 从可用卡牌池中随机选取
        const shuffled = [...this.availableCardIds].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    updateModalDOM() {
        const modalContainer = document.getElementById('drawModal');
        if (modalContainer) {
            modalContainer.outerHTML = this.renderDrawModal();
            this.attachModalEvents();
        }
    }

    handleConfirmDraw() {
        if (this.modalSelectedCards.length !== CARDS_TO_SELECT) return;

        // 将选中的牌放入槽位，并为每张牌生成爻数据
        this.modalSelectedCards.forEach(cardId => {
            this.selectedSlots.push(cardId);
            
            // 当前步骤 +1（1-6）
            this.currentStep++;
            
            // 生成爻数据（与小程序抛掷铜钱一致）
            const yaoData = generateYaoData(this.currentStep);
            
            // 记录爻（与小程序 yaos 数组结构一致）
            const newYao = {
                value: yaoData.value,
                isMoving: yaoData.isMoving,
                name: yaoData.name,
                symbol: yaoData.symbol,
                position: yaoData.position
            };
            this.yaos.push(newYao);
            
            // 记录爻历史（与小程序 yaoHistory 数组结构一致）
            const historyItem = {
                step: yaoData.step,
                position: yaoData.position,
                name: yaoData.name,
                symbol: yaoData.symbol,
                isMoving: yaoData.isMoving,
                backCount: yaoData.backCount,
                cardId: cardId  // 额外记录卡牌ID
            };
            this.yaoHistory.push(historyItem);
            
            // 从可用卡牌池中移除
            const idx = this.availableCardIds.indexOf(cardId);
            if (idx > -1) {
                this.availableCardIds.splice(idx, 1);
            }
            
            // 打印日志（与小程序类似）
            console.log(`[抽牌] ${yaoData.position}：${yaoData.name} (${yaoData.symbol})`);
        });

        // 关闭弹框
        this.showDrawModal = false;
        this.modalCards = [];
        this.modalSelectedCards = [];

        // 更新页面
        this.updateSlotsUI();
        this.updateModalDOM();
        this.updateButtonState();

        // 记录日志
        console.log(`[抽牌] 第${this.drawRound}轮完成，已选${this.selectedSlots.length}张牌，当前爻数据:`, this.yaos);
    }

    updateSlotsUI() {
        const slotsContainer = document.querySelector('.card-slots-grid');
        if (slotsContainer) {
            slotsContainer.innerHTML = this.renderCardSlots();
        }
    }

    async handleNext() {
        // 跳转到抽牌页面
        window.router.navigate(`/test/${this.matchType.id}/tarot/pick`);
    }
}

export default TarotShufflePage;
