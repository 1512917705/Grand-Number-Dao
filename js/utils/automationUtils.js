// 自动化相关的工具函数
import { config } from '../config.js';

/**
 * 计算自动化设备的UI显示数据
 * @param {Object} gameState - 游戏状态对象
 * @returns {Array} 预计算的UI数据数组
 */
export function calculateAutomationItemUIData(gameState) {
    const numberFormat = gameState.settings?.numberDisplayFormat || 'scientific';
    
    return Object.entries(gameState.automation).map(([itemId, item]) => {
        const itemConfig = config.gameBalance.automation[itemId];
        const nextCost = Math.floor(itemConfig.baseCost * Math.pow(itemConfig.costMultiplier, item.count));
        let amount = 1;
        let totalCost = nextCost;
        
        const buyAmount = gameState.settings?.buyAmount || '1';
        
        if (buyAmount === "100") {
            amount = 100;
            totalCost = calculateTotalCost(itemId, amount, gameState);
        } else if (buyAmount === "half") {
            amount = Math.max(1, Math.floor(getMaxAffordableAmount(itemId, gameState) / 2));
            totalCost = calculateTotalCost(itemId, amount, gameState);
        } else if (buyAmount === "max") {
            amount = getMaxAffordableAmount(itemId, gameState);
            totalCost = calculateTotalCost(itemId, amount, gameState);
        }
        
        const displayCostString = amount > 1 ? 
            `成本: ${formatNumber(totalCost, numberFormat)}修为 (x${amount})` : 
            `成本: ${formatNumber(nextCost, numberFormat)}修为`;
            
        // 确保使用正确的成本进行判断
        const costToCheck = amount > 1 ? totalCost : nextCost;
        const canAfford = gameState.resources.cultivationPoints >= costToCheck;
            
        return {
            itemId,
            displayCostString,
            canAfford
        };
    });
}

/**
 * 计算指定设备的总成本
 * @param {string} itemId - 设备ID
 * @param {number} amount - 购买数量
 * @param {Object} gameState - 游戏状态对象
 * @returns {number} 总成本
 */
export function calculateTotalCost(itemId, amount, gameState) {
    if (!gameState || !gameState.automation) {
        console.error('游戏状态或自动化数据无效');
        return 0;
    }

    const itemConfig = config.gameBalance.automation[itemId];
    if (!itemConfig) {
        console.error(`未找到设备配置: ${itemId}`);
        return 0;
    }

    const item = gameState.automation[itemId];
    if (!item) {
        console.error(`未找到设备数据: ${itemId}`);
        return 0;
    }

    let totalCost = 0;
    
    for (let i = 0; i < amount; i++) {
        totalCost += Math.floor(itemConfig.baseCost * Math.pow(itemConfig.costMultiplier, item.count + i));
    }
    
    return totalCost;
}

/**
 * 计算可以购买的最大数量
 * @param {string} itemId - 设备ID
 * @param {Object} gameState - 游戏状态对象
 * @returns {number} 最大可购买数量
 */
export function getMaxAffordableAmount(itemId, gameState) {
    if (!gameState || !gameState.automation) {
        console.error('游戏状态或自动化数据无效');
        return 0;
    }

    const itemConfig = config.gameBalance.automation[itemId];
    if (!itemConfig) {
        console.error(`未找到设备配置: ${itemId}`);
        return 0;
    }

    const item = gameState.automation[itemId];
    if (!item) {
        console.error(`未找到设备数据: ${itemId}`);
        return 0;
    }

    const resources = gameState.resources.cultivationPoints;
    
    let amount = 0;
    let cost = 0;
    let nextCost = Math.floor(itemConfig.baseCost * Math.pow(itemConfig.costMultiplier, item.count));
    
    while (resources >= cost + nextCost) {
        cost += nextCost;
        amount++;
        nextCost = Math.floor(itemConfig.baseCost * Math.pow(itemConfig.costMultiplier, item.count + amount));
    }
    
    return amount;
}

/**
 * 格式化数字为指定格式
 * @param {number} num - 要格式化的数字
 * @param {string} format - 格式化方式 ('scientific' 或 'chinese')
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num, format = 'scientific') {
    if (num < 1000) return num.toString();
    
    if (format === 'chinese') {
        const units = ['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载'];
        let exp = Math.floor(Math.log10(num));
        let unitIndex = Math.floor(exp / 4);
        let value = num / Math.pow(10, unitIndex * 4);
        
        // 如果数值太大，超过中文单位范围，回退到科学计数法
        if (unitIndex >= units.length) {
            return formatNumber(num, 'scientific');
        }
        
        return `${value.toFixed(2)}${units[unitIndex]}`;
    } else {
        // 科学计数法
        const exp = Math.floor(Math.log10(num));
        const coeff = num / Math.pow(10, exp);
        return `${coeff.toFixed(2)}e${exp}`;
    }
} 