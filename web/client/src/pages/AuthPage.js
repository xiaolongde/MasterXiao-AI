/**
 * 认证页面 - 登录/注册/忘记密码
 * 按照《注册登录文档》第五节设计
 */

import { Navbar } from '../components/Common.js';
import { authApi } from '../services/api.js';

export class AuthPage {
    constructor(params) {
        // 当前模式: login / register / forgot
        this.mode = params.action || 'login';
        this.form = {
            phone: '',
            smsCode: '',
            password: '',
            confirmPassword: '',
            inviteCode: ''
        };
        this.countdown = 0;
        this.countdownTimer = null;
        this.isSubmitting = false;
        this.sessionId = localStorage.getItem('sessionId') || '';
        this.devCode = ''; // 开发环境返回的验证码
    }

    render() {
        return `
      <div class="page auth-page">
        ${Navbar({
            title: this.getPageTitle(),
            showBack: true,
            showHistory: false,
            showProfile: false
        })}
        
        <main class="page-content">
          <div class="app-container">
            
            <!-- Logo 区域 -->
            <section class="auth-logo-section animate-fade-in-up">
              <div class="auth-logo">✨</div>
              <h2 class="auth-title">${this.getPageTitle()}</h2>
              <p class="auth-subtitle">${this.getSubtitle()}</p>
            </section>

            <!-- 表单区域 -->
            <section class="auth-form-section animate-fade-in-up animate-delay-100">
              <div class="glass-card">
                ${this.renderForm()}
              </div>
            </section>

            <!-- 底部切换链接 -->
            <section class="auth-footer animate-fade-in-up animate-delay-200">
              ${this.renderFooter()}
            </section>

            <div class="mt-8 safe-area-bottom"></div>
          </div>
        </main>
      </div>
    `;
    }

    getPageTitle() {
        switch (this.mode) {
            case 'login': return '登录';
            case 'register': return '注册';
            case 'forgot': return '重置密码';
            default: return '登录';
        }
    }

    getSubtitle() {
        switch (this.mode) {
            case 'login': return '使用手机号验证码快速登录';
            case 'register': return '创建账号，开始你的匹配之旅';
            case 'forgot': return '通过短信验证码重置密码';
            default: return '';
        }
    }

    renderForm() {
        switch (this.mode) {
            case 'login': return this.renderLoginForm();
            case 'register': return this.renderRegisterForm();
            case 'forgot': return this.renderForgotForm();
            default: return this.renderLoginForm();
        }
    }

    renderLoginForm() {
        return `
      <form id="auth-form" class="form" autocomplete="off">
        <!-- 手机号 -->
        <div class="input-group mb-4">
          <label class="input-label">手机号</label>
          <input type="tel" id="phone" class="input" placeholder="请输入手机号" 
                 maxlength="11" autocomplete="off" inputmode="numeric">
        </div>

        <!-- 验证码（可选） -->
        <div class="input-group mb-4">
          <label class="input-label">验证码</label>
          <div class="sms-code-row">
            <input type="text" id="smsCode" class="input sms-code-input" 
                   placeholder="请输入验证码" maxlength="6" inputmode="numeric" autocomplete="one-time-code">
            <button type="button" id="sendCodeBtn" class="btn btn--primary sms-code-btn" data-action="send-code">
              获取验证码
            </button>
          </div>
        </div>

        <!-- 开发环境验证码提示 -->
        <div id="devCodeHint" class="dev-code-hint" style="display:none;"></div>

        <!-- 登录按钮 -->
        <button type="submit" id="submitBtn" class="btn btn--primary btn--full mt-4" disabled>
          登录
        </button>
      </form>
    `;
    }

