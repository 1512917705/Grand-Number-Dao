// 导入必要的模块
import { getGameState, initializeGameState } from './gameState.js';
import { showNotification, showAutoSaveNotification } from '../ui/uiManager.js';
import { config } from '../config.js';

// 常量定义
const SAVE_KEY = 'grandNumberDaoSave';
const SETTINGS_KEY = 'grandNumberDaoSettings';

/**
 * 收集需要保存的游戏数据
 * @returns {Object} 待保存的游戏数据
 */
function gatherDataForSave() {
    const gameState = getGameState();
    
    return {
        // 资源数据
        resources: {
            cultivationPoints: gameState.resources.cultivationPoints,
            spiritualEnergy: gameState.resources.spiritualEnergy,
            mana: gameState.resources.mana
        },
        
        // 统计数据
        totalClicks: gameState.stats.totalClicks,
        energyPerSecond: gameState.stats.energyPerSecond || 0,
        cultivationPerSecond: gameState.stats.cultivationPerSecond || 0,
        
        // 境界数据
        currentRealmIndex: gameState.realm.currentRealmIndex,
        
        // 自动化设备数据
        automation: {
            "spirit-gathering-array": {
                count: gameState.automation["spirit-gathering-array"].count,
                effect: gameState.automation["spirit-gathering-array"].effect
            },
            "auto-tuna": {
                count: gameState.automation["auto-tuna"].count,
                currentSpiritConsumed: gameState.automation["auto-tuna"].currentSpiritConsumed,
                currentCultivationGained: gameState.automation["auto-tuna"].currentCultivationGained
            }
        },
        
        // 购买数量设置
        buyAmount: gameState.buyAmount || "1",
        
        // 保存时间戳
        lastSaveTime: Date.now()
    };
}

/**
 * 验证存档数据的有效性
 * @param {Object} data - 待验证的存档数据
 * @returns {boolean} 数据是否有效
 */
function isValidSaveData(data) {
    // 检查基本结构
    if (!data || typeof data !== 'object') {
        console.debug('存档数据不是有效的对象');
        return false;
    }

    // 检查必需的基本字段
    if (!data.resources || typeof data.resources !== 'object') {
        console.debug('存档数据缺少 resources 对象');
        return false;
    }

    // 检查资源数据
    const requiredResources = ['cultivationPoints', 'spiritualEnergy', 'mana'];
    for (const resource of requiredResources) {
        if (typeof data.resources[resource] !== 'number') {
            console.debug(`存档数据中 resources.${resource} 不是有效的数字`);
            return false;
        }
    }

    // 检查自动化设备数据
    if (!data.automation || typeof data.automation !== 'object') {
        console.debug('存档数据缺少 automation 对象');
        return false;
    }

    // 检查聚灵阵数据
    if (!data.automation['spirit-gathering-array'] || 
        typeof data.automation['spirit-gathering-array'].count !== 'number' ||
        typeof data.automation['spirit-gathering-array'].effect !== 'number') {
        console.debug('存档数据中 spirit-gathering-array 数据无效');
        return false;
    }

    // 检查吐纳数据
    if (!data.automation['auto-tuna'] || 
        typeof data.automation['auto-tuna'].count !== 'number' ||
        typeof data.automation['auto-tuna'].currentSpiritConsumed !== 'number' ||
        typeof data.automation['auto-tuna'].currentCultivationGained !== 'number') {
        console.debug('存档数据中 auto-tuna 数据无效');
        return false;
    }

    // 检查其他必需字段
    if (typeof data.totalClicks !== 'number') {
        console.debug('存档数据中 totalClicks 不是有效的数字');
        return false;
    }

    if (typeof data.currentRealmIndex !== 'number') {
        console.debug('存档数据中 currentRealmIndex 不是有效的数字');
        return false;
    }

    // 检查可选字段，如果存在则验证类型
    if (data.energyPerSecond !== undefined && typeof data.energyPerSecond !== 'number') {
        console.debug('存档数据中 energyPerSecond 不是有效的数字');
        return false;
    }

    if (data.cultivationPerSecond !== undefined && typeof data.cultivationPerSecond !== 'number') {
        console.debug('存档数据中 cultivationPerSecond 不是有效的数字');
        return false;
    }

    if (data.buyAmount !== undefined && typeof data.buyAmount !== 'string') {
        console.debug('存档数据中 buyAmount 不是有效的字符串');
        return false;
    }

    if (data.lastSaveTime !== undefined && typeof data.lastSaveTime !== 'number') {
        console.debug('存档数据中 lastSaveTime 不是有效的数字');
        return false;
    }

    return true;
}

