// 自动化相关的工具函数
import { config } from '../config.js';

/**
 * 计算自动化设备的UI显示数据
 * @param {Object} gameState - 游戏状态对象
 * @returns {Array} 预计算的UI数据数组
 */
export function calculateAutomationItemUIData(gameState) {
    return Object.entries(gameState.automation).map(([itemId, item]) => {
        const itemConfig = config.gameBalance.automation[itemId];
        const nextCost = Math.floor(itemConfig.baseCost * Math.pow(itemConfig.costMultiplier, item.count));
        let amount = 1;
        let totalCost = nextCost;
        
        if (gameState.buyAmount === "100") {
            amount = 100;
            totalCost = calculateTotalCost(itemId, amount, gameState);
        } else if (gameState.buyAmount === "half") {
            amount = Math.max(1, Math.floor(getMaxAffordableAmount(itemId, gameState) / 2));
            totalCost = calculateTotalCost(itemId, amount, gameState);
        } else if (gameState.buyAmount === "max") {
            amount = getMaxAffordableAmount(itemId, gameState);
            totalCost = calculateTotalCost(itemId, amount, gameState);
        }
        
        const displayCostString = amount > 1 ? 
            `成本: ${totalCost}修为 (x${amount})` : 
            `成本: ${nextCost}修为`;
            
        return {
            itemId,
            displayCostString,
            canAfford: gameState.resources.cultivationPoints >= nextCost
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