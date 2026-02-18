/**
 * 历史记录路由
 * 提供用户历史匹配记录查询接口
 */
import express from 'express';
import { SessionMatchRecord } from '../database/models/index.js';

const router = express.Router();
const matchTypes = [
    {
        id: 'love',
        icon: '💑',
        title: '感情匹配',
        description: '测试你们的契合指数',
        longDescription: '通过生日特质或直觉塔罗分析，深入了解你与TA之间的性格契合度，探索两人性格的互补与摩擦点。',
        price: 29.9,
        category: 'relationship',
        popular: true,
        features: ['性格特质分析', '性格互补性评估', '相处建议']
    },
    {
        id: 'career',
        icon: '💼',
        title: '职场关系',
        description: '解析职场人际关系',
        longDescription: '分析你与同事、领导之间的相处之道，了解职场中的潜在助力与阻力。',
        price: 29.9,
        category: 'career',
        popular: true,
        features: ['领导关系分析', '同事相处建议', '职场风险提示']
    },
    {
        id: 'cooperation',
        icon: '🤝',
        title: '合作关系',
        description: '看清合作对象，早做决定',
        longDescription: '评估你与潜在合作伙伴的契合度，分析合作中可能遇到的挑战与机遇。',
        price: 29.9,
        category: 'career',
        popular: false,
        features: ['合作契合度评分', '风险预警', '合作策略建议']
    },
    {
        id: 'thoughts',
        icon: '💭',
        title: 'TA的想法和态度',
        description: '揭开TA的真实想法',
        longDescription: '通过直觉塔罗测试，探索对方内心的真实想法和对你的态度。',
        price: 29.9,
        category: 'relationship',
        popular: true,
        features: ['对方心理分析', '真实态度解读', '沟通建议']
    },
    {
        id: 'job',
        icon: '📈',
        title: '职业发展',
        description: '找到最适合你的职业方向',
        longDescription: '基于你的性格特征分析，为你推荐最适合的职业发展方向。',
        price: 29.9,
        category: 'career',
        popular: false,
        features: ['性格职业匹配', '行业推荐', '发展路径规划']
    },
    {
        id: 'city',
        icon: '🗺️',
        title: '城市方向',
        description: '哪座城市最适合你发展',
        longDescription: '根据你的出生地和性格特征，分析最适合你发展的城市方向。',
        price: 29.9,
        category: 'direction',
        popular: false,
        features: ['方位适配分析', '城市推荐', '发展建议']
    },
    {
        id: 'peach',
        icon: '🌸',
        title: '社交魅力',
        description: '测试你的社交魅力值',
        longDescription: '分析你近期的社交状态，了解提升人际吸引力的方式。',
        price: 29.9,
        category: 'relationship',
        popular: true,
        features: ['社交魅力分析', '提升建议', '人际关系指导']
    },
    {
        id: 'benefactor',
        icon: '⭐',
        title: '人脉分析',
        description: '发现你身边的助力者',
        longDescription: '分析适合你的人脉特征，帮助你识别和拓展有价值的人际关系。',
        price: 29.9,
        category: 'direction',
        popular: false,
        features: ['人脉特征分析', '识别方法', '社交建议']
    },
    {
        id: 'yesno',
        icon: '❓',
        title: 'Yes or No',
        description: '犹豫时，快速帮你判断',
        longDescription: '面对选择犹豫不决？让直觉塔罗给你一个参考答案。',
        price: 19.9,
        category: 'decision',
        popular: true,
        features: ['快速测试', '明确答案', '行动建议']
    },
    {
        id: 'choice',
        icon: '⚖️',
        title: '二选一',
        description: '左右为难？帮你稳妥选对',
        longDescription: '两个选择左右为难？直觉塔罗帮你分析每个选择的利弊。',
        price: 19.9,
        category: 'decision',
        popular: false,
        features: ['双选对比分析', '利弊权衡', '最优建议']
    }
];
/**
 * 获取历史记录列表
 * GET /api/history/records?sessionId=xxx&userId=xxx&page=1&pageSize=20
 */
