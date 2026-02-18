/**
 * 支付确认页
 * 类似支付宝提交订单页面
 * 显示商品信息、数量、总计、支付方式，点击"去支付"发起支付
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar } from '../components/Common.js';
import { paymentApi } from '../services/api.js';

export class PaymentConfirmPage {
    constructor(params) {
        this.testType = params.type;
        this.matchType = getMatchTypeById(this.testType);

        if (!this.matchType) {
            window.router.navigate('/');
            return;
        }

        this.quantity = 1;
        this.discountPrice = 19.9;
        this.originalPrice = this.matchType.price || 29.9;
        this.paymentMethod = 'alipay';
        this.isSubmitting = false;
        this.status = 'confirming'; // confirming, paying, success
        this.orderId = null;
        this.qrCodeData = null;
        this.redeemCode = null;
        this.pollingTimer = null;
    }

    get totalPrice() {
        return (this.discountPrice * this.quantity).toFixed(2);
    }

    render() {
        if (!this.matchType) return '';

        if (this.status === 'paying') return this.renderPaying();
        if (this.status === 'success') return this.renderSuccess();

        return this.renderConfirm();
    }

    renderConfirm() {
        return `
      <div class="page payment-confirm-page">
        ${Navbar({
            title: '提交订单',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}

        <main class="page-content">
          <div class="app-container">

            <!-- 商品信息 -->
            <section class="confirm-product-section animate-fade-in-up">
              <div class="glass-card">
                <div class="confirm-product-row">
                  <div class="confirm-product-icon">${this.matchType.icon}</div>
                  <div class="confirm-product-info">
                    <h3 class="confirm-product-name">${this.matchType.title} · 性格分析</h3>
                    <p class="confirm-product-desc">${this.matchType.description}</p>
                    <div class="confirm-product-tags">
                      ${(this.matchType.features || []).slice(0, 2).map(f => `<span class="confirm-tag">${f}</span>`).join('')}
                    </div>
                  </div>
                  <div class="confirm-product-price">
                    <span class="confirm-price-current">¥${this.discountPrice}</span>
                    <span class="confirm-price-original">¥${this.originalPrice}</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- 总计 -->
            <section class="confirm-total-section animate-fade-in-up animate-delay-100">
              <div class="glass-card">
                <div class="confirm-row">
                  <span class="confirm-row-label">总计：</span>
                  <span class="confirm-total-price">¥ ${this.totalPrice}</span>
                </div>
              </div>
            </section>

            <!-- 优惠信息 -->
            <section class="confirm-discount-section animate-fade-in-up animate-delay-200">
              <div class="glass-card">
                <div class="confirm-row">
                  <span class="confirm-row-label">优惠券：</span>
                  <span class="confirm-row-value">限时优惠已折扣</span>
                </div>
                <div class="confirm-row">
                  <span class="confirm-row-label">已优惠：</span>
                  <span class="confirm-discount-amount">-¥${((this.originalPrice - this.discountPrice) * this.quantity).toFixed(2)}</span>
                </div>
              </div>
            </section>

            <!-- 支付方式 -->
            <section class="confirm-payment-section animate-fade-in-up animate-delay-200">
              <div class="glass-card">
                <div class="confirm-row confirm-payment-method" data-method="alipay">
                  <div class="confirm-method-left">
                    <span class="confirm-method-icon confirm-method-icon--alipay">支</span>
                    <span class="confirm-method-name">支付宝</span>
                  </div>
                  <span class="confirm-method-check ${this.paymentMethod === 'alipay' ? 'active' : ''}">✓</span>
                </div>
              </div>
            </section>

            <!-- 服务说明 -->
            <section class="confirm-notice-section animate-fade-in-up animate-delay-300">
              <div class="glass-card glass-card--light">
                <div class="confirm-notice-header">
                  <span>💡</span>
                  <span>温馨提示</span>
                </div>
                <ul class="confirm-notice-list">
                  <li>支付成功后将立即为您生成分析报告</li>
                  <li>分析报告可在历史记录中永久查看</li>
                  <li>如有问题请联系在线客服</li>
                </ul>
              </div>
            </section>

          </div>
        </main>

        <!-- 底部支付栏 -->
        <div class="confirm-bottom-bar safe-area-bottom">
          <div class="confirm-bottom-left">
            <span class="confirm-bottom-label">还需支付：</span>
            <span class="confirm-bottom-price-symbol">¥</span>
            <span class="confirm-bottom-price-amount" id="confirmTotalAmount">${this.totalPrice}</span>
          </div>
          <button class="confirm-pay-btn" data-action="pay">
            立即支付
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

        // 去支付
        const payBtn = document.querySelector('[data-action="pay"]');
        if (payBtn) {
            payBtn.addEventListener('click', () => this.handlePay());
        }
    }

    async handlePay() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        const payBtn = document.querySelector('[data-action="pay"]');
        if (payBtn) {
            payBtn.disabled = true;
            payBtn.textContent = '正在创建订单...';
        }

        try {
            window.showToast('正在创建订单...');

            const response = await paymentApi.createOrder({
                productId: 'test-standard',
                paymentMethod: this.paymentMethod,
                testType: this.testType,
                quantity: this.quantity,
                amount: this.totalPrice
            });

            if (response.success) {
                // 支付成功后跳转到支付页的二维码扫码流程
                window.appState.set('paymentOrder', {
                    orderId: response.data.orderId,
                    qrCode: response.data.qrCode,
                    amount: this.totalPrice,
                    testType: this.testType
                });
                window.router.navigate(`/pay/${this.testType}`);
            }
        } catch (error) {
            window.showToast(error.message || '创建订单失败，请重试', 'error');
            this.isSubmitting = false;
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.textContent = '去支付';
            }
        }
    }

    rerender() {
        const container = document.getElementById('app');
        container.innerHTML = this.render();
        this.attachEvents();
    }
}

export default PaymentConfirmPage;
