/**
 * 匹配游戏 生日输入页
 * 输入双方生日进行生日特质匹配
 */

import { getMatchTypeById } from '../data/matchTypes.js';
import { Navbar, ProgressBar, BottomActionBar } from '../components/Common.js';
import { formatLunarDate } from '../scripts/lunar.js';
import { getSessionId } from '../scripts/state.js';
import { matchRecordApi } from '../services/api.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Mandarin } from 'flatpickr/dist/l10n/zh.js';

export class BirthdayInputPage {
    constructor(params) {
        this.matchType = getMatchTypeById(params.type);
        if (!this.matchType) {
            window.router.navigate('/');
            return;
        }

        this.formData = {
            personA: { name: '', gender: '', birthDate: '', lunarDate: '' },
            personB: { name: '', gender: '', birthDate: '', lunarDate: '' }
        };

        this.currentStep = 1; // 1: 输入A的信息, 2: 输入B的信息
    }

    render() {
        if (!this.matchType) return '';

        return `
      <div class="page birthday-input-page">
        ${Navbar({
            title: '生日匹配',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            
            <!-- 进度指示 -->
            <section class="progress-section">
              ${ProgressBar(this.currentStep, 2, { 
                showText: false, 
                showSteps: false,
                stepLabel: `步骤 ${this.currentStep}/2：输入${this.currentStep === 1 ? '你的' : '对方的'}信息`
              })}
            </section>

            <!-- 表单区域 -->
            <section class="form-section animate-fade-in-up">
              <div class="glass-card">
                <h3 class="heading-3 mb-4">
                  ${this.currentStep === 1 ? '👤 你的信息' : '👥 对方的信息'}
                </h3>
                
                <form id="birthday-form" class="form">
                  <!-- 性别 -->
                  <div class="input-group mb-4">
                    <div class="gender-selector">
                      <button type="button" class="gender-btn" data-gender="male">
                        <span class="gender-icon">👨</span>
                        <span>男</span>
                      </button>
                      <button type="button" class="gender-btn" data-gender="female">
                        <span class="gender-icon">👩</span>
                        <span>女</span>
                      </button>
                    </div>
                  </div>

                  <!-- 称呼 -->
                  <div class="input-group mb-4">
                    <input 
                      type="text" 
                      id="name" 
                      class="input" 
                      placeholder="称呼"
                      maxlength="10"
                    >
                  </div>

                  <!-- 出生日期 -->
                  <div class="input-group mb-4">
                    <div class="date-input-wrapper">
                      <input 
                        type="text" 
                        id="birthDate" 
                        class="input flatpickr-input"
                        placeholder="请选择阳历生日"
                        readonly
                      >
                    </div>
                    <div id="lunar-date" class="lunar-date-display" style="display: none;">
                      <span class="lunar-icon">🌙</span>
                      <span class="lunar-text"></span>
                    </div>
                  </div>
                </form>
              </div>
            </section>

            <!-- 已输入的A信息展示（步骤2时显示）-->
            ${this.renderPersonAInfo()}

          </div>
        </main>

        <!-- 底部操作栏 -->
        <div class="bottom-action-bar safe-area-bottom">
          <div class="action-bar__buttons">
            ${this.currentStep === 2 ? `
              <button class="btn btn--secondary" data-action="back-step">上一步</button>
            ` : ''}
            <button class="btn btn--primary btn--full" data-action="next" disabled>
              ${this.currentStep === 1 ? '下一步' : '开始分析'}
            </button>
          </div>
        </div>
      </div>
    `;
    }

