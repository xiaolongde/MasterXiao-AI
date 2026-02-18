/**
 * 匹配游戏 直觉卡牙算法
 * 基于翻牌方式生成符号
 */

/**
 * 牌面类型
 * 全正位(0): 三张全正位，阳性且变化
 * 多正位(1): 两正一逆，阳性稳定
 * 多逆位(2): 一正两逆，阴性稳定
 * 全逆位(3): 三张全逆位，阴性且变化
 */
export const YAO_TYPES = {
    OLD_YANG: { value: 0, name: '老阳', tarotName: '太阳能量', symbol: '☀️', isYang: true, isChanging: true },
    YOUNG_YANG: { value: 1, name: '少阳', tarotName: '星辰能量', symbol: '⭐', isYang: true, isChanging: false },
    YOUNG_YIN: { value: 2, name: '少阴', tarotName: '月亮能量', symbol: '🌙', isYang: false, isChanging: false },
    OLD_YIN: { value: 3, name: '老阴', tarotName: '暗夜能量', symbol: '🌑', isYang: false, isChanging: true }
};

/**
 * 根据正反面数量获取爻类型
 * @param {number} faceUpCount - 正面朝上的牌数 (0-3)
 */
export function getYaoType(faceUpCount) {
    switch (faceUpCount) {
        case 3: return YAO_TYPES.OLD_YANG;   // 0背3正
        case 2: return YAO_TYPES.YOUNG_YANG; // 1背2正
        case 1: return YAO_TYPES.YOUNG_YIN;  // 2背1正
        case 0: return YAO_TYPES.OLD_YIN;    // 3背0正
        default: return YAO_TYPES.YOUNG_YANG;
    }
}

/**
 * 八种基本符号
 */
export const BAGUA = {
    QIAN: { name: '乾', symbol: '☰', lines: [1, 1, 1], element: '金', nature: '天' },
    DUI: { name: '兑', symbol: '☱', lines: [1, 1, 0], element: '金', nature: '泽' },
    LI: { name: '离', symbol: '☲', lines: [1, 0, 1], element: '火', nature: '火' },
    ZHEN: { name: '震', symbol: '☳', lines: [1, 0, 0], element: '木', nature: '雷' },
    XUN: { name: '巽', symbol: '☴', lines: [0, 1, 1], element: '木', nature: '风' },
    KAN: { name: '坎', symbol: '☵', lines: [0, 1, 0], element: '水', nature: '水' },
    GEN: { name: '艮', symbol: '☶', lines: [0, 0, 1], element: '土', nature: '山' },
    KUN: { name: '坤', symbol: '☷', lines: [0, 0, 0], element: '土', nature: '地' }
};

/**
 * 根据三轮结果获取符号
 * @param {Array} lines - 三轮的正逆值 [下, 中, 上]，1为正位，0为逆位
 */
export function getBaguaByLines(lines) {
    const key = lines.join('');
    const baguaMap = {
        '111': BAGUA.QIAN,
        '110': BAGUA.DUI,
        '101': BAGUA.LI,
        '100': BAGUA.ZHEN,
        '011': BAGUA.XUN,
        '010': BAGUA.KAN,
        '001': BAGUA.GEN,
        '000': BAGUA.KUN
    };
    return baguaMap[key] || BAGUA.KUN;
}

/**
 * 卡牌符号类
 */
export class Hexagram {
    constructor(yaos) {
        // yaos: 6轮结果，从下到上 [第1轮, 第2轮, 第3轮, 第4轮, 第5轮, 第6轮]
        this.yaos = yaos;
        this.calculate();
    }

    calculate() {
        // 获取基本正逆值（正位=1，逆位=0）
        this.lines = this.yaos.map(yao => yao.isYang ? 1 : 0);

        // 下符号（第1、2、3轮）
        this.lowerLines = this.lines.slice(0, 3);
        this.lower = getBaguaByLines(this.lowerLines);

        // 上符号（第4、5、6轮）
        this.upperLines = this.lines.slice(3, 6);
        this.upper = getBaguaByLines(this.upperLines);

        // 查找对应的64种符号
        this.hexagram = this.findHexagram();

        // 计算变化符号（如果有变化轮）
        this.changingYaos = this.yaos.filter(yao => yao.isChanging);
        this.hasChanging = this.changingYaos.length > 0;

        if (this.hasChanging) {
            this.calculateChangedHexagram();
        }
    }

