/**
 * 78张标准塔罗牌数据
 * 22张大阿尔卡纳 + 56张小阿尔卡纳
 * 仅供娱乐参考，不构成任何专业建议
 */

// 22张大阿卡纳牌
export const MAJOR_ARCANA = [
    { id: 0, name: '愚者', symbol: '🃏', upright: '新的开始、冒险精神、纯真', reversed: '冲动、缺乏计划', element: '风' },
    { id: 1, name: '魔术师', symbol: '🎩', upright: '创造力、自信、技能', reversed: '缺乏方向、能力受限', element: '风' },
    { id: 2, name: '女祭司', symbol: '🌙', upright: '直觉、智慧、内在洞察', reversed: '忽视直觉、信息不足', element: '水' },
    { id: 3, name: '皇后', symbol: '👑', upright: '丰饶、关爱、创造力', reversed: '过度依赖、创造力受阻', element: '土' },
    { id: 4, name: '皇帝', symbol: '🏛️', upright: '权威、稳定、领导力', reversed: '过于控制、缺乏灵活', element: '火' },
    { id: 5, name: '教皇', symbol: '📿', upright: '传统、指导、精神追求', reversed: '思想僵化、缺乏创新', element: '土' },
    { id: 6, name: '恋人', symbol: '💕', upright: '爱情、和谐、选择', reversed: '关系失衡、选择困难', element: '风' },
    { id: 7, name: '战车', symbol: '🏇', upright: '胜利、决心、行动力', reversed: '方向不明、缺乏控制', element: '水' },
    { id: 8, name: '力量', symbol: '🦁', upright: '内在力量、勇气、耐心', reversed: '自我怀疑、缺乏信心', element: '火' },
    { id: 9, name: '隐士', symbol: '🏔️', upright: '内省、寻求智慧、独处', reversed: '孤立、过度封闭', element: '土' },
    { id: 10, name: '机遇之轮', symbol: '🎡', upright: '转变、机遇、新阶段', reversed: '逆境、抗拒改变', element: '火' },
    { id: 11, name: '正义', symbol: '⚖️', upright: '公平、真相、因果', reversed: '不公、逃避责任', element: '风' },
    { id: 12, name: '倒吊人', symbol: '🙃', upright: '新视角、牺牲、等待', reversed: '拖延、无谓牺牲', element: '水' },
    { id: 13, name: '死神', symbol: '🦋', upright: '转变、结束与新生', reversed: '抗拒改变、停滞', element: '水' },
    { id: 14, name: '节制', symbol: '🏺', upright: '平衡、耐心、调和', reversed: '失衡、过度', element: '火' },
    { id: 15, name: '恶魔', symbol: '🔗', upright: '束缚、欲望、物质', reversed: '解脱、摆脱限制', element: '土' },
    { id: 16, name: '塔', symbol: '🗼', upright: '突变、觉醒、重建', reversed: '逃避改变、延迟', element: '火' },
    { id: 17, name: '星星', symbol: '⭐', upright: '希望、灵感、平静', reversed: '失望、缺乏信心', element: '风' },
    { id: 18, name: '月亮', symbol: '🌑', upright: '直觉、潜意识、情绪', reversed: '困惑、恐惧', element: '水' },
    { id: 19, name: '太阳', symbol: '☀️', upright: '快乐、成功、活力', reversed: '暂时受阻、过度乐观', element: '火' },
    { id: 20, name: '审判', symbol: '📯', upright: '觉醒、评估、新阶段', reversed: '自我批判、拒绝改变', element: '火' },
    { id: 21, name: '世界', symbol: '🌍', upright: '完成、整合、成就', reversed: '未完成、缺乏闭合', element: '土' }
];

// 56张小阿尔卡纳牌
const SUIT_WANDS = { suit: '权杖', suitSymbol: '🔥', element: '火' };
const SUIT_CUPS = { suit: '圣杯', suitSymbol: '💧', element: '水' };
const SUIT_SWORDS = { suit: '宝剑', suitSymbol: '⚔️', element: '风' };
const SUIT_PENTACLES = { suit: '星币', suitSymbol: '⭕', element: '土' };

