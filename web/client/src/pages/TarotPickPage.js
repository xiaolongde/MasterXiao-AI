/**
 * 直觉塔罗 抽牌页
 * 圆环牌轮排列，手指上下滑动旋转牌轮
 * 点击牌 → 生成爻数据 → 单数牌背面/双数牌正面 → 放入槽框
 * 抽满6张后点击"开始解读"跳转到解读页
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar } from '../components/Common.js';
import { getGuaInfo, generateGuaCode, generateBianGuaCode, getMovingYaoPositions, getLunarDate } from '../utils/guaData.js';
import { matchRecordApi } from '../services/api.js';
import { getSessionId } from '../scripts/state.js';
import { FULL_DECK } from '../data/tarot.js';

const ANGLE_STEP = 3.5;  // 每张牌间隔角度（度）
const TOTAL_CARDS = Math.ceil(360 / ANGLE_STEP);  // 铺满整圆所需张数（≈103）
const CARDS_TO_DRAW = 6;
const SLOT_LABELS = ['目标', '动力', '障碍', '资源', '支持', '结果'];

// 爻位置名称
const YAO_POSITION_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

/**
 * 生成单张牌的爻数据（模拟抛掷铜钱）
 */
function generateYaoData(step) {
    const coin1 = Math.random() > 0.5 ? '背' : '字';
    const coin2 = Math.random() > 0.5 ? '背' : '字';
    const coin3 = Math.random() > 0.5 ? '背' : '字';
    const coins = [coin1, coin2, coin3];
    const backCount = coins.filter(c => c === '背').length;

    let value, isMoving, name, symbol;

    switch (backCount) {
        case 3:
            value = 1; isMoving = true;
            name = '老阳（三背）'; symbol = '○'; break;
        case 2:
            value = 1; isMoving = false;
            name = '少阳（二背一字）'; symbol = '⚊'; break;
        case 1:
            value = 0; isMoving = false;
            name = '少阴（一背二字）'; symbol = '⚋'; break;
        case 0: default:
            value = 0; isMoving = true;
            name = '老阴（三字）'; symbol = '×'; break;
    }

    return {
        value, isMoving, name, symbol,
        position: YAO_POSITION_NAMES[step - 1],
        step, backCount, coins
    };
}

// 响应式半径：圆心在左侧边缘(left:0)，右半弧覆盖视口
function getWheelRadius() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 牌轮可用高度 = 视口高度 - 导航栏 - 槽位 - 提示栏 - 按钮栏（约250px）
    const availableHeight = vh - 250;
    // 半径 = 可用高度的50% - 10px
    const r = availableHeight * 0.50 - 10;
    return Math.max(r, 190);
}

export class TarotPickPage {
    constructor(params) {
        this.matchType = getMatchTypeById(params.type);
        if (!this.matchType) { window.router.navigate('/'); return; }

        this.currentRotation = 0;
        this.isDragging = false;
        this.hasMoved = false;
        this.startY = 0;
        this.lastRotation = 0;
        this.velocity = 0;
        this.lastMoveTime = 0;
        this.lastMoveY = 0;
        this.animFrameId = null;
        this._cleanups = [];

        this.pickedCards = new Array(CARDS_TO_DRAW).fill(null);
        this.isShowingPreview = false;

        // 预洗牌：先打乱78张，再随机补牌铺满整圆
        this.deckCards = this._shuffleDeck();

        this.yaos = [];
        this.yaoHistory = [];
        this.currentStep = 0;

        this.isLoading = false;
        this._isSpinning = false;
        this._pendingDraw = null;
        this._remindTimer = null;

        // 判断是否来自小红书入口（有核销码即为小红书用户）
        this.isXHS = !!(window.appState?.get?.('redeemCode'));
    }

    get pickedCount() {
        return this.pickedCards.filter(c => c !== null).length;
    }

    /**
     * 洗牌：先打乱78张牌全部放入，再从中随机抽取补满整圆
     */
    _shuffleDeck() {
        const deck = [...FULL_DECK];
        // 洗牌
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        // 78张全部使用，不够的从78张里随机补
        const result = [...deck];
        while (result.length < TOTAL_CARDS) {
            result.push(deck[Math.floor(Math.random() * deck.length)]);
        }
        return result;
    }

