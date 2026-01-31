/**
 * MasterXiao-AI 主入口文件
 * 初始化应用和交互
 */

// 导入样式（确保 Vite 能正确处理）
import './styles/main.css';

/**
 * 初始化应用
 */
function initApp() {
  console.log('🔮 MasterXiao-AI 启动中...');
  
  // 初始化动画
  initAnimations();
  
  // 初始化事件监听
  initEventListeners();
  
  console.log('✨ MasterXiao-AI 启动完成！');
}

/**
 * 初始化动画效果
 * 使用 Intersection Observer 实现滚动时触发动画
 */
function initAnimations() {
  const animatedElements = document.querySelectorAll('.animate-hidden');
  
  if (animatedElements.length === 0) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('animate-hidden');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  animatedElements.forEach(el => observer.observe(el));
}

/**
 * 初始化事件监听器
 */
function initEventListeners() {
  // 功能卡片点击
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', handleFeatureCardClick);
  });
  
  // 开始占卜按钮
  const startBtn = document.querySelector('.btn--primary');
  if (startBtn) {
    startBtn.addEventListener('click', handleStartClick);
  }
  
  // 导航按钮
  document.querySelectorAll('.navbar__icon-btn').forEach(btn => {
    btn.addEventListener('click', handleNavClick);
  });
}

/**
 * 处理功能卡片点击
 */
function handleFeatureCardClick(event) {
  const card = event.currentTarget;
  const title = card.querySelector('.feature-card__title')?.textContent;
  
  // 添加点击效果
  card.style.transform = 'scale(0.98)';
  setTimeout(() => {
    card.style.transform = '';
  }, 150);
  
  // TODO: 导航到对应的测试选择页面
  console.log(`📍 点击了: ${title}`);
  showToast(`正在进入 ${title}...`);
}

/**
 * 处理开始占卜按钮点击
 */
function handleStartClick() {
  console.log('🔮 开始占卜');
  showToast('欢迎来到 MasterXiao AI！');
}

/**
 * 处理导航按钮点击
 */
function handleNavClick(event) {
  const btn = event.currentTarget;
  const title = btn.getAttribute('title');
  
  console.log(`🧭 导航: ${title}`);
  showToast(`${title} 功能开发中...`);
}

/**
 * 显示 Toast 提示
 */
function showToast(message, type = 'default') {
  // 移除已存在的 toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 创建新的 toast
  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'default' ? `toast--${type}` : ''}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 触发动画
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });
  
  // 自动隐藏
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// 将 showToast 暴露到全局，方便调试
window.showToast = showToast;

// DOM 加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 导出供其他模块使用
export { showToast };
