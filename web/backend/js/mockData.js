/**
 * 模拟数据
 */

const MockData = {
    // 统计数据
    stats: {
        totalUsers: 1286,
        totalOrders: 3542,
        totalRevenue: 156800,
        totalMatches: 8923
    },

    // 用户数据
    users: [
        { id: 1, name: '张三', phone: '138****1234', email: 'zhang@example.com', registerTime: '2026-01-15 14:30:00', status: 'active' },
        { id: 2, name: '李四', phone: '139****5678', email: 'li@example.com', registerTime: '2026-01-18 09:22:00', status: 'active' },
        { id: 3, name: '王五', phone: '137****9012', email: 'wang@example.com', registerTime: '2026-01-20 16:45:00', status: 'active' },
        { id: 4, name: '赵六', phone: '136****3456', email: 'zhao@example.com', registerTime: '2026-01-22 11:15:00', status: 'pending' },
        { id: 5, name: '孙七', phone: '135****7890', email: 'sun@example.com', registerTime: '2026-01-25 20:30:00', status: 'active' },
        { id: 6, name: '周八', phone: '134****2345', email: 'zhou@example.com', registerTime: '2026-01-28 08:00:00', status: 'active' },
        { id: 7, name: '吴九', phone: '133****6789', email: 'wu@example.com', registerTime: '2026-02-01 13:20:00', status: 'pending' },
        { id: 8, name: '郑十', phone: '132****0123', email: 'zheng@example.com', registerTime: '2026-02-03 17:45:00', status: 'active' },
    ],

    // 订单数据
    orders: [
        { id: 'ORD202602040001', user: '张三', type: '生日匹配', amount: 29.9, payTime: '2026-02-04 10:30:22', status: 'success' },
        { id: 'ORD202602040002', user: '李四', type: '卡牌匹配', amount: 19.9, payTime: '2026-02-04 11:15:43', status: 'success' },
        { id: 'ORD202602040003', user: '王五', type: '生日匹配', amount: 29.9, payTime: '2026-02-04 12:08:15', status: 'pending' },
        { id: 'ORD202602040004', user: '赵六', type: '卡牌匹配', amount: 19.9, payTime: '2026-02-04 13:22:38', status: 'success' },
        { id: 'ORD202602040005', user: '孙七', type: '生日匹配', amount: 29.9, payTime: '2026-02-04 14:45:10', status: 'failed' },
        { id: 'ORD202602040006', user: '周八', type: '生日匹配', amount: 29.9, payTime: '2026-02-04 15:30:55', status: 'success' },
        { id: 'ORD202602040007', user: '吴九', type: '卡牌匹配', amount: 19.9, payTime: '2026-02-04 16:18:27', status: 'success' },
        { id: 'ORD202602040008', user: '郑十', type: '生日匹配', amount: 29.9, payTime: '2026-02-04 17:05:42', status: 'pending' },
    ],

    // 生日匹配记录
    birthdayMatches: [
        { id: 1, user1: '张三', birthday1: '1995-03-15', user2: '李四', birthday2: '1996-08-22', matchScore: 92, createTime: '2026-02-04 10:30:00' },
        { id: 2, user1: '王五', birthday1: '1994-12-08', user2: '赵六', birthday2: '1995-05-18', matchScore: 85, createTime: '2026-02-04 11:45:00' },
        { id: 3, user1: '孙七', birthday1: '1997-01-25', user2: '周八', birthday2: '1996-09-10', matchScore: 78, createTime: '2026-02-04 13:20:00' },
        { id: 4, user1: '吴九', birthday1: '1993-07-03', user2: '郑十', birthday2: '1994-11-28', matchScore: 88, createTime: '2026-02-04 14:55:00' },
        { id: 5, user1: '陈一', birthday1: '1998-04-12', user2: '林二', birthday2: '1997-06-30', matchScore: 95, createTime: '2026-02-04 16:10:00' },
    ],

    // 卡牌匹配记录
    cardMatches: [
        { id: 1, user: '张三', cardType: '塔罗牌', cards: '愚者、魔术师、女祭司', result: '事业运势上升', createTime: '2026-02-04 09:15:00' },
        { id: 2, user: '李四', cardType: '塔罗牌', cards: '皇帝、恋人、战车', result: '感情顺利发展', createTime: '2026-02-04 10:30:00' },
        { id: 3, user: '王五', cardType: '塔罗牌', cards: '力量、隐士、命运之轮', result: '适合自我提升', createTime: '2026-02-04 11:45:00' },
        { id: 4, user: '赵六', cardType: '塔罗牌', cards: '正义、倒吊人、死神', result: '需要做出改变', createTime: '2026-02-04 13:00:00' },
        { id: 5, user: '孙七', cardType: '塔罗牌', cards: '节制、恶魔、高塔', result: '注意平衡生活', createTime: '2026-02-04 14:30:00' },
    ],

    // 用户增长统计（月度）
    userGrowthMonthly: [
        { month: '2025-09', newUsers: 156, totalUsers: 450 },
        { month: '2025-10', newUsers: 203, totalUsers: 653 },
        { month: '2025-11', newUsers: 245, totalUsers: 898 },
        { month: '2025-12', newUsers: 189, totalUsers: 1087 },
        { month: '2026-01', newUsers: 312, totalUsers: 1399 },
        { month: '2026-02', newUsers: 187, totalUsers: 1586 }
    ],

    // 用户增长统计（日度 - 最近7天）
    userGrowthDaily: [
        { date: '2026-01-29', newUsers: 23 },
        { date: '2026-01-30', newUsers: 31 },
        { date: '2026-01-31', newUsers: 28 },
        { date: '2026-02-01', newUsers: 45 },
        { date: '2026-02-02', newUsers: 52 },
        { date: '2026-02-03', newUsers: 38 },
        { date: '2026-02-04', newUsers: 19 }
    ],

    // 匹配类型统计
    matchTypeStats: [
        { id: 'love', icon: '💑', title: '感情匹配', totalUsers: 2856, maleCount: 1142, femaleCount: 1714 },
        { id: 'career', icon: '💼', title: '职场关系', totalUsers: 1523, maleCount: 853, femaleCount: 670 },
        { id: 'cooperation', icon: '🤝', title: '合作关系', totalUsers: 892, maleCount: 534, femaleCount: 358 },
        { id: 'thoughts', icon: '💭', title: 'TA的想法和态度', totalUsers: 2134, maleCount: 747, femaleCount: 1387 },
        { id: 'job', icon: '📈', title: '职业发展', totalUsers: 1245, maleCount: 685, femaleCount: 560 },
        { id: 'city', icon: '🗺️', title: '城市方向', totalUsers: 678, maleCount: 380, femaleCount: 298 },
        { id: 'peach', icon: '🌸', title: '社交魅力', totalUsers: 1867, maleCount: 560, femaleCount: 1307 },
        { id: 'benefactor', icon: '⭐', title: '人脉分析', totalUsers: 534, maleCount: 294, femaleCount: 240 },
        { id: 'yesno', icon: '❓', title: 'Yes or No', totalUsers: 3421, maleCount: 1197, femaleCount: 2224 },
        { id: 'choice', icon: '⚖️', title: '二选一', totalUsers: 1756, maleCount: 667, femaleCount: 1089 }
    ]
};

// 导出数据供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockData;
}
