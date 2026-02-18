/**
 * 管理员登录页面逻辑
 */

// 动态获取 API 基础地址
function getAdminApiBase() {
    return '/api/admin';
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // 检查是否已登录
    const token = localStorage.getItem('adminToken');
    if (token) {
        window.location.href = 'index.html';
        return;
    }

    // 恢复记住的用户名
    const savedUsername = localStorage.getItem('adminUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberCheckbox.checked = true;
    }

    // 登录表单提交
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const loginBtn = loginForm.querySelector('.login-btn');

        if (!username || !password) {
            showError('请填写用户名和密码');
            return;
        }

        // 显示加载状态
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        try {
            // 调用后端登录API
            const response = await fetch(`${getAdminApiBase()}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const result = await response.json();

            if (result.code !== 200) {
                throw new Error(result.message || '登录失败');
            }

            // 记住用户名
            if (rememberCheckbox.checked) {
                localStorage.setItem('adminUsername', username);
            } else {
                localStorage.removeItem('adminUsername');
            }

            // 保存登录状态
            localStorage.setItem('adminToken', result.data.token);
            localStorage.setItem('adminInfo', JSON.stringify(result.data.admin));

            // 跳转到管理页面
            window.location.href = 'index.html';
        } catch (error) {
            showError(error.message);
        } finally {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });

    // 显示错误信息
    function showError(message) {
        // 检查是否已存在错误提示
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            loginForm.insertBefore(errorDiv, loginForm.firstChild);
        }
        
        errorDiv.innerHTML = `⚠️ ${message}`;
        errorDiv.classList.add('show');

        // 3秒后自动隐藏
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 3000);
    }
});
