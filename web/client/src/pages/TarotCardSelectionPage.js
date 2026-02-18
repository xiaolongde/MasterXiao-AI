/**
 * 直觉塔罗 摇牌页
 * 6张牌排列（2行×3列），点击摇牌从6张中随机选3张
 * 每张牌正反随机（字=正面，背=反面），与铜钱抛掷规则一致
 * 正面显示塔罗牌图案（symbol + name），反面显示牌背
 * 摇6次后根据爻数据计算卦象，跳转到解读页
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar } from '../components/Common.js';
import { getGuaInfo, generateGuaCode, generateBianGuaCode, getMovingYaoPositions, getLunarDate } from '../utils/guaData.js';
import { matchRecordApi } from '../services/api.js';
import { getSessionId } from '../scripts/state.js';

const TOTAL_SHAKES = 6;
const COINS_PER_SHAKE = 3; // 每次摇3张牌（=3枚铜钱）
const YAO_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

export class TarotCardSelectionPage {
    constructor(params) {
        this.matchType = getMatchTypeById(params.type);
        if (!this.matchType) { window.router.navigate('/'); return; }

        this.selectedCards = window.appState?.selectedTarotCards || [];
        this.shakeCount = 0;
        this.yaos = [];           // 6次爻数据
        this.collectedCards = []; // 正面（字）的牌
        this.isShaking = false;
    }

    render() {
        if (!this.matchType) return '';

        const cardsHtml = this.selectedCards.map((card, i) => `
          <div class="cs-card" data-idx="${i}" id="csCard${i}">
            <div class="cs-card__inner">
              <div class="cs-card__back">
                <span class="cs-card__star">✦</span>
              </div>
              <div class="cs-card__front">
                <span class="cs-card__symbol">${card.symbol || '✦'}</span>
                <span class="cs-card__name">${card.name || ''}</span>
              </div>
            </div>
          </div>
        `).join('');

        return `
      <div class="page tarot-card-selection-page">
        ${Navbar({ title: '摇牌', showBack: true, showHistory: false, showProfile: false })}
        <main class="page-content">
          <div class="cs-page-wrap">

            <div class="cs-title">命运之牌</div>
            <div class="cs-status" id="csStatus">第 1 / ${TOTAL_SHAKES} 次摇牌</div>

            <!-- 6张大牌 -->
            <div class="cs-card-grid" id="csCardGrid">
              ${cardsHtml}
            </div>

            <!-- 摇牌按钮 -->
            <div class="cs-shake-bar">
              <button class="btn btn--primary btn--full btn--lg" id="csShakeBtn">摇牌</button>
            </div>

            <!-- 底部收集区 -->
            <div class="cs-collect-area" id="csCollectArea">
              <div class="cs-collect-label">已获得的正面牌</div>
              <div class="cs-collect-slots" id="csCollectSlots"></div>
            </div>

          </div>
        </main>
      </div>`;
    }

    attachEvents() {
        document.querySelector('.navbar__back-btn')?.addEventListener('click', () => window.router.back());
        document.getElementById('csShakeBtn')?.addEventListener('click', () => this.doShake());
    }

    doShake() {
        if (this.isShaking || this.shakeCount >= TOTAL_SHAKES) return;
        this.isShaking = true;

        const btn = document.getElementById('csShakeBtn');
        if (btn) { btn.disabled = true; btn.classList.add('disabled'); }

        const cards = document.querySelectorAll('.cs-card');
        const grid = document.getElementById('csCardGrid');

        // 1. 重置所有牌状态
        cards.forEach(c => {
            c.classList.remove(
                'cs-card--face-up', 'cs-card--face-down',
                'cs-card--picked', 'cs-card--not-picked', 'cs-card--hidden',
                'cs-card--phase-float', 'cs-card--phase-scatter', 'cs-card--phase-glow',
                'cs-card--shuffle-swap', 'cs-card--energy-pulse'
            );
            c.style.setProperty('--sx', '0px');
            c.style.setProperty('--sy', '0px');
            c.style.setProperty('--sr', '0deg');
            c.style.removeProperty('--swap-x');
            c.style.removeProperty('--swap-y');
        });

        // 恢复网格为完整6张牌布局
        if (grid) {
            grid.classList.remove('cs-card-grid--picked-only');
        }

        // 2. 随机选3张（= 3枚铜钱）
        const indices = [0, 1, 2, 3, 4, 5];
        const picked = [];
        for (let i = 0; i < COINS_PER_SHAKE; i++) {
            const ri = Math.floor(Math.random() * indices.length);
            picked.push(indices[ri]);
            indices.splice(ri, 1);
        }

        // 3. 每张牌随机正面（字）或反面（背）
        const coins = picked.map(() => Math.random() > 0.5 ? '字' : '背');
        const backCount = coins.filter(c => c === '背').length;

        // 4. 根据背面数量计算爻
        const yao = this.calculateYao(backCount, this.shakeCount + 1, coins);

        // =========== 炫酷洗牌动画 ===========
        // 添加网格震动
        if (grid) grid.classList.add('cs-grid--shaking');

        // === Phase 0: 卡片聚拢到中心 (0 ~ 400ms) ===
        cards.forEach((c, i) => {
            c.classList.add('cs-card--gather');
        });

        // === Phase 0.5: 粒子爆发 + 全部牌随机重排 (400ms ~ 1200ms) ===
        setTimeout(() => {
            cards.forEach(c => c.classList.remove('cs-card--gather'));

            // 创建粒子爆发效果
            this.spawnParticles(grid);

            // 所有牌一次性随机重排并飞行到新位置
            this.shuffleAllCards(grid);
        }, 400);

        // === Phase 1: 浮空 (1200ms ~ 1650ms) ===
        setTimeout(() => {
            if (grid) grid.classList.remove('cs-grid--shaking');
            cards.forEach(c => c.classList.add('cs-card--phase-float'));
        }, 1200);

        // === Phase 2: 零重力散开 (1650ms ~ 2150ms) ===
        setTimeout(() => {
            cards.forEach(c => c.classList.remove('cs-card--phase-float'));
            cards.forEach((c, i) => {
                const angle = (i / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
                const dist = 12 + Math.random() * 10;
                c.style.setProperty('--sx', `${Math.cos(angle) * dist}px`);
                c.style.setProperty('--sy', `${Math.sin(angle) * dist}px`);
                c.style.setProperty('--sr', `${(Math.random() - 0.5) * 24}deg`);
                c.classList.add('cs-card--phase-scatter');
            });
        }, 1650);

        // === Phase 3: 能量收束发光 (2150ms ~ 2600ms) ===
        setTimeout(() => {
            cards.forEach(c => {
                c.classList.remove('cs-card--phase-scatter');
                c.classList.add('cs-card--phase-glow');
                c.classList.add('cs-card--energy-pulse');
            });
        }, 2150);

        // === Phase 4: 揭牌 (2600ms+) ===
        setTimeout(() => {
            cards.forEach(c => {
                c.classList.remove('cs-card--phase-glow');
                c.classList.remove('cs-card--energy-pulse');
            });

            // 获取当前最新的DOM中的卡牌元素（shuffleAllCards可能重排了DOM）
            const currentCards = document.querySelectorAll('.cs-card');

            // 隐藏未被选中的牌（淡出动画）
            currentCards.forEach(c => {
                const idx = parseInt(c.dataset.idx);
                if (!picked.includes(idx)) {
                    c.classList.add('cs-card--not-picked');
                }
            });

            // 等淡出动画完成后，彻底隐藏未选中的牌并收缩网格为一行
            setTimeout(() => {
                currentCards.forEach(c => {
                    const idx = parseInt(c.dataset.idx);
                    if (!picked.includes(idx)) {
                        c.classList.add('cs-card--hidden');
                    }
                });
                // 网格收缩为一行3列居中
                if (grid) {
                    grid.classList.add('cs-card-grid--picked-only');
                }
            }, 420);

            // 依次翻开被选中的牌
            picked.forEach((idx, pi) => {
                const isFaceUp = coins[pi] === '字';
                const cardEl = document.getElementById(`csCard${idx}`);
                if (!cardEl) return;

                setTimeout(() => {
                    cardEl.classList.add('cs-card--picked');
                    cardEl.classList.add(isFaceUp ? 'cs-card--face-up' : 'cs-card--face-down');

                    // 翻牌时的光圈特效
                    this.spawnFlipGlow(cardEl);

                    if (isFaceUp) {
                        this.collectedCards.push({
                            cardIndex: idx,
                            shakeRound: this.shakeCount,
                            cardData: this.selectedCards[idx]
                        });
                    }
                }, pi * 280);
            });

            // 翻完后更新状态
            setTimeout(() => {
                this.yaos.push(yao);
                this.shakeCount++;
                this.updateCollectSlots();
                this.updateStatus();
                this.isShaking = false;
                if (btn) { btn.disabled = false; btn.classList.remove('disabled'); }

                if (this.shakeCount >= TOTAL_SHAKES) {
                    this.onAllShakesDone();
                }
            }, COINS_PER_SHAKE * 280 + 500);

        }, 2600);
    }

    /**
     * 所有牌一次性随机重排（炫酷飞行动画）
     */
    shuffleAllCards(grid) {
        if (!grid) return;
        const cardEls = Array.from(grid.querySelectorAll('.cs-card'));
        if (cardEls.length === 0) return;

        // 1. 记录每张牌当前的位置
        const positions = cardEls.map(card => {
            const rect = card.getBoundingClientRect();
            return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        });

        // 2. 生成随机新顺序（洗牌算法）
        const newOrder = Array.from({ length: cardEls.length }, (_, i) => i);
        for (let i = newOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
        }

        // 3. 为每张牌计算飞行目标偏移量并添加飞行动画
        cardEls.forEach((card, oldIndex) => {
            const newIndex = newOrder.indexOf(oldIndex);
            if (newIndex === oldIndex) return; // 位置不变则跳过

            const oldPos = positions[oldIndex];
            const newPos = positions[newIndex];
            const dx = newPos.left - oldPos.left;
            const dy = newPos.top - oldPos.top;

            // 设置飞行参数（带随机弧线和旋转）
            const curvature = (Math.random() - 0.5) * 60; // 弧线弯曲度
            const rotation = (Math.random() - 0.5) * 360; // 旋转角度
            const delay = Math.random() * 120; // 随机延迟

            card.style.setProperty('--swap-x', `${dx}px`);
            card.style.setProperty('--swap-y', `${dy}px`);
            card.style.setProperty('--curve', `${curvature}px`);
            card.style.setProperty('--rotate', `${rotation}deg`);
            card.style.setProperty('--delay', `${delay}ms`);
            
            card.classList.add('cs-card--shuffle-all');

            // 生成飞行轨迹粒子
            this.spawnTrailParticle(grid, oldPos, newPos);
        });

        // 4. 动画结束后真正重排 DOM 顺序
        setTimeout(() => {
            // 按新顺序重排 DOM
            const fragment = document.createDocumentFragment();
            newOrder.forEach(oldIndex => {
                fragment.appendChild(cardEls[oldIndex]);
            });
            grid.innerHTML = '';
            grid.appendChild(fragment);

            // 清理样式
            grid.querySelectorAll('.cs-card').forEach(c => {
                c.classList.remove('cs-card--shuffle-all');
                c.style.removeProperty('--swap-x');
                c.style.removeProperty('--swap-y');
                c.style.removeProperty('--curve');
                c.style.removeProperty('--rotate');
                c.style.removeProperty('--delay');
            });
        }, 800);
    }

    /**
     * 随机交换两张牌的 DOM 位置（炫酷飞行动画）
     */
    swapRandomCards(grid) {
        if (!grid) return;
        const cardEls = Array.from(grid.querySelectorAll('.cs-card'));
        if (cardEls.length < 2) return;

        // 随机选两张不同的牌
        const a = Math.floor(Math.random() * cardEls.length);
        let b = Math.floor(Math.random() * cardEls.length);
        while (b === a) b = Math.floor(Math.random() * cardEls.length);

        const cardA = cardEls[a];
        const cardB = cardEls[b];

        // 计算两张牌的位置差
        const rectA = cardA.getBoundingClientRect();
        const rectB = cardB.getBoundingClientRect();
        const dx = rectB.left - rectA.left;
        const dy = rectB.top - rectA.top;

        // 给 A 和 B 设置飞行目标
        cardA.style.setProperty('--swap-x', `${dx}px`);
        cardA.style.setProperty('--swap-y', `${dy}px`);
        cardB.style.setProperty('--swap-x', `${-dx}px`);
        cardB.style.setProperty('--swap-y', `${-dy}px`);

        cardA.classList.add('cs-card--shuffle-swap');
        cardB.classList.add('cs-card--shuffle-swap');

        // 生成交换轨迹上的小粒子
        this.spawnTrailParticle(grid, rectA, rectB);

        // 动画结束后真正交换 DOM 顺序
        setTimeout(() => {
            cardA.classList.remove('cs-card--shuffle-swap');
            cardB.classList.remove('cs-card--shuffle-swap');
            cardA.style.removeProperty('--swap-x');
            cardA.style.removeProperty('--swap-y');
            cardB.style.removeProperty('--swap-x');
            cardB.style.removeProperty('--swap-y');

            // 真正交换 DOM 位置
            const parent = cardA.parentNode;
            const siblingA = cardA.nextSibling === cardB ? cardA : cardA.nextSibling;
            parent.insertBefore(cardA, cardB);
            parent.insertBefore(cardB, siblingA);
        }, 350);
    }

    /**
     * 在网格区域生成粒子爆发
     */
    spawnParticles(container) {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'cs-particle';
            const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5;
            const dist = 40 + Math.random() * 80;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            const size = 3 + Math.random() * 5;
            const hue = 250 + Math.random() * 60; // 紫-粉色系
            const delay = Math.random() * 200;

            particle.style.cssText = `
                left: ${centerX}px; top: ${centerY}px;
                width: ${size}px; height: ${size}px;
                --tx: ${tx}px; --ty: ${ty}px;
                background: hsl(${hue}, 80%, 65%);
                animation-delay: ${delay}ms;
            `;
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 900);
        }
    }

    /**
     * 在两张牌交换路径上生成拖尾粒子
     */
    spawnTrailParticle(container, rectA, rectB) {
        if (!container) return;
        const gridRect = container.getBoundingClientRect();
        const midX = ((rectA.left + rectB.left) / 2) - gridRect.left + (rectA.width / 2);
        const midY = ((rectA.top + rectB.top) / 2) - gridRect.top + (rectA.height / 2);

        for (let i = 0; i < 6; i++) {
            const p = document.createElement('div');
            p.className = 'cs-trail-particle';
            const ox = (Math.random() - 0.5) * 40;
            const oy = (Math.random() - 0.5) * 30;
            p.style.cssText = `left:${midX + ox}px;top:${midY + oy}px;animation-delay:${i * 30}ms;`;
            container.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    }

    /**
     * 翻牌时的光圈特效
     */
    spawnFlipGlow(cardEl) {
        const glow = document.createElement('div');
        glow.className = 'cs-flip-glow';
        cardEl.appendChild(glow);
        setTimeout(() => glow.remove(), 800);
    }

    /**
     * 根据背面数量计算爻（与小程序铜钱规则完全一致）
     * 3背=老阳(动) / 2背=少阳 / 1背=少阴 / 0背=老阴(动)
     */
    calculateYao(backCount, step, coins) {
        let value, isMoving, name, symbol;

        switch (backCount) {
            case 3: // 三背 - 老阳 - 阳动
                value = 1; isMoving = true;
                name = '老阳（三背）'; symbol = '○';
                break;
            case 2: // 二背一字 - 少阳 - 阳静
                value = 1; isMoving = false;
                name = '少阳（二背一字）'; symbol = '⚊';
                break;
            case 1: // 一背二字 - 少阴 - 阴静
                value = 0; isMoving = false;
                name = '少阴（一背二字）'; symbol = '⚋';
                break;
            case 0: // 三字 - 老阴 - 阴动
            default:
                value = 0; isMoving = true;
                name = '老阴（三字）'; symbol = '×';
                break;
        }

        return {
            value, isMoving, name, symbol,
            position: YAO_NAMES[step - 1],
            step, backCount, coins
        };
    }

    updateStatus() {
        const el = document.getElementById('csStatus');
        if (!el) return;
        if (this.shakeCount >= TOTAL_SHAKES) {
            el.textContent = `摇牌完成！共获得 ${this.collectedCards.length} 张正面牌`;
        } else {
            el.textContent = `第 ${this.shakeCount + 1} / ${TOTAL_SHAKES} 次摇牌`;
        }
    }

    updateCollectSlots() {
        const container = document.getElementById('csCollectSlots');
        if (!container) return;
        container.innerHTML = this.collectedCards.map((item, i) => {
            const card = item.cardData || {};
            return `
              <div class="cs-mini-card cs-mini-card--enter" style="animation-delay: ${i * 0.05}s">
                <div class="cs-mini-card__face">
                  <span class="cs-mini-card__symbol">${card.symbol || '✦'}</span>
                  <span class="cs-mini-card__name">${card.name || ''}</span>
                </div>
              </div>`;
        }).join('');
    }

    onAllShakesDone() {
        const btn = document.getElementById('csShakeBtn');
        if (!btn) return;

        // 计算卦象
        try {
            const guaCode = generateGuaCode(this.yaos);
            const benGuaInfo = getGuaInfo(guaCode);
            const bianGuaCode = generateBianGuaCode(this.yaos);
            const bianGuaInfo = getGuaInfo(bianGuaCode);
            const movingPositions = getMovingYaoPositions(this.yaos);
            const lunarDate = getLunarDate();

            // 获取问题信息
            const question = window.appState?.get?.('tarotQuestion') || '运势指引';
            const questionCategory = window.appState?.get?.('questionCategory') || '综合';
            const gender = window.appState?.get?.('gender') || '';

            // 组装 guaData（与小程序完全一致的结构）
            const guaData = {
                question,
                benGuaInfo,
                bianGuaInfo,
                yaos: this.yaos,
                movingPositions,
                questionCategory,
                gender
            };

            console.log('[摇牌完成] 卦象数据:', {
                本卦: benGuaInfo.name,
                变卦: bianGuaInfo.name,
                动爻: movingPositions,
                爻数据: this.yaos.map(y => `${y.position}: ${y.name} ${y.symbol}`),
                正面牌: this.collectedCards.map(c => c.cardData?.name)
            });

            // 保存到全局状态
            if (window.appState) {
                window.appState.set('guaData', guaData);
                window.appState.set('yaos', this.yaos);
                window.appState.set('benGuaInfo', benGuaInfo);
                window.appState.set('bianGuaInfo', bianGuaInfo);
                window.appState.set('movingPositions', movingPositions);
                window.appState.set('lunarDate', lunarDate);
            }

            btn.textContent = '开始解读';
            btn.onclick = async () => {
                // 创建匹配记录
                const sessionId = getSessionId();
                const testData = {
                    type: this.matchType.id,
                    method: 'tarot',
                    guaData: {
                        question,
                        questionCategory,
                        gender,
                        benGua: benGuaInfo.name,
                        bianGua: bianGuaInfo.name,
                        movingPositions,
                        yaos: this.yaos.map(y => ({ position: y.position, name: y.name, symbol: y.symbol }))
                    },
                    collectedCards: this.collectedCards.map(c => c.cardData?.name || ''),
                    timestamp: Date.now()
                };

                try {
                    // 获取本地 userId，没有则传 null
                    let userId = null;
                    try {
                        const userStr = localStorage.getItem('user');
                        if (userStr) {
                            const user = JSON.parse(userStr);
                            userId = user.id || user.userId || null;
                        }
                    } catch (e) { /* ignore */ }

                    const result = await matchRecordApi.create(sessionId, testData, userId);
                    console.log('匹配记录创建成功:', result);
                    testData.recordId = result.data?.recordId;
                    testData.sessionId = sessionId;
                } catch (error) {
                    console.error('创建匹配记录失败:', error);
                    testData.sessionId = sessionId;
                }

                window.appState?.set('currentTest', testData);

                // 跳转到商品/服务页
                window.router.navigate(`/product/${this.matchType.id}`);
            };

        } catch (error) {
            console.error('[摇牌] 卦象计算失败:', error);
            btn.textContent = '重新摇牌';
            btn.onclick = () => {
                this.shakeCount = 0;
                this.yaos = [];
                this.collectedCards = [];
                this.isShaking = false;
                this.updateStatus();
                this.updateCollectSlots();
                document.querySelectorAll('.cs-card').forEach(c => {
                    c.classList.remove('cs-card--face-up', 'cs-card--face-down', 'cs-card--picked', 'cs-card--not-picked', 'cs-card--hidden');
                });
                // 恢复网格布局
                document.getElementById('csCardGrid')?.classList.remove('cs-card-grid--picked-only');
                btn.textContent = '摇牌';
                btn.onclick = () => this.doShake();
            };
        }
    }
}

export default TarotCardSelectionPage;