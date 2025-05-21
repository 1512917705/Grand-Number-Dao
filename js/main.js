// 游戏主入口文件

// 导入依赖
import { REALMS_DATA } from './data/realmsData.js';
import { initializeGameState, getGameState, updateGameState } from './core/gameState.js';
import * as uiManager from './ui/uiManager.js';
import { config } from './config.js';
import { calculateAutomationItemUIData } from './utils/automationUtils.js';
import * as saveLoadManager from './core/saveLoadManager.js';
import * as automationManager from './core/automationManager.js';
import * as progressionManager from './core/progressionManager.js';
import * as resourceManager from './core/resourceManager.js';

// 游戏状态
let tickData = {
    meditationClicksThisTick: 0,
    lastTickTime: Date.now()
};

// 初始化游戏
function initGame() {
    // 等待 DOM 加载完成
    document.addEventListener('DOMContentLoaded', () => {
        // 加载用户偏好设置
        const savedSettings = saveLoadManager.loadUserPreferences();
        if (savedSettings) {
            Object.assign(config, savedSettings);
        }
        
        // 加载保存的游戏数据
        const savedData = saveLoadManager.loadGameData();
        if (savedData) {
            initializeGameState(savedData);
            automationManager.recalculateAllAutomationEffects();
            progressionManager.updateRealm(); // 检查初始境界
        } else {
            initializeGameState();
        }
        
        // 注册事件监听器
        registerEventListeners();
        
        // 初始化调试功能
        initDebugFeatures();
        
        // 更新UI显示
        uiManager.updateAllUI(getGameState());
        
        // 启动游戏循环
        setInterval(gameLoop, 1000);
        
        // 启动自动保存
        startAutoSave();
    });
}

// 启动自动保存
function startAutoSave() {
    try {
        const autoSaveInterval = config.autoSaveInterval || 60000; // 默认1分钟
        // console.log(`自动保存已启动，间隔时间：${autoSaveInterval/1000}秒`);
        
        // 立即执行一次保存
        const initialSave = saveLoadManager.attemptAutoSave();
        // console.log('初始自动保存:', initialSave ? '成功' : '失败');
        
        // 设置定时保存
        const autoSaveTimer = setInterval(() => {
            const success = saveLoadManager.attemptAutoSave();
            // console.log('定时自动保存:', success ? '成功' : '失败');
        }, autoSaveInterval);
        
        // 保存定时器ID，以便需要时可以清除
        window.autoSaveTimer = autoSaveTimer;
    } catch (error) {
        console.error('启动自动保存失败:', error);
    }
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
    const cultivationResource = document.getElementById('cultivation-points').closest('.resource');
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
    const spiritResource = document.getElementById('spiritual-energy').closest('.resource');
    if (spiritResource) {
        spiritResource.appendChild(modifySpiritBtn);
    }
    
    // 3. 为修改修为按钮添加事件监听器
    modifyCultivationBtn.addEventListener('click', () => {
        // 显示输入对话框
        const newValue = prompt('请输入新的修为值:', getGameState().resources.cultivationPoints);
        if (newValue !== null) {
            const numValue = parseFloat(newValue);
            if (!isNaN(numValue)) {
                updateGameState('resources.cultivationPoints', numValue);
                uiManager.updateAllUI(getGameState());
            }
        }
    });
    
    // 4. 为修改灵气按钮添加事件监听器
    modifySpiritBtn.addEventListener('click', () => {
        // 显示输入对话框
        const newValue = prompt('请输入新的灵气值:', getGameState().resources.spiritualEnergy);
        if (newValue !== null) {
            const numValue = parseFloat(newValue);
            if (!isNaN(numValue)) {
                updateGameState('resources.spiritualEnergy', numValue);
                uiManager.updateAllUI(getGameState());
            }
        }
    });
}

