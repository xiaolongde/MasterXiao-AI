/**
 * 匹配游戏 生日特质算法
 * 年柱、月柱、日柱计算（不含时柱）
 */

/**
 * 天干
 */
export const TIANGAN = [
    { index: 0, name: '甲', element: '木', nature: '阳', color: '#4CAF50' },
    { index: 1, name: '乙', element: '木', nature: '阴', color: '#8BC34A' },
    { index: 2, name: '丙', element: '火', nature: '阳', color: '#F44336' },
    { index: 3, name: '丁', element: '火', nature: '阴', color: '#E91E63' },
    { index: 4, name: '戊', element: '土', nature: '阳', color: '#795548' },
    { index: 5, name: '己', element: '土', nature: '阴', color: '#A1887F' },
    { index: 6, name: '庚', element: '金', nature: '阳', color: '#FFD700' },
    { index: 7, name: '辛', element: '金', nature: '阴', color: '#FFC107' },
    { index: 8, name: '壬', element: '水', nature: '阳', color: '#2196F3' },
    { index: 9, name: '癸', element: '水', nature: '阴', color: '#03A9F4' }
];

/**
 * 地支
 */
export const DIZHI = [
    { index: 0, name: '子', element: '水', nature: '阳', animal: '鼠' },
    { index: 1, name: '丑', element: '土', nature: '阴', animal: '牛' },
    { index: 2, name: '寅', element: '木', nature: '阳', animal: '虎' },
    { index: 3, name: '卯', element: '木', nature: '阴', animal: '兔' },
    { index: 4, name: '辰', element: '土', nature: '阳', animal: '龙' },
    { index: 5, name: '巳', element: '火', nature: '阴', animal: '蛇' },
    { index: 6, name: '午', element: '火', nature: '阳', animal: '马' },
    { index: 7, name: '未', element: '土', nature: '阴', animal: '羊' },
    { index: 8, name: '申', element: '金', nature: '阳', animal: '猴' },
    { index: 9, name: '酉', element: '金', nature: '阴', animal: '鸡' },
    { index: 10, name: '戌', element: '土', nature: '阳', animal: '狗' },
    { index: 11, name: '亥', element: '水', nature: '阴', animal: '猪' }
];

/**
 * 五行相生相克
 */
export const WUXING = {
    '木': { generates: '火', overcomes: '土', generatedBy: '水', overcomedBy: '金', color: '#4CAF50', emoji: '🌳' },
    '火': { generates: '土', overcomes: '金', generatedBy: '木', overcomedBy: '水', color: '#F44336', emoji: '🔥' },
    '土': { generates: '金', overcomes: '水', generatedBy: '火', overcomedBy: '木', color: '#795548', emoji: '🏔️' },
    '金': { generates: '水', overcomes: '木', generatedBy: '土', overcomedBy: '火', color: '#FFD700', emoji: '🔶' },
    '水': { generates: '木', overcomes: '火', generatedBy: '金', overcomedBy: '土', color: '#2196F3', emoji: '💧' }
};

/**
 * 节气数据（用于判断月柱）
 * 每年节气时间略有不同，这里使用平均值
 */
const JIEQI = [
    { name: '立春', month: 1, day: 4 },   // 正月，寅月开始
    { name: '惊蛰', month: 2, day: 6 },   // 二月，卯月开始
    { name: '清明', month: 3, day: 5 },   // 三月，辰月开始
    { name: '立夏', month: 4, day: 6 },   // 四月，巳月开始
    { name: '芒种', month: 5, day: 6 },   // 五月，午月开始
    { name: '小暑', month: 6, day: 7 },   // 六月，未月开始
    { name: '立秋', month: 7, day: 8 },   // 七月，申月开始
    { name: '白露', month: 8, day: 8 },   // 八月，酉月开始
    { name: '寒露', month: 9, day: 9 },   // 九月，戌月开始
    { name: '立冬', month: 10, day: 8 },  // 十月，亥月开始
    { name: '大雪', month: 11, day: 7 },  // 十一月，子月开始
    { name: '小寒', month: 12, day: 6 }   // 十二月，丑月开始
];

/**
 * 计算年柱
 * @param {number} year - 公历年份
 * @param {number} month - 公历月份
 * @param {number} day - 公历日期
 */
