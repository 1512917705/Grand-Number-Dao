// UI 管理模块
import { formatNumber } from '../utils/numberFormatter.js';
import { REALMS_DATA } from '../data/realmsData.js';
import { updateGameState } from '../core/gameState.js';

// DOM 元素引用
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
    realmProgressBar: document.getElementById('realm-progress-bar'),
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

// --- 内部辅助函数 ---

// 创建模态框
function _createModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = content;
    return modal;
}

// 显示模态框
function _showModal(modal) {
    document.body.appendChild(modal);
}

// 隐藏模态框
function _hideModal(modal) {
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
}

// 更新资源显示
function _updateResourceDisplay(resourceName, value, format) {
    const element = elements[resourceName];
    if (element) {
        element.textContent = formatNumber(value, format);
    }
}

// 更新境界进度UI
function _updateRealmProgressUI(gameState) {
    const realmProgress = document.getElementById('realm-progress');
    const realmProgressText = document.getElementById('realm-progress-text');
    
    if (!realmProgress || !realmProgressText) {
        console.error('找不到境界进度相关的DOM元素');
        return;
    }
    
    const currentRealmIndex = gameState.realm.currentRealmIndex;
    const currentRealm = REALMS_DATA[currentRealmIndex];
    const nextRealm = REALMS_DATA[currentRealmIndex + 1];
    
    if (!currentRealm || !nextRealm) {
        realmProgressText.textContent = '已达最高境界';
        realmProgress.style.width = '100%';
        return;
    }
    
    const currentPoints = gameState.resources.cultivationPoints;
    const threshold = nextRealm.threshold;
    const progress = Math.min(100, (currentPoints / threshold) * 100);
    
    const numberFormat = gameState.settings?.numberDisplayFormat || 'scientific';
    const formattedCurrent = formatNumber(currentPoints, numberFormat);
    const formattedThreshold = formatNumber(threshold, numberFormat);
    
    // 修改显示格式，使用箭头表示进度方向
    realmProgressText.textContent = `${currentRealm.name} → ${nextRealm.name} (${formattedCurrent}/${formattedThreshold})`;
    realmProgress.style.width = `${progress}%`;
    
}

// 更新自动化设备UI
function _updateAutomationItemsUI(automationState, buyAmount, currentCultivationPoints, precalculatedItemUIData, format) {
    document.querySelectorAll('.automation-item.clickable-item').forEach(itemElement => {
        const itemId = itemElement.dataset.item;
        const itemData = automationState[itemId];
        const displayData = precalculatedItemUIData.find(d => d.itemId === itemId);

        if (itemData && displayData) {
            // 更新等级显示
            const levelElement = itemElement.querySelector('.item-level');
            if (levelElement) {
                if (itemId === "spirit-gathering-array") {
                    levelElement.textContent = `数量: ${itemData.count}`;
                } else {
                    levelElement.textContent = `等级: ${itemData.count}`;
                }
            }

            // 更新效果显示
            const effectElement = itemElement.querySelector('.item-effect');
            if (effectElement) {
                if (itemId === "spirit-gathering-array") {
                    effectElement.textContent = `效果: 每秒产出 ${formatNumber(itemData.effect, format)} 灵气`;
                } else if (itemId === "auto-tuna") {
                    effectElement.textContent = `效果: 每秒消耗 ${formatNumber(itemData.currentSpiritConsumed, format)} 灵气，获得 ${formatNumber(itemData.currentCultivationGained, format)} 修为`;
                }
            }

            // 更新成本显示
            const costElement = itemElement.querySelector('.item-cost');
            if (costElement) {
                costElement.textContent = displayData.displayCostString;
                itemElement.classList.toggle('cannot-afford', !displayData.canAfford);
            }
        }
    });
}

// --- 导出的函数 ---

// 初始化UI
export function initializeUI() {
    // 注册纯UI事件监听器
    elements.toggleLeftPanelBtn.addEventListener('click', toggleLeftPanelDisplay);
    
    // 页签按钮事件
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.tabTarget;
            switchTab(targetId);
        });
    });
    
    // 设置菜单显示/隐藏
    elements.settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSettingsMenu();
    });
    
    // 点击页面其他地方时隐藏设置菜单
    document.addEventListener('click', (e) => {
        hideSettingsMenuOnClickOutside(e);
    });
}

// 更新所有UI
export function updateAllUI(gameState) {
    if (!gameState) {
        console.error('updateAllUI received null or undefined gameState');
        return;
    }

    const format = gameState.settings?.numberDisplayFormat || 'scientific';

    // 更新资源显示
    _updateResourceDisplay('cultivationPoints', gameState.resources.cultivationPoints, format);
    _updateResourceDisplay('spiritualEnergy', gameState.resources.spiritualEnergy, format);
    _updateResourceDisplay('mana', gameState.resources.mana, format);
    
    // 更新统计信息
    _updateResourceDisplay('totalClicks', gameState.stats.totalClicks, format);
    _updateResourceDisplay('energyPerSecond', gameState.stats.energyPerSecond, format);
    _updateResourceDisplay('cultivationPerSecond', gameState.stats.cultivationPerSecond, format);
    
    // 更新境界进度
    _updateRealmProgressUI(gameState);
    
    // 更新自动化设备
    _updateAutomationItemsUI(gameState.automation, gameState.buyAmount, gameState.resources.cultivationPoints, gameState.precalculatedItemUIData, format);
}

