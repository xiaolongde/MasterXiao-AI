/**
 * 匹配游戏 主入口文件
 * 初始化应用、路由和全局功能
 */

// ==================== 时间格式化工具 ====================
function getTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

// 导入样式
import './styles/main.css';

// 导入核心模块
import router from './scripts/router.js';
import state from './scripts/state.js';
import { configApi } from './services/api.js';

// 导入页面
import {
  HomePage,
  TopicListPage,
  XHSLandingPage,
  XHSTestPage,
  AuthPage,
  TestSelectPage,
  BirthdayInputPage,
  TarotPage,
  TarotTabooPage,
  TarotPrinciplePage,
  TarotShufflePage,
  TarotPickPage,
  TarotCardSelectionPage,
  TarotResultLoadingPage,
  TarotResultPage,
  ResultPage,
  PaymentPage,
  ProductPage,
  DivinationResultPage,
  HistoryPage,
  HistoryDetailPage,
  ProfilePage
} from './pages/index.js';

/**
 * 初始化应用
 */
function initApp() {
  console.log(`[${getTimestamp()}] ✨ 匹配游戏启动中...`);

  // 初始化 Session
  initializeSession();

  // 注册路由
  registerRoutes();

  // 初始化全局功能
  initGlobalFeatures();

  // 获取服务端状态（test模式下跳过登录和购买校验）
  fetchServerState();

  // 启动路由
  router.start();

  console.log(`[${getTimestamp()}] ✨ 匹配游戏启动完成！`);
}

/**
 * 初始化 Session - 确保有 sessionId
 */
function initializeSession() {
  let sessionId = localStorage.getItem('sessionId');

  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() :
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    localStorage.setItem('sessionId', sessionId);
  }

  window.appSession = {
    id: sessionId,
    createdAt: new Date().toISOString()
  };

  console.log(`[${getTimestamp()}] 📋 SessionId: ${sessionId.slice(0, 8)}...`);
}

/**
 * 注册路由
 */
function registerRoutes() {
  router
    .register('/', HomePage)
    .register('/topics', TopicListPage)
    .register('/xhs', XHSLandingPage)
    .register('/xhs/test', XHSTestPage)
    .register('/auth', AuthPage)
    .register('/test/:type', TestSelectPage)
    .register('/test/:type/birthday', BirthdayInputPage)
    .register('/test/:type/tarot', TarotPage)
    .register('/test/:type/tarot/taboo', TarotTabooPage)
    .register('/test/:type/tarot/principle', TarotPrinciplePage)
    .register('/test/:type/tarot/shuffle', TarotShufflePage)
    .register('/test/:type/tarot/pick', TarotPickPage)
    .register('/test/:type/tarot/card-selection', TarotCardSelectionPage)
    .register('/test/:type/tarot/result-loading', TarotResultLoadingPage)
    .register('/test/:type/tarot/result', TarotResultPage)
    .register('/pay/:type', PaymentPage)
    .register('/product/:type', ProductPage)
    .register('/result/:id', ResultPage)
    .register('/divination/result', DivinationResultPage)
    .register('/history', HistoryPage)
    .register('/history/detail/:id', HistoryDetailPage)
    .register('/profile', ProfilePage);
}

/**
 * 获取服务端状态
 */
async function fetchServerState() {
  try {
    const result = await configApi.getServerState();
    if (result.success && result.data) {
      state.set('serverState', result.data.serverState);
      console.log(`[${getTimestamp()}] 🔧 服务端状态: ${result.data.serverState}`);
    }
  } catch (err) {
    console.warn(`[${getTimestamp()}] ⚠️ 获取服务端状态失败:`, err.message);
    state.set('serverState', 'production'); // 默认生产模式
  }
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
