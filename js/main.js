// 游戏主入口文件

// 配置对象
const config = {
    debugMode: true,
    plaintextImportExport: true,
    numberDisplayFormat: "chinese", // 默认使用中文单位
    autoSaveInterval: 60000, // 自动保存间隔时间，单位毫秒
    gameBalance: {
        clickValue: 10,  // 每次点击消耗的灵气数量
        conversionRate: 10,  // 灵气转化为修为的比率
        automation: {
            "spirit-gathering-array": {
                baseCost: 10,
                costMultiplier: 1.15,
                baseEffect: 1
            },
            "auto-tuna": {
                baseCost: 50,
                costMultiplier: 1.2,
                baseSpiritConsumedPerSecond: 1,
                baseCultivationGainedPerSecond: 5
            }
        }
    }
};

// 导入境界数据
import { REALMS_DATA } from './data/realmsData.js';

// DOM元素引用
const elements = {
    // 页眉按钮
    importBtn: document.getElementById('import-btn'),
    exportBtn: document.getElementById('export-btn'),
    settingsBtn: document.getElementById('settings-btn'),

    // 左侧面板
    leftPanel: document.getElementById('left-panel'),
    toggleLeftPanelBtn: document.getElementById('toggle-left-panel'),
    
    // 修炼按钮
    meditateBtn: document.getElementById('meditate-btn'),
    clickValue: document.getElementById('click-value'),
    
    // 页签相关
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // 资源显示
    cultivationPoints: document.getElementById('cultivation-points'),
    spiritualEnergy: document.getElementById('spiritual-energy'),
    mana: document.getElementById('mana'),
    
    // 境界进度
    realmProgress: document.getElementById('realm-progress'),
    realmProgressText: document.getElementById('realm-progress-text'),
    
    // 统计信息
    totalClicks: document.getElementById('total-clicks'),
    energyPerSecond: document.getElementById('energy-per-second'),
    cultivationPerSecond: document.getElementById('cultivation-per-second'),
    
    // 右侧面板
    amountBtns: document.querySelectorAll('.amount-btn'),
    automationItems: document.querySelectorAll('.automation-item.clickable-item'),
    
    // 设置菜单相关
    settingsMenu: document.getElementById('settings-menu'),
    menuImportBtn: document.getElementById('menu-import-btn'),
    menuExportBtn: document.getElementById('menu-export-btn'),
    menuHardResetBtn: document.getElementById('menu-hard-reset-btn'),
    
    // 自动保存提示
    autoSaveNotification: document.getElementById('auto-save-notification')
};

