/**
 * 个人详情页面
 * 显示用户信息：称呼、手机号、性别
 */

import { Navbar } from '../components/Common.js';
import { authApi } from '../services/api.js';

export class ProfilePage {
    constructor() {
        this.user = authApi.getLocalUser();
        this.gender = localStorage.getItem('user_gender') || '未知';
        this.isEditing = false;
    }

    render() {
        const phone = this.user?.phone || '';
        const maskedPhone = phone
            ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
            : '未绑定';
        const nickname = this.user?.nickname || '未设置';

        return `
      <div class="page profile-page">
        ${Navbar({
            title: '我的',
            showBack: true,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            
            <!-- 头像区域 -->
            <section class="profile-header animate-fade-in-up">
              <div class="glass-card text-center" style="padding: 2rem 1.5rem;">
                <div class="profile-avatar">👤</div>
                <h2 class="profile-nickname">${nickname}</h2>
              </div>
            </section>

            <!-- 信息列表 -->
            <section class="profile-info-section animate-fade-in-up animate-delay-100">
              <div class="glass-card" style="padding: 0;">
                
                <!-- 称呼 -->
                <div class="profile-info-item">
                  <div class="profile-info-label">称呼</div>
                  <div class="profile-info-value">
                    ${this.isEditing ? `
                      <input type="text" id="edit-nickname" class="profile-edit-input" 
                             value="${nickname}" maxlength="20" placeholder="请输入称呼">
                    ` : `
                      <span id="display-nickname">${nickname}</span>
                      <button class="profile-edit-btn" data-action="edit-nickname">✏️</button>
                    `}
                  </div>
                </div>

                <!-- 手机号 -->
                <div class="profile-info-item">
                  <div class="profile-info-label">手机号</div>
                  <div class="profile-info-value">
                    <span>${maskedPhone}</span>
                  </div>
                </div>

                <!-- 性别 -->
                <div class="profile-info-item" style="border-bottom: none;">
                  <div class="profile-info-label">性别</div>
                  <div class="profile-info-value">
                    <div class="profile-gender-selector">
                      <button class="gender-option ${this.gender === '男' ? 'active' : ''}" data-gender="男">♂ 男</button>
                      <button class="gender-option ${this.gender === '女' ? 'active' : ''}" data-gender="女">♀ 女</button>
                      <button class="gender-option ${this.gender === '未知' ? 'active' : ''}" data-gender="未知">未知</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- 保存按钮（编辑时显示） -->
            ${this.isEditing ? `
              <section class="animate-fade-in-up animate-delay-200" style="margin-top: 1.5rem;">
                <button class="btn btn--primary btn--full" data-action="save-nickname">保存</button>
              </section>
            ` : ''}

            <!-- 退出登录 -->
            <section class="animate-fade-in-up animate-delay-200" style="margin-top: 2rem;">
              <button class="btn btn--ghost btn--full profile-logout-btn" data-action="logout">
                退出登录
              </button>
            </section>

            <div class="mt-8 safe-area-bottom"></div>
          </div>
        </main>
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

        // 编辑称呼
        const editNicknameBtn = document.querySelector('[data-action="edit-nickname"]');
        if (editNicknameBtn) {
            editNicknameBtn.addEventListener('click', () => {
                this.isEditing = true;
                this.rerender();
            });
        }

        // 保存称呼
        const saveBtn = document.querySelector('[data-action="save-nickname"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveNickname());
        }

        // 编辑输入框回车保存
        const editInput = document.getElementById('edit-nickname');
        if (editInput) {
            editInput.focus();
            editInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.saveNickname();
                }
            });
        }

        // 性别选择
        document.querySelectorAll('.gender-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const gender = btn.dataset.gender;
                this.gender = gender;
                localStorage.setItem('user_gender', gender);

                // 更新 UI
                document.querySelectorAll('.gender-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                window.showToast('已更新', 'success');
            });
        });

        // 退出登录
        const logoutBtn = document.querySelector('[data-action="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authApi.logout();
                localStorage.removeItem('userId');
                localStorage.removeItem('user_gender');
                window.showToast('已退出登录', 'success');
                setTimeout(() => {
                    window.router.navigate('/');
                }, 500);
            });
        }
    }

    saveNickname() {
        const input = document.getElementById('edit-nickname');
        if (!input) return;

        const newNickname = input.value.trim();
        if (!newNickname) {
            window.showToast('称呼不能为空', 'error');
            return;
        }

        // 更新本地存储
        if (this.user) {
            this.user.nickname = newNickname;
            localStorage.setItem('user', JSON.stringify(this.user));
        }

        this.isEditing = false;
        window.showToast('已保存', 'success');
        this.rerender();
    }

    rerender() {
        const container = document.getElementById('app');
        if (container) {
            container.innerHTML = this.render();
            this.attachEvents();
        }
    }
}

export default ProfilePage;
