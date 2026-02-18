/**
 * 控制台日志工具 - 带颜色输出
 */

// ANSI 颜色码
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

// 获取时间戳
function getTimestamp() {
    return new Date().toLocaleString('zh-CN');
}

const logger = {
    info: (...args) => {
        console.log(`${colors.blue}[${getTimestamp()}] [INFO]${colors.reset}`, ...args);
    },
    
    error: (...args) => {
        console.error(`${colors.red}[${getTimestamp()}] [ERROR]${colors.reset}`, ...args);
    },
    
    warn: (...args) => {
        console.warn(`${colors.yellow}[${getTimestamp()}] [WARN]${colors.reset}`, ...args);
    },
    
    success: (...args) => {
        console.log(`${colors.green}[${getTimestamp()}] [SUCCESS]${colors.reset}`, ...args);
    },
    
    debug: (...args) => {
        console.log(`${colors.cyan}[${getTimestamp()}] [DEBUG]${colors.reset}`, ...args);
    },
    
    log: (...args) => {
        console.log(`[${getTimestamp()}]`, ...args);
    }
};

export default logger;