    renderRegisterForm() {
        return `
      <form id="auth-form" class="form" autocomplete="off">
        <!-- 手机号 -->
        <div class="input-group mb-4">
          <label class="input-label">手机号</label>
          <input type="tel" id="phone" class="input" placeholder="请输入手机号" 
                 maxlength="11" autocomplete="off" inputmode="numeric">
        </div>

        <!-- 验证码 -->
        <div class="input-group mb-4">
          <label class="input-label">验证码</label>
          <div class="sms-code-row">
            <input type="text" id="smsCode" class="input sms-code-input" 
                   placeholder="请输入验证码" maxlength="6" inputmode="numeric" autocomplete="one-time-code">
            <button type="button" id="sendCodeBtn" class="btn btn--primary sms-code-btn" data-action="send-code">
              获取验证码
            </button>
          </div>
        </div>

        <!-- 开发环境验证码提示 -->
        <div id="devCodeHint" class="dev-code-hint" style="display:none;"></div>

        <!-- 密码（可选） -->
        <div class="input-group mb-4">
          <label class="input-label">设置密码 <span class="input-helper-inline">（可选）</span></label>
          <input type="password" id="password" class="input" placeholder="6位以上密码（可选）" 
                 maxlength="20" autocomplete="new-password">
        </div>

        <!-- 邀请码（可选） -->
        <div class="input-group mb-4">
          <label class="input-label">邀请码 <span class="input-helper-inline">（可选）</span></label>
          <input type="text" id="inviteCode" class="input" placeholder="有邀请码可填写" 
                 maxlength="10" autocomplete="off">
        </div>

        <!-- 注册按钮 -->
        <button type="submit" id="submitBtn" class="btn btn--primary btn--full mt-4" disabled>
          注册
        </button>
      </form>
    `;
    }

    renderForgotForm() {
        return `
      <form id="auth-form" class="form" autocomplete="off">
        <!-- 手机号 -->
        <div class="input-group mb-4">
          <label class="input-label">手机号</label>
          <input type="tel" id="phone" class="input" placeholder="请输入手机号" 
                 maxlength="11" autocomplete="off" inputmode="numeric">
        </div>

        <!-- 验证码 -->
        <div class="input-group mb-4">
          <label class="input-label">验证码</label>
          <div class="sms-code-row">
            <input type="text" id="smsCode" class="input sms-code-input" 
                   placeholder="请输入验证码" maxlength="6" inputmode="numeric" autocomplete="one-time-code">
            <button type="button" id="sendCodeBtn" class="btn btn--primary sms-code-btn" data-action="send-code">
              获取验证码
            </button>
          </div>
        </div>

        <!-- 开发环境验证码提示 -->
        <div id="devCodeHint" class="dev-code-hint" style="display:none;"></div>

        <!-- 新密码 -->
        <div class="input-group mb-4">
          <label class="input-label">新密码</label>
          <input type="password" id="password" class="input" placeholder="请输入新密码（6位以上）" 
                 maxlength="20" autocomplete="new-password">
        </div>

        <!-- 确认密码 -->
        <div class="input-group mb-4">
          <label class="input-label">确认密码</label>
          <input type="password" id="confirmPassword" class="input" placeholder="请再次输入新密码" 
                 maxlength="20" autocomplete="new-password">
        </div>

        <!-- 提交按钮 -->
        <button type="submit" id="submitBtn" class="btn btn--primary btn--full mt-4" disabled>
          重置密码
        </button>
      </form>
    `;
    }

    renderFooter() {
        if (this.mode === 'login') {
            return `
        <div class="auth-links">
          <a class="auth-link" data-action="switch-register">注册新账号</a>
          <span class="auth-link-divider">|</span>
          <a class="auth-link" data-action="switch-forgot">忘记密码？</a>
        </div>
      `;
        } else if (this.mode === 'register') {
            return `
        <div class="auth-links">
          <a class="auth-link" data-action="switch-login">已有账号？立即登录</a>
        </div>
      `;
        } else {
            return `
        <div class="auth-links">
          <a class="auth-link" data-action="switch-login">返回登录</a>
        </div>
      `;
        }
    }