export function getYearPillar(year, month, day) {
    // 如果在立春之前，年柱使用上一年
    const lichun = JIEQI[0];
    if (month < lichun.month + 1 || (month === lichun.month + 1 && day < lichun.day)) {
        year -= 1;
    }

    // 天干：(年份 - 4) % 10
    const tianganIndex = (year - 4) % 10;
    // 地支：(年份 - 4) % 12
    const dizhiIndex = (year - 4) % 12;

    return {
        tiangan: TIANGAN[tianganIndex],
        dizhi: DIZHI[dizhiIndex],
        ganzhi: TIANGAN[tianganIndex].name + DIZHI[dizhiIndex].name
    };
}

/**
 * 计算月柱
 * @param {number} year - 公历年份
 * @param {number} month - 公历月份 (1-12)
 * @param {number} day - 公历日期
 */
export function getMonthPillar(year, month, day) {
    // 确定农历月份（根据节气）
    let lunarMonth = month - 1; // 默认

    // 找到当前所在的节气月
    for (let i = JIEQI.length - 1; i >= 0; i--) {
        const jq = JIEQI[i];
        if (month > jq.month + 1 || (month === jq.month + 1 && day >= jq.day)) {
            lunarMonth = i;
            break;
        }
    }

    // 如果是上一年的十二月
    if (lunarMonth === 11 && month === 1) {
        year -= 1;
    }

    // 年干
    const yearGan = (year - 4) % 10;

    // 月干计算规则：
    // 甲己年起丙寅，乙庚年起戊寅，丙辛年起庚寅，丁壬年起壬寅，戊癸年起甲寅
    const monthGanStart = [2, 4, 6, 8, 0]; // 对应不同年干的起始月干
    const startGan = monthGanStart[yearGan % 5];
    const tianganIndex = (startGan + lunarMonth) % 10;

    // 月支：寅月(1)对应地支索引2
    const dizhiIndex = (lunarMonth + 2) % 12;

    return {
        tiangan: TIANGAN[tianganIndex],
        dizhi: DIZHI[dizhiIndex],
        ganzhi: TIANGAN[tianganIndex].name + DIZHI[dizhiIndex].name
    };
}

/**
 * 计算日柱
 * 使用蔡勒公式的变体
 * @param {number} year - 公历年份
 * @param {number} month - 公历月份 (1-12)
 * @param {number} day - 公历日期
 */
export function getDayPillar(year, month, day) {
    // 计算从1900年1月31日（甲子日）至今的天数
    const baseDate = new Date(1900, 0, 31); // 1900年1月31日是甲子日
    const targetDate = new Date(year, month - 1, day);

    const diffTime = targetDate.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 天干索引
    const tianganIndex = ((diffDays % 10) + 10) % 10;
    // 地支索引
    const dizhiIndex = ((diffDays % 12) + 12) % 12;

    return {
        tiangan: TIANGAN[tianganIndex],
        dizhi: DIZHI[dizhiIndex],
        ganzhi: TIANGAN[tianganIndex].name + DIZHI[dizhiIndex].name
    };
}

/**
 * 计算三柱（年、月、日）
 * @param {Date|string} birthDate - 出生日期
 */
export function getThreePillars(birthDate) {
    const date = new Date(birthDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const yearPillar = getYearPillar(year, month, day);
    const monthPillar = getMonthPillar(year, month, day);
    const dayPillar = getDayPillar(year, month, day);

    return {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        fullName: `${yearPillar.ganzhi} ${monthPillar.ganzhi} ${dayPillar.ganzhi}`,
        elements: analyzeElements(yearPillar, monthPillar, dayPillar)
    };
}

/**
 * 分析五行分布
 */
function analyzeElements(yearPillar, monthPillar, dayPillar) {
    const elements = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };

    // 统计天干五行
    [yearPillar, monthPillar, dayPillar].forEach(pillar => {
        elements[pillar.tiangan.element] += 1;
        elements[pillar.dizhi.element] += 1;
    });

    // 找出最强和最弱的五行
    let strongest = { element: '', count: 0 };
    let weakest = { element: '', count: Infinity };

    Object.entries(elements).forEach(([element, count]) => {
        if (count > strongest.count) {
            strongest = { element, count };
        }
        if (count < weakest.count) {
            weakest = { element, count };
        }
    });

    return {
        distribution: elements,
        strongest,
        weakest,
        // 用神通常是最弱的五行或生扶日主的五行
        yongshen: weakest.element
    };
}

/**
 * 分析两人生日特质相合度
 * @param {object} personA - A的三柱信息
 * @param {object} personB - B的三柱信息
 */