// 格式化大数字的辅助函数
function formatNumber(value) {
    if (value === undefined || value === null || isNaN(value)) return "0";
    if (value === 0) return "0";

    const localSign = value < 0 ? "-" : "";
    const absValue = Math.abs(value);

    // 从配置中获取当前显示格式
    const displayFormat = config.numberDisplayFormat;

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

// 游戏状态
const gameState = {
    // 资源
    resources: {
        cultivationPoints: 0,     // 修为
        spiritualEnergy: 10,      // 灵气 - 初始给10点灵气让玩家能开始打坐
        mana: 0                   // 法力
    },
    
    // 点击数据
    clicks: {
        total: 0,                 // 总点击次数
        value: config.gameBalance.clickValue  // 每次点击消耗的灵气数量
    },
    
    // 转化比例
    conversion: {
        rate: config.gameBalance.conversionRate  // 1点灵气转化为1点修为
    },
    
    // 境界数据
    realm: {
        currentRealmIndex: 0       // 当前境界索引，指向REALMS_DATA中的境界
    },
    
    // 自动化设备
    automation: {
        "spirit-gathering-array": {
            name: "聚灵阵",
            count: 1,             // 初始默认有1个聚灵阵
            baseCost: config.gameBalance.automation["spirit-gathering-array"].baseCost,
            costMultiplier: config.gameBalance.automation["spirit-gathering-array"].costMultiplier,
            baseEffect: config.gameBalance.automation["spirit-gathering-array"].baseEffect,
            effect: config.gameBalance.automation["spirit-gathering-array"].baseEffect
        },
        "auto-tuna": {
            name: "自动吐纳",
            count: 0,                                // 等级
            baseCost: config.gameBalance.automation["auto-tuna"].baseCost,
            costMultiplier: config.gameBalance.automation["auto-tuna"].costMultiplier,
            baseSpiritConsumedPerSecond: config.gameBalance.automation["auto-tuna"].baseSpiritConsumedPerSecond,
            baseCultivationGainedPerSecond: config.gameBalance.automation["auto-tuna"].baseCultivationGainedPerSecond,
            currentSpiritConsumed: 0,                // 当前每秒消耗的灵气总量
            currentCultivationGained: 0              // 当前每秒产出的修为总量
        }
    },
    
    // 统计数据
    stats: {
        energyPerSecond: 0,        // 每秒灵气获取速度
        cultivationPerSecond: 0    // 每秒修为获取速度
    },
    
    // 购买数量设置
    buyAmount: "1",               // 默认购买1个

    // 节拍数据
    tickData: {
        meditationClicksThisTick: 0  // 本节拍内的打坐点击次数
    }
};

// 收集需要保存的游戏数据
function gatherDataForSave() {
    const saveData = {
        resources: {
            cultivationPoints: gameState.resources.cultivationPoints,
            spiritualEnergy: gameState.resources.spiritualEnergy,
            mana: gameState.resources.mana
        },
        totalClicks: gameState.clicks.total,
        currentRealmIndex: gameState.realm.currentRealmIndex,
        automationLevels: {
            spiritGatheringArrayLevel: gameState.automation["spirit-gathering-array"].count,
            autoTunaLevel: gameState.automation["auto-tuna"].count
        },
        settings: {
            numberDisplayFormat: config.numberDisplayFormat
        },
        lastSaveTime: Date.now()
    };
    return saveData;
}

// 尝试自动保存游戏
function attemptAutoSave() {
    try {
        const dataToSave = gatherDataForSave();
        const jsonString = JSON.stringify(dataToSave);
        localStorage.setItem('xianxiaGameSave', jsonString);
        showAutoSaveNotification();
        if (config.debugMode) {
            console.log("游戏已自动保存于", new Date().toLocaleString());
        }
    } catch (error) {
        console.error("自动保存失败:", error);
    }
}

// 加载游戏数据
function loadGameData() {
    const savedJson = localStorage.getItem('xianxiaGameSave');
    if (savedJson) {
        try {
            const loadedData = JSON.parse(savedJson);

            // 应用数据到 gameState
            gameState.resources.cultivationPoints = loadedData.resources.cultivationPoints || 0;
            gameState.resources.spiritualEnergy = loadedData.resources.spiritualEnergy || 0;
            gameState.resources.mana = loadedData.resources.mana || 0;
            gameState.clicks.total = loadedData.totalClicks || 0;
            gameState.realm.currentRealmIndex = loadedData.currentRealmIndex || 0;

            // 处理自动化设备等级
            if (loadedData.automationLevels) {
                gameState.automation["spirit-gathering-array"].count = loadedData.automationLevels.spiritGatheringArrayLevel || 0;
                gameState.automation["auto-tuna"].count = loadedData.automationLevels.autoTunaLevel || 0;
            } else {
                // 处理旧存档可能没有 automationLevels 的情况
                gameState.automation["spirit-gathering-array"].count = 0;
                gameState.automation["auto-tuna"].count = 0;
            }

            // 加载设置
            if (loadedData.settings && loadedData.settings.numberDisplayFormat) {
                config.numberDisplayFormat = loadedData.settings.numberDisplayFormat;
            }

            // 重新计算自动化效果
            reinitializeAutomationEffects();

            if (config.debugMode) {
                console.log("游戏数据已加载，上次保存时间:", new Date(loadedData.lastSaveTime).toLocaleString());
            }
        } catch (error) {
            console.error("加载已保存的游戏数据失败:", error);
            localStorage.removeItem('xianxiaGameSave'); // 清除损坏的存档
        }
    } else if (config.debugMode) {
        console.log("未找到存档，开始新游戏");
    }

    // 更新UI以反映当前状态
    updateUI();
}

// 重新初始化自动化效果
function reinitializeAutomationEffects() {
    // 更新聚灵阵效果
    const spiritGatheringArray = gameState.automation["spirit-gathering-array"];
    spiritGatheringArray.effect = spiritGatheringArray.baseEffect * spiritGatheringArray.count;

    // 更新自动吐纳效果
    const autoTuna = gameState.automation["auto-tuna"];
    autoTuna.currentSpiritConsumed = autoTuna.baseSpiritConsumedPerSecond * autoTuna.count;
    autoTuna.currentCultivationGained = autoTuna.baseCultivationGainedPerSecond * autoTuna.count;
}

// 显示自动保存通知
function showAutoSaveNotification() {
    const notification = document.getElementById('auto-save-notification');
    if (notification) {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000); // 3秒后自动隐藏
    }
}

// 应用导入的数据到游戏状态
function applyImportedDataToGameState(loadedData) {
    // 应用资源数据
    gameState.resources.cultivationPoints = loadedData.resources.cultivationPoints || 0;
    gameState.resources.spiritualEnergy = loadedData.resources.spiritualEnergy || 0;
    gameState.resources.mana = loadedData.resources.mana || 0;
    
    // 应用点击数据
    gameState.clicks.total = loadedData.totalClicks || 0;
    
    // 应用境界数据
    gameState.realm.currentRealmIndex = loadedData.currentRealmIndex || 0;
    
    // 应用自动化设备等级
    if (loadedData.automationLevels) {
        gameState.automation["spirit-gathering-array"].count = loadedData.automationLevels.spiritGatheringArrayLevel || 0;
        gameState.automation["auto-tuna"].count = loadedData.automationLevels.autoTunaLevel || 0;
    } else {
        // 处理旧存档可能没有 automationLevels 的情况
        gameState.automation["spirit-gathering-array"].count = 0;
        gameState.automation["auto-tuna"].count = 0;
    }

    // 应用设置
    if (loadedData.settings && loadedData.settings.numberDisplayFormat) {
        config.numberDisplayFormat = loadedData.settings.numberDisplayFormat;
    }
    
    // 重新计算自动化效果
    reinitializeAutomationEffects();
    
    // 更新境界进度
    updateRealmProgress();
    
    // 立即执行一次自动保存
    attemptAutoSave();
    
    if (config.debugMode) {
        console.log('游戏数据已成功导入:', loadedData);
    }
}

