/**
 * 测试塔罗牌API
 */

import https from 'https';
import http from 'http';

const testData = {
    question: "我的事业发展会如何？",
    questionType: "事业",
    selectedCards: [
        { id: 1, slot: 0, label: "目标" },
        { id: 5, slot: 1, label: "动力" },
        { id: 10, slot: 2, label: "障碍" },
        { id: 15, slot: 3, label: "资源" },
        { id: 20, slot: 4, label: "支持" },
        { id: 25, slot: 5, label: "结果" }
    ],
    userInfo: {
        gender: "男",
        birthDate: "1990-01-01"
    }
};

const postData = JSON.stringify(testData);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/tarot/interpret',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('发送测试请求...');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('数据:', JSON.stringify(testData, null, 2));

const req = http.request(options, (res) => {
    console.log(`\n状态码: ${res.statusCode}`);
    console.log('响应头:', res.headers);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n响应内容:');
        try {
            const jsonData = JSON.parse(data);
            console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`请求失败: ${e.message}`);
});

req.write(postData);
req.end();
