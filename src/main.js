/**
 * MasterXiao-AI 主入口文件
 * 初始化应用、路由和全局功能
 */

// 导入样式
import './styles/main.css';

// 导入核心模块
import router from './scripts/router.js';
import state from './scripts/state.js';

// 导入页面
import {
  HomePage,
  TestSelectPage,
  BirthdayInputPage,
  TarotPage,
  ResultPage,
  PaymentPage
} from './pages/index.js';

/**
 * 初始化应用
 */
function initApp() {
  console.log('🔮 MasterXiao-AI 启动中...');

  // 注册路由
  registerRoutes();

  // 初始化全局功能
  initGlobalFeatures();

  // 启动路由
  router.start();

  console.log('✨ MasterXiao-AI 启动完成！');
}

/**
 * 注册路由
 */
function registerRoutes() {
  router
    .register('/', HomePage)
    .register('/test/:type', TestSelectPage)
    .register('/test/:type/birthday', BirthdayInputPage)
    .register('/test/:type/tarot', TarotPage)
    .register('/pay/:type', PaymentPage)
    .register('/result/:id', ResultPage);
}

/**
 * 初始化全局功能
 */
function initGlobalFeatures() {
  // Toast 提示功能
  window.showToast = showToast;

  // 全局状态
  window.appState = state;

  // 全局路由
  window.router = router;

  // 阻止 iOS 橡皮筋效果
  document.body.addEventListener('touchmove', function (e) {
    if (e.target.closest('.page-content')) {
      return;
    }
    e.preventDefault();
  }, { passive: false });
}

/**
 * 显示 Toast 提示
 * @param {string} message - 提示信息
 * @param {string} type - 类型: 'default' | 'success' | 'error'
 * @param {number} duration - 持续时间（毫秒）
 */
function showToast(message, type = 'default', duration = 2500) {
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
  }, duration);
}

// DOM 加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 导出供调试使用
export { showToast, router, state };