// 导入游戏数据
function importGameData() {
    // 创建模态窗口
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>导入存档</h3>
            <p>请粘贴存档内容：</p>
            <textarea id="import-text" placeholder="在此粘贴存档内容..."></textarea>
            <div class="modal-buttons">
                <button id="confirm-import-btn">确认导入</button>
                <button id="close-import-modal">取消</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 添加事件监听器
    document.getElementById('confirm-import-btn').addEventListener('click', () => {
        const importedString = document.getElementById('import-text').value.trim();
        if (!importedString) {
            alert('请输入存档内容！');
            return;
        }

        try {
            let jsonString;
            if (config.plaintextImportExport) {
                jsonString = importedString;
            } else {
                jsonString = decryptFunction(importedString);
            }

            const loadedData = JSON.parse(jsonString);
            if (isValidSaveData(loadedData)) {
                applyImportedDataToGameState(loadedData);
                updateUI();
                showImportSuccessNotification();
                document.body.removeChild(modal);
            } else {
                alert('存档数据格式无效！');
            }
        } catch (error) {
            console.error('导入存档失败:', error);
            alert('导入失败，数据可能已损坏或格式错误！');
        }
    });

    document.getElementById('close-import-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // 点击模态窗口外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 显示导入成功通知
function showImportSuccessNotification() {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = '存档导入成功！';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
    }, 100);
}

// 获取初始游戏状态
function getInitialGameState() {
    return {
        // 资源
        resources: {
            cultivationPoints: 0,     // 修为
            spiritualEnergy: 10,      // 灵气 - 初始给10点灵气让玩家能开始打坐
            mana: 0                   // 法力
        },
        
        // 点击数据
        clicks: {
            total: 0,                 // 总点击次数
            value: config.gameBalance.clickValue  // 每次点击消耗的灵气数量
        },
        
        // 转化比例
        conversion: {
            rate: config.gameBalance.conversionRate  // 1点灵气转化为1点修为
        },
        
        // 境界数据
        realm: {
            currentRealmIndex: 0       // 当前境界索引，指向REALMS_DATA中的境界
        },
        
        // 自动化设备
        automation: {
            "spirit-gathering-array": {
                name: "聚灵阵",
                count: 1,             // 初始默认有1个聚灵阵
                baseCost: config.gameBalance.automation["spirit-gathering-array"].baseCost,
                costMultiplier: config.gameBalance.automation["spirit-gathering-array"].costMultiplier,
                baseEffect: config.gameBalance.automation["spirit-gathering-array"].baseEffect,
                effect: config.gameBalance.automation["spirit-gathering-array"].baseEffect
            },
            "auto-tuna": {
                name: "自动吐纳",
                count: 0,                                // 等级
                baseCost: config.gameBalance.automation["auto-tuna"].baseCost,
                costMultiplier: config.gameBalance.automation["auto-tuna"].costMultiplier,
                baseSpiritConsumedPerSecond: config.gameBalance.automation["auto-tuna"].baseSpiritConsumedPerSecond,
                baseCultivationGainedPerSecond: config.gameBalance.automation["auto-tuna"].baseCultivationGainedPerSecond,
                currentSpiritConsumed: 0,                // 当前每秒消耗的灵气总量
                currentCultivationGained: 0              // 当前每秒产出的修为总量
            }
        },
        
        // 统计数据
        stats: {
            energyPerSecond: 0,        // 每秒灵气获取速度
            cultivationPerSecond: 0    // 每秒修为获取速度
        },
        
        // 购买数量设置
        buyAmount: "1",               // 默认购买1个

        // 节拍数据
        tickData: {
            meditationClicksThisTick: 0  // 本节拍内的打坐点击次数
        }
    };
}

// 显示确认对话框
function showConfirmationModal({ title, message, confirmButtonText, confirmButtonClass, onConfirm, cancelButtonText, onCancel }) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';  // 使用新的CSS类
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="modal-buttons">
                <button id="confirm-btn" class="${confirmButtonClass}">${confirmButtonText}</button>
                <button id="cancel-btn">${cancelButtonText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 添加事件监听器
    document.getElementById('confirm-btn').addEventListener('click', () => {
        onConfirm();
        document.body.removeChild(modal);
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        if (onCancel) onCancel();
        document.body.removeChild(modal);
    });

    // 点击模态窗口外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (onCancel) onCancel();
            document.body.removeChild(modal);
        }
    });
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
    }, 100);
}