/**
 * 尝试自动保存游戏
 * @returns {boolean} 保存是否成功
 */
function attemptAutoSave() {
    try {
        // console.log('开始自动保存...');
        const saveData = gatherDataForSave();
        // console.log('收集到的存档数据:', saveData);
        
        const serializedData = JSON.stringify(saveData);
        // console.log('序列化后的数据长度:', serializedData.length);
        
        localStorage.setItem(SAVE_KEY, serializedData);
        // console.log('自动保存成功完成');
        showAutoSaveNotification();
        return true;
    } catch (error) {
        console.error('自动保存失败:', error);
        return false;
    }
}

/**
 * 加载游戏数据
 * @returns {Object|null} 加载的游戏数据，如果加载失败则返回null
 */
function loadGameData() {
    try {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (!savedData) {
            return null;
        }

        const parsedData = JSON.parse(savedData);
        if (!isValidSaveData(parsedData)) {
            console.error('存档数据无效');
            return null;
        }

        return parsedData;
    } catch (error) {
        console.error('加载游戏数据失败:', error);
        return null;
    }
}

/**
 * 将加载的数据应用到游戏状态
 * @param {Object} loadedData - 加载的游戏数据
 * @returns {boolean} 是否成功应用数据
 */
function applyLoadedDataToGameState(loadedData) {
    try {
        if (!isValidSaveData(loadedData)) {
            throw new Error('无效的存档数据');
        }

        initializeGameState(loadedData);
        return true;
    } catch (error) {
        console.error('应用存档数据失败:', error);
        return false;
    }
}

/**
 * 导入游戏数据
 * @param {string} serializedString - 序列化的存档字符串
 * @returns {boolean} 导入是否成功
 */
function importGameData(serializedString) {
    try {
        const parsedData = JSON.parse(serializedString);
        if (!isValidSaveData(parsedData)) {
            throw new Error('无效的存档数据');
        }

        return applyLoadedDataToGameState(parsedData);
    } catch (error) {
        console.error('导入游戏数据失败:', error);
        return false;
    }
}

/**
 * 导出游戏数据
 * @returns {string} 序列化的游戏数据
 */
function exportGameData() {
    const saveData = gatherDataForSave();
    return JSON.stringify(saveData, null, 2);
}

/**
 * 保存用户偏好设置
 * @param {Object} preferences - 用户偏好设置
 */
function saveUserPreferences(preferences) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    } catch (error) {
        console.error('保存用户偏好设置失败:', error);
    }
}

/**
 * 加载用户偏好设置
 * @returns {Object|null} 用户偏好设置，如果加载失败则返回null
 */
function loadUserPreferences() {
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        return savedSettings ? JSON.parse(savedSettings) : null;
    } catch (error) {
        console.error('加载用户偏好设置失败:', error);
        return null;
    }
}

/**
 * 硬重置游戏
 */
function hardReset() {
    try {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        showNotification('游戏已重置', 'success');
    } catch (error) {
        console.error('硬重置游戏失败:', error);
        showNotification('重置失败', 'error');
    }
}

// 导出函数
export {
    attemptAutoSave,
    loadGameData,
    importGameData,
    exportGameData,
    saveUserPreferences,
    loadUserPreferences,
    hardReset
};
