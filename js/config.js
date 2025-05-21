// 游戏配置文件

export const config = {
    // 调试模式
    debugMode: true, // 设置为true开启调试模式，false关闭
    
    // 自动保存配置
    autoSaveInterval: 10000, // 自动保存间隔时间，单位毫秒
    
    // 导入导出配置
    plaintextImportExport: true, // 是否使用明文导入导出
    
    // 游戏平衡性配置
    gameBalance: {
        // 点击相关
        clickValue: 10, // 每次点击消耗的灵气数量
        conversionRate: 1, // 灵气转化为修为的比率
        
        // 自动化设备基础配置
        automation: {
            "spirit-gathering-array": {
                baseCost: 10, // 基础成本
                costMultiplier: 1.15, // 成本增长倍率
                baseEffect: 1 // 基础效果
            },
            "auto-tuna": {
                baseCost: 50, // 基础成本
                costMultiplier: 1.2, // 成本增长倍率
                baseSpiritConsumedPerSecond: 1, // 每级每秒消耗的灵气
                baseCultivationGainedPerSecond: 5 // 每级每秒产出的修为
            }
        }
    }
}; 