// 硬重置游戏
function hardResetGame() {
    showConfirmationModal({
        title: "确认硬重置",
        message: "警告：此操作将清除所有游戏进度且不可逆！确定要重置游戏吗？",
        confirmButtonText: "重置",
        confirmButtonClass: "danger-button",
        onConfirm: () => {
            // 清除存档
            localStorage.removeItem('xianxiaGameSave');
            
            // 重置游戏状态
            const initialState = getInitialGameState();
            Object.assign(gameState, initialState);
            
            // 重新计算自动化效果
            reinitializeAutomationEffects();
            
            // 更新UI
            updateUI();
            
            // 显示通知
            showNotification("游戏已重置", "success");
            
            if (config.debugMode) {
                console.log("游戏已重置为初始状态");
            }
        },
        cancelButtonText: "取消"
    });
}

// 初始化游戏
function initGame() {
    loadSettings(); // 在游戏初始化时加载设置
    // 加载保存的游戏数据
    loadGameData();
    
    // 初始化境界
    updateRealmProgress();
    
    // 注册事件监听器
    registerEventListeners();
    
    // 初始化调试功能
    initDebugFeatures();
    
    // 更新UI显示
    updateUI();
    
    // 启动游戏循环
    setInterval(gameLoop, 1000);
    
    // 启动自动保存
    setInterval(attemptAutoSave, config.autoSaveInterval);
}

// 初始化调试功能
function initDebugFeatures() {
    // 如果调试模式关闭，则直接返回
    if (!config.debugMode) return;
    
    // 1. 创建修改修为按钮
    const modifyCultivationBtn = document.createElement('button');
    modifyCultivationBtn.id = 'debug-modify-cultivation-btn';
    modifyCultivationBtn.className = 'debug-btn';
    modifyCultivationBtn.textContent = '🔧';
    modifyCultivationBtn.title = '修改修为';
    
    // 添加到修为显示区域旁边
    const cultivationResource = elements.cultivationPoints.closest('.resource');
    if (cultivationResource) {
        cultivationResource.appendChild(modifyCultivationBtn);
    }
    
    // 2. 创建修改灵气按钮
    const modifySpiritBtn = document.createElement('button');
    modifySpiritBtn.id = 'debug-modify-spirit-btn';
    modifySpiritBtn.className = 'debug-btn';
    modifySpiritBtn.textContent = '🔧';
    modifySpiritBtn.title = '修改灵气';
    
    // 添加到灵气显示区域旁边
    const spiritResource = elements.spiritualEnergy.closest('.resource');
    if (spiritResource) {
        spiritResource.appendChild(modifySpiritBtn);
    }
    
    // 3. 为修改修为按钮添加事件监听器
    modifyCultivationBtn.addEventListener('click', () => {
        // 显示输入对话框
        const newValue = prompt('请输入新的修为值:', gameState.resources.cultivationPoints);
        
        // 如果用户点击取消，则不执行操作
        if (newValue === null) return;
        
        // 尝试将输入转换为数字
        const parsedValue = parseFloat(newValue);
        
        // 验证输入
        if (isNaN(parsedValue) || parsedValue < 0) {
            alert('请输入有效的非负数值!');
            return;
        }
        
        // 更新修为值
        gameState.resources.cultivationPoints = parsedValue;
        
        // 检查是否需要更新境界
        updateRealmProgress();
        
        // 更新UI
        updateUI();
        
        console.log(`[DEBUG] 修为已修改为: ${parsedValue}`);
    });
    
    // 4. 为修改灵气按钮添加事件监听器
    modifySpiritBtn.addEventListener('click', () => {
        // 显示输入对话框
        const newValue = prompt('请输入新的灵气值:', gameState.resources.spiritualEnergy);
        
        // 如果用户点击取消，则不执行操作
        if (newValue === null) return;
        
        // 尝试将输入转换为数字
        const parsedValue = parseFloat(newValue);
        
        // 验证输入
        if (isNaN(parsedValue) || parsedValue < 0) {
            alert('请输入有效的非负数值!');
            return;
        }
        
        // 更新灵气值
        gameState.resources.spiritualEnergy = parsedValue;
        
        // 更新UI
        updateUI();
        
        console.log(`[DEBUG] 灵气已修改为: ${parsedValue}`);
    });
    
    // 添加调试按钮的样式
    const style = document.createElement('style');
    style.textContent = `
        .debug-btn {
            margin-left: 8px;
            background-color: #ff9800;
            color: white;
            border: none;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .debug-btn:hover {
            background-color: #f57c00;
        }
    `;
    document.head.appendChild(style);
    
    console.log('[DEBUG] 调试功能已初始化');
}