    render() {
        if (!this.matchType) return '';

        const radius = getWheelRadius();
        let cardsHtml = '';
        for (let i = 0; i < TOTAL_CARDS; i++) {
            const angle = i * ANGLE_STEP;
            cardsHtml += `
                <div class="wheel-card" data-idx="${i}"
                     style="transform: rotate(${angle}deg) translateY(-${radius}px)">
                  <div class="wheel-card__face">
                    <div class="wheel-card__diamond"></div>
                    <div class="wheel-card__corner wheel-card__corner--tl"></div>
                    <div class="wheel-card__corner wheel-card__corner--tr"></div>
                    <div class="wheel-card__corner wheel-card__corner--bl"></div>
                    <div class="wheel-card__corner wheel-card__corner--br"></div>
                  </div>
                </div>`;
        }

        const slotsHtml = SLOT_LABELS.map((label, i) => `
          <div class="pick-slot" id="pickSlot${i}" data-slot="${i}">
            <div class="pick-slot__empty">
              <span class="pick-slot__label">${label}</span>
            </div>
          </div>
        `).join('');

        return `
      <div class="page tarot-pick-page">
        ${Navbar({ title: '抽牌', showBack: true, showHistory: false, showProfile: false })}
        <main class="page-content">
          <div class="pick-page-wrap">
            <div class="pick-slots-bar" id="pickSlotsBar">
              ${slotsHtml}
            </div>
            <div class="pick-hint-bar">
              <span class="pick-hint-text">点击牌轮中的牌抽取，共需抽 ${CARDS_TO_DRAW} 张</span>
            </div>
            <div class="pick-wheel-viewport" id="wheelViewport">
              <div class="pick-wheel" id="pickWheel" style="--wheel-radius: ${radius}px">
                ${cardsHtml}
              </div>
            </div>
          </div>
          <div class="pick-bottom-bar" id="pickBottomBar" style="display:none;">
            <button class="btn btn--primary btn--full btn--lg pick-next-btn" id="pickNextBtn">
              开始解读
            </button>
          </div>
        </main>

        <!-- 默念提醒浮层 -->
        <div class="pick-remind-toast" id="pickRemindToast">
          <div class="pick-remind-toast__icon">🙏</div>
          <div class="pick-remind-toast__text">请心里默念您的问题</div>
        </div>

        <!-- 抽牌结果弹框 -->
        <div class="pick-card-modal-overlay" id="pickCardModal">
          <div class="pick-card-modal">
            <div class="pick-card-modal__particles" id="modalParticles"></div>
            <div class="pick-card-modal__glow"></div>
            <div class="pick-card-modal__card" id="modalCard">
              <div class="pick-card-modal__face">
                <span class="pick-card-modal__card-icon" id="modalCardIcon">✦</span>
                <span class="pick-card-modal__card-name" id="modalCardName"></span>
              </div>
              <!-- 牌背面装饰层（参考图：深蓝底 + 双圆环 + 放射线 + 四方位符号 + 四角弧线） -->
              <div class="pick-card-modal__back-decor">
                <div class="modal-back__inner-border"></div>
                <div class="modal-back__radial-line modal-back__radial-line--0"></div>
                <div class="modal-back__radial-line modal-back__radial-line--45"></div>
                <div class="modal-back__radial-line modal-back__radial-line--90"></div>
                <div class="modal-back__radial-line modal-back__radial-line--135"></div>
                <div class="modal-back__circle modal-back__circle--outer"></div>
                <div class="modal-back__circle modal-back__circle--inner"></div>
                <div class="modal-back__center-icon">Q</div>
                <div class="modal-back__suit modal-back__suit--top">⛤</div>
                <div class="modal-back__suit modal-back__suit--right">☤</div>
                <div class="modal-back__suit modal-back__suit--bottom">🏆</div>
                <div class="modal-back__suit modal-back__suit--left">⚔</div>
                <div class="modal-back__corner modal-back__corner--tl">Q</div>
                <div class="modal-back__corner modal-back__corner--tr">☽</div>
                <div class="modal-back__corner modal-back__corner--bl">☽</div>
                <div class="modal-back__corner modal-back__corner--br">☾</div>
              </div>
            </div>
            <div class="pick-card-modal__info">
              <span class="pick-card-modal__step" id="modalStep"></span>
              <span class="pick-card-modal__slot-label" id="modalSlotLabel"></span>
              <span class="pick-card-modal__orientation" id="modalOrientation"></span>
            </div>
            <div class="pick-card-modal__buttons">
              <button class="pick-card-modal__btn pick-card-modal__btn--confirm" id="modalConfirmBtn">
                确定
              </button>
            </div>
            <div class="pick-card-modal__retry-link" id="modalRetryBtn">
              点错了，换一张
            </div>
          </div>
        </div>
      </div>`;
    }

