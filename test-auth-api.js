/**
 * 认证接口测试脚本
 * 测试 send-sms, register, login, check-permission, reset-password
 */

const BASE_URL = 'http://localhost:3000/api';
const PHONE = '13900139999';  // 使用未被限流的号码
let authToken = '';
let verifyCode = '';

async function request(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json();
    return { status: res.status, data };
}

function log(title, result) {
    const icon = result.data?.success || result.data?.code === 200 ? '✅' : '❌';
    console.log(`\n${icon} ${title}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Response:`, JSON.stringify(result.data, null, 2));
}

async function runTests() {
    console.log('🧪 ======= 认证接口测试开始 =======\n');

    // 1. 发送验证码（注册类型）
    console.log('--- 测试1: 发送注册验证码 ---');
    let result = await request('POST', '/auth/send-sms', {
        phone: PHONE,
        type: 'register'
    });
    log('发送注册验证码', result);
    verifyCode = result.data.code; // 开发环境获取验证码

    // 2. 注册
    console.log('\n--- 测试2: 用户注册 ---');
    result = await request('POST', '/auth/register', {
        phone: PHONE,
        smsCode: verifyCode,
        password: '123456',
        sessionId: 'test-session-001'
    });
    log('用户注册', result);
    if (result.data?.data?.token) {
        authToken = result.data.data.token;
    }

    // 3. 重复注册（应失败）
    console.log('\n--- 测试3: 重复注册（应失败） ---');
    result = await request('POST', '/auth/send-sms', {
        phone: PHONE,
        type: 'register'
    });
    log('重复发送注册验证码', result);

    // 4. 发送登录验证码
    console.log('\n--- 测试4: 发送登录验证码 ---');
    result = await request('POST', '/auth/send-sms', {
        phone: PHONE,
        type: 'login'
    });
    log('发送登录验证码', result);
    verifyCode = result.data.code;

    // 5. 验证码登录
    console.log('\n--- 测试5: 验证码登录 ---');
    result = await request('POST', '/auth/login', {
        phone: PHONE,
        code: verifyCode
    });
    log('验证码登录', result);
    if (result.data?.data?.token) {
        authToken = result.data.data.token;
    }

    // 6. 密码登录
    console.log('\n--- 测试6: 密码登录 ---');
    result = await request('POST', '/auth/login', {
        phone: PHONE,
        password: '123456'
    });
    log('密码登录', result);

    // 7. 获取当前用户信息
    console.log('\n--- 测试7: 获取当前用户信息 ---');
    result = await request('GET', '/auth/me', null, authToken);
    log('获取用户信息', result);

    // 8. 权限检查（已登录）
    console.log('\n--- 测试8: 权限检查（已登录） ---');
    result = await request('POST', '/user/check-permission', {
        testTypeId: 'love',
        sessionId: 'test-session-001'
    }, authToken);
    log('权限检查(已登录)', result);

    // 9. 权限检查（未登录）
    console.log('\n--- 测试9: 权限检查（未登录） ---');
    result = await request('POST', '/user/check-permission', {
        testTypeId: 'love',
        sessionId: 'test-session-001'
    });
    log('权限检查(未登录)', result);

    // 10. 发送重置密码验证码
    console.log('\n--- 测试10: 重置密码 ---');
    result = await request('POST', '/auth/send-sms', {
        phone: PHONE,
        type: 'reset'
    });
    log('发送重置验证码', result);
    verifyCode = result.data.code;

    // 11. 重置密码
    result = await request('POST', '/auth/reset-password', {
        phone: PHONE,
        smsCode: verifyCode,
        newPassword: '654321',
        confirmPassword: '654321'
    });
    log('重置密码', result);

    // 12. 用新密码登录
    console.log('\n--- 测试12: 新密码登录 ---');
    result = await request('POST', '/auth/login', {
        phone: PHONE,
        password: '654321'
    });
    log('新密码登录', result);

    // 13. 频率限制测试 - 快速连续发送
    console.log('\n--- 测试13: 频率限制（60秒内重复发送） ---');
    result = await request('POST', '/auth/send-sms', {
        phone: PHONE,
        type: 'login'
    });
    log('频率限制', result);

    // 14. 兼容旧接口 send-code
    console.log('\n--- 测试14: 兼容旧接口 send-code ---');
    result = await request('POST', '/auth/send-code', {
        phone: '13900139000'
    });
    log('旧接口 send-code', result);

    console.log('\n\n🧪 ======= 认证接口测试完成 =======');
}

runTests().catch(e => {
    console.error('❌ 测试运行错误:', e);
});