    /**
     * 根据上下符号查找64种符号
     */
    findHexagram() {
        // 64种符号映射表 [下符号, 上符号] -> 符号名
        const hexagramMap = {
            '乾乾': { id: 1, name: '乾', meaning: '刚健中正' },
            '坤坤': { id: 2, name: '坤', meaning: '柔顺伸展' },
            '震坎': { id: 3, name: '屯', meaning: '起始艰难' },
            '坎艮': { id: 4, name: '蒙', meaning: '启蒙教育' },
            '乾坎': { id: 5, name: '需', meaning: '等待时机' },
            '坎乾': { id: 6, name: '讼', meaning: '争讼之象' },
            '坤坎': { id: 7, name: '师', meaning: '兵众之象' },
            '坎坤': { id: 8, name: '比', meaning: '亲比和谐' },
            '乾巽': { id: 9, name: '小畜', meaning: '小有积蓄' },
            '兑乾': { id: 10, name: '履', meaning: '谨慎行事' },
            '乾坤': { id: 11, name: '泰', meaning: '通泰安康' },
            '坤乾': { id: 12, name: '否', meaning: '闭塞不通' },
            '离乾': { id: 13, name: '同人', meaning: '同心协力' },
            '乾离': { id: 14, name: '大有', meaning: '丰收富有' },
            '艮坤': { id: 15, name: '谦', meaning: '谦虚谨慎' },
            '坤震': { id: 16, name: '豫', meaning: '欢乐和豫' },
            '震兑': { id: 17, name: '随', meaning: '随顺时势' },
            '巽艮': { id: 18, name: '蛊', meaning: '整治祸乱' },
            '兑坤': { id: 19, name: '临', meaning: '临事而惧' },
            '坤巽': { id: 20, name: '观', meaning: '观察审视' },
            '震离': { id: 21, name: '噬嗑', meaning: '刑罚分明' },
            '离艮': { id: 22, name: '贲', meaning: '文饰光明' },
            '坤艮': { id: 23, name: '剥', meaning: '剥落衰败' },
            '震坤': { id: 24, name: '复', meaning: '回复兴起' },
            '震乾': { id: 25, name: '无妄', meaning: '无妄之灾' },
            '乾艮': { id: 26, name: '大畜', meaning: '大有积蓄' },
            '震艮': { id: 27, name: '颐', meaning: '颐养正道' },
            '巽兑': { id: 28, name: '大过', meaning: '大过之象' },
            '坎坎': { id: 29, name: '坎', meaning: '重重险难' },
            '离离': { id: 30, name: '离', meaning: '光明照耀' },
            '艮兑': { id: 31, name: '咸', meaning: '感应相通' },
            '巽震': { id: 32, name: '恒', meaning: '恒久不变' },
            '艮乾': { id: 33, name: '遁', meaning: '退避隐遁' },
            '乾震': { id: 34, name: '大壮', meaning: '壮大强盛' },
            '坤离': { id: 35, name: '晋', meaning: '进取光明' },
            '离坤': { id: 36, name: '明夷', meaning: '光明受损' },
            '离巽': { id: 37, name: '家人', meaning: '家庭和睦' },
            '兑离': { id: 38, name: '睽', meaning: '背离乖异' },
            '艮坎': { id: 39, name: '蹇', meaning: '艰难险阻' },
            '坎震': { id: 40, name: '解', meaning: '解除困难' },
            '兑艮': { id: 41, name: '损', meaning: '减损节制' },
            '震巽': { id: 42, name: '益', meaning: '增益进取' },
            '乾兑': { id: 43, name: '夬', meaning: '决断果断' },
            '巽乾': { id: 44, name: '姤', meaning: '邂逅相遇' },
            '坤兑': { id: 45, name: '萃', meaning: '聚集汇合' },
            '巽坤': { id: 46, name: '升', meaning: '上升进取' },
            '坎兑': { id: 47, name: '困', meaning: '困顿穷厄' },
            '巽坎': { id: 48, name: '井', meaning: '井养不穷' },
            '离兑': { id: 49, name: '革', meaning: '变革更新' },
            '巽离': { id: 50, name: '鼎', meaning: '革故鼎新' },
            '震震': { id: 51, name: '震', meaning: '震动警醒' },
            '艮艮': { id: 52, name: '艮', meaning: '止静安定' },
            '艮巽': { id: 53, name: '渐', meaning: '循序渐进' },
            '兑震': { id: 54, name: '归妹', meaning: '归妹待嫁' },
            '离震': { id: 55, name: '丰', meaning: '丰盛光大' },
            '艮离': { id: 56, name: '旅', meaning: '旅途漂泊' },
            '巽巽': { id: 57, name: '巽', meaning: '顺从谦逊' },
            '兑兑': { id: 58, name: '兑', meaning: '喜悦和悦' },
            '坎巽': { id: 59, name: '涣', meaning: '涣散离散' },
            '兑坎': { id: 60, name: '节', meaning: '节制有度' },
            '兑巽': { id: 61, name: '中孚', meaning: '诚信感化' },
            '艮震': { id: 62, name: '小过', meaning: '小有过越' },
            '离坎': { id: 63, name: '既济', meaning: '事业已成' },
            '坎离': { id: 64, name: '未济', meaning: '事业未成' }
        };

        const key = this.lower.name + this.upper.name;
        return hexagramMap[key] || { id: 0, name: '未知', meaning: '待解析' };
    }