    attachEvents() {
        document.querySelector('.navbar__back-btn')?.addEventListener('click', () => window.router.back());

        // 卡牌点击抽牌
        document.getElementById('pickWheel')?.addEventListener('click', (e) => {
            if (this.hasMoved || this.isShowingPreview || this.isLoading) return;
            const card = e.target.closest('.wheel-card');
            if (card) {
                const idx = parseInt(card.dataset.idx);
                this.handleDrawOne(idx, card);
            }
        });

        // 开始解读
        document.getElementById('pickNextBtn')?.addEventListener('click', () => this.handleStartDivination());

        // 弹框按钮
        document.getElementById('modalRetryBtn')?.addEventListener('click', () => this.handleRetry());
        document.getElementById('modalConfirmBtn')?.addEventListener('click', () => this.handleConfirm());

        const vp = document.getElementById('wheelViewport');
        if (!vp) return;

        // touch
        vp.addEventListener('touchstart', (e) => {
            this.stopInertia(); this.hasMoved = false;
            this.onDragStart(e.touches[0].clientY);
        }, { passive: true });
        vp.addEventListener('touchmove', (e) => {
            e.preventDefault(); this.hasMoved = true;
            this.onDragMove(e.touches[0].clientY);
        }, { passive: false });
        vp.addEventListener('touchend', () => this.onDragEnd());

        // mouse
        vp.addEventListener('mousedown', (e) => {
            this.stopInertia(); this.hasMoved = false;
            this.onDragStart(e.clientY);
        });
        const onMM = (e) => { if (this.isDragging) { this.hasMoved = true; this.onDragMove(e.clientY); } };
        const onMU = () => { if (this.isDragging) this.onDragEnd(); };
        document.addEventListener('mousemove', onMM);
        document.addEventListener('mouseup', onMU);
        this._cleanups.push(() => {
            document.removeEventListener('mousemove', onMM);
            document.removeEventListener('mouseup', onMU);
        });
    }

    /* ---- 拖动 ---- */
    onDragStart(y) {
        this.isDragging = true; this.startY = y;
        this.lastRotation = this.currentRotation;
        this.velocity = 0; this.lastMoveTime = Date.now(); this.lastMoveY = y;
    }
    onDragMove(y) {
        if (!this.isDragging) return;
        this.currentRotation = this.lastRotation + (y - this.startY) * 0.45;
        this.applyRotation();
        const now = Date.now(), dt = now - this.lastMoveTime;
        if (dt > 0) this.velocity = ((y - this.lastMoveY) / dt) * 0.45;
        this.lastMoveTime = now; this.lastMoveY = y;
    }
    onDragEnd() {
        this.isDragging = false;
        if (Math.abs(this.velocity) > 0.02) this.startInertia();
    }
    startInertia() {
        const step = () => {
            this.velocity *= 0.96;
            if (Math.abs(this.velocity) < 0.005) { this.animFrameId = null; return; }
            this.currentRotation += this.velocity * 16;
            this.applyRotation();
            this.animFrameId = requestAnimationFrame(step);
        };
        this.animFrameId = requestAnimationFrame(step);
    }
    stopInertia() {
        if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
    }
    applyRotation() {
        const el = document.getElementById('pickWheel');
        if (el) el.style.transform = `rotate(${this.currentRotation}deg)`;
    }

