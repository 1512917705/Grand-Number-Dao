// 导入必要的模块
import { getGameState, updateGameState } from './gameState.js';
import { getMaxAffordableAmount, calculateTotalCost } from '../utils/automationUtils.js';
import { config } from '../config.js';
import { showNotification } from '../ui/uiManager.js';

/**
 * 购买自动化设备
 * @param {string} itemId - 设备ID
 * @returns {boolean} 购买是否成功
 */
export function buyAutomationItem(itemId) {
    const gameState = getGameState();
    const itemConfig = config.gameBalance.automation[itemId];
    
    if (!itemConfig) {
        console.error(`未找到设备配置: ${itemId}`);
        return false;
    }

    // 确定购买数量
    let amount = 1;
    const buyAmount = gameState.settings?.buyAmount || '1';
    
    if (buyAmount === 'max') {
        amount = getMaxAffordableAmount(itemId, gameState);
    } else if (buyAmount === 'half') {
        amount = Math.floor(getMaxAffordableAmount(itemId, gameState) / 2);
    } else {
        amount = parseInt(buyAmount) || 1;
    }

    if (amount <= 0) {
        showNotification('修为不足，无法购买', 'error');
        return false;
    }

    // 计算总成本
    const totalCost = calculateTotalCost(itemId, amount, gameState);
    
    // 检查资源是否足够
    if (gameState.resources.cultivationPoints < totalCost) {
        showNotification('修为不足，无法购买', 'error');
        return false;
    }

    // 扣除资源并增加设备数量
    updateGameState('resources.cultivationPoints', gameState.resources.cultivationPoints - totalCost);
    updateGameState(`automation.${itemId}.count`, gameState.automation[itemId].count + amount);

    // 重新计算设备效果
    recalculateAutomationEffect(itemId);
    
    showNotification(`成功购买 ${amount} 个${itemConfig.name || itemId}`, 'success');
    return true;
}

/**
 * 重新计算指定自动化设备的效果
 * @param {string} itemId - 设备ID
 */
function recalculateAutomationEffect(itemId) {
    const gameState = getGameState();
    const itemConfig = config.gameBalance.automation[itemId];
    const automation = gameState.automation[itemId];

    if (!itemConfig || !automation) {
        console.error(`未找到设备配置或状态: ${itemId}`);
        return;
    }

    switch (itemId) {
        case 'spirit-gathering-array':
            // 聚灵阵效果 = 基础效果 * 数量
            updateGameState(`automation.${itemId}.effect`, itemConfig.baseEffect * automation.count);
            break;
            
        case 'auto-tuna':
            // 自动吐纳效果 = 基础效果 * 数量
            updateGameState(`automation.${itemId}.currentSpiritConsumed`, 
                itemConfig.baseSpiritConsumedPerSecond * automation.count);
            updateGameState(`automation.${itemId}.currentCultivationGained`, 
                itemConfig.baseCultivationGainedPerSecond * automation.count);
            break;
            
        default:
            console.warn(`未知的设备类型: ${itemId}`);
    }
}

/**
 * 重新计算所有自动化设备的效果
 */
export function recalculateAllAutomationEffects() {
    Object.keys(config.gameBalance.automation).forEach(itemId => {
        recalculateAutomationEffect(itemId);
    });
}

/**
 * 处理自动化设备的资源产出
 */
export function updateAutomationTick() {
    const gameState = getGameState();
    const deltaTime = 1; // 假设每个tick是1秒

    // 处理聚灵阵产出
    const spiritArray = gameState.automation['spirit-gathering-array'];
    if (spiritArray && spiritArray.count > 0) {
        updateGameState('resources.spiritualEnergy', 
            gameState.resources.spiritualEnergy + spiritArray.effect * deltaTime);
    }

    // 处理自动吐纳
    const autoTuna = gameState.automation['auto-tuna'];
    if (autoTuna && autoTuna.count > 0) {
        const spiritCost = autoTuna.currentSpiritConsumed * deltaTime;
        
        if (gameState.resources.spiritualEnergy >= spiritCost) {
            updateGameState('resources.spiritualEnergy', 
                gameState.resources.spiritualEnergy - spiritCost);
            updateGameState('resources.cultivationPoints', 
                gameState.resources.cultivationPoints + autoTuna.currentCultivationGained * deltaTime);
        }
    }

    // 更新每秒产出统计
    updateGameState('stats.energyPerSecond', spiritArray ? spiritArray.effect : 0);
    updateGameState('stats.cultivationPerSecond', autoTuna ? 
        (gameState.resources.spiritualEnergy >= autoTuna.currentSpiritConsumed ? 
            autoTuna.currentCultivationGained : 0) : 0);
}
