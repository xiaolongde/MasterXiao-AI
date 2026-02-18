/**
 * 匹配游戏 支付页面
 * 显示支付二维码和核销码
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar, BottomActionBar } from '../components/Common.js';
import { paymentApi } from '../services/api.js';

export class PaymentPage {
    constructor(params) {
        this.testType = params.type;
        this.matchType = getMatchTypeById(this.testType);

        this.orderId = null;
        this.paymentMethod = 'alipay'; // 默认支付宝
        this.qrCodeData = null;
        this.redeemCode = null;
        this.status = 'selecting'; // selecting, paying, success
        this.pollingTimer = null;
        this.pollingCount = 0;       // 轮询计数
        this.maxPollingCount = 20;   // 最大轮询次数
    }

    render() {
        return `
      <div class="page payment-page">
        ${Navbar({
            title: '支付',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            ${this.renderContent()}
          </div>
        </main>
      </div>
    `;
    }

    renderContent() {
        switch (this.status) {
            case 'selecting':
                return this.renderPaymentSelect();
            case 'paying':
                return this.renderPaymentQR();
            case 'success':
                return this.renderSuccess();
            default:
                return '';
        }
    }

    renderPaymentSelect() {
        const product = this.matchType || { title: '测试服务', price: 29.9 };
        const discountPrice = 19.9;

        return `
      <section class="payment-info mt-4 mb-6 animate-fade-in-up">
        <div class="glass-card">
          <div class="payment-product">
            <span class="product-icon">${product.icon || '🔮'}</span>
            <div class="product-info">
              <h3 class="product-name">${product.title}</h3>
              <p class="product-desc">${product.description || ''}</p>
            </div>
            <div class="product-price">
              <span class="price-symbol">¥</span>
              <span class="price-value">${discountPrice}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="payment-method-section mb-6 animate-fade-in-up animate-delay-100">
        <h4 class="section-title mb-4">选择支付方式</h4>
        
        <div class="payment-methods">
          <div class="payment-method-card active" data-method="alipay" style="display:flex;flex-direction:row;align-items:center;gap:12px;padding:14px 16px;">
            <div class="method-icon alipay-icon" style="margin:0;">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="#1677FF">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold">支</text>
              </svg>
            </div>
            <div class="method-name" style="flex:1;text-align:left;">支付宝</div>
            <div class="method-check">✓</div>
          </div>
        </div>
      </section>

      <div class="bottom-action-bar safe-area-bottom">
        <div class="action-bar__buttons">
          <button class="btn btn--primary btn--full" data-action="create-order">
            立即支付 ¥${discountPrice}
          </button>
        </div>
      </div>
    `;
    }

    renderPaymentQR() {
        return `
      <section class="qr-section mt-4 animate-fade-in-up">
        <div class="glass-card text-center">
          <h3 class="heading-3 mb-4">
            ${this.paymentMethod === 'alipay' ? '支付宝' : '微信'}扫码支付
          </h3>
          
          <div class="qr-container">
            <div class="qr-code">
              <img src="${this.qrCodeData}" alt="支付二维码" />
            </div>
            <p class="qr-tip small-text mt-3">
              请使用${this.paymentMethod === 'alipay' ? '支付宝' : '微信'}扫描二维码完成支付
            </p>
          </div>
          
          <div class="payment-amount mt-4">
            <span class="amount-label">支付金额</span>
            <span class="amount-value">¥ 19.9</span>
          </div>
          
          <div class="order-info mt-4">
            <p class="small-text">订单号: ${this.orderId}</p>
          </div>
        </div>
      </section>

      <section class="payment-status mt-4 animate-fade-in-up animate-delay-100">
        <div class="glass-card glass-card--light">
          <div class="status-indicator">
            <div class="loading-dots">
              <span class="loading-dots__dot"></span>
              <span class="loading-dots__dot"></span>
              <span class="loading-dots__dot"></span>
            </div>
            <p class="status-text">等待支付中...</p>
          </div>
        </div>
      </section>

      <!-- 开发环境：模拟支付按钮 -->
      ${this.renderDevPayButton()}
      
      <div class="bottom-action-bar safe-area-bottom">
        <div class="action-bar__buttons">
          <button class="btn btn--secondary" data-action="cancel-order">
            取消支付
          </button>
          <button class="btn btn--primary" data-action="check-status">
            我已支付
          </button>
        </div>
      </div>
    `;
    }

    renderDevPayButton() {
        // 仅开发环境显示
        return `
      <section class="dev-section mt-4">
        <div class="glass-card text-center" style="border: 2px dashed var(--color-warning);">
          <p class="small-text mb-3" style="color: var(--color-warning);">🛠️ 开发模式</p>
          <button class="btn btn--primary btn--sm" data-action="simulate-pay">
            模拟支付成功
          </button>
        </div>
      </section>
    `;
    }

    renderSuccess() {
        return `
      <section class="success-section mt-6 animate-fade-in-up">
        <div class="glass-card text-center">
          <div class="success-icon animate-bounce-in">✅</div>
          <h2 class="heading-2 mb-2">支付成功</h2>
          <p class="body-text-secondary mb-4">正在为您准备解读报告...</p>
          
          <div class="status-indicator" style="margin-top:20px;">
            <div class="loading-dots">
              <span class="loading-dots__dot"></span>
              <span class="loading-dots__dot"></span>
              <span class="loading-dots__dot"></span>
            </div>
            <p class="small-text" style="margin-top:12px;color:var(--color-text-tertiary);">即将跳转到解读页面</p>
          </div>
        </div>
      </section>
    `;
    }

    attachEvents() {
        // 返回按钮
        const backBtn = document.querySelector('.navbar__back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.cleanup();
                window.router.back();
            });
        }

        // 支付方式选择
        document.querySelectorAll('.payment-method-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectPaymentMethod(card.dataset.method);
            });
        });

        // 创建订单
        const createOrderBtn = document.querySelector('[data-action="create-order"]');
        if (createOrderBtn) {
            createOrderBtn.addEventListener('click', () => this.createOrder());
        }

        // 取消支付
        const cancelBtn = document.querySelector('[data-action="cancel-order"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelOrder());
        }

        // 检查支付状态
        const checkBtn = document.querySelector('[data-action="check-status"]');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkPaymentStatus());
        }

        // 模拟支付（开发环境）
        const simulateBtn = document.querySelector('[data-action="simulate-pay"]');
        if (simulateBtn) {
            simulateBtn.addEventListener('click', () => this.simulatePay());
        }
    }

    selectPaymentMethod(method) {
        this.paymentMethod = 'alipay'; // 仅支持支付宝
    }

    async createOrder() {
        try {
            window.showToast('正在创建订单...');

            const response = await paymentApi.createOrder({
                productId: 'test-standard',
                paymentMethod: this.paymentMethod,
                testType: this.testType
            });

            if (response.success) {
                this.orderId = response.data.orderId;
                this.qrCodeData = response.data.qrCode;
                this.status = 'paying';
                this.rerender();

                // 开始轮询支付状态
                this.startPolling();
            }
        } catch (error) {
            window.showToast(error.message || '创建订单失败', 'error');
        }
    }

    cancelOrder() {
        this.cleanup();
        this.status = 'selecting';
        this.orderId = null;
        this.qrCodeData = null;
        this.rerender();
    }

    startPolling() {
        this.pollingCount = 0;
        // 每3秒检查一次支付状态，最多查询20次
        this.pollingTimer = setInterval(() => {
            this.pollingCount++;
            if (this.pollingCount >= this.maxPollingCount) {
                this.stopPolling();
                // 更新页面提示
                const statusText = document.querySelector('.status-text');
                if (statusText) {
                    statusText.textContent = '查询超时，请点击"我已支付"手动查询';
                }
                const loadingDots = document.querySelector('.loading-dots');
                if (loadingDots) {
                    loadingDots.style.display = 'none';
                }
                return;
            }
            this.checkPaymentStatus(true);
        }, 3000);
    }

    stopPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
    }

    async checkPaymentStatus(silent = false) {
        try {
            const response = await paymentApi.getOrderStatus(this.orderId);

            if (response.success && response.data.status === 'paid') {
                this.stopPolling();
                this.redeemCode = response.data.redeemCode;
                this.status = 'success';
                this.rerender();

                if (!silent) {
                    window.showToast('支付成功！', 'success');
                }

                // 支付成功后自动跳转到解读页面
                this.navigateToInterpret();
            } else if (response.success && response.data.status === 'expired') {
                this.stopPolling();
                window.showToast('订单已过期，请重新下单', 'error');
                setTimeout(() => {
                    this.cancelOrder();
                }, 1500);
            } else if (!silent) {
                window.showToast('暂未收到支付，请稍候重试');
            }
        } catch (error) {
            if (!silent) {
                window.showToast('查询失败，请稍候重试', 'error');
            }
        }
    }

    async simulatePay() {
        try {
            const response = await paymentApi.simulatePay(this.orderId);

            if (response.success) {
                this.stopPolling();
                this.redeemCode = response.data.redeemCode;
                this.status = 'success';
                this.rerender();
                window.showToast('模拟支付成功！', 'success');

                // 支付成功后自动跳转到解读页面
                this.navigateToInterpret();
            }
        } catch (error) {
            window.showToast(error.message || '模拟支付失败', 'error');
        }
    }

    /**
     * 支付成功后自动跳转到解读页面
     * 根据测试方法（tarot/birthday）跳转到对应的解读加载页
     */
    navigateToInterpret() {
        const currentTest = window.appState?.get?.('currentTest');
        const method = currentTest?.method;
        const typeId = this.testType;

        // 保存核销码到状态
        if (this.redeemCode) {
            window.appState.set('redeemCode', this.redeemCode);
        }

        // 延迟1.5秒跳转，让用户看到支付成功提示
        setTimeout(() => {
            if (method === 'birthday') {
                // 生日匹配：跳转到结果页，由结果页调用分析接口
                window.router.navigate(`/result/birthday`);
            } else {
                // 塔罗/六爻：跳转到解读加载页，由加载页调用解读接口
                const question = window.appState?.get?.('tarotQuestion')
                    || window.appState?.get?.('selectedQuestion')
                    || currentTest?.question
                    || '综合分析';
                window.router.navigate(`/test/${typeId}/tarot/result-loading?question=${encodeURIComponent(question)}`);
            }
        }, 1500);
    }

    copyRedeemCode() {
        if (this.redeemCode) {
            navigator.clipboard.writeText(this.redeemCode).then(() => {
                window.showToast('核销码已复制！', 'success');
            }).catch(() => {
                window.showToast('复制失败，请手动复制');
            });
        }
    }

    cleanup() {
        this.stopPolling();
    }

    rerender() {
        const container = document.getElementById('app');
        container.innerHTML = this.render();
        this.attachEvents();
    }
}

export default PaymentPage;