// 显示通知
export function showNotification(message, type = 'success') {
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

// 显示确认对话框
export function showConfirmationModal({ title, message, confirmButtonText, confirmButtonClass, onConfirm, cancelButtonText, onCancel }) {
    const modal = _createModal(`
        <div class="modal-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="modal-buttons">
                <button id="confirm-btn" class="${confirmButtonClass}">${confirmButtonText}</button>
                <button id="cancel-btn">${cancelButtonText}</button>
            </div>
        </div>
    `);

    _showModal(modal);

    // 添加事件监听器
    document.getElementById('confirm-btn').addEventListener('click', () => {
        onConfirm();
        _hideModal(modal);
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        if (onCancel) onCancel();
        _hideModal(modal);
    });

    // 点击模态窗口外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (onCancel) onCancel();
            _hideModal(modal);
        }
    });
}

// 显示导入模态框
export function displayImportModal(onConfirmImportCallback) {
    const modal = _createModal(`
        <div class="modal-content">
            <h3>导入存档</h3>
            <p>请粘贴存档内容：</p>
            <textarea id="import-text" placeholder="在此粘贴存档内容..."></textarea>
            <div class="modal-buttons">
                <button id="confirm-import-btn">确认导入</button>
                <button id="close-import-modal">取消</button>
            </div>
        </div>
    `);

    _showModal(modal);

    document.getElementById('confirm-import-btn').addEventListener('click', () => {
        const importedString = document.getElementById('import-text').value.trim();
        if (!importedString) {
            showNotification('请输入存档内容！', 'error');
            return;
        }
        onConfirmImportCallback(importedString);
        _hideModal(modal);
    });

    document.getElementById('close-import-modal').addEventListener('click', () => {
        _hideModal(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            _hideModal(modal);
        }
    });
}

// 显示导出模态框
export function displayExportModal(exportString) {
    const modal = _createModal(`
        <div class="modal-content">
            <h3>导出存档</h3>
            <p>请复制以下内容并妥善保存：</p>
            <textarea id="export-text" readonly>${exportString}</textarea>
            <div class="modal-buttons">
                <button id="copy-export-btn">复制</button>
                <button id="close-export-modal">关闭</button>
            </div>
        </div>
    `);

    _showModal(modal);

    document.getElementById('copy-export-btn').addEventListener('click', () => {
        const textarea = document.getElementById('export-text');
        textarea.select();
        document.execCommand('copy');
        showNotification('已复制到剪贴板！');
    });

    document.getElementById('close-export-modal').addEventListener('click', () => {
        _hideModal(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            _hideModal(modal);
        }
    });
}

// 显示单位设置模态框
export function displayUnitSettingsModal(currentFormat, onFormatChangeCallback) {
    const modal = _createModal(`
        <div class="modal-content">
            <h3>单位设置</h3>
            <div class="unit-settings-options">
                <label>
                    <input type="radio" name="numberFormatOptions" value="scientific" 
                        ${currentFormat === 'scientific' ? 'checked' : ''}>
                    科学计数法
                </label>
                <label>
                    <input type="radio" name="numberFormatOptions" value="chinese"
                        ${currentFormat === 'chinese' ? 'checked' : ''}>
                    中文单位
                </label>
            </div>
            <div class="modal-buttons">
                <button id="close-unit-settings">关闭</button>
            </div>
        </div>
    `);

    _showModal(modal);

    // 监听单位格式选择变化
    const radioButtons = modal.querySelectorAll('input[name="numberFormatOptions"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                onFormatChangeCallback(e.target.value);
            }
        });
    });

    document.getElementById('close-unit-settings').addEventListener('click', () => {
        _hideModal(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            _hideModal(modal);
        }
    });
}

// 切换左侧面板显示
export function toggleLeftPanelDisplay() {
    elements.leftPanel.classList.toggle('collapsed');
    elements.toggleLeftPanelBtn.textContent = 
        elements.leftPanel.classList.contains('collapsed') ? '▶' : '◀';
}

// 切换页签
export function switchTab(tabTargetId) {
    // 移除所有页签按钮的active类
    elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    // 添加当前按钮的active类
    const activeButton = Array.from(elements.tabButtons)
        .find(btn => btn.dataset.tabTarget === tabTargetId);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // 隐藏所有内容区域
    elements.tabContents.forEach(content => content.classList.remove('active'));
    
    // 显示目标内容区域
    const targetContent = document.querySelector(tabTargetId);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

// 切换设置菜单
export function toggleSettingsMenu() {
    // 确保其他菜单都关闭
    document.querySelectorAll('.settings-menu').forEach(menu => {
        if (menu !== elements.settingsMenu) {
            menu.classList.remove('show');
        }
    });
    // 切换当前菜单的显示状态
    elements.settingsMenu.classList.toggle('show');
}

// 点击外部隐藏设置菜单
export function hideSettingsMenuOnClickOutside(event) {
    if (!elements.settingsMenu.contains(event.target) && 
        event.target !== elements.settingsBtn) {
        elements.settingsMenu.classList.remove('show');
    }
}

// 显示自动保存通知
export function showAutoSaveNotification() {
    if (elements.autoSaveNotification) {
        elements.autoSaveNotification.classList.add('show');
        setTimeout(() => {
            elements.autoSaveNotification.classList.remove('show');
        }, 3000);
    }
}
