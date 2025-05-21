// 导入游戏配置
import { REALMS_DATA } from '../data/realmsData.js';
import { config } from '../config.js';
import { calculateAutomationItemUIData } from '../utils/automationUtils.js';

/**
 * 获取初始游戏状态
 * @returns {Object} 初始游戏状态对象
 */
function getInitialGameState() {
    return {
        // 资源系统
        resources: {
            cultivationPoints: 0,     // 修为
            spiritualEnergy: 10,      // 灵气
            mana: 0,                  // 法力
            soulStrength: 1,          // 灵魂强度（转生加成）
            karma: 0,                 // 功德
            sin: 0                    // 业力
        },

        // 玩家统计
        stats: {
            totalClicks: 0,           // 总点击次数
            totalPlayTime: 0,         // 总游戏时间（秒）
            sessionStartTime: null,   // 本次会话开始时间
            lastSaveTime: null,       // 上次保存时间
            totalAscensions: 0,       // 总转生次数
            highestRealm: 0,          // 达到过的最高境界
            totalCultivationGained: 0, // 累计获得的修为
            totalSpiritGained: 0,     // 累计获得的灵气
            totalManaGained: 0,       // 累计获得的法力
            energyPerSecond: 0,        // 每秒能量
            cultivationPerSecond: 0    // 每秒修为
        },

        // 境界系统
        realm: {
            currentRealmIndex: 0,     // 当前境界索引
            realmBreakthroughs: 0     // 境界突破次数
        },

        // 功法系统 - 将由GongfaManager按需填充
        gongfas: {},

        // 技能系统 - 将由SkillManager按需填充
        skills: {},

        // 自动化系统
        automation: {
            "spirit-gathering-array": {
                count: 1,              // 初始默认有1个聚灵阵
                baseCost: 10,         // 基础成本
                costMultiplier: 1.15, // 成本增长系数
                baseEffect: 1,        // 基础效果
                effect: 1             // 当前效果
            },
            "auto-tuna": {
                count: 0,              // 初始等级为0
                baseCost: 50,         // 基础成本
                costMultiplier: 1.2,  // 成本增长系数
                baseSpiritConsumedPerSecond: 1,  // 基础灵气消耗
                baseCultivationGainedPerSecond: 5, // 基础修为产出
                currentSpiritConsumed: 0,        // 当前灵气消耗
                currentCultivationGained: 0      // 当前修为产出
            }
        },

        // 成就系统
        achievements: {
            unlocked: [],            // 已解锁的成就ID
            progress: {},            // 成就进度
            rewards: {}              // 已领取的成就奖励
        },

        // 挑战系统
        challenges: {
            active: null,            // 当前激活的挑战ID
            completed: [],           // 已完成的挑战ID
            rewards: {}              // 已领取的挑战奖励
        },

        // 活动系统
        activities: {
            active: [],              // 当前激活的活动ID
            completed: [],           // 已完成的活动ID
            rewards: {}              // 已领取的活动奖励
        },

        // 加成系统
        bonuses: {
            clickMultiplier: 1,      // 点击加成
            spiritMultiplier: 1,     // 灵气加成
            cultivationMultiplier: 1, // 修为加成
            manaMultiplier: 1,       // 法力加成
            automationMultiplier: 1  // 自动化加成
        },

        // 游戏设置
        settings: {
            numberFormat: 'chinese',  // 数字显示格式
            autoSave: true,          // 自动保存
            soundEnabled: true,      // 音效开关
            musicEnabled: true,      // 音乐开关
            notifications: true,     // 通知开关
            theme: 'default'         // 界面主题
        },

        // 购买数量
        buyAmount: "1",

        // 预计算的UI数据
        precalculatedItemUIData: []
    };
}

// 游戏状态对象
let gameState = getInitialGameState();

/**
 * 初始化游戏状态
 * @param {Object} [savedData=null] - 从存档加载的数据
 */
function initializeGameState(savedData = null) {
    // 基础游戏状态
    gameState = {
        resources: {
            cultivationPoints: 0,
            spiritualEnergy: 0,
            mana: 0
        },
        stats: {
            totalClicks: 0,
            energyPerSecond: 0,
            cultivationPerSecond: 0
        },
        realm: {
            currentRealmIndex: 0
        },
        automation: {
            "spirit-gathering-array": {
                count: 1,
                baseEffect: config.gameBalance.automation["spirit-gathering-array"].baseEffect,
                effect: config.gameBalance.automation["spirit-gathering-array"].baseEffect
            },
            "auto-tuna": {
                count: 0,
                baseSpiritConsumedPerSecond: config.gameBalance.automation["auto-tuna"].baseSpiritConsumedPerSecond,
                baseCultivationGainedPerSecond: config.gameBalance.automation["auto-tuna"].baseCultivationGainedPerSecond,
                currentSpiritConsumed: 0,
                currentCultivationGained: 0
            }
        },
        buyAmount: "1", // 默认购买数量
        precalculatedItemUIData: [] // 初始化预计算的UI数据
    };

    // 如果有存档数据，则加载存档
    if (savedData) {
        // 加载资源数据
        if (savedData.resources) {
            gameState.resources = { ...gameState.resources, ...savedData.resources };
        }

        // 加载统计数据
        if (savedData.totalClicks) {
            gameState.stats.totalClicks = savedData.totalClicks;
        }

        // 加载境界数据
        if (savedData.currentRealmIndex !== undefined) {
            gameState.realm.currentRealmIndex = savedData.currentRealmIndex;
        }

        // 加载自动化设备数据
        if (savedData.automation) {
            if (savedData.automation["spirit-gathering-array"]) {
                gameState.automation["spirit-gathering-array"].count = 
                    savedData.automation["spirit-gathering-array"].count;
                gameState.automation["spirit-gathering-array"].effect = 
                    savedData.automation["spirit-gathering-array"].effect;
            }
            if (savedData.automation["auto-tuna"]) {
                gameState.automation["auto-tuna"].count = 
                    savedData.automation["auto-tuna"].count;
                gameState.automation["auto-tuna"].currentSpiritConsumed = 
                    savedData.automation["auto-tuna"].currentSpiritConsumed;
                gameState.automation["auto-tuna"].currentCultivationGained = 
                    savedData.automation["auto-tuna"].currentCultivationGained;
            }
        }

        // 加载购买数量设置
        if (savedData.buyAmount) {
            gameState.buyAmount = savedData.buyAmount;
        }
    }

    // 计算初始的UI数据
    gameState.precalculatedItemUIData = calculateAutomationItemUIData(gameState);

    return gameState;
}

/**
 * 深度合并对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            result[key] = deepMerge(target[key], source[key]);
        } else {
            result[key] = source[key];
        }
    }
    
    return result;
}

/**
 * 获取游戏状态
 * @returns {Object} 游戏状态对象
 */
function getGameState() {
    // 确保返回一个有效的状态对象
    if (!gameState) {
        gameState = getInitialGameState();
    }
    return gameState;
}

/**
 * 更新游戏状态
 * @param {string} path - 状态路径（例如：'resources.cultivationPoints'）
 * @param {*} value - 新值
 */
function updateGameState(path, value) {
    const keys = path.split('.');
    let current = gameState;
    
    for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
}

/**
 * 重置游戏状态
 */
function resetGameState() {
    gameState = getInitialGameState();
    console.log("游戏状态已重置。");
    return gameState;
}

// 导出
export {
    getInitialGameState,
    initializeGameState,
    getGameState,
    updateGameState,
    resetGameState
}; 