const MINOR_NAMES = ['Ace', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍从', '骑士', '王后', '国王'];

function buildMinorArcana() {
    const suits = [SUIT_WANDS, SUIT_CUPS, SUIT_SWORDS, SUIT_PENTACLES];
    const cards = [];
    let id = 22; // 从22开始编号
    for (const s of suits) {
        for (let rank = 0; rank < 14; rank++) {
            const label = MINOR_NAMES[rank];
            cards.push({
                id: id++,
                name: `${s.suit}${label}`,
                symbol: s.suitSymbol,
                suit: s.suit,
                rank: rank + 1,
                element: s.element,
                upright: '',
                reversed: ''
            });
        }
    }
    return cards;
}

export const MINOR_ARCANA = buildMinorArcana();

/** 完整78张塔罗牌 */
export const FULL_DECK = [...MAJOR_ARCANA, ...MINOR_ARCANA];

/**
 * 从78张中随机抽取count张牌
 * @param {number} count - 抽取数量
 * @returns {Array} 抽到的牌数组 (含 id, name, symbol, suit 等)
 */
export function drawFromFullDeck(count = 6) {
    const deck = [...FULL_DECK];
    const drawn = [];
    for (let i = 0; i < count && deck.length > 0; i++) {
        const ri = Math.floor(Math.random() * deck.length);
        drawn.push({ ...deck[ri] });
        deck.splice(ri, 1);
    }
    return drawn;
}

/**
 * 根据正位牌数量获取能量类型
 * @param {number} uprightCount - 正位朝上的牌数 (0-6)
 */
export function getEnergyType(uprightCount) {
    if (uprightCount >= 5) {
        return {
            type: 'very_positive',
            name: '强正向能量',
            symbol: '☀️',
            description: '整体能量非常积极正面',
            score: 85 + Math.floor(Math.random() * 10)
        };
    } else if (uprightCount >= 4) {
        return {
            type: 'positive',
            name: '正向能量',
            symbol: '⭐',
            description: '整体趋势积极向好',
            score: 70 + Math.floor(Math.random() * 15)
        };
    } else if (uprightCount >= 3) {
        return {
            type: 'balanced',
            name: '平衡能量',
            symbol: '⚖️',
            description: '需要双方共同努力',
            score: 55 + Math.floor(Math.random() * 15)
        };
    } else if (uprightCount >= 2) {
        return {
            type: 'challenging',
            name: '挑战能量',
            symbol: '🌙',
            description: '存在一些需要面对的挑战',
            score: 40 + Math.floor(Math.random() * 15)
        };
    } else {
        return {
            type: 'reflective',
            name: '反思能量',
            symbol: '🌑',
            description: '建议暂时观望，内省调整',
            score: 25 + Math.floor(Math.random() * 15)
        };
    }
}

/**
 * 随机抽取一张卡牌
 * @param {Array} excludeIds - 需要排除的牌ID数组
 */
export function drawCard(excludeIds = []) {
    const availableCards = MAJOR_ARCANA.filter(card => !excludeIds.includes(card.id));
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];
    const isUpright = Math.random() > 0.5;
    
    return {
        ...card,
        isUpright,
        meaning: isUpright ? card.upright : card.reversed,
        position: isUpright ? '正位' : '逆位'
    };
}

/**
 * 抽取指定数量的卡牌
 * @param {number} count - 抽取数量
 */
export function drawCards(count = 6) {
    const drawnIds = [];
    const cards = [];
    
    for (let i = 0; i < count; i++) {
        const card = drawCard(drawnIds);
        drawnIds.push(card.id);
        cards.push(card);
    }
    
    return cards;
}

/**
 * 生成卡牌分析结果
 * @param {Array} cards - 抽取的牌数组
 * @param {string} matchType - 匹配类型
 */
export function generateTarotReading(cards, matchType) {
    const uprightCount = cards.filter(c => c.isUpright).length;
    const energy = getEnergyType(uprightCount);
    
    // 根据匹配类型生成解读
    const typeReadings = {
        'love': generateLoveReading(cards, energy),
        'career': generateCareerReading(cards, energy),
        'cooperation': generateCooperationReading(cards, energy),
        'thoughts': generateThoughtsReading(cards, energy),
        'job': generateJobReading(cards, energy),
        'city': generateCityReading(cards, energy),
        'peach': generateSocialReading(cards, energy),
        'benefactor': generateBenefactorReading(cards, energy),
        'yesno': generateYesNoReading(cards, energy),
        'choice': generateChoiceReading(cards, energy)
    };
    
    return {
        cards,
        energy,
        reading: typeReadings[matchType] || generateGeneralReading(cards, energy),
        score: energy.score,
        disclaimer: '本测试结果仅供娱乐参考，不构成任何专业建议。请理性看待测试结果。'
    };
}

// 各类型解读生成函数
function generateLoveReading(cards, energy) {
    const conclusions = {
        'very_positive': '双方性格特质显示出高度的契合与互补，建议珍惜这份默契，通过良好沟通进一步增进了解。',
        'positive': '整体契合度良好，双方在某些方面存在互补优势。建议保持开放的心态，多创造共同话题。',
        'balanced': '双方需要更多的理解与磨合。建议增加沟通频率，尊重彼此的差异性。',
        'challenging': '存在一些性格差异需要面对。建议放慢节奏，先从朋友的角度相互了解。',
        'reflective': '当前可能不是最佳时机，建议先专注于自我提升，给彼此一些空间和时间。'
    };
    return conclusions[energy.type];
}

function generateCareerReading(cards, energy) {
    const conclusions = {
        'very_positive': '职场人际关系处于良好状态，团队协作顺利。建议继续保持积极主动的工作态度。',
        'positive': '与同事/领导的关系整体和谐，存在良好的合作基础。建议适时表达自己的想法。',
        'balanced': '职场关系需要更多经营。建议主动沟通，明确各自的职责和期望。',
        'challenging': '可能存在一些沟通障碍。建议换位思考，避免不必要的误解。',
        'reflective': '建议暂时观察，调整自己的工作方式，寻找更合适的切入点。'
    };
    return conclusions[energy.type];
}

