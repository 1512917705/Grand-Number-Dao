// 资源管理器模块
import { getGameState, updateGameState } from './gameState.js';
import { config } from '../config.js';
import * as uiManager from '../ui/uiManager.js';

// 资源类型枚举
export const ResourceType = {
    CULTIVATION_POINTS: 'cultivationPoints',
    SPIRITUAL_ENERGY: 'spiritualEnergy',
    MANA: 'mana'
};

// 处理修炼点击
export function processMeditationClick() {
    const gameState = getGameState();
    const spiritCost = config.gameBalance.clickValue;
    const cultivationGain = spiritCost * config.gameBalance.conversionRate;
    
    // 检查灵气是否足够
    if (gameState.resources.spiritualEnergy >= spiritCost) {
        // 消耗灵气
        updateGameState('resources.spiritualEnergy', gameState.resources.spiritualEnergy - spiritCost);
        // 增加修为
        updateGameState('resources.cultivationPoints', gameState.resources.cultivationPoints + cultivationGain);
        // 更新点击统计
        updateGameState('stats.totalClicks', gameState.stats.totalClicks + 1);
        
        // 更新UI
        uiManager.updateAllUI(getGameState());
        
        return true;
    } else {
        // 灵气不足时显示提示
        uiManager.showNotification('灵气不足，无法修炼！', 'error');
        return false;
    }
}

// 检查是否有足够的资源
export function canAfford(resourceType, amount) {
    const gameState = getGameState();
    return gameState.resources[resourceType] >= amount;
}

// 增加资源
export function addResource(resourceType, amount) {
    const gameState = getGameState();
    const currentAmount = gameState.resources[resourceType];
    updateGameState(`resources.${resourceType}`, currentAmount + amount);
    uiManager.updateAllUI(getGameState());
}

// 消耗资源
export function spendResource(resourceType, amount) {
    if (!canAfford(resourceType, amount)) {
        return false;
    }
    
    const gameState = getGameState();
    const currentAmount = gameState.resources[resourceType];
    updateGameState(`resources.${resourceType}`, currentAmount - amount);
    uiManager.updateAllUI(getGameState());
    return true;
}