    /* ---- 显示默念提醒 ---- */
    showRemindToast() {
        const toast = document.getElementById('pickRemindToast');
        if (!toast) return;
        toast.classList.remove('pick-remind-toast--show');
        void toast.offsetWidth;
        toast.classList.add('pick-remind-toast--show');
        clearTimeout(this._remindTimer);
        this._remindTimer = setTimeout(() => {
            toast.classList.remove('pick-remind-toast--show');
        }, 2000);
    }

    /* ---- 随机转动牌轮 ---- */
    spinWheelRandom() {
        return new Promise((resolve) => {
            const randomAngle = 120 + Math.random() * 360;
            const targetRotation = this.currentRotation + randomAngle;
            const startRotation = this.currentRotation;
            // 随机转动时长 500~1000ms
            const duration = 500 + Math.random() * 500;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                this.currentRotation = startRotation + (targetRotation - startRotation) * eased;
                this.applyRotation();

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.currentRotation = targetRotation;
                    this.lastRotation = targetRotation;
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    /* ---- 抽一张牌 ---- */
    handleDrawOne(cardIdx, cardElement) {
        if (this.pickedCount >= CARDS_TO_DRAW) {
            window.showToast && window.showToast('已抽满6张牌，请点击开始解读', 'default');
            return;
        }
        if (this._pendingDraw) return;
        if (this._isSpinning) return;

        this.stopInertia();
        this._isSpinning = true;

        // 显示默念提醒
        this.showRemindToast();

        // 先随机转动牌轮，再弹出结果
        this.spinWheelRandom().then(() => {
            this._isSpinning = false;

            const stepNum = this.currentStep + 1;
            const yaoData = generateYaoData(stepNum);
            const slotIdx = this.pickedCards.findIndex(c => c === null);
            const isReversed = (stepNum % 2 === 1);

            // 从预洗好的牌堆中取出对应位置的塔罗牌
            const tarotCard = this.deckCards[cardIdx] || this.deckCards[0];

            const cardData = {
                id: cardIdx,
                step: stepNum,
                yao: {
                    value: yaoData.value,
                    isMoving: yaoData.isMoving,
                    name: yaoData.name,
                    symbol: yaoData.symbol,
                    position: yaoData.position
                },
                isReversed,
                label: SLOT_LABELS[slotIdx],
                symbol: yaoData.symbol,
                positionName: yaoData.position,
                backCount: yaoData.backCount,
                coins: yaoData.coins,
                // 塔罗牌信息
                tarotName: tarotCard.name,
                tarotSymbol: tarotCard.symbol,
                tarotUpright: tarotCard.upright,
                tarotReversed: tarotCard.reversed
            };

            this._pendingDraw = {
                cardIdx,
                cardElement,
                stepNum,
                yaoData,
                slotIdx,
                cardData
            };

            if (cardElement) {
                cardElement.classList.add('wheel-card--flipping');
            }

            setTimeout(() => {
                this.showCardModal(cardData);
            }, 400);
        });
    }

    /* ---- 显示抽牌结果弹框 ---- */
    showCardModal(cardData) {
        const modal = document.getElementById('pickCardModal');
        const modalCard = document.getElementById('modalCard');
        const modalCardIcon = document.getElementById('modalCardIcon');
        const modalCardName = document.getElementById('modalCardName');
        const modalStep = document.getElementById('modalStep');
        const modalSlotLabel = document.getElementById('modalSlotLabel');
        const modalOrientation = document.getElementById('modalOrientation');
        if (!modal) return;

        // 显示塔罗牌图标和名称
        if (modalCardIcon) modalCardIcon.textContent = cardData.tarotSymbol || (cardData.isReversed ? '✦' : '✧');
        if (modalCardName) modalCardName.textContent = cardData.tarotName || '';
        if (modalStep) modalStep.textContent = `第 ${cardData.step} 张`;
        if (modalSlotLabel) modalSlotLabel.textContent = `— ${cardData.label} —`;
        if (modalOrientation) {
            modalOrientation.textContent = cardData.isReversed ? '逆位' : '正位';
            modalOrientation.className = 'pick-card-modal__orientation' +
                (cardData.isReversed ? ' pick-card-modal__orientation--reversed' : '');
        }

        if (modalCard) {
            modalCard.classList.toggle('pick-card-modal__card--reversed', cardData.isReversed);
        }

        this.createParticles();

        modal.classList.add('pick-card-modal-overlay--show');
        setTimeout(() => {
            modal.classList.add('pick-card-modal-overlay--animate');
        }, 50);

        this.isShowingPreview = true;
    }

    /* ---- 生成粒子特效 ---- */
    createParticles() {
        const container = document.getElementById('modalParticles');
        if (!container) return;
        container.innerHTML = '';

        const colors = ['#c59cff', '#9b6dff', '#ffd700', '#ff6bb5', '#7ee8fa', '#ffffff'];
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'pick-particle';
            const angle = (Math.random() * 360) * (Math.PI / 180);
            const distance = 80 + Math.random() * 120;
            const size = 3 + Math.random() * 6;
            const delay = Math.random() * 0.6;
            const duration = 0.8 + Math.random() * 0.8;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            p.style.cssText = `
                width: ${size}px; height: ${size}px;
                background: ${color};
                --tx: ${tx}px;
                --ty: ${ty}px;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
            `;
            container.appendChild(p);
        }
    }

    /* ---- 隐藏弹框 ---- */
    hideCardModal() {
        const modal = document.getElementById('pickCardModal');
        if (!modal) return;
        modal.classList.remove('pick-card-modal-overlay--animate');
        modal.classList.add('pick-card-modal-overlay--closing');

        setTimeout(() => {
            modal.classList.remove('pick-card-modal-overlay--show', 'pick-card-modal-overlay--closing');
            this.isShowingPreview = false;
        }, 300);
    }

    /* ---- 确认抽牌 ---- */
    handleConfirm() {
        if (!this._pendingDraw) return;
        const { cardIdx, cardElement, stepNum, yaoData, slotIdx, cardData } = this._pendingDraw;

        this.currentStep = stepNum;

        if (cardElement) {
            cardElement.classList.remove('wheel-card--flipping');
            cardElement.classList.add('wheel-card--drawn');
        }

        this.yaos.push(cardData.yao);
        this.yaoHistory.push({
            step: yaoData.step,
            position: yaoData.position,
            name: yaoData.name,
            symbol: yaoData.symbol,
            isMoving: yaoData.isMoving,
            backCount: yaoData.backCount,
            cardIdx
        });

        this.pickedCards[slotIdx] = cardData;
        this.fillSlot(slotIdx, cardData);

        console.log(`[抽牌确认] 第${stepNum}张 ${cardData.label}：${cardData.isReversed ? '【逆位】' : '【正位】'}`);

        this._pendingDraw = null;
        this.hideCardModal();
    }

    /* ---- 重抽 ---- */
    handleRetry() {
        if (!this._pendingDraw) return;
        const { cardElement } = this._pendingDraw;

        if (cardElement) {
            cardElement.classList.remove('wheel-card--flipping');
        }

        this._pendingDraw = null;
        this.hideCardModal();
    }

    /* ---- 填充槽框 ---- */
    fillSlot(slotIdx, cardData) {
        const slotEl = document.getElementById(`pickSlot${slotIdx}`);
        if (!slotEl) return;

        const faceClass = cardData.isReversed ? 'pick-slot__back' : 'pick-slot__front';
        const rotateStyle = cardData.isReversed ? 'transform: rotate(180deg);' : '';

        slotEl.innerHTML = `
          <div class="pick-slot__filled ${faceClass}" style="${rotateStyle}">
            <span class="pick-slot__symbol">${cardData.tarotSymbol || '✦'}</span>
            <span class="pick-slot__name">${cardData.tarotName || cardData.label}</span>
          </div>
        `;
        slotEl.classList.add('pick-slot--filled');
        if (cardData.isReversed) slotEl.classList.add('pick-slot--reversed');

        const remaining = CARDS_TO_DRAW - this.pickedCount;
        const hint = document.querySelector('.pick-hint-text');
        if (hint) {
            hint.textContent = remaining > 0
                ? `还需抽 ${remaining} 张牌`
                : '已抽满 6 张牌，点击开始解读';
        }

        // 抽满后显示"开始解读"按钮
        if (remaining <= 0) {
            const bottomBar = document.getElementById('pickBottomBar');
            if (bottomBar) {
                bottomBar.style.display = '';
            }
        }
    }

    /* ---- 开始解读 ---- */
    async handleStartDivination() {
        const remaining = CARDS_TO_DRAW - this.pickedCount;
        if (remaining > 0) {
            window.showToast && window.showToast(`请再抽 ${remaining} 张牌`, 'error');
            return;
        }
        if (this.isLoading) return;
        this.isLoading = true;

        const btn = document.getElementById('pickNextBtn');
        if (btn) { btn.disabled = true; btn.classList.add('disabled'); btn.textContent = '正在准备...'; }

        try {
            const guaCode = generateGuaCode(this.yaos);
            const benGuaInfo = getGuaInfo(guaCode);
            const bianGuaCode = generateBianGuaCode(this.yaos);
            const bianGuaInfo = getGuaInfo(bianGuaCode);
            const movingPositions = getMovingYaoPositions(this.yaos);
            const lunarDate = getLunarDate();

            const question = window.appState?.get?.('tarotQuestion') || window.appState?.get?.('selectedQuestion') || '运势指引';
            const questionCategory = window.appState?.get?.('questionCategory') || window.appState?.get?.('tarotCategory') || '综合';
            const gender = window.appState?.get?.('tarotGender') || window.appState?.get?.('gender') || '';

            const guaData = { question, benGuaInfo, bianGuaInfo, yaos: this.yaos, movingPositions, questionCategory, gender };

            if (window.appState) {
                window.appState.set('guaData', guaData);
                window.appState.set('yaos', this.yaos);
                window.appState.set('yaoHistory', this.yaoHistory);
                window.appState.set('benGuaInfo', benGuaInfo);
                window.appState.set('bianGuaInfo', bianGuaInfo);
                window.appState.set('movingPositions', movingPositions);
                window.appState.set('lunarDate', lunarDate);
                window.appState.set('drawnTarotCards', this.pickedCards);
            }

            const sessionId = getSessionId();
            const testData = {
                type: this.matchType.id, method: 'tarot',
                guaData: {
                    question, questionCategory, gender,
                    benGua: benGuaInfo.name, bianGua: bianGuaInfo.name,
                    movingPositions,
                    yaos: this.yaos.map(y => ({ position: y.position, name: y.name, symbol: y.symbol }))
                },
                pickedCards: this.pickedCards.map(c => ({
                    step: c.step, label: c.label, isReversed: c.isReversed,
                    positionName: c.positionName, symbol: c.symbol
                })),
                timestamp: Date.now()
            };

            try {
                let userId = null;
                try {
                    const u = JSON.parse(localStorage.getItem('user') || '{}');
                    userId = u.id || u.userId || null;
                } catch (e) { /* ignore */ }
                const result = await matchRecordApi.create(sessionId, testData, userId);
                testData.recordId = result.data?.recordId;
                testData.sessionId = sessionId;
            } catch (error) {
                console.error('创建匹配记录失败:', error);
                testData.sessionId = sessionId;
            }

            window.appState?.set('currentTest', testData);

            // 小红书入口：直接跳转到解读加载页（已有核销码，无需商品页付费）
            if (this.isXHS) {
                console.log('[小红书入口] 直接跳转到解读加载页');
                const question = encodeURIComponent(
                    window.appState?.get?.('tarotQuestion') || window.appState?.get?.('selectedQuestion') || '运势指引'
                );
                window.router.navigate(`/test/${this.matchType.id}/tarot/result-loading?question=${question}`);
            } else {
                // 普通入口：跳转到商品/服务页
                window.router.navigate(`/product/${this.matchType.id}`);
            }

        } catch (error) {
            console.error('[解读准备失败]', error);
            window.showToast && window.showToast('卦象计算失败，请重试', 'error');
            this.isLoading = false;
            if (btn) { btn.disabled = false; btn.classList.remove('disabled'); btn.textContent = '开始解读'; }
        }
    }

    destroy() {
        this.stopInertia();
        clearTimeout(this._remindTimer);
        this._cleanups.forEach(fn => fn());
    }
}

export default TarotPickPage;