// 注册事件监听器
function registerEventListeners() {
    // 左侧面板折叠按钮
    elements.toggleLeftPanelBtn.addEventListener('click', toggleLeftPanel);
    
    // 修炼按钮
    elements.meditateBtn.addEventListener('click', handleMeditate);
    
    // 页签按钮事件
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有页签按钮的active类
            elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的active类
            button.classList.add('active');
            
            // 获取目标内容区域
            const targetId = button.dataset.tabTarget;
            const targetContent = document.querySelector(targetId);
            
            // 隐藏所有内容区域
            elements.tabContents.forEach(content => content.classList.remove('active'));
            
            // 显示目标内容区域
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // 数量选择按钮
    elements.amountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的active类
            elements.amountBtns.forEach(b => b.classList.remove('active'));
            // 给点击的按钮添加active类
            btn.classList.add('active');
            // 更新购买数量
            gameState.buyAmount = btn.dataset.amount;
            
            // 更新UI以显示新的购买数量对应的成本
            updateUI();
        });
    });
    
    // 自动化设备点击购买
    elements.automationItems.forEach(item => {
        item.addEventListener('click', () => {
            const itemId = item.dataset.item;
            buyAutomation(itemId);
        });
    });
    
    // 默认激活x1按钮
    elements.amountBtns[0].classList.add('active');
    
    // 设置菜单显示/隐藏
    elements.settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // 确保其他菜单都关闭
        document.querySelectorAll('.settings-menu').forEach(menu => {
            if (menu !== elements.settingsMenu) {
                menu.classList.remove('show');
            }
        });
        // 切换当前菜单的显示状态
        elements.settingsMenu.classList.toggle('show');
    });
    
    // 点击页面其他地方时隐藏设置菜单
    document.addEventListener('click', (e) => {
        if (!elements.settingsMenu.contains(e.target) && e.target !== elements.settingsBtn) {
            elements.settingsMenu.classList.remove('show');
        }
    });
    
    // 设置菜单项点击事件
    elements.menuImportBtn.addEventListener('click', () => {
        importGameData();
        elements.settingsMenu.classList.remove('show');
    });
    
    elements.menuExportBtn.addEventListener('click', () => {
        exportGameData();
        elements.settingsMenu.classList.remove('show');
    });
    
    elements.menuHardResetBtn.addEventListener('click', () => {
        hardResetGame();
        elements.settingsMenu.classList.remove('show');
    });
}

// 切换左侧面板
function toggleLeftPanel() {
    elements.leftPanel.classList.toggle('collapsed');
    // 如果面板已收起，按钮显示向右箭头；否则显示向左箭头
    elements.toggleLeftPanelBtn.textContent = elements.leftPanel.classList.contains('collapsed') ? '▶' : '◀';
}

// 处理修炼按钮点击 - 修改为只记录点击次数
function handleMeditate() {
    // 增加点击次数
    gameState.clicks.total++;
    
    // 增加本节拍内的点击计数
    gameState.tickData.meditationClicksThisTick++;
}

// 购买自动化设备
function buyAutomation(itemId) {
    const item = gameState.automation[itemId];
    if (!item) return;
    
    // 计算购买数量
    let amount = 1;
    if (gameState.buyAmount === "100") {
        amount = 100;
    } else if (gameState.buyAmount === "half") {
        // 计算可以购买的最大数量的一半
        const maxAffordable = getMaxAffordableAmount(itemId);
        amount = Math.max(1, Math.floor(maxAffordable / 2));
    } else if (gameState.buyAmount === "max") {
        // 计算可以购买的最大数量
        amount = getMaxAffordableAmount(itemId);
    }
    
    // 确保至少购买1个
    amount = Math.max(1, amount);
    
    // 计算总成本
    const totalCost = calculateTotalCost(itemId, amount);
    
    // 检查资源是否足够
    if (gameState.resources.cultivationPoints >= totalCost) {
        // 扣除资源
        gameState.resources.cultivationPoints -= totalCost;
        
        // 增加设备数量
        item.count += amount;
        
        // 更新设备效果
        if (itemId === "spirit-gathering-array") {
            // 聚灵阵直接更新效果
            item.effect = item.baseEffect * item.count;
        } else if (itemId === "auto-tuna") {
            // 自动吐纳更新消耗和产出
            item.currentSpiritConsumed = item.baseSpiritConsumedPerSecond * item.count;
            item.currentCultivationGained = item.baseCultivationGainedPerSecond * item.count;
        }
        
        // 检查境界是否需要更新
        updateRealmProgress();
        
        // 更新UI
        updateUI();
    }
}

// 计算指定设备的总成本
function calculateTotalCost(itemId, amount) {
    const item = gameState.automation[itemId];
    let totalCost = 0;
    
    for (let i = 0; i < amount; i++) {
        totalCost += Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.count + i));
    }
    
    return totalCost;
}