function generateCooperationReading(cards, energy) {
    const conclusions = {
        'very_positive': '合作前景看好，双方目标一致且互有优势。建议明确分工，发挥各自所长。',
        'positive': '合作基础良好，但需要建立清晰的规则。建议签订书面协议，明确权责。',
        'balanced': '合作需要更多磨合。建议先进行小规模试点，再决定是否深入合作。',
        'challenging': '存在一些潜在风险。建议充分调研，做好风险评估后再做决定。',
        'reflective': '当前时机可能不够成熟。建议暂缓决定，继续观察和收集信息。'
    };
    return conclusions[energy.type];
}

function generateThoughtsReading(cards, energy) {
    const conclusions = {
        'very_positive': '对方对你持有积极正面的印象，对你的关注度较高。建议主动创造交流机会。',
        'positive': '对方对你有一定好感，但可能还在观察阶段。建议保持自然，展现真实的自己。',
        'balanced': '对方的态度比较中立，需要更多互动来加深印象。建议找到共同话题。',
        'challenging': '对方可能有一些顾虑或保留。建议给对方一些时间和空间。',
        'reflective': '对方当前可能有其他关注的事情。建议暂时减少期待，专注于自我成长。'
    };
    return conclusions[energy.type];
}

function generateJobReading(cards, energy) {
    const conclusions = {
        'very_positive': '职业发展前景乐观，当前方向正确。建议继续精进专业技能，把握机会。',
        'positive': '职业道路整体顺利，有上升空间。建议拓展人脉，增加曝光度。',
        'balanced': '职业发展需要更明确的规划。建议设定阶段性目标，稳步前进。',
        'challenging': '可能遇到一些瓶颈。建议学习新技能，寻找突破点。',
        'reflective': '建议暂停下来思考真正想要的方向，必要时可以寻求职业咨询。'
    };
    return conclusions[energy.type];
}

function generateCityReading(cards, energy) {
    const conclusions = {
        'very_positive': '所选方向非常适合你的发展，建议积极准备，把握机会。',
        'positive': '整体方向不错，有发展潜力。建议做好调研，了解当地情况。',
        'balanced': '各有利弊，需要综合考量。建议列出优缺点，根据自身情况决定。',
        'challenging': '可能存在一些适应挑战。建议先短期尝试，再做长期决定。',
        'reflective': '当前可能不是最佳时机。建议暂缓决定，继续收集信息。'
    };
    return conclusions[energy.type];
}

function generateSocialReading(cards, energy) {
    const conclusions = {
        'very_positive': '社交魅力值很高，人际吸引力强。建议多参加社交活动，展现自我。',
        'positive': '社交状态良好，有不错的人缘。建议保持真诚，拓展社交圈。',
        'balanced': '社交能力需要提升。建议主动学习社交技巧，增加互动。',
        'challenging': '可能有些社交压力。建议放松心态，从小范围社交开始。',
        'reflective': '建议暂时关注内在修养，提升自信后再拓展社交。'
    };
    return conclusions[energy.type];
}

function generateBenefactorReading(cards, energy) {
    const conclusions = {
        'very_positive': '身边有潜在的助力者，建议留意那些愿意给你建议的人。',
        'positive': '有获得帮助的机会，建议主动寻求指导，虚心请教。',
        'balanced': '需要自己主动出击。建议扩大社交圈，建立有价值的人脉关系。',
        'challenging': '当前主要依靠自己。建议提升自身能力，吸引志同道合的人。',
        'reflective': '建议先专注于自我成长，好的人脉关系自然会到来。'
    };
    return conclusions[energy.type];
}

function generateYesNoReading(cards, energy) {
    const conclusions = {
        'very_positive': '从测试结果看，可以积极行动，但仍需做好充分准备。',
        'positive': '整体倾向积极，建议在做好规划后行动。',
        'balanced': '需要更多信息才能做出判断。建议收集更多资料后再决定。',
        'challenging': '建议暂缓行动，等待更好的时机。',
        'reflective': '当前不建议仓促决定，给自己更多思考时间。'
    };
    return conclusions[energy.type];
}

function generateChoiceReading(cards, energy) {
    const conclusions = {
        'very_positive': '两个选择都有其优势，建议选择更符合长期目标的选项。',
        'positive': '其中一个选择略占优势，建议综合考虑后做决定。',
        'balanced': '两个选择各有利弊，建议列出详细对比，理性分析。',
        'challenging': '两个选择都存在挑战，建议寻找第三种可能。',
        'reflective': '建议暂时不做选择，给自己更多时间考虑。'
    };
    return conclusions[energy.type];
}

function generateGeneralReading(cards, energy) {
    return energy.description + '建议保持开放的心态，理性看待测试结果。';
}

export default {
    MAJOR_ARCANA,
    getEnergyType,
    drawCard,
    drawCards,
    generateTarotReading
};
