/**
 * 匹配游戏 匹配类型数据
 * 10种匹配分析类型定义
 */
/**
 * 小红书跳转链接示例：
 * http://localhost:5173/xhs?t=job
 * t参数可选值：love、cooperation、city、job
 * 点击"开始测试"后直接跳转到对应的测试页面：
 * http://localhost:5173/test/love/birthday
 */
export const matchTypes = [
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
    },
    {
        id: 'pet',
        icon: '🐾',
        title: '宠物匹配',
        description: '找到最适合你的萌宠伙伴',
        longDescription: '根据你的性格特征和生活习惯，分析最适合你的宠物类型，找到与你最合拍的萌宠伙伴。',
        price: 19.9,
        category: 'relationship',
        popular: false,
        features: ['性格宠物匹配', '养宠建议', '互动指导']
    }
];

/**
 * 按分类获取匹配类型
 */
export function getMatchTypesByCategory(category) {
    return matchTypes.filter(type => type.category === category);
}

/**
 * 获取热门匹配类型
 */
export function getPopularMatchTypes() {
    return matchTypes.filter(type => type.popular);
}

/**
 * 根据 ID 获取匹配类型
 */
export function getMatchTypeById(id) {
    return matchTypes.find(type => type.id === id);
}

/**
 * 匹配类型分类
 */
export const categories = [
    { id: 'relationship', name: '感情关系', icon: '💕' },
    { id: 'career', name: '职场事业', icon: '💼' },
    { id: 'direction', name: '方向指引', icon: '🧭' },
    { id: 'decision', name: '决策判断', icon: '⚖️' }
];

export default matchTypes;