// 计算可以购买的最大数量
function getMaxAffordableAmount(itemId) {
    const item = gameState.automation[itemId];
    const resources = gameState.resources.cultivationPoints;
    
    let amount = 0;
    let cost = 0;
    let nextCost = Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.count));
    
    while (resources >= cost + nextCost) {
        cost += nextCost;
        amount++;
        nextCost = Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.count + amount));
    }
    
    return amount;
}

// 处理自动化设备产出
function processAutomation() {
    // 获取聚灵阵
    const spiritGatheringArray = gameState.automation["spirit-gathering-array"];
    
    // 计算灵气产出
    let totalEnergyPerSecond = 0;
    
    if (spiritGatheringArray && spiritGatheringArray.count > 0) {
        totalEnergyPerSecond = spiritGatheringArray.effect;
    }
    
    // 更新每秒灵气获取速度显示
    gameState.stats.energyPerSecond = totalEnergyPerSecond;
    
    // 返回本节拍产生的灵气量
    return totalEnergyPerSecond;
}

// 处理自动吐纳功能
function processAutoTuna() {
    // 获取自动吐纳
    const autoTuna = gameState.automation["auto-tuna"];
    
    // 如果自动吐纳等级为0，则不执行
    if (!autoTuna || autoTuna.count === 0) {
        gameState.stats.cultivationPerSecond = 0;
        return { spiritConsumed: 0, cultivationGained: 0 };
    }
    
    // 获取当前消耗和产出
    const spiritToConsume = autoTuna.currentSpiritConsumed;
    const cultivationToGain = autoTuna.currentCultivationGained;
    
    // 更新每秒修为获取速度
    gameState.stats.cultivationPerSecond = cultivationToGain;
    
    // 返回消耗和产出值
    return {
        spiritConsumed: spiritToConsume,
        cultivationGained: cultivationToGain
    };
}

// 处理游戏节拍
function processTick() {
    // 阶段A：资源产生
    const spiritGainedThisTick = processAutomation();
    let availableSpirit = gameState.resources.spiritualEnergy + spiritGainedThisTick;
    
    // 阶段B：自动化消耗与转化
    const autoTunaResult = processAutoTuna();
    let totalCultivationGained = 0;
    
    if (availableSpirit >= autoTunaResult.spiritConsumed) {
        availableSpirit -= autoTunaResult.spiritConsumed;
        totalCultivationGained += autoTunaResult.cultivationGained;
    } else {
        gameState.stats.cultivationPerSecond = 0;
    }
    
    // 阶段C：处理累计的手动操作
    const clicksToProcess = gameState.tickData.meditationClicksThisTick;
    gameState.tickData.meditationClicksThisTick = 0;
    
    const spiritPerClick = gameState.clicks.value;
    const cultivationPerClick = gameState.conversion.rate;
    
    for (let i = 0; i < clicksToProcess; i++) {
        if (availableSpirit > 0) {
            // 计算本次点击实际可以转化的灵气量
            const actualSpiritUsed = Math.min(availableSpirit, spiritPerClick);
            // 按比例计算获得的修为
            const actualCultivationGained = (actualSpiritUsed / spiritPerClick) * cultivationPerClick;
            
            availableSpirit -= actualSpiritUsed;
            totalCultivationGained += actualCultivationGained;
        } else {
            break;
        }
    }
    
    // 阶段D：最终状态更新
    gameState.resources.spiritualEnergy = availableSpirit;
    gameState.resources.cultivationPoints += totalCultivationGained;
    
    // 阶段E：其他周期性更新
    updateRealmProgress();
}

// 游戏主循环，每秒执行一次
function gameLoop() {
    // 执行游戏节拍
    processTick();
    
    // 更新UI
    updateUI();
}

// 更新境界进度
function updateRealmProgress() {
    const playerCultivation = gameState.resources.cultivationPoints;
    
    // 从当前境界的下一个境界开始检查，看是否可以提升境界
    for (let i = gameState.realm.currentRealmIndex + 1; i < REALMS_DATA.length; i++) {
        if (playerCultivation >= REALMS_DATA[i].threshold) {
            // 更新当前境界索引
            gameState.realm.currentRealmIndex = i;
            
            // 可以在这里添加境界突破的特殊逻辑或显示
            console.log(`突破至新境界: ${REALMS_DATA[i].name}`);
        } else {
            // 如果找到第一个无法突破的境界，停止检查
            break;
        }
    }
}

// 更新UI显示
function updateUI() {
    // 使用 formatNumber 格式化所有数字显示
    elements.cultivationPoints.textContent = formatNumber(gameState.resources.cultivationPoints);
    elements.spiritualEnergy.textContent = formatNumber(gameState.resources.spiritualEnergy);
    elements.mana.textContent = formatNumber(gameState.resources.mana);
    elements.clickValue.textContent = formatNumber(gameState.conversion.rate);
    elements.totalClicks.textContent = gameState.clicks.total;
    elements.energyPerSecond.textContent = formatNumber(gameState.stats.energyPerSecond);
    elements.cultivationPerSecond.textContent = formatNumber(gameState.stats.cultivationPerSecond);
    
    // 更新境界显示
    updateRealmUI();
    
    // 更新自动化设备显示
    updateAutomationUI();
}

