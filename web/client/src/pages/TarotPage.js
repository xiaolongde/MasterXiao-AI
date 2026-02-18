/**
 * 直觉卡牌 问题选择页
 * 选择问题类型和具体问题
 * 参数流程参考 MasterChenAI-mp 小程序的"问问"页面
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar, ProgressBar } from '../components/Common.js';

// ==================== 问题分类与问题列表（与小程序保持一致）====================

// 问题分类列表（与小程序 CATEGORIES 一致）
const CATEGORIES = ['综合', '健康类', '事业类', '财运类', '感情类', '投资类', '学业类', '其他类'];

// 分类对应的问题列表（与小程序 CATEGORY_QUESTIONS 一致）
const CATEGORY_QUESTIONS = {
  '健康类': [
    '疾病什么时候能痊愈',
    '明年身体健康状况',
    '什么时候能怀孕',
    '亲人病了，这个病能好吗',
    '这个病适合保守治疗还是做手术',
    '这个病最长还能活多久'
  ],
  '事业类': [
    '升职机遇',
    '现在适合创业吗',
    '现在适合换工作吗',
    '怎么选择工作方向',
    '跟人合作是否有利',
    '投资新生意是否有利',
    '入职新公司是否有利',
    '我能顺利通过面试吗',
    '单位有人故意为难怎么办',
    '目前推进的项目会顺利吗',
    '未来三个月，我会遇到新的工作机会吗',
    '现在面试的公司怎么选择'
  ],
  '财运类': [
    '最近三个月财运怎么样',
    '未来一年财运怎样',
    '什么时候有财运'
  ],
  '感情类': [
    '明年桃花运怎么样',
    '算和TA是否合适在一起',
    '最近会不会遇到烂桃花',
    '我和TA会走到一起吗',
    '我和TA感情不好，是不是不适合',
    '我和TA2026年是不是感情会更好',
    '下一次遇到正缘是什么时候',
    'A和B哪个更适合在一起',
    '要谈几个男/女朋友才会遇到适合结婚的人',
    '未来三个月，我是否会遇到新的桃花',
    '我和TA异地恋，会有结果吗',
    '现在遇到的人会是我的正缘吗',
    '我和TA能复合吗',
    '家人反对该怎么办'
  ],
  '投资类': [
    '近一个月A股走势',
    '近期适不适合投资',
    '什么时候投资有财运',
    '某只股票近一个月走势',
    '某行业能投资吗'
  ],
  '学业类': [
    '本次考试能否顺利',
    '适合学什么专业',
    '适合考哪里的大学',
    '能否考上重点学校',
    '适合往哪个方向发展',
    '小孩学习不好，怎么办',
    '应该选文科还是理科',
    '适合什么类型课外兴趣班',
    '学校A和学校B去哪个更好'
  ],
  '综合': [
    '明天会怎么样',
    '明年事业、财运',
    '明年整体情况',
    '2026年会不会发财',
    '2026年会不会遇到合适的人',
    '最近特别不顺该怎么办',
    '下周会怎么样'
  ],
  '其他类': [
    '明天适合出远门吗（确定位置的地方）',
    '近期哪天适合出远门（确定位置的地方）',
    '近期哪天去办事比较顺利（确定某一件事）',
    '明天穿什么颜色衣服会有好运',
    '近期我如何处理和家人的关系',
    '怎么避小人',
    '适合住哪个位置的房子/A和B小区，哪个更适合'
  ]
};

// 问题分类与规则类型的映射（与小程序 CATEGORY_RULE_MAP 一致）
const CATEGORY_RULE_MAP = {
  '综合': 'nianyun',
  '健康类': 'jiankang',
  '事业类': 'shiye',
  '财运类': 'caiyun',
  '感情类': 'ganqing',
  '投资类': 'gushi',
  '学业类': 'shengxue',
  '其他类': 'qita'
};

// 自由输入选项的标识
const FREE_INPUT_OPTION = '以上问题均不符合，自由问题输入';

// 分类图标映射
const CATEGORY_ICONS = {
  '综合': '🌟',
  '健康类': '💪',
  '事业类': '📈',
  '财运类': '💰',
  '感情类': '❤️',
  '投资类': '📊',
  '学业类': '📚',
  '其他类': '✨'
};

/**
 * 根据问题分类获取对应的规则类型
 */