    /**
     * 计算变化符号
     */
    calculateChangedHexagram() {
        // 变化轮后的正逆值取反
        const changedLines = this.yaos.map(yao => {
            if (yao.isChanging) {
                return yao.isYang ? 0 : 1; // 老阳变阴，老阴变阳
            }
            return yao.isYang ? 1 : 0;
        });

        const changedLower = getBaguaByLines(changedLines.slice(0, 3));
        const changedUpper = getBaguaByLines(changedLines.slice(3, 6));

        // 创建变卦对象
        this.changedHexagram = {
            lower: changedLower,
            upper: changedUpper,
            lines: changedLines
        };
    }

    /**
     * 获取符号描述
     */
    getDescription() {
        return {
            name: this.hexagram.name,
            meaning: this.hexagram.meaning,
            upper: this.upper,
            lower: this.lower,
            yaos: this.yaos.map((yao, index) => ({
                position: index + 1,
                ...yao
            })),
            hasChanging: this.hasChanging,
            changingPositions: this.yaos
                .map((yao, index) => yao.isChanging ? index + 1 : null)
                .filter(p => p !== null),
            changedHexagram: this.changedHexagram
        };
    }
}

/**
 * 模拟翻牌
 * @returns {number} 正面朝上的牌数 (0-3)
 */
export function flipCards() {
    let faceUpCount = 0;
    for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.5) {
            faceUpCount++;
        }
    }
    return faceUpCount;
}

/**
 * 自动生成符号（模拟6次翻牌）
 */
export function autoGenerateHexagram() {
    const yaos = [];
    for (let i = 0; i < 6; i++) {
        const faceUpCount = flipCards();
        yaos.push(getYaoType(faceUpCount));
    }
    return new Hexagram(yaos);
}

/**
 * 根据用户选择的结果生成符号
 * @param {Array} results - 6次翻牌结果，每个元素是正位朝上的数量 [0-3]
 */
export function generateHexagramFromResults(results) {
    if (results.length !== 6) {
        throw new Error('需要6次翻牌结果');
    }

    const yaos = results.map(faceUpCount => getYaoType(faceUpCount));
    return new Hexagram(yaos);
}

export default {
    YAO_TYPES,
    BAGUA,
    getYaoType,
    getBaguaByLines,
    Hexagram,
    flipCards,
    autoGenerateHexagram,
    generateHexagramFromResults
};