router.get('/records', (req, res) => {
    try {
        const { sessionId, userId, page = 1, pageSize = 20 } = req.query;

        // 至少需要一个查询条件
        if (!sessionId && !userId) {
            return res.status(400).json({
                success: false,
                message: '请提供 sessionId 或 userId',
                data: null
            });
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const size = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
        const offset = (pageNum - 1) * size;

        // 优先使用 userId 查询，userId 不存在时才使用 sessionId
        const queryCondition = userId ? { userId } : { sessionId };

        // 使用 findHistory 方法查询
        const { records, total } = SessionMatchRecord.findHistory(
            queryCondition,
            { limit: size, offset }
        );

        // 格式化返回数据
        const formattedRecords = records.map((record, index) => {
            // 优先使用独立的 type 字段，兼容从 req_data 中提取
            let question = '未知问题';
            let recordType = record.type;
            let recordMethod = record.method;
            
            if (!recordType && record.req_data) {
                const reqData = typeof record.req_data === 'string'
                    ? JSON.parse(record.req_data)
                    : record.req_data;
                recordType = reqData.type;
                recordMethod = recordMethod || reqData.method;
            }

            if (recordType) {
                let typeRes = matchTypes.find(t => t.id === recordType);
                question = typeRes ? typeRes.title : `未知匹配`;
            }

            return {
                id: record.id,
                sessionId: record.session_id,
                serialNumber: offset + index + 1,
                question: question,
                type: recordType || null,
                method: recordMethod || null,
                createTime: record.create_date,
                status: record.status === 1 ? '匹配成功' : (record.status === 2 ? '匹配失败' : '匹配中'),
                result_data: record.result_data ? '有结果' : null
            };
        });
        console.log(formattedRecords)
        res.json({
            success: true,
            data: {
                records: formattedRecords,
                total,
                page: pageNum,
                pageSize: size
            }
        });
    } catch (error) {
        console.error('获取历史记录列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误: ' + error.message,
            data: null
        });
    }
});

/**
 * 获取单条记录详情
 * GET /api/history/record/:recordId?sessionId=xxx
 */
router.get('/record/:recordId', (req, res) => {
    try {
        const { recordId } = req.params;
        const { sessionId, userId } = req.query;

        if (!recordId) {
            return res.status(400).json({
                success: false,
                message: '缺少记录ID',
                data: null
            });
        }

        // 查询记录
        const record = SessionMatchRecord.findById(parseInt(recordId));

        if (!record) {
            return res.status(404).json({
                success: false,
                message: '记录不存在',
                data: null
            });
        }

        // 权限验证：确认记录属于请求方
        const isOwner = (sessionId && record.session_id === sessionId) ||
                        (userId && record.user_id === userId);

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: '无权访问此记录',
                data: null
            });
        }

        // 解析 result_data
        let resultData = record.result_data;
        if (typeof resultData === 'string') {
            try {
                resultData = JSON.parse(resultData);
            } catch (e) { /* ignore */ }
        }

        // 解析 req_data
        let reqData = record.req_data;
        if (typeof reqData === 'string') {
            try {
                reqData = JSON.parse(reqData);
            } catch (e) { /* ignore */ }
        }

       let question = '未知问题';
            if (record.req_data) {
                const reqData = typeof record.req_data === 'string'
                    ? JSON.parse(record.req_data)
                    : record.req_data;

                let typeRes = matchTypes.find(t => t.id === reqData.type);
                question = typeRes ? typeRes.title : `未知匹配`;
            }

        res.json({
            success: true,
            data: {
                id: record.id,
                sessionId: record.session_id,
                question: question,
                reqData: reqData,
                result: resultData,
                createTime: record.create_date,
                status: record.status === 1 ? '匹配成功' : (record.status === 2 ? '匹配失败' : '匹配中')
            }
        });
    } catch (error) {
        console.error('获取记录详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误: ' + error.message,
            data: null
        });
    }
});

export default router;