function getRuleTypeByCategory(categoryName) {
  return CATEGORY_RULE_MAP[categoryName] || 'nianyun';
}

/**
 * 获取当前分类下的问题列表
 */
function getQuestionsWithFreeInput(categoryName) {
  const questions = CATEGORY_QUESTIONS[categoryName] || [];
  return questions;
}

export class TarotPage {
    constructor(params) {
        this.matchType = getMatchTypeById(params.type);
        
        // 参数命名与小程序保持一致
        this.selectedCategoryIndex = 0;  // 选中的分类索引
        this.categories = CATEGORIES;     // 分类列表
        this.categoryQuestions = CATEGORY_QUESTIONS; // 分类对应的问题
        this.categoryRuleMap = CATEGORY_RULE_MAP;    // 分类映射到规则类型
        
        this.currentQuestions = [];       // 当前分类下的问题列表（包含自由输入选项）
        this.selectedQuestionIndex = -1;  // 选中的问题索引
        this.selectedQuestion = '';       // 最终选定的问题
        this.showFreeInput = false;       // 是否显示自由输入框
        this.freeInputQuestion = '';      // 自由输入的问题内容
        
        // 小程序参数（将保存到全局）
        this.questionCategory = '';       // 问题分类名称
        this.questionType = '';           // 规则类型（ruleType）
        
        this.showGenderModal = false;     // 是否显示性别选择弹框
        this.selectedGender = null;       // 选择的性别 'male' | 'female'
        
        if (!this.matchType) {
            window.router.navigate('/');
            return;
        }
        
        // 初始化问题列表
        this.updateQuestionList(this.selectedCategoryIndex);
    }

    /**
     * 更新问题列表
     * 与小程序 updateQuestionList 方法一致
     */
    updateQuestionList(categoryIndex) {
        const category = this.categories[categoryIndex];
        const questions = this.categoryQuestions[category] || [];
        // 不添加自由输入选项
        this.currentQuestions = questions;
        
        this.selectedQuestionIndex = -1;
        this.selectedQuestion = '';
        this.showFreeInput = false;
        this.freeInputQuestion = '';
    }

    /**
     * 保存问题信息到全局
     * 与小程序 saveQuestionToGlobal 方法一致
     */
    saveQuestionToGlobal(question) {
        const categoryIndex = this.selectedCategoryIndex;
        const categoryName = this.categories[categoryIndex];
        const ruleType = this.categoryRuleMap[categoryName] || 'nianyun';
        
        // 更新实例属性
        this.selectedQuestion = question;
        this.questionCategory = categoryName;
        this.questionType = ruleType;
        
        // 保存到全局状态（与小程序 app.globalData 对应）
        if (window.appState) {
            window.appState.set('selectedQuestion', question);
            window.appState.set('questionCategory', categoryName);
            window.appState.set('questionType', ruleType);
        }
        
        console.log('[问事] 选择问题:', question);
        console.log('[问事] 问题分类:', categoryName);
        console.log('[问事] 规则类型:', ruleType);
    }