    renderPersonAInfo() {
        const personA = this.formData.personA;
        const personB = this.formData.personB;
        const genderEmojiA = personA.gender === 'male' ? '👨' : (personA.gender === 'female' ? '👩' : '👤');
        const genderEmojiB = personB.gender === 'male' ? '👨' : (personB.gender === 'female' ? '👩' : '👤');

        return `
      <section class="persons-info mt-4 animate-fade-in">
        <div class="persons-info__cards">
          <!-- 甲方信息卡片 -->
          <div class="person-card ${this.currentStep === 1 ? 'person-card--active' : ''}" data-person="A">
            <div class="person-card__top">
              <span class="person-avatar">${genderEmojiA}</span>
              <div class="person-card__info">
                <p class="person-card__name">${personA.name || '甲方'}</p>
                <div class="person-card__date-row">
                  <span class="person-card__date">${personA.birthDate || '未填写'}</span>
                  <span class="badge ${personA.name ? 'badge--success' : 'badge--secondary'}">
                    ${personA.name ? '已填写' : '待填写'}
                  </span>
                </div>
              </div>
            </div>
            ${personA.lunarDate ? `<p class="person-card__lunar">${personA.lunarDate}</p>` : ''}
          </div>
          
          <!-- 乙方信息卡片 -->
          <div class="person-card ${this.currentStep === 2 ? 'person-card--active' : ''}" data-person="B">
            <div class="person-card__top">
              <span class="person-avatar">${genderEmojiB}</span>
              <div class="person-card__info">
                <p class="person-card__name">${personB.name || '乙方'}</p>
                <div class="person-card__date-row">
                  <span class="person-card__date">${personB.birthDate || '未填写'}</span>
                  <span class="badge ${personB.name ? 'badge--success' : 'badge--secondary'}">
                    ${personB.name ? '已填写' : '待填写'}
                  </span>
                </div>
              </div>
            </div>
            ${personB.lunarDate ? `<p class="person-card__lunar">${personB.lunarDate}</p>` : ''}
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
                if (this.currentStep === 2) {
                    this.goBackStep();
                } else {
                    window.router.back();
                }
            });
        }

        // 人员卡片点击切换
        document.querySelectorAll('.person-card').forEach(card => {
            card.addEventListener('click', () => {
                const person = card.dataset.person;
                this.switchToPerson(person);
            });
        });

        // 性别选择
        document.querySelectorAll('.gender-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectGender(btn.dataset.gender);
            });
        });

        // 表单输入
        const nameInput = document.getElementById('name');
        const birthDateInput = document.getElementById('birthDate');

        if (nameInput) {
            nameInput.addEventListener('input', () => this.validateForm());
        }
        
        // 初始化 flatpickr 日期选择器
        if (birthDateInput) {
            // 生成年份选项（1920-当前年）
            const currentYear = new Date().getFullYear();
            const years = [];
            for (let y = currentYear; y >= 1920; y--) {
                years.push(y);
            }
            
            this.flatpickrInstance = flatpickr(birthDateInput, {
                dateFormat: 'Y-m-d',
                locale: Mandarin,
                maxDate: 'today',
                minDate: '1920-01-01',
                disableMobile: true,  // 强制在移动端也使用flatpickr UI
                allowInput: false,
                clickOpens: true,
                appendTo: document.body,  // 添加到body，方便居中定位
                onChange: (selectedDates, dateStr) => {
                    this.updateLunarDate(dateStr);
                    this.validateForm();
                    // 更新顶部日期显示
                    this.updateCalendarHeader(selectedDates[0]);
                },
                onReady: (selectedDates, dateStr, instance) => {
                    const calendar = instance.calendarContainer;
                    if (calendar) {
                        // 创建顶部日期显示区域
                        const headerDiv = document.createElement('div');
                        headerDiv.className = 'flatpickr-header-display';
                        headerDiv.innerHTML = '<span class="header-date">请选择日期</span>';
                        calendar.insertBefore(headerDiv, calendar.firstChild);
                        
                        // 替换年份输入框为下拉选择器，并调整顺序（年份在前）
                        const yearInput = calendar.querySelector('.cur-year');
                        const monthSelect = calendar.querySelector('.flatpickr-monthDropdown-months');
                        if (yearInput && monthSelect) {
                            const yearSelect = document.createElement('select');
                            yearSelect.className = 'flatpickr-yearDropdown';
                            years.forEach(y => {
                                const option = document.createElement('option');
                                option.value = y;
                                option.textContent = y + '年';
                                yearSelect.appendChild(option);
                            });
                            yearSelect.value = instance.currentYear;
                            yearSelect.addEventListener('change', (e) => {
                                instance.changeYear(parseInt(e.target.value));
                            });
                            yearInput.parentNode.replaceChild(yearSelect, yearInput);
                            
                            // 调整顺序：年份在前，月份在后
                            const currentMonth = calendar.querySelector('.flatpickr-current-month');
                            if (currentMonth) {
                                currentMonth.insertBefore(yearSelect, monthSelect);
                            }
                        }
                        
                        // 创建遮罩层
                        const overlay = document.createElement('div');
                        overlay.className = 'flatpickr-overlay';
                        document.body.appendChild(overlay);
                        this.flatpickrOverlay = overlay;
                        
                        // 点击遮罩关闭日历
                        overlay.addEventListener('click', () => {
                            instance.close();
                        });
                        
                        // 添加自定义样式
                        const style = document.createElement('style');
                        style.textContent = `
                            /* 遮罩层 */
                            .flatpickr-overlay {
                                display: none;
                                position: fixed;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background: rgba(0, 0, 0, 0.5);
                                z-index: 9998;
                            }
                            .flatpickr-overlay.active {
                                display: block;
                            }
                            
                            /* 日历容器居中 + 紫色阴影 - 无圆角 */
                            .flatpickr-calendar {
                                position: fixed !important;
                                top: 50% !important;
                                left: 50% !important;
                                transform: translate(-50%, -50%) !important;
                                z-index: 9999 !important;
                                border-radius: 16px !important;
                                box-shadow: 0 12px 48px rgba(139, 127, 216, 0.35) !important;
                                width: 340px !important;
                                max-width: 92vw !important;
                                border: none !important;
                                overflow: hidden !important;
                                background: linear-gradient(180deg, #8B7FD8 0%, #A78BFA 15%, #E8D5FF 35%, #FFE5F0 60%, #E5F0FF 100%) !important;
                            }
                            .flatpickr-calendar.open {
                                display: block !important;
                            }
                            
                            /* 顶部日期显示 - 透明背景融入整体渐变 */
                            .flatpickr-header-display {
                                background: transparent !important;
                                padding: 24px 20px !important;
                                text-align: center;
                                border-radius: 0 !important;
                                border: none !important;
                                margin: 0 !important;
                            }
                            .flatpickr-header-display .header-date {
                                color: #1E40AF !important;
                                font-size: 26px !important;
                                font-weight: 700 !important;
                                display: block;
                                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
                            }
                            
                            /* 月份导航栏 - 透明背景融入整体渐变 */
                            .flatpickr-calendar .flatpickr-months {
                                background: transparent !important;
                                padding: 14px 12px !important;
                            }
                            .flatpickr-calendar .flatpickr-month {
                                height: auto !important;
                                line-height: 1.4 !important;
                            }
                            .flatpickr-calendar .flatpickr-current-month {
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                gap: 12px !important;
                                color: #2D2D3D !important;
                                font-size: 16px !important;
                                font-weight: 600 !important;
                                padding: 0 40px !important;
                                height: auto !important;
                                position: relative !important;
                                width: 100% !important;
                            }
                            
                            /* 年份下拉选择器样式 */
                            .flatpickr-yearDropdown {
                                color: #2D2D3D !important;
                                font-size: 15px !important;
                                font-weight: 600 !important;
                                background: white !important;
                                border: 2px solid rgba(139, 127, 216, 0.4) !important;
                                border-radius: 10px !important;
                                padding: 8px 12px !important;
                                cursor: pointer !important;
                                outline: none !important;
                                width: 115px !important;
                                height: 40px !important;
                            }
                            .flatpickr-yearDropdown:focus {
                                border-color: #8B7FD8 !important;
                                box-shadow: 0 0 0 3px rgba(139, 127, 216, 0.15) !important;
                            }
                            
                            /* 月份下拉样式 */
                            .flatpickr-calendar .flatpickr-current-month .flatpickr-monthDropdown-months {
                                color: #2D2D3D !important;
                                font-size: 15px !important;
                                font-weight: 600 !important;
                                background: white !important;
                                border: 2px solid rgba(139, 127, 216, 0.4) !important;
                                border-radius: 10px !important;
                                padding: 8px 16px !important;
                                cursor: pointer !important;
                                -webkit-appearance: none !important;
                                appearance: none !important;
                                width: 100px !important;
                                height: 40px !important;
                            }
                            .flatpickr-calendar .flatpickr-current-month .flatpickr-monthDropdown-months:focus {
                                border-color: #8B7FD8 !important;
                                box-shadow: 0 0 0 3px rgba(139, 127, 216, 0.15) !important;
                                outline: none !important;
                            }
                            
                            .flatpickr-calendar .flatpickr-prev-month,
                            .flatpickr-calendar .flatpickr-next-month {
                                fill: #8B7FD8 !important;
                                color: #8B7FD8 !important;
                                position: absolute !important;
                                top: 50% !important;
                                transform: translateY(-50%) !important;
                                padding: 10px !important;
                                border-radius: 8px !important;
                                transition: background 0.2s !important;
                            }
                            .flatpickr-calendar .flatpickr-prev-month {
                                left: 8px !important;
                            }
                            .flatpickr-calendar .flatpickr-next-month {
                                right: 8px !important;
                            }
                            .flatpickr-calendar .flatpickr-prev-month:hover,
                            .flatpickr-calendar .flatpickr-next-month:hover {
                                background: rgba(139, 127, 216, 0.1) !important;
                            }
                            .flatpickr-calendar .flatpickr-prev-month svg,
                            .flatpickr-calendar .flatpickr-next-month svg {
                                fill: #8B7FD8 !important;
                                width: 14px !important;
                                height: 14px !important;
                            }
                            
                            /* 日历主体 - 透明背景融入整体渐变 */
                            .flatpickr-calendar .flatpickr-innerContainer {
                                background: transparent !important;
                                padding: 12px 16px 16px !important;
                            }
                            .flatpickr-calendar .flatpickr-rContainer {
                                background: transparent !important;
                            }
                            .flatpickr-calendar .flatpickr-days {
                                background: transparent !important;
                                width: 100% !important;
                            }
                            .flatpickr-calendar .dayContainer {
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                            }
                            
                            /* 星期标题 */
                            .flatpickr-calendar .flatpickr-weekdays {
                                background: transparent !important;
                                margin-bottom: 8px !important;
                            }
                            .flatpickr-calendar .flatpickr-weekday {
                                color: #6B5B95 !important;
                                font-weight: 700 !important;
                                font-size: 13px !important;
                            }
                            
                            /* 日期样式 - 基础 */
                            .flatpickr-calendar .flatpickr-day {
                                color: #2D2D3D !important;
                                border-radius: 50% !important;
                                font-weight: 600 !important;
                                height: 40px !important;
                                width: 40px !important;
                                max-width: 40px !important;
                                line-height: 40px !important;
                                margin: 1px auto !important;
                            }
                            /* 当月日期 - 圆圈 + 淡色背景 */
                            .flatpickr-calendar .flatpickr-day:not(.prevMonthDay):not(.nextMonthDay):not(.selected) {
                                background: rgba(255, 255, 255, 0.55) !important;
                                border: 1.5px solid rgba(139, 127, 216, 0.2) !important;
                            }
                            /* 非当月日期 - 变淡 */
                            .flatpickr-calendar .flatpickr-day.prevMonthDay,
                            .flatpickr-calendar .flatpickr-day.nextMonthDay {
                                color: #c4b8e8 !important;
                                opacity: 0.5 !important;
                                background: transparent !important;
                                border-color: transparent !important;
                            }
                            /* 选中日期 - 深色圆圈背景，提高优先级覆盖当月样式 */
                            .flatpickr-calendar .flatpickr-day.selected,
                            .flatpickr-calendar .flatpickr-day.flatpickr-selected {
                                background: #5B4BB4 !important;
                                background: linear-gradient(135deg, #5B4BB4 0%, #6B5AC4 50%, #7C4DFF 100%) !important;
                                border: none !important;
                                border-color: transparent !important;
                                color: #fff !important;
                                box-shadow: 0 4px 16px rgba(91, 75, 180, 0.6), inset 0 1px 0 rgba(255,255,255,0.2) !important;
                                font-weight: 700 !important;
                                opacity: 1 !important;
                            }
                            /* 今天 */
                            .flatpickr-calendar .flatpickr-day.today:not(.selected) {
                                border: 2px solid #8B7FD8 !important;
                                background: rgba(139, 127, 216, 0.12) !important;
                            }
                            /* 禁用日期 */
                            .flatpickr-calendar .flatpickr-day.flatpickr-disabled {
                                color: #bbb !important;
                                opacity: 0.4 !important;
                                background: transparent !important;
                                border-color: transparent !important;
                            }
                            /* 悬停 */
                            .flatpickr-calendar .flatpickr-day:hover:not(.flatpickr-disabled):not(.selected) {
                                background: rgba(139, 127, 216, 0.18) !important;
                                border-color: rgba(139, 127, 216, 0.4) !important;
                            }
                        `;
                        document.head.appendChild(style);
                    }
                    
                    // 月视图左右滑动切换月份
                    if (calendar) {
                        let touchStartX = 0;
                        let touchStartY = 0;
                        let isSwiping = false;
                        
                        const daysContainer = calendar.querySelector('.flatpickr-innerContainer') || calendar;
                        
                        daysContainer.addEventListener('touchstart', (e) => {
                            touchStartX = e.touches[0].clientX;
                            touchStartY = e.touches[0].clientY;
                            isSwiping = true;
                        }, { passive: true });
                        
                        daysContainer.addEventListener('touchend', (e) => {
                            if (!isSwiping) return;
                            isSwiping = false;
                            
                            const touchEndX = e.changedTouches[0].clientX;
                            const touchEndY = e.changedTouches[0].clientY;
                            const deltaX = touchEndX - touchStartX;
                            const deltaY = touchEndY - touchStartY;
                            const absDX = Math.abs(deltaX);
                            const absDY = Math.abs(deltaY);
                            
                            if (absDX > 50 && absDX > absDY * 1.5) {
                                // 水平滑动 → 切换月份
                                if (deltaX < 0) {
                                    instance.changeMonth(1);   // 左滑 → 下一月
                                } else {
                                    instance.changeMonth(-1);  // 右滑 → 上一月
                                }
                            } else if (absDY > 60 && absDY > absDX * 1.5) {
                                // 垂直滑动 → 切换年份
                                const newYear = deltaY < 0
                                    ? instance.currentYear + 1   // 上滑 → 下一年
                                    : instance.currentYear - 1;  // 下滑 → 上一年
                                // 限制在 1920 ~ 当前年范围内
                                const currentYear = new Date().getFullYear();
                                if (newYear >= 1920 && newYear <= currentYear) {
                                    instance.changeYear(newYear);
                                    // 同步年份下拉框
                                    const yearSelect = document.querySelector('.flatpickr-yearDropdown');
                                    if (yearSelect) {
                                        yearSelect.value = newYear;
                                    }
                                }
                            }
                        }, { passive: true });
                    }
                    
                    // 移动端优化：确保点击输入框能打开选择器
                    instance.input.addEventListener('click', () => {
                        instance.open();
                    });
                },
                onOpen: () => {
                    // 显示遮罩
                    if (this.flatpickrOverlay) {
                        this.flatpickrOverlay.classList.add('active');
                    }
                    // 更新顶部显示
                    const currentDate = this.flatpickrInstance.selectedDates[0];
                    this.updateCalendarHeader(currentDate);
                    
                    // 同步年份下拉选择器的值
                    const yearSelect = document.querySelector('.flatpickr-yearDropdown');
                    if (yearSelect && this.flatpickrInstance) {
                        yearSelect.value = this.flatpickrInstance.currentYear;
                    }
                },
                onClose: () => {
                    // 隐藏遮罩
                    if (this.flatpickrOverlay) {
                        this.flatpickrOverlay.classList.remove('active');
                    }
                },
                onMonthChange: () => {
                    // 月份改变时同步年份下拉
                    const yearSelect = document.querySelector('.flatpickr-yearDropdown');
                    if (yearSelect && this.flatpickrInstance) {
                        yearSelect.value = this.flatpickrInstance.currentYear;
                    }
                },
                onYearChange: () => {
                    // 年份改变时同步年份下拉
                    const yearSelect = document.querySelector('.flatpickr-yearDropdown');
                    if (yearSelect && this.flatpickrInstance) {
                        yearSelect.value = this.flatpickrInstance.currentYear;
                    }
                }
            });
        }

        // 下一步按钮 - 使用简单的 click 事件，移动端 click 事件是可靠的
        const nextBtn = document.querySelector('[data-action="next"]');
        if (nextBtn) {
            nextBtn.onclick = (e) => {
                console.log('点击了下一步/开始分析按钮');
                console.log('当前步骤:', this.currentStep);
                console.log('表单数据:', JSON.stringify(this.formData));
                this.handleNext();
            };
        }

        // 返回上一步按钮
        const backStepBtn = document.querySelector('[data-action="back-step"]');
        if (backStepBtn) {
            backStepBtn.onclick = () => {
                console.log('点击了上一步按钮');
                this.goBackStep();
            };
        }
    }

    selectGender(gender) {
        // 更新UI
        document.querySelectorAll('.gender-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.gender === gender);
        });

        // 保存数据
        if (this.currentStep === 1) {
            this.formData.personA.gender = gender;
        } else {
            this.formData.personB.gender = gender;
        }

        // 实时更新底部卡片的头像
        this.updatePersonCards();
        
        this.validateForm();
    }
    
    // 更新日历顶部日期显示
    updateCalendarHeader(date) {
        const headerDisplay = document.querySelector('.flatpickr-header-display .header-date');
        if (headerDisplay) {
            if (date) {
                const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const weekDay = weekDays[date.getDay()];
                headerDisplay.textContent = `${year}年${month}月${day}日${weekDay}`;
            } else {
                headerDisplay.textContent = '请选择日期';
            }
        }
    }
    
    // 更新底部人员卡片显示
    updatePersonCards() {
        const personCards = document.querySelectorAll('.person-card');
        if (personCards.length === 0) return;
        
        // 更新甲方卡片头像
        const cardA = document.querySelector('[data-person="A"] .person-avatar');
        if (cardA) {
            const genderA = this.formData.personA.gender;
            cardA.textContent = genderA === 'male' ? '👨' : (genderA === 'female' ? '👩' : '👤');
        }
        
        // 更新乙方卡片头像
        const cardB = document.querySelector('[data-person="B"] .person-avatar');
        if (cardB) {
            const genderB = this.formData.personB.gender;
            cardB.textContent = genderB === 'male' ? '👨' : (genderB === 'female' ? '👩' : '👤');
        }
    }

    validateForm() {
        const name = document.getElementById('name')?.value.trim();
        const birthDate = document.getElementById('birthDate')?.value;
        const gender = this.currentStep === 1
            ? this.formData.personA.gender
            : this.formData.personB.gender;

        const isValid = name && birthDate && gender;
        
        console.log('validateForm:', { name, birthDate, gender, isValid, step: this.currentStep });

        const nextBtn = document.querySelector('[data-action="next"]');
        if (nextBtn) {
            nextBtn.disabled = !isValid;
        }
        
        // 实时更新当前人员的卡片信息
        this.updateCurrentPersonCard(name, birthDate, gender);
        
        // 如果三个字段都填写完成，自动跳转
        if (isValid) {
            this.autoNavigateNext();
        }

        return isValid;
    }
    
    // 自动跳转到下一步
    autoNavigateNext() {
        // 使用防抖，避免重复触发
        if (this.autoNavTimer) {
            clearTimeout(this.autoNavTimer);
        }
        
        this.autoNavTimer = setTimeout(() => {
            // 再次检查表单是否完整
            const name = document.getElementById('name')?.value.trim();
            const birthDate = document.getElementById('birthDate')?.value;
            const gender = this.currentStep === 1
                ? this.formData.personA.gender
                : this.formData.personB.gender;
            
            if (name && birthDate && gender) {
                // 保存当前数据
                const lunarDate = birthDate ? formatLunarDate(birthDate) : '';
                const person = this.currentStep === 1 ? 'personA' : 'personB';
                this.formData[person].name = name;
                this.formData[person].birthDate = birthDate;
                this.formData[person].lunarDate = lunarDate;
                
                // 只有当另一方未填写时才自动跳转
                const otherPerson = this.currentStep === 1 ? 'personB' : 'personA';
                const otherData = this.formData[otherPerson];
                const isOtherComplete = otherData.name && otherData.birthDate && otherData.gender;

                if (this.currentStep === 1 && !isOtherComplete) {
                    // 跳转到步骤2
                    this.currentStep = 2;
                    this.rerender();
                }
                // 如果两方都已填写，不自动跳转，让用户可以自由编辑
            }
        }, 500); // 500ms 延迟，给用户时间确认
    }
    
    // 实时更新当前人员的卡片信息
    updateCurrentPersonCard(name, birthDate, gender) {
        const person = this.currentStep === 1 ? 'A' : 'B';
        const card = document.querySelector(`[data-person="${person}"]`);
        if (!card) return;
        
        // 更新头像
        const avatar = card.querySelector('.person-avatar');
        if (avatar) {
            avatar.textContent = gender === 'male' ? '👨' : (gender === 'female' ? '👩' : '👤');
        }
        
        // 更新名字
        const nameEl = card.querySelector('.person-card__name');
        if (nameEl) {
            nameEl.textContent = name || (person === 'A' ? '甲方' : '乙方');
        }
        
        // 更新日期
        const dateEl = card.querySelector('.person-card__date');
        if (dateEl) {
            dateEl.textContent = birthDate || '未填写';
        }
        
        // 更新农历
        const lunarEl = card.querySelector('.person-card__lunar');
        if (birthDate) {
            const lunarDate = formatLunarDate(birthDate);
            if (lunarEl) {
                lunarEl.textContent = lunarDate;
            } else {
                // 创建农历元素（添加到卡片底部）
                const newLunarEl = document.createElement('p');
                newLunarEl.className = 'person-card__lunar';
                newLunarEl.textContent = lunarDate;
                card.appendChild(newLunarEl);
            }
        } else if (lunarEl) {
            // 如果没有日期，移除农历元素
            lunarEl.remove();
        }
        
        // 更新状态标签
        const badge = card.querySelector('.badge');
        if (badge) {
            const isComplete = name && birthDate && gender;
            badge.className = `badge ${isComplete ? 'badge--success' : 'badge--secondary'}`;
            badge.textContent = isComplete ? '已填写' : '待填写';
        }
    }

    updateLunarDate(dateStr) {
        const lunarContainer = document.getElementById('lunar-date');
        const lunarText = lunarContainer?.querySelector('.lunar-text');
        
        if (!lunarContainer || !lunarText) return;

        if (dateStr) {
            const lunarStr = formatLunarDate(dateStr);
            lunarText.textContent = `农历：${lunarStr}`;
            lunarContainer.style.display = 'flex';
        } else {
            lunarContainer.style.display = 'none';
        }
    }

    handleNext() {
        console.log('handleNext 被调用');
        
        if (!this.validateForm()) {
            console.log('表单验证未通过，返回');
            return;
        }

        // 保存当前步骤数据
        const name = document.getElementById('name').value.trim();
        const birthDate = document.getElementById('birthDate').value;
        const lunarDate = birthDate ? formatLunarDate(birthDate) : '';
        
        console.log('表单数据:', { name, birthDate, lunarDate });

        if (this.currentStep === 1) {
            this.formData.personA.name = name;
            this.formData.personA.birthDate = birthDate;
            this.formData.personA.lunarDate = lunarDate;

            // 切换到步骤2
            this.currentStep = 2;
            this.rerender();
        } else {
            this.formData.personB.name = name;
            this.formData.personB.birthDate = birthDate;
            this.formData.personB.lunarDate = lunarDate;
            
            console.log('准备提交测试，跳转到商品页');

            // 先保存测试数据到状态，再跳转到商品/服务页
            this.saveTestDataAndGoProduct();
        }
    }

    goBackStep() {
        if (this.currentStep === 2) {
            // 保存当前乙方数据
            this.saveCurrentFormData();
            this.currentStep = 1;
            this.rerender();
        }
    }
    
    // 保存当前表单数据到对应人员
    saveCurrentFormData() {
        const name = document.getElementById('name')?.value.trim() || '';
        const birthDate = document.getElementById('birthDate')?.value || '';
        const lunarDate = birthDate ? formatLunarDate(birthDate) : '';
        const person = this.currentStep === 1 ? 'personA' : 'personB';
        
        this.formData[person].name = name;
        this.formData[person].birthDate = birthDate;
        this.formData[person].lunarDate = lunarDate;
    }
    
    // 点击卡片切换人员
    switchToPerson(person) {
        const targetStep = person === 'A' ? 1 : 2;
        
        if (targetStep === this.currentStep) return;
        
        // 先保存当前表单数据
        this.saveCurrentFormData();
        
        // 切换步骤
        this.currentStep = targetStep;
        this.rerender();
    }

    rerender() {
        // 销毁旧的 flatpickr 实例
        if (this.flatpickrInstance) {
            this.flatpickrInstance.destroy();
            this.flatpickrInstance = null;
        }
        
        // 移除遮罩层
        if (this.flatpickrOverlay) {
            this.flatpickrOverlay.remove();
            this.flatpickrOverlay = null;
        }
        
        const container = document.getElementById('app');
        const formSection = document.querySelector('.form-section');
        
        // 添加淡出动画
        if (formSection) {
            formSection.classList.add('fade-out');
        }
        
        // 延迟更新内容，等待淡出动画完成
        setTimeout(() => {
            container.innerHTML = this.render();
            this.attachEvents();

            const currentPerson = this.currentStep === 1 ? this.formData.personA : this.formData.personB;
            
            // 恢复当前步骤对应人员的数据
            if (currentPerson.name) {
                document.getElementById('name').value = currentPerson.name;
            }
            if (currentPerson.birthDate) {
                document.getElementById('birthDate').value = currentPerson.birthDate;
                this.updateLunarDate(currentPerson.birthDate);
            }
            if (currentPerson.gender) {
                this.selectGender(currentPerson.gender);
            } else if (this.currentStep === 2 && !this.formData.personB.gender) {
                // 步骤2且乙方未选性别：自动选择相反性别
                const oppositeGender = this.formData.personA.gender === 'male' ? 'female' : 'male';
                this.selectGender(oppositeGender);
            }
            
            // 验证表单状态
            this.validateForm();
            
            // 添加淡入动画
            const newFormSection = document.querySelector('.form-section');
            if (newFormSection) {
                newFormSection.classList.add('fade-in');
            }
        }, 150); // 150ms 过渡时间
    }

    /**
     * 保存测试数据到状态，然后跳转到商品/服务页
     */
    saveTestDataAndGoProduct() {
        const testData = {
            type: this.matchType.id,
            method: 'birthday',
            personA: {
                name: this.formData.personA.name,
                gender: this.formData.personA.gender === 'male' ? '男' : '女',
                birthDate: this.formData.personA.birthDate
            },
            personB: {
                name: this.formData.personB.name,
                gender: this.formData.personB.gender === 'male' ? '男' : '女',
                birthDate: this.formData.personB.birthDate
            },
            timestamp: Date.now()
        };
        window.appState.set('currentTest', testData);
        // 跳转到商品/服务页
        window.router.navigate(`/product/${this.matchType.id}`);
    }

    async submitTest() {
        console.log('submitTest 被调用');
        
        // 保存测试数据到状态
        const testData = {
            type: this.matchType.id,
            method: 'birthday',
            personA: {
                name: this.formData.personA.name,
                gender: this.formData.personA.gender === 'male' ? '男' : '女',
                birthDate: this.formData.personA.birthDate
            },
            personB: {
                name: this.formData.personB.name,
                gender: this.formData.personB.gender === 'male' ? '男' : '女',
                birthDate: this.formData.personB.birthDate
            },
            timestamp: Date.now()
        };
        
        console.log('测试数据:', JSON.stringify(testData));

        // 创建匹配记录（sessionId 已存在则复用）
        const sessionId = getSessionId();
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
            console.log('匹配记录创建/复用成功:', result);
            testData.recordId = result.data?.recordId;
            testData.sessionId = sessionId;
        } catch (error) {
            console.error('创建匹配记录失败:', error);
            // 不阻塞用户流程，继续跳转
            testData.sessionId = sessionId;
        }
        
        window.appState.set('currentTest', testData);

        // 跳转到结果页（或付款页）
        console.log('准备跳转到 /result/birthday');
        window.router.navigate(`/result/birthday`);
    }
}

export default BirthdayInputPage;