    attachEvents() {
        // 返回按钮
        const backBtn = document.querySelector('.navbar__back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.cleanup();
                window.router.back();
            });
        }

        // 发送验证码按钮
        const sendCodeBtn = document.getElementById('sendCodeBtn');
        if (sendCodeBtn) {
            sendCodeBtn.addEventListener('click', () => this.handleSendCode());
        }

        // 表单提交
        const form = document.getElementById('auth-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // 输入监听 - 实时验证表单
        this.bindInputListeners();

        // 底部切换链接
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', () => {
                const action = el.dataset.action;
                this.handleAction(action);
            });
        });
    }

    bindInputListeners() {
        const phoneInput = document.getElementById('phone');
        const codeInput = document.getElementById('smsCode');
        const pwdInput = document.getElementById('password');
        const confirmPwdInput = document.getElementById('confirmPassword');

        const validate = () => this.validateForm();

        phoneInput?.addEventListener('input', (e) => {
            // 只允许数字
            e.target.value = e.target.value.replace(/\D/g, '');
            this.form.phone = e.target.value;
            validate();
        });

        codeInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
            this.form.smsCode = e.target.value;
            validate();
        });

        pwdInput?.addEventListener('input', (e) => {
            this.form.password = e.target.value;
            validate();
        });

        confirmPwdInput?.addEventListener('input', (e) => {
            this.form.confirmPassword = e.target.value;
            validate();
        });

        const inviteInput = document.getElementById('inviteCode');
        inviteInput?.addEventListener('input', (e) => {
            this.form.inviteCode = e.target.value;
        });
    }

    validateForm() {
        const submitBtn = document.getElementById('submitBtn');
        if (!submitBtn) return false;

        const phoneValid = /^1[3-9]\d{9}$/.test(this.form.phone);
        const codeValid = /^\d{6}$/.test(this.form.smsCode);

        let valid = false;

        switch (this.mode) {
            case 'login':
                // 登录模式：只需手机号即可提交，验证码可选
                valid = phoneValid;
                break;
            case 'register':
                valid = phoneValid && codeValid;
                // 如果填了密码，需要至少6位
                if (this.form.password && this.form.password.length < 6) {
                    valid = false;
                }
                break;
            case 'forgot':
                valid = phoneValid && codeValid &&
                    this.form.password.length >= 6 &&
                    this.form.password === this.form.confirmPassword;
                break;
        }

        submitBtn.disabled = !valid;
        return valid;
    }

    async handleSendCode() {
        if (this.countdown > 0) return;

        const phone = this.form.phone;
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            window.showToast('请输入有效的11位手机号', 'error');
            return;
        }

        const sendCodeBtn = document.getElementById('sendCodeBtn');
        if (sendCodeBtn) {
            sendCodeBtn.disabled = true;
        }

        try {
            const type = this.mode === 'forgot' ? 'reset' : this.mode;
            const result = await authApi.sendSms(phone, type);

            // 开发环境显示验证码
            if (result.code) {
                this.devCode = result.code;
                const hint = document.getElementById('devCodeHint');
                if (hint) {
                    hint.style.display = 'block';
                    hint.textContent = `📱 开发模式验证码: ${result.code}`;
                }
            }

            window.showToast('验证码已发送', 'success');

            // 开始倒计时
            this.countdown = 60;
            this.updateCountdown();
            this.countdownTimer = setInterval(() => {
                this.countdown--;
                this.updateCountdown();
                if (this.countdown <= 0) {
                    clearInterval(this.countdownTimer);
                    this.countdownTimer = null;
                }
            }, 1000);
        } catch (error) {
            window.showToast(error.message || '发送失败', 'error');
            if (sendCodeBtn) {
                sendCodeBtn.disabled = false;
            }
        }
    }

    updateCountdown() {
        const sendCodeBtn = document.getElementById('sendCodeBtn');
        if (!sendCodeBtn) return;

        if (this.countdown > 0) {
            sendCodeBtn.disabled = true;
            sendCodeBtn.textContent = `${this.countdown}秒后重试`;
        } else {
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '获取验证码';
        }
    }

    async handleSubmit() {
        if (this.isSubmitting) return;
        if (!this.validateForm()) return;

        this.isSubmitting = true;
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '处理中...';
        }

        try {
            switch (this.mode) {
                case 'login':
                    await this.handleLogin();
                    break;
                case 'register':
                    await this.handleRegister();
                    break;
                case 'forgot':
                    await this.handleResetPassword();
                    break;
            }
        } catch (error) {
            window.showToast(error.message || '操作失败', 'error');
        } finally {
            this.isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = this.getSubmitText();
            }
        }
    }

    getSubmitText() {
        switch (this.mode) {
            case 'login': return '登录';
            case 'register': return '注册';
            case 'forgot': return '重置密码';
            default: return '提交';
        }
    }

    async handleLogin() {
        // 使用快速登录接口：手机号必填，验证码可选
        const smsCode = this.form.smsCode || undefined;
        const result = await authApi.quickLogin(this.form.phone, smsCode);

        if (result.success) {
            const msg = result.data?.isNewUser ? '注册并登录成功' : '登录成功';
            window.showToast(msg, 'success');
            this.cleanup();
            this.redirectToOriginalPage();
        }
    }

    async handleRegister() {
        const data = {
            phone: this.form.phone,
            smsCode: this.form.smsCode,
            sessionId: this.sessionId
        };
        if (this.form.password) {
            data.password = this.form.password;
        }
        if (this.form.inviteCode) {
            data.inviteCode = this.form.inviteCode;
        }

        const result = await authApi.register(data);

        if (result.success) {
            window.showToast('注册成功', 'success');
            this.cleanup();
            this.redirectToOriginalPage();
        }
    }

    async handleResetPassword() {
        const result = await authApi.resetPassword({
            phone: this.form.phone,
            smsCode: this.form.smsCode,
            newPassword: this.form.password,
            confirmPassword: this.form.confirmPassword
        });

        if (result.success) {
            window.showToast('密码重置成功，请重新登录', 'success');
            // 切换到登录模式
            this.switchMode('login');
        }
    }

    redirectToOriginalPage() {
        const redirectStr = sessionStorage.getItem('redirect_after_login');

        if (redirectStr) {
            try {
                const redirectData = JSON.parse(redirectStr);
                sessionStorage.removeItem('redirect_after_login');

                if (redirectData.path) {
                    window.router.navigate(redirectData.path);
                    return;
                }
                if (redirectData.page === 'detail') {
                    window.router.navigate(`/test/${redirectData.testTypeId}`);
                    return;
                }
            } catch (e) {
                // ignore
            }
        }

        // 默认返回首页
        window.router.navigate('/');
    }

    handleAction(action) {
        switch (action) {
            case 'switch-login':
                this.switchMode('login');
                break;
            case 'switch-register':
                this.switchMode('register');
                break;
            case 'switch-forgot':
                this.switchMode('forgot');
                break;
            case 'send-code':
                this.handleSendCode();
                break;
        }
    }

    switchMode(mode) {
        this.cleanup();
        this.mode = mode;
        this.form = { phone: this.form.phone, smsCode: '', password: '', confirmPassword: '', inviteCode: '' };
        this.countdown = 0;
        this.isSubmitting = false;
        this.devCode = '';

        // 重新渲染
        const container = document.getElementById('app');
        if (container) {
            container.innerHTML = this.render();
            this.attachEvents();

            // 恢复手机号
            const phoneInput = document.getElementById('phone');
            if (phoneInput && this.form.phone) {
                phoneInput.value = this.form.phone;
            }
        }
    }

    cleanup() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }
}

export default AuthPage;