export function analyzeCompatibility(personA, personB) {
    const result = {
        score: 0,
        details: [],
        conclusion: ''
    };

    // 1. 日柱天干合化（10分）
    const dayGanCompatibility = checkTianganHe(
        personA.day.tiangan.name,
        personB.day.tiangan.name
    );
    if (dayGanCompatibility.isHe) {
        result.score += 10;
        result.details.push({
            type: 'positive',
            title: '日干相合',
            description: `${personA.day.tiangan.name}${personB.day.tiangan.name}相合，性格特质高度契合`
        });
    }

    // 2. 年支相合（8分）
    const yearZhiCompatibility = checkDizhiHe(
        personA.year.dizhi.name,
        personB.year.dizhi.name
    );
    if (yearZhiCompatibility.isLiuhe) {
        result.score += 8;
        result.details.push({
            type: 'positive',
            title: '年支六合',
            description: `${personA.year.dizhi.name}${personB.year.dizhi.name}六合，家庭背景融洽`
        });
    }

    // 3. 五行互补（15分）
    const elementBalance = checkElementBalance(personA.elements, personB.elements);
    result.score += elementBalance.score;
    result.details.push(...elementBalance.details);

    // 4. 检查冲克（减分）
    const conflicts = checkConflicts(personA, personB);
    result.score -= conflicts.penalty;
    result.details.push(...conflicts.details);

    // 确保分数在0-100之间
    result.score = Math.max(0, Math.min(100, result.score + 50)); // 基础分50

    // 生成结论
    result.conclusion = generateConclusion(result.score, result.details);

    return result;
}

/**
 * 检查天干五合
 */
function checkTianganHe(gan1, gan2) {
    const heMap = {
        '甲己': '土', '己甲': '土',
        '乙庚': '金', '庚乙': '金',
        '丙辛': '水', '辛丙': '水',
        '丁壬': '木', '壬丁': '木',
        '戊癸': '火', '癸戊': '火'
    };

    const key = gan1 + gan2;
    return {
        isHe: key in heMap,
        element: heMap[key] || null
    };
}

/**
 * 检查地支六合
 */
function checkDizhiHe(zhi1, zhi2) {
    const liuheMap = {
        '子丑': '土', '丑子': '土',
        '寅亥': '木', '亥寅': '木',
        '卯戌': '火', '戌卯': '火',
        '辰酉': '金', '酉辰': '金',
        '巳申': '水', '申巳': '水',
        '午未': '土', '未午': '土'
    };

    const key = zhi1 + zhi2;
    return {
        isLiuhe: key in liuheMap,
        element: liuheMap[key] || null
    };
}

/**
 * 检查五行互补
 */
function checkElementBalance(elementsA, elementsB) {
    const result = { score: 0, details: [] };

    // 如果A缺的五行B有，或者B缺的A有，就是互补
    const aWeakest = elementsA.weakest.element;
    const bWeakest = elementsB.weakest.element;
    const aStrongest = elementsA.strongest.element;
    const bStrongest = elementsB.strongest.element;

    // A的弱项是B的强项
    if (aWeakest === bStrongest) {
        result.score += 8;
        result.details.push({
            type: 'positive',
            title: '五行互补',
            description: `对方${WUXING[bStrongest].emoji}${bStrongest}可以弥补你${WUXING[aWeakest].emoji}${aWeakest}的不足`
        });
    }

    // B的弱项是A的强项
    if (bWeakest === aStrongest) {
        result.score += 8;
        result.details.push({
            type: 'positive',
            title: '五行互补',
            description: `你的${WUXING[aStrongest].emoji}${aStrongest}可以弥补对方${WUXING[bWeakest].emoji}${bWeakest}的不足`
        });
    }

    return result;
}

/**
 * 检查冲克
 */
function checkConflicts(personA, personB) {
    const result = { penalty: 0, details: [] };

    // 地支相冲
    const chongMap = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];

    const checks = [
        { pillarsA: personA.year, pillarsB: personB.year, name: '年柱' },
        { pillarsA: personA.day, pillarsB: personB.day, name: '日柱' }
    ];

    checks.forEach(({ pillarsA, pillarsB, name }) => {
        const pair = pillarsA.dizhi.name + pillarsB.dizhi.name;
        const reversePair = pillarsB.dizhi.name + pillarsA.dizhi.name;

        if (chongMap.includes(pair) || chongMap.includes(reversePair)) {
            result.penalty += 5;
            result.details.push({
                type: 'negative',
                title: `${name}相冲`,
                description: `${pillarsA.dizhi.name}${pillarsB.dizhi.name}相冲，可能会有意见分歧`
            });
        }
    });

    return result;
}

/**
 * 生成匹配结论
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

export default {
    TIANGAN,
    DIZHI,
    WUXING,
    getYearPillar,
    getMonthPillar,
    getDayPillar,
    getThreePillars,
    analyzeCompatibility
};
