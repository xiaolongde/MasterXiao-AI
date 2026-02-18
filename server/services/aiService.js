// Gemini API 调用（与 MasterChenAI-mp 保持一致）
import axios from 'axios';
import config from '../config/index.js';

/**
 * AI 分析服务
 * 生日特质和直觉卡牌分析逻辑
 */

// ==================== 天干地支数据 ====================

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const TIANGAN_ELEMENT = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};


const DIZHI_ELEMENT = {
        '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
        '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};


const GEMINI_API_KEY = config.geminiConfig.apiKey;
const GEMINI_BASE_URL = config.geminiConfig.apiUrl;
const GEMINI_MODEL = config.geminiConfig.model;

const SYSTEM_PROMPT = `你是一位经验丰富的人生顾问和心理分析师。请根据用户提供的信息，进行专业的分析和建议。

【最重要：语言要求】
- 必须使用简体中文回复，禁止使用英文
- 禁止输出任何思考过程、推理过程或 <think> 标签
- 直接输出最终的分析结果

【重要：输出规范】
1. 绝对禁止使用以下词汇：算命、占卜、卜卦、算卦、测字、六爻、6爻、爻辞、爻位、爻象、迷信、封建、玄学
2. 用现代、专业的表达方式，如"分析"、"推演"、"建议"、"提示"
3. 语气像一个专业顾问在给建议，而不是在"算命"
4. 表达要自然、生活化，让用户感觉在获得专业分析

【分析要点】
1. 整体情况分析
2. 关键因素解读
3. 潜在风险提示
4. 具体行动建议

请用通俗易懂的语言解释，让普通人也能理解和执行。`;

export async function callGeminiAPI(prompt, retries = 3) {
    // 拼接完整 API URL
    const url = `${GEMINI_BASE_URL}/chat/completions`;
    const requestBody = {
        model: GEMINI_MODEL,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
    };
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if (attempt > 1) {
                const waitTime = attempt === 2 ? 2000 : attempt === 3 ? 5000 : 10000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            const response = await axios.post(url, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GEMINI_API_KEY}`
                },
                timeout: 180000
            });
            const choices = response.data && response.data.choices;
            const content = choices && choices[0] && choices[0].message && choices[0].message.content;
            if (!content) throw new Error('返回数据格式异常');
            // 移除 <think> 标签
            return content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^<think>[\s\S]*$/gi, '').replace(/<\/think>/gi, '').trim();
        } catch (error) {
            lastError = error;
            const statusCode = error.response ? error.response.status : null;
            if (attempt >= retries) break;
            if (!(error.code && ['ETIMEDOUT','ECONNRESET','ECONNREFUSED','ENOTFOUND','EAI_AGAIN','ECONNABORTED'].includes(error.code)) && !(statusCode && [408,429,500,502,503,504,520,521,522,523,524].includes(statusCode))) break;
        }
    }
    throw lastError;
}

const WUXING_EMOJI = {
    '金': '🔶', '木': '🌳', '水': '💧', '火': '🔥', '土': '🏔️'
};

// ==================== 生日特质计算 ====================

/**
 * 计算年柱
 */
function getYearPillar(year, month, day) {
    // 立春前算上一年
    if (month < 2 || (month === 2 && day < 4)) {
        year -= 1;
    }

    const tianganIndex = (year - 4) % 10;
    const dizhiIndex = (year - 4) % 12;

    return {
        tiangan: TIANGAN[tianganIndex],
        dizhi: DIZHI[dizhiIndex],
        ganzhi: TIANGAN[tianganIndex] + DIZHI[dizhiIndex]
    };
}

/**
 * 计算月柱
 */
function getMonthPillar(year, month, day) {
    // 简化的月柱计算
    const yearGan = (year - 4) % 10;
    const monthGanStart = [2, 4, 6, 8, 0][yearGan % 5];

    let lunarMonth = month - 1;
    if (day < 6) lunarMonth = (lunarMonth + 11) % 12;

    const tianganIndex = (monthGanStart + lunarMonth) % 10;
    const dizhiIndex = (lunarMonth + 2) % 12;

    return {
        tiangan: TIANGAN[tianganIndex],
        dizhi: DIZHI[dizhiIndex],
        ganzhi: TIANGAN[tianganIndex] + DIZHI[dizhiIndex]
    };
}

/**
 * 计算日柱
 */
function getDayPillar(year, month, day) {
    const baseDate = new Date(1900, 0, 31);
    const targetDate = new Date(year, month - 1, day);
    const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

    const tianganIndex = ((diffDays % 10) + 10) % 10;
    const dizhiIndex = ((diffDays % 12) + 12) % 12;

    return {
        tiangan: TIANGAN[tianganIndex],
        dizhi: DIZHI[dizhiIndex],
        ganzhi: TIANGAN[tianganIndex] + DIZHI[dizhiIndex]
    };
}

/**
 * 计算三柱
 */
function getThreePillars(birthDate) {
    const date = new Date(birthDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return {
        year: getYearPillar(year, month, day),
        month: getMonthPillar(year, month, day),
        day: getDayPillar(year, month, day)
    };
}

/**
 * 分析五行
 */
function analyzeElements(pillars) {
    const elements = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };

    ['year', 'month', 'day'].forEach(key => {
        elements[TIANGAN_ELEMENT[pillars[key].tiangan]] += 1;
        elements[DIZHI_ELEMENT[pillars[key].dizhi]] += 1;
    });

    let strongest = { element: '木', count: 0 };
    let weakest = { element: '木', count: Infinity };

    Object.entries(elements).forEach(([element, count]) => {
        if (count > strongest.count) strongest = { element, count };
        if (count < weakest.count) weakest = { element, count };
    });

    return { distribution: elements, strongest, weakest };
}

// ==================== 相合度分析 ====================

/**
 * 天干五合
 */
const TIANGAN_HE = {
    '甲己': true, '己甲': true,
    '乙庚': true, '庚乙': true,
    '丙辛': true, '辛丙': true,
    '丁壬': true, '壬丁': true,
    '戊癸': true, '癸戊': true
};

/**
 * 地支六合
 */
const DIZHI_LIUHE = {
    '子丑': true, '丑子': true,
    '寅亥': true, '亥寅': true,
    '卯戌': true, '戌卯': true,
    '辰酉': true, '酉辰': true,
    '巳申': true, '申巳': true,
    '午未': true, '未午': true
};

/**
 * 地支相冲
 */
const DIZHI_CHONG = ['子午', '午子', '丑未', '未丑', '寅申', '申寅', '卯酉', '酉卯', '辰戌', '戌辰', '巳亥', '亥巳'];

/**
 * 分析两人生日特质相合度
 */
function analyzeCompatibilityInternal(pillarsA, pillarsB, matchType) {
    let score = 50; // 基础分
    const details = [];

    // 日柱天干合
    const dayGanKey = pillarsA.day.tiangan + pillarsB.day.tiangan;
    if (TIANGAN_HE[dayGanKey]) {
        score += 15;
        details.push({
            type: 'positive',
            title: '日干相合',
            description: `${dayGanKey}天干相合，两人性格特质高度契合`
        });
    }

    // 年支六合
    const yearZhiKey = pillarsA.year.dizhi + pillarsB.year.dizhi;
    if (DIZHI_LIUHE[yearZhiKey]) {
        score += 10;
        details.push({
            type: 'positive',
            title: '年支六合',
            description: `${yearZhiKey}六合，家庭背景融洽`
        });
    }

    // 月支六合
    const monthZhiKey = pillarsA.month.dizhi + pillarsB.month.dizhi;
    if (DIZHI_LIUHE[monthZhiKey]) {
        score += 8;
        details.push({
            type: 'positive',
            title: '月支六合',
            description: `${monthZhiKey}六合，情感默契`
        });
    }

    // 日支冲
    const dayZhiKey = pillarsA.day.dizhi + pillarsB.day.dizhi;
    if (DIZHI_CHONG.includes(dayZhiKey)) {
        score -= 10;
        details.push({
            type: 'negative',
            title: '日支相冲',
            description: `${dayZhiKey}相冲，日常相处可能有摩擦`
        });
    }

    // 年支冲
    const yearZhiChong = pillarsA.year.dizhi + pillarsB.year.dizhi;
    if (DIZHI_CHONG.includes(yearZhiChong)) {
        score -= 8;
        details.push({
            type: 'negative',
            title: '年支相冲',
            description: `${yearZhiChong}相冲，原生家庭可能有差异`
        });
    }

    // 五行互补分析
    const elementsA = analyzeElements(pillarsA);
    const elementsB = analyzeElements(pillarsB);

    if (elementsA.weakest.element === elementsB.strongest.element) {
        score += 10;
        details.push({
            type: 'positive',
            title: '五行互补',
            description: `对方的${WUXING_EMOJI[elementsB.strongest.element]}${elementsB.strongest.element}可以补足你的${WUXING_EMOJI[elementsA.weakest.element]}${elementsA.weakest.element}`
        });
    }

    if (elementsB.weakest.element === elementsA.strongest.element) {
        score += 10;
        details.push({
            type: 'positive',
            title: '五行互补',
            description: `你的${WUXING_EMOJI[elementsA.strongest.element]}${elementsA.strongest.element}可以补足对方的${WUXING_EMOJI[elementsB.weakest.element]}${elementsB.weakest.element}`
        });
    }

    // 限制分数范围
    score = Math.max(20, Math.min(95, score));

    return {
        score,
        details,
        elementsA,
        elementsB
    };
}

// ==================== 导出 API ====================

/**
 * 生日匹配分析
 */
export async function analyzeBirthday(personA, personB, matchType) {
    // 计算三柱
    const pillarsA = getThreePillars(personA.birthDate);
    const pillarsB = getThreePillars(personB.birthDate);

    // 分析相合度
    const analysis = analyzeCompatibilityInternal(pillarsA, pillarsB, matchType);

    // 生成结论
    const conclusion = generateConclusion(analysis.score, analysis.details);

    // 生成建议
    const suggestion = generateSuggestion(analysis.score, analysis.details, matchType);

    return {
        personA: {
            name: personA.name,
            gender: personA.gender,
            pillars: pillarsA,
            elements: analysis.elementsA
        },
        personB: {
            name: personB.name,
            gender: personB.gender,
            pillars: pillarsB,
            elements: analysis.elementsB
        },
        score: analysis.score,
        conclusion,
        details: analysis.details,
        suggestion,
        matchType
    };
}

/**
 * 直觉卡牌分析
 */
export async function analyzeHexagram(hexagram, matchType, question) {
    // 计算分数
    const score = calculateHexagramScore(hexagram);

    // 生成详情
    const details = generateHexagramDetails(hexagram);

    // 生成结论
    const conclusion = generateHexagramConclusion(hexagram, score);

    // 生成建议
    const suggestion = generateHexagramSuggestion(hexagram, matchType);

    return {
        hexagram,
        score,
        conclusion,
        details,
        suggestion,
        question,
        matchType
    };
}

/**
 * 计算符号分数
 */
function calculateHexagramScore(hexagram) {
    const positiveHexagrams = ['乾', '坤', '泰', '同人', '大有', '谦', '咸', '恒', '益', '萃', '既济'];
    const negativeHexagrams = ['否', '讼', '剥', '困', '蹇', '睽', '明夷', '未济'];

    let score = 60;

    if (positiveHexagrams.includes(hexagram.name)) {
        score += 20;
    } else if (negativeHexagrams.includes(hexagram.name)) {
        score -= 15;
    }

    // 变化轮影响
    if (hexagram.hasChanging && hexagram.changingPositions) {
        score += hexagram.changingPositions.length <= 2 ? 5 : -5;
    }

    return Math.max(20, Math.min(95, score));
}

/**
 * 生成符号详情
 */
function generateHexagramDetails(hexagram) {
    const details = [];

    details.push({
        type: 'positive',
        title: `${hexagram.name}符号`,
        description: hexagram.meaning || '待解析'
    });

    if (hexagram.upper && hexagram.lower) {
        details.push({
            type: 'positive',
            title: '上下符号分析',
            description: `上符号${hexagram.upper.name}（${hexagram.upper.nature || ''}），下符号${hexagram.lower.name}（${hexagram.lower.nature || ''}）`
        });
    }

    if (hexagram.hasChanging && hexagram.changingPositions) {
        details.push({
            type: hexagram.changingPositions.length <= 2 ? 'positive' : 'negative',
            title: '变化分析',
            description: `第${hexagram.changingPositions.join('、')}轮为变化轮，表示事情会有变化`
        });
    }

    return details;
}

/**
 * 生成结论
 */
function generateConclusion(score, details) {
    const positives = details.filter(d => d.type === 'positive').length;
    const negatives = details.filter(d => d.type === 'negative').length;

    if (score >= 80) {
        return 'A和B互利：双方性格特质高度契合，非常适合建立良好关系。';
    } else if (score >= 60) {
        if (positives > negatives) {
            return 'A利B，B不利A：你在这段关系中付出较多，但整体是积极的。';
        } else {
            return 'A不利B，B利A：对方在这段关系中获益更多。';
        }
    } else if (score >= 40) {
        return 'A和B相互不利：双方性格有一定差异，需要更多包容和理解。';
    } else {
        return 'A和B相互不利：分析显示双方差异较大，建议谨慎考虑。';
    }
}

/**
 * 生成符号结论
 */
function generateHexagramConclusion(hexagram, score) {
    if (score >= 75) {
        return `${hexagram.name}符号显示双方关系积极向好，有互利共赢的趋势。`;
    } else if (score >= 55) {
        return `${hexagram.name}符号提示需要双方共同努力，关系可以改善。`;
    } else {
        return `${hexagram.name}符号暗示当前时机不太适合，建议谨慎行事。`;
    }
}

/**
 * 生成建议
 */
function generateSuggestion(score, details, matchType) {
    const positives = details.filter(d => d.type === 'positive');
    const negatives = details.filter(d => d.type === 'negative');

    let suggestion = '';

    if (score >= 80) {
        suggestion = '这是非常好的契合度！双方在性格特质上高度互补，建议珍惜这份关系，共同维护。注意保持沟通，互相理解和包容。';
    } else if (score >= 60) {
        suggestion = '整体关系是积极的，但也存在一些需要注意的地方。';
        if (negatives.length > 0) {
            suggestion += `特别是${negatives[0].title}方面，需要双方多一些耐心和理解。`;
        }
        suggestion += '只要用心经营，这段关系会越来越好。';
    } else if (score >= 40) {
        suggestion = '双方存在一定的差异，但并非不可调和。建议：1) 增加沟通频率；2) 尊重对方的差异；3) 寻找共同兴趣。如果双方都愿意付出努力，关系是可以改善的。';
    } else {
        suggestion = '从性格分析角度看，双方确实存在较大的差异。建议在做重要决定前，多观察、多了解对方。如果是合作关系，建议寻找其他机会；如果是感情关系，请谨慎考虑。';
    }

    return suggestion;
}

/**
 * 生成符号建议
 */
function generateHexagramSuggestion(hexagram, matchType) {
    return `${hexagram.name}符号的核心含义是"${hexagram.meaning || '待解析'}"。根据分析结果提示，当前最重要的是保持平和的心态，不要急于求成。遇事多思考，听从内心的指引。如果有变化，说明事情会有转机，保持耐心等待合适的时机。`;
}

// ==================== 塔罗牌解读 ====================

/**
 * 塔罗牌数据库（简化版，实际应该有完整的78张牌）
 */
const TAROT_CARDS = {
    0: { name: '愚者', meaning: '新开始、冒险、纯真', reversed: '鲁莽、冲动、盲目' },
    1: { name: '魔术师', meaning: '创造力、技能、主动', reversed: '操纵、欺骗、缺乏方向' },
    2: { name: '女祭司', meaning: '直觉、内在智慧、神秘', reversed: '隐藏的真相、缺乏洞察' },
    3: { name: '皇后', meaning: '丰饶、母性、创造', reversed: '依赖、空虚、缺乏成长' },
    4: { name: '皇帝', meaning: '权威、结构、控制', reversed: '专制、僵化、缺乏同情' },
    5: { name: '教皇', meaning: '传统、信仰、指导', reversed: '叛逆、挑战权威' },
    6: { name: '恋人', meaning: '关系、选择、和谐', reversed: '失和、错误选择' },
    7: { name: '战车', meaning: '胜利、决心、方向', reversed: '失控、缺乏方向' },
    8: { name: '力量', meaning: '勇气、耐心、影响力', reversed: '软弱、自我怀疑' },
    9: { name: '隐士', meaning: '内省、寻找、指引', reversed: '孤立、迷失' },
    10: { name: '命运之轮', meaning: '命运、循环、转折', reversed: '厄运、抵抗变化' },
    11: { name: '正义', meaning: '公平、真相、因果', reversed: '不公、逃避责任' },
    12: { name: '倒吊人', meaning: '牺牲、放手、新视角', reversed: '无意义的牺牲、拖延' },
    13: { name: '死神', meaning: '结束、转变、重生', reversed: '抵抗变化、停滞' },
    14: { name: '节制', meaning: '平衡、耐心、和谐', reversed: '失衡、过度' },
    15: { name: '恶魔', meaning: '束缚、诱惑、物质主义', reversed: '解脱、觉醒' },
    16: { name: '高塔', meaning: '突变、破坏、启示', reversed: '逃避灾难、恐惧变化' },
    17: { name: '星星', meaning: '希望、灵感、宁静', reversed: '绝望、缺乏信仰' },
    18: { name: '月亮', meaning: '幻觉、直觉、不确定', reversed: '释放恐惧、真相浮现' },
    19: { name: '太阳', meaning: '成功、喜悦、活力', reversed: '过度乐观、延迟的成功' },
    20: { name: '审判', meaning: '反思、救赎、内在召唤', reversed: '自我怀疑、缺乏闭合' },
    21: { name: '世界', meaning: '完成、成就、旅程结束', reversed: '未完成、缺乏闭合' }
    // ... 更多牌（这里简化为只列出大阿卡纳前22张）
};

/**
 * 塔罗牌解读
 * @param {Object} data - 解读数据
 * @param {string} data.question - 问题
 * @param {string} data.questionType - 问题类型
 * @param {Array} data.selectedCards - 选中的6张牌
 * @param {Object} data.userInfo - 用户信息
 * @returns {Promise<Object>} 解读结果
 */
async function interpretTarot(data) {
    const { question, questionType, selectedCards, userInfo } = data;

    // 构建塔罗牌信息
    const cardInterpretations = selectedCards.map((card, index) => {
        const cardInfo = TAROT_CARDS[card.id] || { 
            name: `牌${card.id}`, 
            meaning: '待解析',
            reversed: '待解析'
        };
        
        return {
            position: card.label, // 目标、动力、障碍、资源、支持、结果
            cardName: cardInfo.name,
            cardId: card.id,
            meaning: cardInfo.meaning,
            interpretation: `在"${card.label}"位置，${cardInfo.name}代表${cardInfo.meaning}`
        };
    });

    // 生成AI提示词
    const aiPrompt = generateTarotPrompt(question, questionType, cardInterpretations, userInfo);

    // 调用DeepSeek API进行解读
    try {
        const aiResponse = await callDeepSeekAPI(aiPrompt);
        
        // 解析AI响应，提取专业版和通俗版
        const { professionalVersion, simpleVersion } = parseTarotResponse(aiResponse);

        return {
            result: aiResponse,
            professionalVersion: professionalVersion || aiResponse,
            simpleVersion: simpleVersion || aiResponse,
            aiPrompt: aiPrompt,
            cardInterpretations
        };
    } catch (error) {
        console.error('[塔罗解读] AI调用失败:', error);
        // 如果AI调用失败，返回基础解读
        return {
            result: generateBasicTarotInterpretation(question, cardInterpretations),
            professionalVersion: generateBasicTarotInterpretation(question, cardInterpretations),
            simpleVersion: generateBasicTarotInterpretation(question, cardInterpretations),
            aiPrompt: aiPrompt,
            cardInterpretations
        };
    }
}

/**
 * 生成塔罗牌AI提示词
 */
function generateTarotPrompt(question, questionType, cardInterpretations, userInfo) {
    let prompt = `你是一位经验丰富的塔罗解读师，现在需要为用户解读塔罗牌阵。\n\n`;
    
    prompt += `【问题】\n${question}\n\n`;
    prompt += `【问题类型】\n${questionType}\n\n`;
    
    if (userInfo.gender) {
        prompt += `【求问者信息】\n性别：${userInfo.gender}\n\n`;
    }
    
    prompt += `【牌阵布局】\n采用六牌阵，各位置含义如下：\n`;
    prompt += `1. 目标：问题的核心目标或期望\n`;
    prompt += `2. 动力：推动事情发展的内在动力\n`;
    prompt += `3. 障碍：需要克服的阻碍或挑战\n`;
    prompt += `4. 资源：可以利用的资源或支持\n`;
    prompt += `5. 支持：外部的帮助或有利因素\n`;
    prompt += `6. 结果：最终可能的结果或方向\n\n`;
    
    prompt += `【抽到的牌】\n`;
    cardInterpretations.forEach((card, index) => {
        prompt += `${index + 1}. ${card.position}：${card.cardName}（${card.meaning}）\n`;
    });
    
    prompt += `\n【解读要求】\n`;
    prompt += `1. 请结合每张牌在其位置上的含义，给出深入的解读\n`;
    prompt += `2. 分析牌与牌之间的关联和整体趋势\n`;
    prompt += `3. 针对用户的问题给出建议和指引\n`;
    prompt += `4. 语言要温和、积极、具有启发性\n`;
    prompt += `5. 避免绝对化的预言，强调选择权在求问者手中\n\n`;
    
    prompt += `请提供两个版本的解读：\n`;
    prompt += `【专业版】使用塔罗术语和深度分析\n`;
    prompt += `【通俗版】用简单易懂的语言表达\n`;
    
    return prompt;
}

/**
 * 调用DeepSeek API
 */
async function callDeepSeekAPI(prompt) {
    const { default: config } = await import('../config/index.js');
    const https = await import('https');
    
    if (!config.deepseek || !config.deepseek.apiKey) {
        throw new Error('DeepSeek API未配置');
    }

    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: '你是一位专业的塔罗牌解读师，擅长通过塔罗牌为人们提供人生指引。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const options = {
            hostname: 'api.deepseek.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.deepseek.apiKey}`,
                'Content-Length': data.length
            },
            timeout: 60000 // 60秒超时
        };

        const req = https.default.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    if (response.choices && response.choices[0]) {
                        resolve(response.choices[0].message.content);
                    } else {
                        reject(new Error('AI响应格式错误'));
                    }
                } catch (error) {
                    reject(new Error('解析AI响应失败'));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`API请求失败: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('API请求超时'));
        });

        req.write(data);
        req.end();
    });
}

/**
 * 解析塔罗响应（提取专业版和通俗版）
 */
function parseTarotResponse(response) {
    let professionalVersion = '';
    let simpleVersion = '';

    // 尝试匹配【专业版】和【通俗版】标记
    const professionalMatch = response.match(/【专业版】([\s\S]*?)(?:【通俗版】|$)/);
    const simpleMatch = response.match(/【通俗版】([\s\S]*?)$/);

    if (professionalMatch) {
        professionalVersion = professionalMatch[1].trim();
    }
    if (simpleMatch) {
        simpleVersion = simpleMatch[1].trim();
    }

    // 如果没有找到标记，使用整个响应作为两个版本
    if (!professionalVersion && !simpleVersion) {
        professionalVersion = response;
        simpleVersion = response;
    }

    return { professionalVersion, simpleVersion };
}

/**
 * 生成基础塔罗解读（当AI不可用时）
 */
function generateBasicTarotInterpretation(question, cardInterpretations) {
    let interpretation = `关于"${question}"的塔罗解读：\n\n`;
    
    cardInterpretations.forEach((card, index) => {
        interpretation += `【${card.position}】${card.cardName}\n`;
        interpretation += `${card.interpretation}\n\n`;
    });
    
    interpretation += `总体建议：\n`;
    interpretation += `从抽到的牌来看，您目前的状况包含了机遇与挑战。`;
    interpretation += `重要的是保持积极的心态，充分利用您拥有的资源和支持，`;
    interpretation += `勇敢面对障碍，朝着您的目标前进。记住，未来掌握在您自己手中。\n`;
    
    return interpretation;
}

export default { 
    analyzeBirthday, 
    analyzeHexagram,
    interpretTarot 
};
