/**
 * 塔罗解读结果页
 * 展示通俗解读结果，支持保存为长图
 */
import { Navbar } from '../components/Common.js';
import { getMatchTypeById } from '../data/matchTypes.js';
import html2canvas from 'html2canvas';

export class TarotResultPage {
    constructor(params) {
        this.matchType = getMatchTypeById(params.type);
        this.resultData = window.appState.tarotInterpretResult || null;
        
        if (!this.matchType || !this.resultData) {
            window.router.navigate('/');
            return;
        }
    }

    render() {
        if (!this.resultData) return '';

        const { question, simpleVersion, lunarDate } = this.resultData;

        return `
      <div class="page tarot-result-page">
        ${Navbar({
            title: '解读结果',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            
            <!-- 可截图区域 -->
            <div id="resultCaptureArea">
              <!-- 问题卡片 -->
              <section class="result-question-card animate-fade-in-up">
                <div class="result-question-label">匹配事项</div>
                <div class="result-question-title">${question}</div>
                ${lunarDate ? `<div class="result-question-date">${lunarDate}</div>` : ''}
              </section>

              <!-- 解读内容卡片 -->
              <section class="result-interpretation-card animate-fade-in-up animate-delay-50">
                <div class="result-interpretation-header">
                  <span class="result-interpretation-icon">💡</span>
                  <span class="result-interpretation-title">解读</span>
                </div>
                
                <div class="result-interpretation-content" id="resultContent">
                  ${this.formatContent(simpleVersion)}
                </div>
              </section>

              <div class="result-disclaimer">
                仅供娱乐参考，不作为任何决策依据
              </div>
            </div>

            <!-- 按钮栏（内嵌在内容区） -->
            <div class="result-bottom-bar">
              <button class="result-bottom-btn result-bottom-btn--restart" id="btnRestart">
                <span class="result-bottom-btn-icon">🏠</span>
                <span>回到首页</span>
              </button>
              <button class="result-bottom-btn result-bottom-btn--save" id="btnSave">
                <span class="result-bottom-btn-icon">💾</span>
                <span>保存</span>
              </button>
            </div>

            <div class="safe-area-bottom"></div>
          </div>
        </main>
      </div>
    `;
    }

    formatContent(content) {
        if (!content) return '<p>暂无解读内容</p>';
        // 将换行符转换为段落，并处理 Markdown 加粗语法
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                // 处理 **加粗** 语法
                const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                return `<p>${formatted}</p>`;
            })
            .join('');
    }

    attachEvents() {
        // 返回按钮
        const backBtn = document.querySelector('.navbar__back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.router.navigate('/');
            });
        }

        // 重新开始按钮
        const btnRestart = document.getElementById('btnRestart');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => {
                // 清除状态
                delete window.appState.tarotInterpretResult;
                delete window.appState.divinationResult;
                window.appState.set && window.appState.set('selectedCards', null);
                window.appState.set && window.appState.set('yaos', null);
                window.appState.set && window.appState.set('guaData', null);
                window.router.navigate('/');
            });
        }

        // 保存按钮
        const btnSave = document.getElementById('btnSave');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                this.handleSaveImage();
            });
        }
    }

    async handleSaveImage() {
        const captureArea = document.getElementById('resultCaptureArea');
        if (!captureArea) {
            window.showToast('保存失败', 'error');
            return;
        }

        const btnSave = document.getElementById('btnSave');
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.querySelector('span:last-child').textContent = '保存中...';
        }

        try {
            // 添加简化样式类（只保留结构、背景色、字体、卡片框）
            captureArea.classList.add('capture-mode');
            
            // 等待样式应用
            await new Promise(resolve => setTimeout(resolve, 50));

            const canvas = await html2canvas(captureArea, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: captureArea.scrollWidth,
                windowHeight: captureArea.scrollHeight,
            });

            // 移除简化样式类
            captureArea.classList.remove('capture-mode');

            // 创建下载链接
            const link = document.createElement('a');
            link.download = `塔罗解读_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.showToast('图片已保存', 'success');
        } catch (err) {
            console.error('保存图片失败:', err);
            window.showToast('保存失败，请重试', 'error');
            // 确保出错时也移除样式类
            captureArea.classList.remove('capture-mode');
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.querySelector('span:last-child').textContent = '保存';
            }
        }
    }
}

export default TarotResultPage;
