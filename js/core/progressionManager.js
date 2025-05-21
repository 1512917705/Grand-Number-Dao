// 境界管理器模块

import { REALMS_DATA } from '../data/realmsData.js';
import { getGameState, updateGameState } from './gameState.js';
import * as uiManager from '../ui/uiManager.js';

/**
 * 检查并更新玩家境界
 * 该函数会检查玩家当前修为是否达到下一个境界的要求，
 * 如果达到则自动晋升，并支持连续突破
 */
export function updateRealm() {
    const gameState = getGameState();
    let currentRealmIndex = gameState.realm.currentRealmIndex;
    let hasRealmChanged = false;
    
    // 从当前境界的下一个境界开始检查
    while (true) {
        const nextRealm = REALMS_DATA[currentRealmIndex + 1];
        
        // 如果没有下一个境界，或者修为不足以突破，则停止检查
        if (!nextRealm || gameState.resources.cultivationPoints < nextRealm.threshold) {
            break;
        }
        
        // 可以突破到下一个境界
        currentRealmIndex++;
        hasRealmChanged = true;
        
        // 更新游戏状态中的境界索引
        updateGameState('realm.currentRealmIndex', currentRealmIndex);
        
        // 显示突破通知
        uiManager.showNotification(`恭喜突破到${nextRealm.name}！`);
        
        // 记录突破历史
        if (!gameState.realm.realmBreakthroughs) {
            updateGameState('realm.realmBreakthroughs', []);
        }
        gameState.realm.realmBreakthroughs.push({
            realm: nextRealm.name,
            timestamp: Date.now()
        });
    }
    
    // 如果境界发生变化，更新UI
    if (hasRealmChanged) {
        uiManager.updateAllUI(getGameState());
    }
}

/**
 * 获取当前境界信息
 * @returns {Object} 包含当前境界和下一个境界信息的对象
 */
export function getCurrentRealmInfo() {
    const gameState = getGameState();
    const currentRealmIndex = gameState.realm.currentRealmIndex;
    const currentRealm = REALMS_DATA[currentRealmIndex];
    const nextRealm = REALMS_DATA[currentRealmIndex + 1];
    
    return {
        currentRealm,
        nextRealm,
        currentRealmIndex
    };
}

/**
 * 计算当前境界的进度
 * @returns {Object} 包含进度信息的对象
 */
export function calculateRealmProgress() {
    const gameState = getGameState();
    const { currentRealm, nextRealm } = getCurrentRealmInfo();
    
    if (!nextRealm) {
        return {
            progress: 1,
            current: gameState.resources.cultivationPoints,
            next: null,
            progressText: '已达最高境界'
        };
    }
    
    const progress = (gameState.resources.cultivationPoints - currentRealm.threshold) / 
                    (nextRealm.threshold - currentRealm.threshold);
    
    return {
        progress: Math.min(progress, 1),
        current: gameState.resources.cultivationPoints,
        next: nextRealm.threshold,
        progressText: `${currentRealm.name} → ${nextRealm.name}`
    };
}
