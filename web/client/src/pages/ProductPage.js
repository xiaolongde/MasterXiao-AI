/**
 * 商品/服务页
 * 展示测试服务商品信息、价格
 * 点击"立即支付"直接发起支付流程
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar } from '../components/Common.js';

export class ProductPage {
    constructor(params) {
        this.testType = params.type;
        this.matchType = getMatchTypeById(this.testType);

        if (!this.matchType) {
            window.router.navigate('/');
            return;
        }

        // 模拟已售数量
        this.soldCount = Math.floor(Math.random() * 500) + 200;
        this.discountPrice = 19.9;
        this.originalPrice = this.matchType.price || 29.9;
    }

    render() {
        if (!this.matchType) return '';
        const product = this.matchType;

        return `
      <div class="page product-page">
        ${Navbar({
            title: '服务详情',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}

        <main class="page-content">
          <!-- 商品头图 -->
          <div class="product-hero">
            <div class="product-hero__bg">
              <div class="product-hero__icon">${product.icon}</div>
              <div class="product-hero__badge">限时优惠</div>
            </div>
            <div class="product-hero__overlay">
              <h1 class="product-hero__title">${product.title}</h1>
              <p class="product-hero__subtitle">${product.description}</p>
            </div>
          </div>

          <div class="app-container">
            <!-- 价格区域 -->
            <section class="product-price-section animate-fade-in-up">
              <div class="product-price-card">
                <div class="product-price-row">
                  <div class="product-price-current">
                    <span class="product-price-symbol">¥</span>
                    <span class="product-price-amount">${this.discountPrice}</span>
                  </div>
                  <div class="product-price-original">
                    <span class="product-price-original-label">原价</span>
                    <span class="product-price-original-amount">¥${this.originalPrice}</span>
                  </div>
                  <div class="product-price-tag">限时折扣</div>
                </div>
                <div class="product-price-info">
                  <span class="product-info-item">✅ 虚拟商品未使用可退款</span>
                  <span class="product-info-item">👤 已售 ${this.soldCount}</span>
                </div>
              </div>
            </section>

            <!-- 温馨提示 -->
            <section class="confirm-notice-section animate-fade-in-up animate-delay-100">
              <div class="product-price-card" style="background:rgba(139,127,216,0.06);">
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
        <div class="product-bottom-bar safe-area-bottom">
          <div class="product-bottom-price">
            <span class="product-bottom-symbol">¥</span>
            <span class="product-bottom-amount">${this.discountPrice}</span>
            <span class="product-bottom-original">¥${this.originalPrice}</span>
          </div>
          <button class="product-buy-btn" data-action="buy">
            立即购买
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

        // 立即购买
        const buyBtn = document.querySelector('[data-action="buy"]');
        if (buyBtn) {
            buyBtn.addEventListener('click', () => {
                window.router.navigate(`/pay/${this.testType}`);
            });
        }
    }
}

export default ProductPage;
