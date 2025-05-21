// 数字格式化工具

// 中文单位定义
const CHINESE_UNITS = [
    { name: "古戈尔", power: 100, threshold: 1e100 },
    { name: "那由他", power: 72, threshold: 1e72 },
    { name: "阿僧祗", power: 64, threshold: 1e64 },
    { name: "恒河沙", power: 56, threshold: 1e56 },
    { name: "载", power: 44, threshold: 1e44 },
    { name: "正", power: 40, threshold: 1e40 },
    { name: "涧", power: 36, threshold: 1e36 },
    { name: "沟", power: 32, threshold: 1e32 },
    { name: "穰", power: 28, threshold: 1e28 },
    { name: "秭", power: 24, threshold: 1e24 },
    { name: "垓", power: 20, threshold: 1e20 },
    { name: "京", power: 16, threshold: 1e16 },
    { name: "兆", power: 12, threshold: 1e12 },
    { name: "亿", power: 8, threshold: 1e8 },
    { name: "万", power: 4, threshold: 1e4 }
];

// 格式化数字
export function formatNumber(value, displayFormat = "scientific") {
    if (value === undefined || value === null || isNaN(value)) return "0";
    if (value === 0) return "0";

    const localSign = value < 0 ? "-" : "";
    const absValue = Math.abs(value);

    if (displayFormat === "scientific") {
        if (absValue < 10000) {
            return localSign + absValue.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });
        } else {
            // 将数字转换为科学计数法格式
            const exp = Math.floor(Math.log10(absValue));
            const coef = absValue / Math.pow(10, exp);
            // 格式化系数，保留2位小数
            const formattedCoef = coef.toFixed(2);
            // 去除不必要的尾随零
            const cleanCoef = parseFloat(formattedCoef).toString();
            return localSign + cleanCoef + "×10^" + exp;
        }
    } else if (displayFormat === "chinese") {
        for (const unit of CHINESE_UNITS) {
            if (absValue >= unit.threshold) {
                const prefixVal = absValue / unit.threshold;
                // 格式化前缀值，去除不必要的尾随零
                const formattedPrefix = parseFloat(prefixVal.toFixed(2)).toString();
                return localSign + formattedPrefix + unit.name;
            }
        }
        // 如果数字小于所有定义的大单位阈值
        return localSign + absValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    // 默认返回原始值的字符串形式
    return localSign + value.toString();
} 