// 注册事件监听器
function registerEventListeners() {
    try {
        // 修炼按钮点击事件
        const meditateBtn = document.getElementById('meditate-btn');
        if (meditateBtn) {
            meditateBtn.addEventListener('click', () => {
                if (resourceManager.processMeditationClick()) {
                    tickData.meditationClicksThisTick++;
                }
            });
        } else {
            console.error('未找到修炼按钮');
        }
        
        // 自动化设备点击事件
        const automationItems = document.querySelectorAll('.automation-item.clickable-item');
        if (automationItems.length > 0) {
            automationItems.forEach(item => {
                item.addEventListener('click', () => {
                    const itemId = item.dataset.item;
                    if (itemId) {
                        automationManager.buyAutomationItem(itemId);
                        uiManager.updateAllUI(getGameState());
                    } else {
                        console.error('自动化设备缺少 data-item 属性');
                    }
                });
            });
        } else {
            console.error('未找到自动化设备按钮');
        }
        
        // 购买数量按钮
        const buyAmountButtons = document.querySelectorAll('[data-amount]');
        buyAmountButtons.forEach(button => {
            button.addEventListener('click', () => {
                const amount = button.getAttribute('data-amount');
                if (!amount) {
                    console.error('购买数量按钮缺少data-amount属性');
                    return;
                }
                
                // 移除所有按钮的active类
                buyAmountButtons.forEach(btn => btn.classList.remove('active'));
                // 给当前按钮添加active类
                button.classList.add('active');
                
                // 更新购买数量设置
                updateGameState('settings.buyAmount', amount);
                
                // 重新计算UI数据
                const gameState = getGameState();
                gameState.precalculatedItemUIData = calculateAutomationItemUIData(gameState);
                // 更新UI显示
                uiManager.updateAllUI(gameState);
            });
        });
        
        // 设置按钮事件
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                uiManager.toggleSettingsMenu();
            });
        } else {
            console.error('未找到设置按钮');
        }

        // 单位设置按钮事件
        const unitSettingsBtn = document.getElementById('menu-unit-settings-btn');
        if (unitSettingsBtn) {
            unitSettingsBtn.addEventListener('click', () => {
                uiManager.toggleSettingsMenu(); // 先关闭设置菜单
                const gameState = getGameState();
                uiManager.displayUnitSettingsModal(
                    gameState.settings?.numberDisplayFormat || 'scientific',
                    (newFormat) => {
                        updateGameState('settings.numberDisplayFormat', newFormat);
                        uiManager.updateAllUI(getGameState());
                    }
                );
            });
        } else {
            console.error('未找到单位设置按钮');
        }

        // 单位设置关闭按钮事件
        const unitSettingsCloseBtn = document.getElementById('unit-settings-close-btn');
        if (unitSettingsCloseBtn) {
            unitSettingsCloseBtn.addEventListener('click', () => {
                uiManager.hideUnitSettingsModal();
            });
        } else {
            console.error('未找到单位设置关闭按钮');
        }

        // 单位设置选项事件
        const numberFormatOptions = document.querySelectorAll('input[name="numberFormatOptions"]');
        if (numberFormatOptions.length > 0) {
            numberFormatOptions.forEach(option => {
                option.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        updateGameState('settings.numberDisplayFormat', e.target.value);
                        uiManager.updateAllUI(getGameState());
                    }
                });
            });
        } else {
            console.error('未找到数字显示格式选项');
        }
        
        // 导入按钮事件
        const importBtn = document.getElementById('menu-import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                uiManager.toggleSettingsMenu(); // 先关闭设置菜单
                uiManager.displayImportModal((importedString) => {
                    if (saveLoadManager.importGameData(importedString)) {
                        uiManager.showNotification('存档导入成功！');
                        automationManager.recalculateAllAutomationEffects();
                        uiManager.updateAllUI(getGameState());
                        // 导入后立即保存
                        const saveSuccess = saveLoadManager.attemptAutoSave();
                        console.log('导入后自动保存:', saveSuccess ? '成功' : '失败');
                    } else {
                        uiManager.showNotification('导入失败，数据可能已损坏或格式错误！', 'error');
                    }
                });
            });
        } else {
            console.error('未找到导入按钮');
        }
        
        // 导出按钮事件
        const exportBtn = document.getElementById('menu-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                uiManager.toggleSettingsMenu(); // 先关闭设置菜单
                const exportString = saveLoadManager.exportGameData();
                uiManager.displayExportModal(exportString);
            });
        } else {
            console.error('未找到导出按钮');
        }
        
        // 硬重置按钮事件
        const hardResetBtn = document.getElementById('menu-hard-reset-btn');
        if (hardResetBtn) {
            hardResetBtn.addEventListener('click', () => {
                uiManager.toggleSettingsMenu(); // 先关闭设置菜单
                uiManager.showConfirmationModal({
                    title: "确认硬重置",
                    message: "警告：此操作将清除所有游戏进度且不可逆！确定要重置游戏吗？",
                    confirmButtonText: "重置",
                    confirmButtonClass: "danger-button",
                    onConfirm: () => {
                        saveLoadManager.hardReset();
                        initializeGameState();
                        automationManager.recalculateAllAutomationEffects();
                        uiManager.updateAllUI(getGameState());
                    },
                    cancelButtonText: "取消"
                });
            });
        } else {
            console.error('未找到硬重置按钮');
        }

        // 页签切换事件
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (tabButtons.length > 0) {
            tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // 移除所有页签的active类
                    tabButtons.forEach(b => b.classList.remove('active'));
                    // 添加当前页签的active类
                    btn.classList.add('active');
                    
                    // 隐藏所有内容
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // 显示目标内容
                    const targetId = btn.dataset.tabTarget;
                    const targetContent = document.querySelector(targetId);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                });
            });
        } else {
            console.error('未找到页签按钮');
        }
    } catch (error) {
        console.error('注册事件监听器失败:', error);
    }
}

// 处理游戏循环
function processTick() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - tickData.lastTickTime) / 1000;
    tickData.lastTickTime = currentTime;
    
    // 处理自动化设备产出
    automationManager.updateAutomationTick();
    
    // 检查境界提升
    progressionManager.updateRealm();
    
    // 重新计算UI数据
    const gameState = getGameState();
    gameState.precalculatedItemUIData = calculateAutomationItemUIData(gameState);
    
    // 更新UI
    uiManager.updateAllUI(gameState);
}

// 游戏主循环
function gameLoop() {
    processTick();
}

// 启动游戏
initGame(); 