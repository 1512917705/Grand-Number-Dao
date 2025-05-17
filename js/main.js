// 游戏主入口文件

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
    
    // 右侧面板
    amountBtns: document.querySelectorAll('.amount-btn'),
    automationItems: document.querySelectorAll('.automation-item.clickable-item')
};

// 游戏状态
const gameState = {
    // 资源
    resources: {
        cultivationPoints: 0,     // 修为
        spiritualEnergy: 0,       // 灵气
        mana: 0                   // 法力
    },
    
    // 点击数据
    clicks: {
        total: 0,                 // 总点击次数
        value: 1                  // 每次点击获得的灵气
    },
    
    // 境界数据
    realm: {
        current: "凡境",
        progress: 0,
        target: 1000
    },
    
    // 自动化设备
    automation: {
        "spirit-gathering-array": {
            name: "聚灵阵",
            count: 0,
            baseCost: 100,        // 基础成本
            costMultiplier: 1.15, // 成本增长倍率
            baseEffect: 5,        // 基础效果
            effect: 0             // 当前效果
        }
    },
    
    // 购买数量设置
    buyAmount: "1"                // 默认购买1个
};

// 初始化游戏
function initGame() {
    // 注册事件监听器
    registerEventListeners();
    
    // 更新UI显示
    updateUI();
    
    // 启动游戏循环
    setInterval(gameLoop, 1000);
}

// 注册事件监听器
function registerEventListeners() {
    // 左侧面板折叠按钮
    elements.toggleLeftPanelBtn.addEventListener('click', toggleLeftPanel);
    
    // 修炼按钮
    elements.meditateBtn.addEventListener('click', handleMeditate);
    
    // 数量选择按钮
    elements.amountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的active类
            elements.amountBtns.forEach(b => b.classList.remove('active'));
            // 给点击的按钮添加active类
            btn.classList.add('active');
            // 更新购买数量
            gameState.buyAmount = btn.dataset.amount;
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
}

// 切换左侧面板
function toggleLeftPanel() {
    elements.leftPanel.classList.toggle('collapsed');
    // 如果面板已收起，按钮显示向右箭头；否则显示向左箭头
    elements.toggleLeftPanelBtn.textContent = elements.leftPanel.classList.contains('collapsed') ? '▶' : '◀';
}

// 处理修炼按钮点击
function handleMeditate() {
    // 增加点击次数
    gameState.clicks.total++;
    
    // 增加灵气
    gameState.resources.spiritualEnergy += gameState.clicks.value;
    
    // 更新UI
    updateUI();
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
        item.effect = item.baseEffect * item.count;
        
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

// 游戏主循环，每秒执行一次
function gameLoop() {
    // 处理自动化设备产出
    processAutomation();
    
    // 转化灵气为修为
    convertEnergy();
    
    // 更新境界进度
    updateRealmProgress();
    
    // 更新UI
    updateUI();
}

// 处理自动化设备产出
function processAutomation() {
    // 计算所有自动化设备的效果
    let totalEnergyPerSecond = 0;
    
    for (const itemId in gameState.automation) {
        const item = gameState.automation[itemId];
        if (item.count > 0) {
            totalEnergyPerSecond += item.effect;
        }
    }
    
    // 增加灵气
    gameState.resources.spiritualEnergy += totalEnergyPerSecond;
    
    // 更新每秒灵气获取速度显示
    gameState.energyPerSecond = totalEnergyPerSecond;
}

// 将灵气转化为修为（简化版本）
function convertEnergy() {
    // 每10点灵气转化为1点修为
    const conversionRate = 10;
    
    if (gameState.resources.spiritualEnergy >= conversionRate) {
        const convertAmount = Math.floor(gameState.resources.spiritualEnergy / conversionRate);
        gameState.resources.spiritualEnergy -= convertAmount * conversionRate;
        gameState.resources.cultivationPoints += convertAmount;
    }
}

// 更新境界进度
function updateRealmProgress() {
    gameState.realm.progress = gameState.resources.cultivationPoints;
    
    // 检查是否可以突破
    if (gameState.realm.progress >= gameState.realm.target) {
        // 这里将来可以实现境界突破逻辑
    }
}

// 更新UI显示
function updateUI() {
    // 更新资源显示
    elements.cultivationPoints.textContent = Math.floor(gameState.resources.cultivationPoints);
    elements.spiritualEnergy.textContent = Math.floor(gameState.resources.spiritualEnergy);
    elements.mana.textContent = Math.floor(gameState.resources.mana);
    
    // 更新点击相关显示
    elements.clickValue.textContent = gameState.clicks.value;
    elements.totalClicks.textContent = gameState.clicks.total;
    
    // 更新境界进度
    const progressPercent = Math.min(100, (gameState.realm.progress / gameState.realm.target) * 100);
    elements.realmProgress.style.width = `${progressPercent}%`;
    elements.realmProgressText.textContent = `${gameState.realm.current}: ${Math.floor(gameState.realm.progress)}/${gameState.realm.target}`;
    
    // 更新每秒获取灵气显示
    elements.energyPerSecond.textContent = gameState.energyPerSecond;
    
    // 更新自动化设备显示
    updateAutomationUI();
}

// 更新自动化设备UI
function updateAutomationUI() {
    // 遍历所有自动化设备元素
    elements.automationItems.forEach(itemElement => {
        const itemId = itemElement.dataset.item;
        const item = gameState.automation[itemId];
        
        if (item) {
            // 更新设备数量
            const levelElement = itemElement.querySelector('.item-level');
            if (levelElement) {
                levelElement.textContent = `数量: ${item.count}`;
            }
            
            // 更新设备效果
            const effectElement = itemElement.querySelector('.item-effect');
            if (effectElement) {
                effectElement.textContent = `效果: 每秒产生${item.effect}灵气`;
            }
            
            // 更新设备成本
            const costElement = itemElement.querySelector('.item-cost');
            if (costElement) {
                const nextCost = Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.count));
                costElement.textContent = `成本: ${nextCost}修为`;
                
                // 根据购买数量模式显示不同成本
                if (gameState.buyAmount !== "1") {
                    let amount = 1;
                    if (gameState.buyAmount === "100") {
                        amount = 100;
                    } else if (gameState.buyAmount === "half") {
                        amount = Math.max(1, Math.floor(getMaxAffordableAmount(itemId) / 2));
                    } else if (gameState.buyAmount === "max") {
                        amount = getMaxAffordableAmount(itemId);
                    }
                    
                    if (amount > 1) {
                        const totalCost = calculateTotalCost(itemId, amount);
                        costElement.textContent = `成本: ${totalCost}修为 (x${amount})`;
                    }
                }
                
                // 如果修为不足，添加不可购买的视觉提示
                const canAfford = gameState.resources.cultivationPoints >= Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.count));
                if (!canAfford) {
                    itemElement.classList.add('cannot-afford');
                } else {
                    itemElement.classList.remove('cannot-afford');
                }
            }
        }
    });
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', initGame); 