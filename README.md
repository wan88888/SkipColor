# 跳跃填色（SkipColor）

微信小游戏 · 点击数字、选择方向，让光束跳跃填色，清空棋盘。

## 本地开发

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入本项目目录（`project.config.json` 中已配置 `compileType: game`）
3. 使用测试 AppID 或自有 AppID 打开
4. 编译运行即可在模拟器/真机预览

## 项目结构

```
game.js              入口
game.json            小游戏配置（竖屏）
images/              提审图标与分享图
docs/submission/     提审文案、隐私说明、截图
js/
  main.js            主循环、触摸、页面路由
  game.js            核心玩法与状态机动画
  beam.js            光束逻辑（校验与反射）
  level.js           关卡生成与加载
  levelpack.js       25 关精编 + 机制教学关
  storage.js         本地存档（wx.storage）
  screens.js         菜单 UI
  renderer.js        游戏画面与结算页
scripts/
  test-levels.js     关卡可解性测试
```

## 功能开关

在 `js/globals.js` 的 `G.FEATURES` 中：

| 开关 | 默认 | 说明 |
|------|------|------|
| `sound` | `false` | 需补齐 `audio/*.mp3` 后开启 |
| `leaderboard` | `false` | 需配置开放数据域后开启 |

## 存储说明

- 进度、设置、主题均使用 **微信本地存储**（`wx.setStorageSync`）
- 键名：`jumpColorStats` / `jumpColorSettings` / `jumpColorTheme`
- 好友排行榜（可选）使用 `wx.setUserCloudStorage`，见 `js/leaderboard.js`

## 测试

```bash
node scripts/test-levels.js
```

校验精编关卡、机制教学关及随机关卡生成器的可解性。

## 提审清单

详细文案与后台步骤见 [`docs/submission/`](docs/submission/)：

| 文件 | 说明 |
|------|------|
| [COPY.md](docs/submission/COPY.md) | 类目、简介、详细描述、更新说明 |
| [PRIVACY.md](docs/submission/PRIVACY.md) | 隐私保护指引（本地存储） |
| [ADMIN_CHECKLIST.md](docs/submission/ADMIN_CHECKLIST.md) | 微信公众平台逐步操作 |
| [P1_CHECKLIST.md](docs/submission/P1_CHECKLIST.md) | 上线质量优化与真机测试 |

### P1 上线质量（代码已落地）

- [x] 生命周期 `onShow/onHide`（无尽计时暂停）
- [x] 安全区 `safeArea` 顶栏/滚动区适配
- [x] 分享深链 `query`（mode / level / seed）
- [x] 每日挑战已完成 → 练习模式不计分
- [x] 存档失败 Toast 提示
- [ ] 真机测试记录 → 见 [P1_CHECKLIST.md](docs/submission/P1_CHECKLIST.md)

### 必备素材

- [x] 小游戏图标 512×512 → `images/icon-512.png`
- [x] 分享图 500×400 → `images/share-500x400.png`（`G.SHARE.imageUrl`）
- [x] 3 张宣传截图 → `docs/submission/screenshots/01-home.png` 等
- [x] 简短介绍与详细描述 → `docs/submission/COPY.md`

### 后台配置

- [ ] 微信公众平台 → 小游戏 → 设置类目（建议：休闲益智，见 COPY.md）
- [ ] 隐私保护指引（见 PRIVACY.md，本地存储说明）
- [ ] 若启用排行榜：配置**开放数据域**并上传开放数据域工程
- [ ] 若启用音效：将 `move.mp3`、`win.mp3`、`ice.mp3` 等放入 `audio/` 目录

### 自测要点

- [ ] 基础教学 → 普通关 → 进阶机制教学 → 正式关卡完整流程
- [ ] 星星模式：未收集星星无法通关
- [ ] 清除进度后数据归零
- [ ] 小屏机主页/成就页可滚动
- [ ] 分享文案与结算页分享按钮
- [ ] 无崩溃、无明显卡顿

### 版本信息建议

- 版本号：0.1.0
- 更新说明：首版发布，含 25 关精编、五种进阶机制、每日挑战与无尽模式

## 已实现机制

| 机制 | 说明 |
|------|------|
| 基础填色 | 数字 + 方向，光束跳过障碍 |
| 冰块 | 消耗填色次数破冰 |
| 传送门 | 成对传送，保持方向 |
| 镜子 | `/` `\` 反射 |
| 炸弹 | 爆炸清除周围格 |
| 星星 | 必须经过并收集才能通关 |

## License

Private — 仅供项目维护者与授权协作方使用。
