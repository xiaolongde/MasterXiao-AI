/**
 * 六爻解析结果页面
 * 只显示通俗版解读结果
 */

import { navigateTo } from '../components/Common.js';

// 页面状态
let pageState = {
    question: '',
    lunarDate: '',
    benGuaInfo: null,
    bianGuaInfo: null,
    hasMovingYao: false,
    movingPositions: [],
    yaos: [],
    aiResponse: '',
    professionalVersion: '',
    simpleVersion: '',
    aiPrompt: '',
    isLoading: false,
    remainingTime: 60,
    progressPercent: 0,
    loadingTip: '正在连接服务器...'
};

// 加载提示语
const loadingTips = [
    '正在分析卦象...',
    '推演六亲关系...',
    '计算世应位置...',
    '解读六神含义...',
    '综合动爻变化...',
    '生成专业解读...',
    '整理通俗版本...',
    '即将完成...'
];

/**
 * 渲染页面
 */
export function render(container, params = {}) {
    // 初始化数据
    initPageData(params);

    // 获取当前日期
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

    container.innerHTML = `
        <div class="divination-result-page">
            <!-- 顶部导航 -->
            <div class="result-navbar">
                <button class="result-navbar__back" id="btn-back">←</button>
                <span class="result-navbar__title">解读结果</span>
            </div>

            <!-- 问题卡片 -->
            <div class="question-card">
                <span class="question-label">匹配事项</span>
                <span class="question-text">${pageState.question || '未知问题'}</span>
                <span class="date-text">${dateStr}</span>
            </div>

            <!-- 加载状态 -->
            ${renderLoadingState()}

            <!-- 解读区域 -->
            ${renderAIResponse()}

            <!-- 免责声明 -->
            <div class="disclaimer">
                仅供娱乐参考，不作为任何决策依据
            </div>

            <!-- 底部按钮 -->
            <div class="bottom-buttons">
                <button class="btn-restart" id="btn-restart">🔄 重新开始</button>
                <button class="btn-share" id="btn-share">📤 分享结果</button>
            </div>
        </div>
    `;

    // 绑定事件
    bindEvents(container);
}

/**
 * 初始化页面数据
 */
function initPageData(params) {
    // 如果有传入参数，使用参数
    if (params.data) {
        const data = params.data;
        pageState.question = data.question || '';
        pageState.aiResponse = data.result || '';
        pageState.professionalVersion = data.professionalVersion || '';
        pageState.simpleVersion = data.simpleVersion || '';
        pageState.aiPrompt = data.aiPrompt || '';
    }

    // 尝试从 localStorage 获取缓存数据
    const cachedResult = localStorage.getItem('divinationResult');
    if (cachedResult && !params.data) {
        try {
            const cached = JSON.parse(cachedResult);
            if (cached.success && cached.data) {
                pageState.aiResponse = cached.data.result || '';
                pageState.professionalVersion = cached.data.professionalVersion || '';
                pageState.simpleVersion = cached.data.simpleVersion || '';
                pageState.aiPrompt = cached.data.aiPrompt || '';
            }
        } catch (e) {
            console.error('解析缓存数据失败:', e);
        }
    }

    // 从 appState 获取问题
    if (!pageState.question && window.appState) {
        pageState.question = window.appState.get?.('tarotQuestion')
            || window.appState.get?.('selectedQuestion')
            || '';
    }

    // 始终尝试从完整响应中提取通俗版（即使 simpleVersion 有值也重新提取，确保准确）
    if (pageState.aiResponse) {
        const extracted = extractSimpleVersion(pageState.aiResponse);
        if (extracted && extracted !== pageState.aiResponse) {
            // 提取成功，使用提取的通俗版
            pageState.simpleVersion = extracted;
        } else if (!pageState.simpleVersion) {
            // 提取失败且没有 simpleVersion，使用完整响应
            pageState.simpleVersion = pageState.aiResponse;
        }
    }

    console.log('[结果页] simpleVersion长度:', pageState.simpleVersion?.length,
        '| aiResponse长度:', pageState.aiResponse?.length,
        '| professionalVersion长度:', pageState.professionalVersion?.length);
}

/**
 * 从完整AI响应中提取通俗版内容
 * 增强版：覆盖各种标题格式
 */