// 更新境界UI
function updateRealmUI() {
    // 获取当前境界对象
    const currentRealm = REALMS_DATA[gameState.realm.currentRealmIndex];
    
    // 获取下一个境界对象
    const nextRealm = REALMS_DATA[gameState.realm.currentRealmIndex + 1];
    
    // 获取当前修为
    const playerCultivation = gameState.resources.cultivationPoints;
    
    // 更新境界文字描述
    if (nextRealm) {
        elements.realmProgressText.textContent = `${currentRealm.name}: ${formatNumber(playerCultivation)} / ${formatNumber(nextRealm.threshold)}`;
    } else {
        // 已经是最高境界
        elements.realmProgressText.textContent = `${currentRealm.name}: ${formatNumber(playerCultivation)} / --`;
    }
    
    // 更新境界进度条
    let progressPercent = 0;
    if (nextRealm) {
        // 计算当前境界内的进度百分比
        const currentThreshold = currentRealm.threshold;
        const nextThreshold = nextRealm.threshold;
        
        if (nextThreshold > currentThreshold) {
            progressPercent = Math.min(100, Math.max(0, (playerCultivation - currentThreshold) / (nextThreshold - currentThreshold) * 100));
        }
    } else {
        // 已经是最高境界，进度条显示100%
        progressPercent = 100;
    }
    
    elements.realmProgress.style.width = `${progressPercent}%`;
}

// 更新自动化设备UI
function updateAutomationUI() {
    // 遍历所有自动化设备元素
    document.querySelectorAll('.automation-item.clickable-item').forEach(itemElement => {
        const itemId = itemElement.dataset.item;
        const item = gameState.automation[itemId];
        
        if (item) {
            // 更新特定元素
            if (itemId === "spirit-gathering-array") {
                // 更新聚灵阵显示
                const levelElement = itemElement.querySelector('.item-level');
                if (levelElement) {
                    levelElement.textContent = `数量: ${item.count}`;
                }
                
                const effectElement = itemElement.querySelector('.item-effect');
                if (effectElement) {
                    effectElement.textContent = `效果: 每秒产生${item.effect}灵气`;
                }
            } else if (itemId === "auto-tuna") {
                // 更新自动吐纳显示
                const levelElement = itemElement.querySelector('#auto-tuna-level');
                if (levelElement) {
                    levelElement.textContent = item.count;
                }
                
                const effectElement = itemElement.querySelector('#auto-tuna-effect');
                if (effectElement) {
                    const spiritConsumed = item.baseSpiritConsumedPerSecond * item.count;
                    const cultivationGained = item.baseCultivationGainedPerSecond * item.count;
                    effectElement.textContent = `消耗${spiritConsumed}灵气/秒, 产出${cultivationGained}修为/秒`;
                }
            }
            
            // 更新成本显示 - 通用逻辑
            const costElement = itemElement.querySelector('.item-cost');
            if (costElement) {
                let costContent = "";
                
                // 获取下一次购买的成本
                const nextCost = Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.count));
                
                // 定义amount变量，提升作用域
                let amount = 1;
                
                if (gameState.buyAmount === "1") {
                    costContent = `成本: ${nextCost}修为`;
                } else {
                    // 计算购买多个的总成本
                    if (gameState.buyAmount === "100") {
                        amount = 100;
                    } else if (gameState.buyAmount === "half") {
                        amount = Math.max(1, Math.floor(getMaxAffordableAmount(itemId) / 2));
                    } else if (gameState.buyAmount === "max") {
                        amount = getMaxAffordableAmount(itemId);
                    }
                    
                    if (amount > 1) {
                        const totalCost = calculateTotalCost(itemId, amount);
                        costContent = `成本: ${totalCost}修为 (x${amount})`;
                    } else {
                        costContent = `成本: ${nextCost}修为`;
                    }
                }
                
                // 更新成本文本
                if (itemId === "auto-tuna") {
                    const costValueElement = itemElement.querySelector('#auto-tuna-cost');
                    if (costValueElement) {
                        // 始终更新整个成本文本，无论是什么购买数量
                        const costParent = costValueElement.parentElement;
                        if (costParent) {
                            if (gameState.buyAmount === "1") {
                                // 对于x1购买，使用简单格式
                                costParent.innerHTML = `成本: <span id="auto-tuna-cost">${nextCost}</span>修为`;
                            } else {
                                // 对于其他购买数量，显示数量信息
                                costParent.innerHTML = `成本: <span id="auto-tuna-cost">${nextCost}</span>修为${amount > 1 ? ` (x${amount})` : ''}`;
                            }
                        }
                    }
                } else {
                    costElement.textContent = costContent;
                }
                
                // 如果修为不足，添加不可购买的视觉提示
                const canAfford = gameState.resources.cultivationPoints >= nextCost;
                if (!canAfford) {
                    itemElement.classList.add('cannot-afford');
                } else {
                    itemElement.classList.remove('cannot-afford');
                }
            }
        }
    });
}

