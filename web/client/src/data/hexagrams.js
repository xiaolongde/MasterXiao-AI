/**
 * 匹配游戏 64种符号数据
 * 用于直觉卡牌测试结果展示
 */

export const hexagrams = [
    { id: 1, name: '乾', symbol: '☰', unicode: '\u2630', meaning: '刚健中正', element: '金', nature: '阳', description: '天行健，君子以自强不息' },
    { id: 2, name: '坤', symbol: '☷', unicode: '\u2637', meaning: '柔顺伸展', element: '土', nature: '阴', description: '地势坤，君子以厚德载物' },
    { id: 3, name: '屯', symbol: '☳☵', unicode: '\u4E69', meaning: '起始艰难', element: '水', nature: '阳', description: '云雷屯，君子以经纶' },
    { id: 4, name: '蒙', symbol: '☶☵', unicode: '\u4E69', meaning: '启蒙教育', element: '水', nature: '阴', description: '山下出泉，蒙' },
    { id: 5, name: '需', symbol: '☵☰', unicode: '\u4E69', meaning: '等待时机', element: '水', nature: '阳', description: '云上于天，需' },
    { id: 6, name: '讼', symbol: '☰☵', unicode: '\u4E69', meaning: '争讼之象', element: '金', nature: '阳', description: '天与水违行，讼' },
    { id: 7, name: '师', symbol: '☵☷', unicode: '\u4E69', meaning: '兵众之象', element: '水', nature: '阴', description: '地中有水，师' },
    { id: 8, name: '比', symbol: '☷☵', unicode: '\u4E69', meaning: '亲比和谐', element: '土', nature: '阴', description: '地上有水，比' },
    { id: 9, name: '小畜', symbol: '☴☰', unicode: '\u4E69', meaning: '小有积蓄', element: '木', nature: '阳', description: '风行天上，小畜' },
    { id: 10, name: '履', symbol: '☰☱', unicode: '\u4E69', meaning: '谨慎行事', element: '金', nature: '阳', description: '上天下泽，履' },
    { id: 11, name: '泰', symbol: '☷☰', unicode: '\u4E69', meaning: '通泰安康', element: '土', nature: '阳', description: '天地交，泰' },
    { id: 12, name: '否', symbol: '☰☷', unicode: '\u4E69', meaning: '闭塞不通', element: '金', nature: '阴', description: '天地不交，否' },
    { id: 13, name: '同人', symbol: '☰☲', unicode: '\u4E69', meaning: '同心协力', element: '金', nature: '阳', description: '天与火，同人' },
    { id: 14, name: '大有', symbol: '☲☰', unicode: '\u4E69', meaning: '丰收富有', element: '火', nature: '阳', description: '火在天上，大有' },
    { id: 15, name: '谦', symbol: '☷☶', unicode: '\u4E69', meaning: '谦虚谨慎', element: '土', nature: '阴', description: '地中有山，谦' },
    { id: 16, name: '豫', symbol: '☳☷', unicode: '\u4E69', meaning: '欢乐和豫', element: '木', nature: '阳', description: '雷出地奋，豫' },
    { id: 17, name: '随', symbol: '☱☳', unicode: '\u4E69', meaning: '随顺时势', element: '金', nature: '阳', description: '泽中有雷，随' },
    { id: 18, name: '蛊', symbol: '☶☴', unicode: '\u4E69', meaning: '整治祸乱', element: '木', nature: '阳', description: '山下有风，蛊' },
    { id: 19, name: '临', symbol: '☷☱', unicode: '\u4E69', meaning: '临事而惧', element: '土', nature: '阳', description: '泽上有地，临' },
    { id: 20, name: '观', symbol: '☴☷', unicode: '\u4E69', meaning: '观察审视', element: '木', nature: '阳', description: '风行地上，观' },
    { id: 21, name: '噬嗑', symbol: '☲☳', unicode: '\u4E69', meaning: '刑罚分明', element: '火', nature: '阳', description: '雷电噬嗑' },
    { id: 22, name: '贲', symbol: '☶☲', unicode: '\u4E69', meaning: '文饰光明', element: '木', nature: '阳', description: '山下有火，贲' },
    { id: 23, name: '剥', symbol: '☶☷', unicode: '\u4E69', meaning: '剥落衰败', element: '木', nature: '阴', description: '山附于地，剥' },
    { id: 24, name: '复', symbol: '☷☳', unicode: '\u4E69', meaning: '回复兴起', element: '土', nature: '阳', description: '雷在地中，复' },
    { id: 25, name: '无妄', symbol: '☰☳', unicode: '\u4E69', meaning: '无妄之灾', element: '金', nature: '阳', description: '天下雷行，无妄' },
    { id: 26, name: '大畜', symbol: '☶☰', unicode: '\u4E69', meaning: '大有积蓄', element: '木', nature: '阳', description: '天在山中，大畜' },
    { id: 27, name: '颐', symbol: '☶☳', unicode: '\u4E69', meaning: '颐养正道', element: '木', nature: '阳', description: '山下有雷，颐' },
    { id: 28, name: '大过', symbol: '☱☴', unicode: '\u4E69', meaning: '大过之象', element: '金', nature: '阳', description: '泽灭木，大过' },
    { id: 29, name: '坎', symbol: '☵☵', unicode: '\u4E69', meaning: '重重险难', element: '水', nature: '阳', description: '水洊至，习坎' },
    { id: 30, name: '离', symbol: '☲☲', unicode: '\u4E69', meaning: '光明照耀', element: '火', nature: '阴', description: '明两作，离' },
    { id: 31, name: '咸', symbol: '☱☶', unicode: '\u4E69', meaning: '感应相通', element: '金', nature: '阳', description: '山上有泽，咸' },
    { id: 32, name: '恒', symbol: '☳☴', unicode: '\u4E69', meaning: '恒久不变', element: '木', nature: '阳', description: '雷风恒' },
    { id: 33, name: '遁', symbol: '☰☶', unicode: '\u4E69', meaning: '退避隐遁', element: '金', nature: '阳', description: '天下有山，遁' },
    { id: 34, name: '大壮', symbol: '☳☰', unicode: '\u4E69', meaning: '壮大强盛', element: '木', nature: '阳', description: '雷在天上，大壮' },
    { id: 35, name: '晋', symbol: '☲☷', unicode: '\u4E69', meaning: '进取光明', element: '火', nature: '阳', description: '明出地上，晋' },
    { id: 36, name: '明夷', symbol: '☷☲', unicode: '\u4E69', meaning: '光明受损', element: '土', nature: '阴', description: '明入地中，明夷' },
    { id: 37, name: '家人', symbol: '☴☲', unicode: '\u4E69', meaning: '家庭和睦', element: '木', nature: '阳', description: '风自火出，家人' },
    { id: 38, name: '睽', symbol: '☲☱', unicode: '\u4E69', meaning: '背离乖异', element: '火', nature: '阴', description: '上火下泽，睽' },
    { id: 39, name: '蹇', symbol: '☵☶', unicode: '\u4E69', meaning: '艰难险阻', element: '水', nature: '阴', description: '山上有水，蹇' },
    { id: 40, name: '解', symbol: '☳☵', unicode: '\u4E69', meaning: '解除困难', element: '木', nature: '阳', description: '雷雨作，解' },
    { id: 41, name: '损', symbol: '☶☱', unicode: '\u4E69', meaning: '减损节制', element: '木', nature: '阳', description: '山下有泽，损' },
    { id: 42, name: '益', symbol: '☴☳', unicode: '\u4E69', meaning: '增益进取', element: '木', nature: '阳', description: '风雷益' },
    { id: 43, name: '夬', symbol: '☱☰', unicode: '\u4E69', meaning: '决断果断', element: '金', nature: '阳', description: '泽上于天，夬' },
    { id: 44, name: '姤', symbol: '☰☴', unicode: '\u4E69', meaning: '邂逅相遇', element: '金', nature: '阴', description: '天下有风，姤' },
    { id: 45, name: '萃', symbol: '☱☷', unicode: '\u4E69', meaning: '聚集汇合', element: '金', nature: '阴', description: '泽上于地，萃' },
    { id: 46, name: '升', symbol: '☷☴', unicode: '\u4E69', meaning: '上升进取', element: '土', nature: '阳', description: '地中生木，升' },
    { id: 47, name: '困', symbol: '☱☵', unicode: '\u4E69', meaning: '困顿穷厄', element: '金', nature: '阳', description: '泽无水，困' },
    { id: 48, name: '井', symbol: '☵☴', unicode: '\u4E69', meaning: '井养不穷', element: '水', nature: '阳', description: '木上有水，井' },
    { id: 49, name: '革', symbol: '☱☲', unicode: '\u4E69', meaning: '变革更新', element: '金', nature: '阳', description: '泽中有火，革' },
    { id: 50, name: '鼎', symbol: '☲☴', unicode: '\u4E69', meaning: '革故鼎新', element: '火', nature: '阳', description: '木上有火，鼎' },
    { id: 51, name: '震', symbol: '☳☳', unicode: '\u4E69', meaning: '震动警醒', element: '木', nature: '阳', description: '洊雷震' },
    { id: 52, name: '艮', symbol: '☶☶', unicode: '\u4E69', meaning: '止静安定', element: '土', nature: '阳', description: '兼山艮' },
    { id: 53, name: '渐', symbol: '☴☶', unicode: '\u4E69', meaning: '循序渐进', element: '木', nature: '阳', description: '山上有木，渐' },
    { id: 54, name: '归妹', symbol: '☳☱', unicode: '\u4E69', meaning: '归妹待嫁', element: '木', nature: '阴', description: '泽上有雷，归妹' },
    { id: 55, name: '丰', symbol: '☳☲', unicode: '\u4E69', meaning: '丰盛光大', element: '木', nature: '阳', description: '雷电皆至，丰' },
    { id: 56, name: '旅', symbol: '☲☶', unicode: '\u4E69', meaning: '旅途漂泊', element: '火', nature: '阴', description: '山上有火，旅' },
    { id: 57, name: '巽', symbol: '☴☴', unicode: '\u4E69', meaning: '顺从谦逊', element: '木', nature: '阴', description: '随风巽' },
    { id: 58, name: '兑', symbol: '☱☱', unicode: '\u4E69', meaning: '喜悦和悦', element: '金', nature: '阴', description: '丽泽兑' },
    { id: 59, name: '涣', symbol: '☴☵', unicode: '\u4E69', meaning: '涣散离散', element: '木', nature: '阳', description: '风行水上，涣' },
    { id: 60, name: '节', symbol: '☵☱', unicode: '\u4E69', meaning: '节制有度', element: '水', nature: '阴', description: '泽上有水，节' },
    { id: 61, name: '中孚', symbol: '☴☱', unicode: '\u4E69', meaning: '诚信感化', element: '木', nature: '阳', description: '泽上有风，中孚' },
    { id: 62, name: '小过', symbol: '☳☶', unicode: '\u4E69', meaning: '小有过越', element: '木', nature: '阴', description: '山上有雷，小过' },
    { id: 63, name: '既济', symbol: '☵☲', unicode: '\u4E69', meaning: '事业已成', element: '水', nature: '阳', description: '水在火上，既济' },
    { id: 64, name: '未济', symbol: '☲☵', unicode: '\u4E69', meaning: '事业未成', element: '火', nature: '阴', description: '火在水上，未济' }
];

/**
 * 获取随机符号
 * @param {number} count - 数量
 */
export function getRandomHexagrams(count = 6) {
    const shuffled = [...hexagrams].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * 根据 ID 获取符号
 */
export function getHexagramById(id) {
    return hexagrams.find(h => h.id === id);
}

/**
 * 根据名称获取符号
 */
export function getHexagramByName(name) {
    return hexagrams.find(h => h.name === name);
}

/**
 * 获取五行对应的符号
 */
export function getHexagramsByElement(element) {
    return hexagrams.filter(h => h.element === element);
}

/**
 * 卡牌背面样式（用于展示）
 */
export const cardBackStyles = [
    { id: 'classic', name: '经典', pattern: 'stars', color: '#1A1A2E' },
    { id: 'mystical', name: '神秘', pattern: 'moon', color: '#2D2D4A' },
    { id: 'golden', name: '金色', pattern: 'sun', color: '#3D3020' }
];

export default hexagrams;
