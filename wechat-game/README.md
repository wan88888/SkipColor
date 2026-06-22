# 跳跃填色 - 微信小游戏

基于 HTML 原型（demo_v4_622.html）转换而来的微信小游戏版本，使用 Canvas 渲染替代 DOM，适配微信小游戏运行环境。

## 目录结构

```
wechat-game/
│
├── game.js                 // 微信小游戏入口
├── game.json               // 游戏配置
├── project.config.json     // 开发者工具配置
├── README.md               // 导入说明
│
├── js/
│   ├── main.js             // 主循环、触摸事件
│   ├── game.js             // 游戏核心逻辑
│   ├── level.js            // 关卡生成
│   ├── storage.js          // 微信存档
│   ├── globals.js          // 全局状态与配置
│   ├── draw.js             // Canvas 绘制工具
│   ├── screens.js          // 菜单界面绘制
│   └── renderer.js         // 游戏界面渲染
```

## 文件职责

| 文件 | 职责 |
|------|------|
| `game.js` | 入口，加载全局模块并启动主循环 |
| `js/main.js` | 触摸事件分发、屏幕路由、游戏主循环 |
| `js/game.js` | 游戏核心逻辑：初始化、移动、动画、状态判定、撤销/重开 |
| `js/level.js` | 关卡生成：随机布局、裁剪、冰块障碍、网格数据加载 |
| `js/storage.js` | 微信存档：读写 `wx.getStorageSync` / `wx.setStorageSync` |
| `js/globals.js` | 全局对象 `G`：Canvas、配置常量、玩家数据、关卡定义、状态变量 |
| `js/draw.js` | Canvas 绘制工具：圆角矩形、文本、阴影、圆形、文字测量与换行 |
| `js/screens.js` | 菜单界面：主页、进阶模式、冰块菜单、敬请期待 |
| `js/renderer.js` | 游戏界面：棋盘、方向控制、系统按钮、提示面板、难度徽章 |

## 导入微信开发者工具

1. 打开 **微信开发者工具**，选择「小游戏」项目类型。
2. 项目目录选择本 `wechat-game` 文件夹。
3. 将 `project.config.json` 中的 `appid` 字段替换为你自己的小游戏 AppID（若无，可使用「测试号」）。
4. 点击导入，工具会自动以 `game.js` 作为入口编译运行。

## 运行要求

- 微信开发者工具（建议最新稳定版）
- 微信小游戏基础库 2.0 及以上
- 已注册微信小游戏账号（或使用测试 AppID）

## 操作说明

- 点击数字块选中，再点击方向按钮发射光束填色。
- 光束会跳过数字块和已填满区域，遇空格填色，遇冰块破冰。
- 填满所有空格即通关；可用「撤销」「重开」「提示」辅助。
- 每日通关数次日零点重置。

## 与原 HTML 版本的差异

- DOM 渲染 → Canvas 渲染
- `localStorage` → `wx.getStorageSync` / `wx.setStorageSync`
- `alert` / `confirm` → `wx.showModal`
- `onclick` → `wx.onTouchStart` + 命中测试
- CSS 动画 → `setTimeout` + Canvas 重绘
- 单文件 → 模块化拆分（globals / draw / screens / level / game / renderer / main / storage）
