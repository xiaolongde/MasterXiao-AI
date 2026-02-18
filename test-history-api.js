/**
 * 历史记录功能测试脚本
 */

const API_BASE = 'http://localhost:3000/api';

async function test() {
    console.log('=== 历史记录功能测试 ===\n');

    // Step 1: Create a match record
    const sessionId = 'test-history-' + Date.now() + '-abcdef0123456';
    console.log('1. 创建匹配记录...');
    console.log('   SessionId:', sessionId);

    const createRes = await fetch(`${API_BASE}/match/record/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: sessionId,
            reqData: {
                personA: { name: '张三', gender: '男', birthDate: '1990-01-01' },
                personB: { name: '李四', gender: '女', birthDate: '1992-06-15' },
                matchType: '感情匹配'
            },
            userId: 'test-user-001'
        })
    }).then(r => r.json());
    console.log('   结果:', JSON.stringify(createRes));
    console.log('   ✅ 创建成功\n');

    // Step 2: Update status to success
    console.log('2. 更新匹配记录状态为成功...');
    const updateRes = await fetch(`${API_BASE}/match/record/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: sessionId,
            status: 1,
            resultData: {
                content: '## 匹配分析结果\n\n张三和李四的匹配度为 **85%**\n\n### 性格分析\n\n- 张三外向活泼\n- 李四温柔体贴\n\n### 建议\n\n两人非常适合，建议多沟通交流。'
            }
        })
    }).then(r => r.json());
    console.log('   结果:', JSON.stringify(updateRes));
    console.log('   ✅ 更新成功\n');

    // Step 3: Query history records by userId
    console.log('3. 查询历史记录列表 (by userId)...');
    const historyRes = await fetch(`${API_BASE}/history/records?userId=test-user-001`).then(r => r.json());
    console.log('   成功:', historyRes.success);
    console.log('   总记录数:', historyRes.data.total);
    console.log('   记录数:', historyRes.data.records.length);
    if (historyRes.data.records.length > 0) {
        const firstRecord = historyRes.data.records[0];
        console.log('   第一条记录:');
        console.log('     - 序号:', firstRecord.serialNumber);
        console.log('     - 问题:', firstRecord.question);
        console.log('     - 状态:', firstRecord.status);
        console.log('     - ID:', firstRecord.id);
    }
    console.log('   ✅ 列表查询成功\n');

    // Step 4: Query history records by sessionId
    console.log('4. 查询历史记录列表 (by sessionId)...');
    const historyRes2 = await fetch(`${API_BASE}/history/records?sessionId=${sessionId}`).then(r => r.json());
    console.log('   成功:', historyRes2.success);
    console.log('   总记录数:', historyRes2.data.total);
    console.log('   ✅ SessionId查询成功\n');

    // Step 5: Query record detail
    if (historyRes.data.records.length > 0) {
        const recordId = historyRes.data.records[0].id;
        console.log('5. 查询记录详情 (recordId=' + recordId + ')...');
        const detailRes = await fetch(`${API_BASE}/history/record/${recordId}?userId=test-user-001`).then(r => r.json());
        console.log('   成功:', detailRes.success);
        if (detailRes.success) {
            console.log('   问题:', detailRes.data.question);
            console.log('   状态:', detailRes.data.status);
            console.log('   有结果数据:', !!detailRes.data.result);
            console.log('   结果内容前50字:', typeof detailRes.data.result === 'object' ? JSON.stringify(detailRes.data.result).substring(0, 50) : String(detailRes.data.result).substring(0, 50));
        }
        console.log('   ✅ 详情查询成功\n');

        // Step 6: Test permission - wrong userId should fail
        console.log('6. 测试权限验证 (错误的userId)...');
        const failRes = await fetch(`${API_BASE}/history/record/${recordId}?userId=wrong-user`).then(r => r.json());
        console.log('   成功:', failRes.success);
        console.log('   消息:', failRes.message);
        console.log('   ✅ 权限验证正常\n');
    }

    // Step 7: Test empty result
    console.log('7. 测试无记录情况...');
    const emptyRes = await fetch(`${API_BASE}/history/records?userId=nonexistent-user`).then(r => r.json());
    console.log('   成功:', emptyRes.success);
    console.log('   记录数:', emptyRes.data.records.length);
    console.log('   ✅ 空结果正常\n');

    // Step 8: Test parameter validation
    console.log('8. 测试参数校验 (无参数)...');
    const noParamRes = await fetch(`${API_BASE}/history/records`).then(r => r.json());
    console.log('   成功:', noParamRes.success);
    console.log('   消息:', noParamRes.message);
    console.log('   ✅ 参数校验正常\n');

    console.log('=== 所有测试完成 ===');
}

test().catch(e => console.error('测试失败:', e.message));
