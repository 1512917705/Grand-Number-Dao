// 导入依赖模块
import { ResourceManager } from './resourceManager.js';
import { ProgressionManager } from './progressionManager.js';
import { AutomationManager } from './automationManager.js';
import { SkillManager } from './skillManager.js';
import { AchievementManager } from './achievementManager.js';
import { ChallengeManager } from './challengeManager.js';
import { ActivityManager } from './activityManager.js';
import { BonusManager } from './bonusManager.js';
import { SaveLoadManager } from './saveLoadManager.js';
import { EventSystem } from './eventSystem.js';
import { UIManager } from '../ui/uiManager.js';
import { BigNumberHandler } from './bigNumberHandler.js';

// 游戏配置常量
const GAME_LOOP_INTERVAL = 1000; // 游戏主循环间隔（毫秒）
const AUTO_SAVE_INTERVAL = 60000; // 自动保存间隔（毫秒）

class GameManager {
    constructor() {
        this.gameLoopId = null;
        this.autoSaveId = null;
        this.isPaused = false;
        this.isInitialized = false;
        
        // 初始化各个管理器
        this.resourceManager = new ResourceManager();
        this.progressionManager = new ProgressionManager();
        this.automationManager = new AutomationManager();
        this.skillManager = new SkillManager();
        this.achievementManager = new AchievementManager();
        this.challengeManager = new ChallengeManager();
        this.activityManager = new ActivityManager();
        this.bonusManager = new BonusManager();
        this.saveLoadManager = new SaveLoadManager();
        this.uiManager = new UIManager();
        this.bigNumberHandler = new BigNumberHandler();
    }

    /**
     * 初始化游戏
     * @returns {Promise<void>}
     */
    async initGame() {
        console.log("游戏初始化开始...");

        try {
            // 1. 初始化大数处理器
            await this.bigNumberHandler.init();

            // 2. 尝试加载存档
            const saveData = await this.saveLoadManager.loadGame();
            
            // 3. 初始化各个管理器
            await this.resourceManager.init(saveData);
            await this.progressionManager.init(saveData);
            await this.automationManager.init(saveData);
            await this.skillManager.init(saveData);
            await this.achievementManager.init(saveData);
            await this.challengeManager.init(saveData);
            await this.activityManager.init(saveData);
            await this.bonusManager.init(saveData);

            // 4. 初始化UI
            await this.uiManager.initUI();
            this.uiManager.updateAllUI();

            // 5. 启动游戏主循环
            this.startGameLoop();

            // 6. 启动自动保存
            this.startAutoSave();

            this.isInitialized = true;
            console.log("游戏初始化完成。");

            // 触发游戏开始事件
            EventSystem.emit('game:started');
        } catch (error) {
            console.error("游戏初始化失败:", error);
            throw error;
        }
    }

    /**
     * 游戏主循环的单个"滴答"
     */
    gameTick() {
        if (this.isPaused) return;

        try {
            // 1. 处理自动化生产
            this.automationManager.processAutomation();

            // 2. 处理资源消耗
            this.resourceManager.processPeriodicConsumption();

            // 3. 检查境界突破
            this.progressionManager.checkRealmProgression();

            // 4. 检查成就达成
            this.achievementManager.checkAchievements();

            // 5. 更新UI
            this.uiManager.updateAllUI();

            // 6. 触发游戏循环事件
            EventSystem.emit('game:tick');
        } catch (error) {
            console.error("游戏循环执行错误:", error);
        }
    }

    /**
     * 启动游戏主循环
     */
    startGameLoop() {
        if (this.gameLoopId === null) {
            this.gameLoopId = setInterval(() => this.gameTick(), GAME_LOOP_INTERVAL);
            console.log("游戏主循环已启动。");
        }
    }

    /**
     * 停止游戏主循环
     */
    stopGameLoop() {
        if (this.gameLoopId !== null) {
            clearInterval(this.gameLoopId);
            this.gameLoopId = null;
            console.log("游戏主循环已停止。");
        }
    }

    /**
     * 启动自动保存
     */
    startAutoSave() {
        if (this.autoSaveId === null) {
            this.autoSaveId = setInterval(() => {
                this.saveLoadManager.saveGame();
            }, AUTO_SAVE_INTERVAL);
            console.log("自动保存已启动。");
        }
    }

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveId !== null) {
            clearInterval(this.autoSaveId);
            this.autoSaveId = null;
            console.log("自动保存已停止。");
        }
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        this.isPaused = true;
        EventSystem.emit('game:paused');
    }

    /**
     * 继续游戏
     */
    resumeGame() {
        this.isPaused = false;
        EventSystem.emit('game:resumed');
    }

    /**
     * 重置游戏
     */
    async resetGame() {
        this.stopGameLoop();
        this.stopAutoSave();
        
        // 重置所有管理器
        await this.resourceManager.reset();
        await this.progressionManager.reset();
        await this.automationManager.reset();
        await this.skillManager.reset();
        await this.achievementManager.reset();
        await this.challengeManager.reset();
        await this.activityManager.reset();
        await this.bonusManager.reset();

        // 重新初始化游戏
        await this.initGame();
        
        EventSystem.emit('game:reset');
    }
}

// 导出单例实例
export const gameManager = new GameManager();