    render() {
        if (!this.matchType) return '';

        return `
      <div class="page tarot-question-page">
        ${Navbar({
            title: '',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            
            <!-- 进度指示器 -->
            <div class="tarot-progress">
              ${ProgressBar(1, 5, {
                  showText: false,
                  showSteps: true,
                  stepLabel: ''
              })}
            </div>

            <!-- 页面标题 -->
            <section class="question-header animate-fade-in-up">
              <h1 class="question-title">你想问什么呢？</h1>
              <p class="question-subtitle">无论大小，任何问题都可以</p>
            </section>

            <!-- 分类标签 -->
            <section class="category-tags animate-fade-in-up animate-delay-100">
              ${this.categories.map((cat, index) => `
                <button class="category-tag ${index === this.selectedCategoryIndex ? 'active' : ''}" 
                        data-category-index="${index}">
                  ${cat}
                </button>
              `).join('')}
            </section>

            <!-- 问题列表 -->
            <section class="question-list animate-fade-in-up animate-delay-200">
              ${this.renderQuestionList()}
            </section>

            <!-- 性别选择弹框 -->
            <div class="gender-modal ${this.showGenderModal ? 'show' : ''}" id="genderModal">
              <div class="gender-modal__overlay"></div>
              <div class="gender-modal__content">
                <h3 class="gender-modal__title">请确认您的性别</h3>
                <p class="gender-modal__subtitle">性别信息将帮助更准确解读结果</p>
                <div class="gender-modal__options">
                  <div class="gender-option ${this.selectedGender === 'male' ? 'selected' : ''}" data-gender="male">
                    <div class="gender-option__avatar gender-option__avatar--male">
                      <span class="gender-avatar-icon">👨</span>
                    </div>
                    <span class="gender-option__label">男</span>
                  </div>
                  <div class="gender-option ${this.selectedGender === 'female' ? 'selected' : ''}" data-gender="female">
                    <div class="gender-option__avatar gender-option__avatar--female">
                      <span class="gender-avatar-icon">👩</span>
                    </div>
                    <span class="gender-option__label">女</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部按钮区域 -->
            <section class="question-footer animate-fade-in-up animate-delay-400">
              <button class="btn btn--primary btn--full btn--lg submit-btn ${!this.selectedQuestion && !this.freeInputQuestion ? 'disabled' : ''}" 
                      ${!this.selectedQuestion && !this.freeInputQuestion ? 'disabled' : ''}
                      id="submitBtn">
                ${this.getSubmitButtonText()}
              </button>
              <p class="disclaimer">仅供娱乐参考，不作为任何决策依据</p>
            </section>

            <div class="safe-area-bottom"></div>
          </div>
        </main>
      </div>
    `;
    }

    renderQuestionList() {
        return this.currentQuestions.map((q, index) => {
            const isSelected = this.selectedQuestionIndex === index;
            return `
              <div class="question-item ${isSelected ? 'selected' : ''}" 
                   data-question-index="${index}">
                <span class="question-text">${q}</span>
                ${isSelected ? '<span class="question-check">✓</span>' : ''}
              </div>
            `;
        }).join('');
    }