function extractSimpleVersion(fullText) {
    if (!fullText) return '';

    // 第一步：尝试精确提取"通俗版"之后的内容（排除"专业版"部分）
    const patterns = [
        // ### 二、通俗版解读 ... (到文末)
        /#{1,4}\s*二[、．.]\s*通俗版解读\s*([\s\S]*?)$/i,
        // 二、通俗版解读 ... (到文末)
        /二[、．.]\s*通俗版解读\s*([\s\S]*?)$/i,
        // 【通俗版解读】 ... (到文末)
        /【通俗版[^】]*】\s*([\s\S]*?)$/i,
        // 通俗版解读 ... (到文末)  
        /通俗版解读\s*([\s\S]*?)$/i,
        // 通俗版 ... (到文末)
        /通俗版\s*([\s\S]*?)$/i,
    ];

    for (const pattern of patterns) {
        const match = fullText.match(pattern);
        if (match && match[1] && match[1].trim().length > 50) {
            return match[1].trim();
        }
    }

    // 第二步：如果有"专业版"标记，尝试去掉专业版部分
    const proPatterns = [
        // 去掉从开头到"二、通俗版"之前的内容（即专业版部分）
        /[\s\S]*?(?=#{0,4}\s*二[、．.]\s*通俗版)/i,
        // 去掉从 "一、专业版解读" 到 "二、通俗版解读" 之间的内容
        /#{0,4}\s*一[、．.]\s*专业版解读[\s\S]*?(?=#{0,4}\s*二[、．.]\s*通俗版解读)/i,
    ];

    for (const pattern of proPatterns) {
        const cleaned = fullText.replace(pattern, '').trim();
        if (cleaned.length > 50 && cleaned.length < fullText.length) {
            // 再去掉通俗版标题本身
            return cleaned
                .replace(/^#{1,4}\s*二[、．.]\s*通俗版解读\s*/m, '')
                .replace(/^通俗版解读\s*/m, '')
                .trim();
        }
    }

    // 第三步：如果完整内容包含"专业版"字样，说明混在一起了，取后半部分
    if (fullText.includes('专业版解读') && fullText.includes('通俗版解读')) {
        const idx = fullText.indexOf('通俗版解读');
        if (idx > 0) {
            let simple = fullText.substring(idx + '通俗版解读'.length).trim();
            if (simple.length > 50) {
                return simple;
            }
        }
    }

    // 无法提取，返回空（由调用者决定 fallback）
    return '';
}

/**
 * 渲染加载状态
 */
function renderLoadingState() {
    if (!pageState.isLoading) {
        return '';
    }

    return `
        <div class="loading-overlay">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span class="loading-title">师傅正在推算中...</span>
                <span class="loading-hint">预计需要 ${pageState.remainingTime} 秒</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${pageState.progressPercent}%"></div>
                </div>
                <span class="loading-tip">${pageState.loadingTip}</span>
            </div>
        </div>
    `;
}

/**
 * 渲染AI响应 - 只显示通俗版
 */
function renderAIResponse() {
    // 只使用 simpleVersion
    const content = pageState.simpleVersion;

    if (!content) {
        return `
            <div class="no-response">
                <p>暂无解读结果</p>
                <button class="btn-ai" id="btn-ask-ai">🔮 开始解读</button>
            </div>
        `;
    }

    return `
        <div class="ai-response">
            <div class="version-section simple">
                <div class="response-title">💡 解读</div>
                <div class="response-content">${formatContent(content)}</div>
            </div>

            <!-- 咨询入口 -->
            <div class="consult-section">
                <div class="consult-title">💬 有疑惑？欢迎咨询</div>
                <p class="consult-tip">如需进一步解读，请联系专业顾问</p>
            </div>
        </div>
    `;
}

/**
 * 格式化内容（将markdown转为HTML）
 */
function formatContent(content) {
    if (!content) return '';

    let html = escapeHtml(content);

    // 去掉所有版本标题行
    html = html.replace(/^[#\s]*[一二三四五六七八九十]*[、．.]\s*通俗版解读\s*/gm, '');
    html = html.replace(/^[#\s]*通俗版解读\s*/gm, '');
    html = html.replace(/^[#\s]*[一二三四五六七八九十]*[、．.]\s*专业版解读\s*/gm, '');
    html = html.replace(/^[#\s]*专业版解读\s*/gm, '');

    // 转换标题
    html = html.replace(/### (.+)/g, '<h4>$1</h4>');
    html = html.replace(/## (.+)/g, '<h3>$1</h3>');
    html = html.replace(/# (.+)/g, '<h2>$1</h2>');

    // 转换加粗
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 转换列表
    html = html.replace(/^\* (.+)/gm, '<li>$1</li>');
    html = html.replace(/^- (.+)/gm, '<li>$1</li>');
    html = html.replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>');

    // 转换分隔线
    html = html.replace(/^---$/gm, '<hr>');

    // 转换换行
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
}

/**
 * HTML转义
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 绑定事件
 */
function bindEvents(container) {
    // 返回按钮
    const backBtn = container.querySelector('#btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    // 重新开始
    const restartBtn = container.querySelector('#btn-restart');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (confirm('确定要重新开始吗？')) {
                localStorage.removeItem('divinationResult');
                navigateTo('home');
            }
        });
    }

    // 分享结果
    const shareBtn = container.querySelector('#btn-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            shareResult();
        });
    }

    // 开始解读按钮
    const askAiBtn = container.querySelector('#btn-ask-ai');
    if (askAiBtn) {
        askAiBtn.addEventListener('click', () => {
            startDivination(container);
        });
    }
}

/**
 * 分享结果
 */
function shareResult() {
    const content = pageState.simpleVersion || pageState.aiResponse;
    const shareText = `🔮 解读结果\n\n问：${pageState.question}\n\n${content}`;

    if (navigator.share) {
        navigator.share({
            title: '解读结果',
            text: shareText
        }).catch(err => {
            console.log('分享取消:', err);
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

/**
 * 复制到剪贴板
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('结果已复制到剪贴板，可以粘贴分享');
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

/**
 * 开始解卦
 */
async function startDivination(container) {
    pageState.isLoading = true;
    pageState.progressPercent = 0;
    pageState.remainingTime = 60;

    const updateLoading = () => {
        if (!pageState.isLoading) return;

        pageState.remainingTime = Math.max(0, pageState.remainingTime - 1);
        pageState.progressPercent = Math.min(95, pageState.progressPercent + 1.5);
        pageState.loadingTip = loadingTips[Math.floor(pageState.progressPercent / 12)] || loadingTips[0];

        render(container, { data: pageState });

        if (pageState.isLoading) {
            setTimeout(updateLoading, 1000);
        }
    };

    render(container, { data: pageState });
    setTimeout(updateLoading, 1000);

    try {
        pageState.isLoading = false;
        pageState.progressPercent = 100;
        render(container, { data: pageState });
    } catch (error) {
        console.error('解卦失败:', error);
        pageState.isLoading = false;
        alert('解卦失败，请重试');
        render(container, { data: pageState });
    }
}

export default { render };

/**
 * 页面渲染器（用于路由系统）
 */
export function DivinationResultPage(container, params = {}) {
    return render(container, params);
}