// 加密函数（Base64编码）
function encryptFunction(plainText) {
    return btoa(unescape(encodeURIComponent(plainText)));
}

// 解密函数（Base64解码）
function decryptFunction(encryptedText) {
    return decodeURIComponent(escape(atob(encryptedText)));
}

// 验证存档数据
function isValidSaveData(data) {
    // 检查基本结构
    if (!data || typeof data !== 'object') return false;
    if (!data.resources || typeof data.resources !== 'object') return false;
    if (!data.automationLevels || typeof data.automationLevels !== 'object') return false;

    // 检查必要字段
    const requiredFields = {
        'resources.cultivationPoints': 'number',
        'resources.spiritualEnergy': 'number',
        'resources.mana': 'number',
        'totalClicks': 'number',
        'currentRealmIndex': 'number',
        'automationLevels.spiritGatheringArrayLevel': 'number',
        'automationLevels.autoTunaLevel': 'number'
    };

    // 检查设置字段（可选）
    if (data.settings) {
        if (typeof data.settings.numberDisplayFormat !== 'string') return false;
        if (!['scientific', 'chinese'].includes(data.settings.numberDisplayFormat)) return false;
    }

    for (const [path, type] of Object.entries(requiredFields)) {
        const value = path.split('.').reduce((obj, key) => obj?.[key], data);
        if (typeof value !== type) return false;
    }

    return true;
}

// 导出游戏数据
function exportGameData() {
    try {
        const dataToExport = gatherDataForSave();
        const jsonString = JSON.stringify(dataToExport, null, 2); // 美化输出
        const exportedString = config.plaintextImportExport ? jsonString : encryptFunction(jsonString);

        // 创建模态窗口
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>导出存档</h3>
                <p>请复制以下内容并妥善保存：</p>
                <textarea id="export-text" readonly>${exportedString}</textarea>
                <div class="modal-buttons">
                    <button id="copy-export-btn">复制</button>
                    <button id="close-export-modal">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加事件监听器
        document.getElementById('copy-export-btn').addEventListener('click', () => {
            const textarea = document.getElementById('export-text');
            textarea.select();
            document.execCommand('copy');
            alert('已复制到剪贴板！');
        });

        document.getElementById('close-export-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // 点击模态窗口外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

    } catch (error) {
        console.error('导出存档失败:', error);
        alert('导出存档失败，请重试！');
    }
}

// 保存设置到 localStorage
function saveSettings() {
    try {
        const userPreferences = {
            numberDisplayFormat: config.numberDisplayFormat
        };
        localStorage.setItem('xianxiaGameUserPreferences', JSON.stringify(userPreferences));
    } catch (error) {
        console.error("保存用户设置失败: ", error);
    }
}

// 从 localStorage 加载设置
function loadSettings() {
    const savedPrefsJson = localStorage.getItem('xianxiaGameUserPreferences');
    if (savedPrefsJson) {
        try {
            const loadedPrefs = JSON.parse(savedPrefsJson);
            if (loadedPrefs.numberDisplayFormat in ["scientific", "chinese"]) {
                config.numberDisplayFormat = loadedPrefs.numberDisplayFormat;
            }
        } catch (error) {
            console.error("加载用户设置失败: ", error);
        }
    }
}

// 单位设置相关的事件处理
function initUnitSettings() {
    const unitSettingsBtn = document.getElementById('menu-unit-settings-btn');
    const unitSettingsModal = document.getElementById('unit-settings-modal');
    const closeBtn = document.getElementById('unit-settings-close-btn');
    const radioButtons = document.querySelectorAll('input[name="numberFormatOptions"]');

    // 打开单位设置模态框
    unitSettingsBtn.addEventListener('click', () => {
        // 隐藏设置菜单
        elements.settingsMenu.classList.remove('show');
        
        // 根据当前设置选中对应的单选按钮
        radioButtons.forEach(radio => {
            radio.checked = radio.value === config.numberDisplayFormat;
        });
        
        // 显示单位设置模态框
        unitSettingsModal.style.display = 'flex';
    });

    // 关闭单位设置模态框
    closeBtn.addEventListener('click', () => {
        unitSettingsModal.style.display = 'none';
    });

    // 点击模态框外部关闭
    unitSettingsModal.addEventListener('click', (e) => {
        if (e.target === unitSettingsModal) {
            unitSettingsModal.style.display = 'none';
        }
    });

    // 监听单位格式选择变化
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                config.numberDisplayFormat = e.target.value;
                saveSettings();
                updateUI(); // 更新所有数字显示
            }
        });
    });
}

// 在 DOMContentLoaded 事件中初始化单位设置
document.addEventListener('DOMContentLoaded', () => {
    initUnitSettings();
    initGame();
}); 