    attachEvents() {
        // 返回按钮
        const backBtn = document.querySelector('.navbar__back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.router.back();
            });
        }

        // 分类标签点击
        document.querySelectorAll('.category-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const index = parseInt(tag.dataset.categoryIndex);
                this.onCategoryChange(index);
            });
        });

        // 问题选择
        this.attachQuestionEvents();

        // 提交按钮
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.handleSubmit();
            });
        }

        // 性别选择弹框事件
        this.attachGenderModalEvents();
    }

    attachGenderModalEvents() {
        // 性别选项点击
        document.querySelectorAll('.gender-option').forEach(option => {
            option.addEventListener('click', () => {
                const gender = option.dataset.gender;
                this.handleGenderSelect(gender);
            });
        });

        // 点击遮罩关闭弹框
        const overlay = document.querySelector('.gender-modal__overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hideGenderModal();
            });
        }
    }

    attachQuestionEvents() {
        document.querySelectorAll('.question-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.questionIndex);
                this.onQuestionChange(index);
            });
        });
    }

    /**
     * 选择分类
     * 与小程序 onCategoryChange 方法一致
     */
    onCategoryChange(index) {
        this.selectedCategoryIndex = index;
        this.updateQuestionList(index);

        // 更新分类标签样式
        document.querySelectorAll('.category-tag').forEach((tag, i) => {
            tag.classList.toggle('active', i === index);
        });

        // 更新问题列表
        this.updateQuestionListUI();

        // 更新提交按钮
        this.updateSubmitButton();
    }

    /**
     * 选择问题
     * 与小程序 onQuestionChange 方法一致
     */
    onQuestionChange(index) {
        const question = this.currentQuestions[index];
        
        this.selectedQuestionIndex = index;
        this.selectedQuestion = question;
        this.freeInputQuestion = '';
        // 保存问题信息到全局
        this.saveQuestionToGlobal(question);

        // 更新问题列表样式
        document.querySelectorAll('.question-item').forEach((item, i) => {
            const isSelected = i === index;
            item.classList.toggle('selected', isSelected);
            
            // 更新勾选标记
            let checkMark = item.querySelector('.question-check');
            if (isSelected && !checkMark) {
                checkMark = document.createElement('span');
                checkMark.className = 'question-check';
                checkMark.textContent = '✓';
                item.appendChild(checkMark);
            } else if (!isSelected && checkMark) {
                checkMark.remove();
            }
        });

        // 更新提交按钮
        this.updateSubmitButton();
    }

    /**
     * 更新问题列表UI
     */
    updateQuestionListUI() {
        const listContainer = document.querySelector('.question-list');
        if (listContainer) {
            listContainer.innerHTML = this.renderQuestionList();
            this.attachQuestionEvents();
        }
    }

    handleSubmit() {
        const question = this.selectedQuestion;
        if (!question || !question.trim()) {
            window.showToast('请先选择问题', 'error');
            return;
        }

        // 如果弹框已显示且已选择性别，则提交
        if (this.showGenderModal && this.selectedGender) {
            this.submitWithGender();
            return;
        }

        // 显示性别选择弹框
        this.showGenderModalFn();
    }

    showGenderModalFn() {
        this.showGenderModal = true;
        const modal = document.getElementById('genderModal');
        if (modal) {
            modal.classList.add('show');
        }
        this.updateSubmitButton();
    }

    hideGenderModal() {
        this.showGenderModal = false;
        this.selectedGender = null;
        const modal = document.getElementById('genderModal');
        if (modal) {
            modal.classList.remove('show');
        }
        // 更新性别选项样式
        document.querySelectorAll('.gender-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        this.updateSubmitButton();
    }

    handleGenderSelect(gender) {
        this.selectedGender = gender;
        
        // 更新性别选项样式
        document.querySelectorAll('.gender-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.gender === gender);
        });

        // 选择性别后延迟500ms自动提交
        setTimeout(() => {
            this.submitWithGender();
        }, 500);
    }

    getSubmitButtonText() {
        const hasQuestion = this.selectedQuestion;
        if (!hasQuestion) {
            return '请选择问题';
        }
        return '下一步';
    }

    updateSubmitButton() {
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            const hasQuestion = this.selectedQuestion;
            const canSubmit = this.showGenderModal ? (hasQuestion && this.selectedGender) : hasQuestion;
            submitBtn.disabled = !canSubmit;
            submitBtn.classList.toggle('disabled', !canSubmit);
            submitBtn.textContent = this.getSubmitButtonText();
        }
    }

    submitWithGender() {
        const question = this.selectedQuestion;
        
        // 确保全局数据已保存（与小程序 saveQuestionToGlobal 对应）
        this.saveQuestionToGlobal(question.trim());

        // 保存到全局状态（与小程序 app.globalData 对应）
        if (window.appState) {
            // 保留原有的命名以兼容
            window.appState.set('tarotQuestion', question);
            window.appState.set('tarotCategory', this.categories[this.selectedCategoryIndex]);
            window.appState.set('tarotGender', this.selectedGender);
            
            // 新增与小程序一致的参数命名
            window.appState.set('selectedQuestion', question);
            window.appState.set('questionCategory', this.questionCategory);
            window.appState.set('questionType', this.questionType);
        }

        // 记录日志
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        console.log(`[${timestamp}] 提交: 问题=${question}, 分类=${this.questionCategory}, 规则类型=${this.questionType}, 性别=${this.selectedGender}`);

        // 跳转到洗牌页面
        window.router.navigate(`/test/${this.matchType.id}/tarot/shuffle`);
    }
}

export default TarotPage;
