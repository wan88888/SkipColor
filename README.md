# 跳跃填色 - 微信小游戏

基于 HTML 原型转换而来的微信小游戏版本，使用 Canvas 渲染替代 DOM，适配微信小游戏运行环境。

## 目录结构

```
SkipColor/
│
├── game.js                 // 微信小游戏入口
├── game.json               // 游戏配置
├── project.config.json     // 开发者工具配置
├── README.md               // 导入说明
│
├── js/
│   ├── main.js             // 主循环、触摸事件、分享
│   ├── game.js             // 游戏核心逻辑
│   ├── level.js            // 关卡生成
│   ├── storage.js          // 微信存档 + 云存档
│   ├── audio.js            // 音效与震动反馈
│   ├── globals.js          // 全局状态与配置
│   ├── draw.js             // Canvas 绘制工具
│   ├── screens.js          // 菜单界面绘制
│   └── renderer.js         // 游戏界面渲染
│
└── audio/                  // 音效资源（需自行添加 mp3）
    ├── move.mp3            // 移动音效
    ├── ice.mp3             // 破冰音效
    └── win.mp3             // 通关音效
```

## 文件职责

| 文件 | 职责 |
|------|------|
| `game.js` | 入口，加载全局模块并启动主循环 |
| `js/main.js` | 触摸事件分发、屏幕路由、脏标记主循环、分享 |
| `js/game.js` | 游戏核心逻辑：初始化、移动、动画、死局判定、撤销/重开、音效控制 |
| `js/level.js` | 关卡生成：随机布局、裁剪、冰块障碍、网格数据加载 |
| `js/storage.js` | 本地存档 + 云存档同步 + 设置持久化 |
| `js/audio.js` | 音效播放（InnerAudioContext）+ 震动反馈 |
| `js/globals.js` | 全局对象 `G`：Canvas、配置、玩家数据、关卡定义、脏标记、深拷贝工具 |
| `js/draw.js` | Canvas 绘制工具：圆角矩形、文本、阴影、圆形、标点感知换行 |
| `js/screens.js` | 菜单界面：主页、进阶模式、冰块菜单、敬请期待 |
| `js/renderer.js` | 游戏界面：棋盘、方向控制、系统按钮、提示面板、难度徽章、关卡进度 |

## 导入微信开发者工具

1. 打开 **微信开发者工具**，选择「小游戏」项目类型。
2. 项目目录选择本 `SkipColor` 文件夹。
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
- 主页可切换音效开关。

## 音效资源

游戏会尝试加载 `audio/move.mp3`、`audio/ice.mp3`、`audio/win.mp3`。若文件不存在，音效静默失败，不影响游戏运行。震动反馈无需资源文件，直接调用 `wx.vibrateShort` / `wx.vibrateLong`。

## 云存档（可选）

`storage.js` 内置云存档同步逻辑，检测到 `wx.cloud` 可用时自动初始化并同步 `user_stats` 集合。若未开通云开发，自动降级为纯本地存储，不影响游戏。

## 与原 HTML 版本的差异

- DOM 渲染 → Canvas 渲染
- `localStorage` → `wx.getStorageSync` / `wx.setStorageSync` + 云存档
- `alert` / `confirm` → `wx.showModal`
- `onclick` → `wx.onTouchStart` + 命中测试 + 坐标缩放
- CSS 动画 → `setTimeout` + Canvas 重绘
- 单文件 → 模块化拆分（globals / draw / screens / level / game / renderer / main / storage / audio）
- 全量重绘 → 脏标记按需重绘
- 无反馈 → 音效 + 震动反馈
