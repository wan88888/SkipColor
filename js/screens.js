var G = GameGlobal;
var draw = require('./draw.js');
var achievements = require('./achievements.js');
var leaderboard = require('./leaderboard.js');
var editor = require('./editor.js');
var daily = require('./daily.js');
var C = G.CONFIG;

function drawScreenBase(title, subtitle) {
  var ctx = G.ctx;
  var W = G.W;
  var H = G.H;

  ctx.fillStyle = C.bgColor;
  ctx.fillRect(0, 0, W, H);

  var cx = W / 2;
  var y = 60;

  draw.drawText(ctx, title, cx, y, 36, C.textMain, 'center', true);
  y += 50;

  if (subtitle) {
    draw.drawText(ctx, subtitle, cx, y, 15, C.textSub, 'center');
    y += 10;
  }

  return { ctx: ctx, W: W, H: H, cx: cx, y: y };
}

function drawButtonList(items, startY) {
  var ctx = G.ctx;
  var W = G.W;
  var cx = W / 2;
  var btnW = W - 40;
  var btnH = 60;
  var btnX = 20;
  var y = startY;

  G.screenButtons = [];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var bgColor = item.disabled ? C.cellEmpty : C.cardBg;
    draw.drawShadowBox(ctx, btnX, y, btnW, btnH, C.radiusLg, bgColor);
    draw.drawText(ctx, item.label, btnX + 20, y + btnH / 2, 18, C.textMain, 'left', true);
    draw.drawText(ctx, item.sub, btnX + btnW - 30, y + btnH / 2, 16, C.textSub, 'right');

    if (item.action) {
      G.screenButtons.push({ x: btnX, y: y, w: btnW, h: btnH, action: item.action });
    }
    y += btnH + 15;
  }

  return y;
}

function drawBackButton(label, y, action) {
  var ctx = G.ctx;
  var W = G.W;
  var cx = W / 2;
  var btnW = W - 40;
  var btnH = 60;
  var btnX = 20;

  y += 20;
  draw.drawShadowBox(ctx, btnX, y, btnW, btnH, C.radiusLg, C.cellEmpty);
  draw.drawText(ctx, label, btnX + btnW / 2, y + btnH / 2, 18, C.textMain, 'center', true);
  G.screenButtons.push({ x: btnX, y: y, w: btnW, h: btnH, action: action });
  return y + btnH;
}

var screenHome = {
  draw: function() {
    var base = drawScreenBase('跳跃填色', null);
    var ctx = base.ctx;
    var W = base.W;
    var cx = base.cx;
    var y = base.y;

    var totalDaily = G.playerStats.normalClearedCount + G.playerStats.advClearedCount;
    draw.drawText(ctx, '今日通关 ' + totalDaily + ' 关  ⭐ ' + G.playerStats.totalStars, cx, y, 15, C.textSub, 'center');
    y += 50;

    var items = [
      { label: '📖 基础教学', sub: '▶', action: 'startTutorial' },
      { label: '🎮 普通关卡', sub: G.playerStats.tutorialCleared ? '▶' : '🔒', action: G.playerStats.tutorialCleared ? 'startNormal' : null, disabled: !G.playerStats.tutorialCleared },
      { label: '🔥 进阶关卡', sub: G.playerStats.normalClearedCount > 0 ? '▶' : '🔒', action: G.playerStats.normalClearedCount > 0 ? 'goAdvModes' : null, disabled: G.playerStats.normalClearedCount === 0 },
      { label: '📅 每日挑战', sub: daily.isDailyClearedToday() ? '✓今日' : '▶', action: 'startDaily' },
      { label: '♾️ 无尽模式', sub: '最高:' + G.playerStats.endlessHighScore, action: 'startEndless' },
      { label: '🏆 成就', sub: achievements.getProgress().unlocked + '/' + achievements.getProgress().total, action: 'goAchievements' },
      { label: '🎨 主题', sub: G.THEMES[G.currentTheme].name, action: 'goThemes' },
      { label: '📊 排行榜', sub: '▶', action: 'goLeaderboard' },
      { label: '🛠️ 关卡编辑器', sub: '▶', action: 'goEditor' }
    ];
    y = drawButtonList(items, y);

    y += 10;
    var toggleW = (W - 50) / 3;
    var soundLabel = G.settings.soundEnabled ? '🔊音效' : '🔇音效';
    var vibLabel = G.settings.vibrationEnabled ? '📳振动' : '📴振动';
    var particleLabel = G.settings.particleEnabled ? '✨特效' : '⚪特效';
    G.screenButtons.push({ x: 20, y: y, w: toggleW, h: 30, action: 'toggleSound' });
    draw.drawText(ctx, soundLabel, 20 + toggleW / 2, y + 15, 12, C.textSub, 'center');
    G.screenButtons.push({ x: 25 + toggleW, y: y, w: toggleW, h: 30, action: 'toggleVibration' });
    draw.drawText(ctx, vibLabel, 25 + toggleW + toggleW / 2, y + 15, 12, C.textSub, 'center');
    G.screenButtons.push({ x: 30 + toggleW * 2, y: y, w: toggleW, h: 30, action: 'toggleParticle' });
    draw.drawText(ctx, particleLabel, 30 + toggleW * 2 + toggleW / 2, y + 15, 12, C.textSub, 'center');

    y += 40;
    var clearBtnW = draw.measureText(ctx, '清除游戏进度', 13) + 20;
    G.screenButtons.push({ x: cx - clearBtnW / 2, y: y, w: clearBtnW, h: 30, action: 'clearData' });
    draw.drawText(ctx, '清除游戏进度', cx, y + 15, 13, C.textSub, 'center');
  }
};

var screenAdvModes = {
  draw: function() {
    var base = drawScreenBase('进阶模式', '选择您要挑战的特殊机制');
    var y = base.y + 40;

    var items = [
      { label: '🧊 冰块融化', sub: '▶', action: 'goIceMenu' },
      { label: '🌀 传送门', sub: '▶', action: 'startPortalMode' },
      { label: '🪞 镜子反射', sub: '▶', action: 'startMirrorMode' },
      { label: '💣 炸弹', sub: '▶', action: 'startBombMode' },
      { label: '⭐ 收集星星', sub: '▶', action: 'startStarMode' }
    ];
    y = drawButtonList(items, y);

    drawBackButton('返回主页', y, 'goHome');
  }
};

var screenIceMenu = {
  draw: function() {
    var base = drawScreenBase('冰块融化', '需要多重交叉配合才能击碎的冰块');
    var y = base.y + 40;

    var items = [
      { label: '📖 冰块教学', sub: '▶', action: 'startAdvTutorial' },
      { label: '🎮 正式关卡', sub: G.playerStats.advTutorialCleared ? '▶' : '🔒', action: G.playerStats.advTutorialCleared ? 'startAdvanced' : null, disabled: !G.playerStats.advTutorialCleared }
    ];
    y = drawButtonList(items, y);

    drawBackButton('返回机制列表', y, 'goAdvModes');
  }
};

var screenAchievements = {
  draw: function() {
    var base = drawScreenBase('成就', achievements.getProgress().unlocked + '/' + achievements.getProgress().total + ' 已解锁');
    var ctx = base.ctx;
    var W = base.W;
    var y = base.y + 30;

    G.screenButtons = [];
    var list = achievements.getList();
    var itemH = 70;
    var itemW = W - 40;
    var itemX = 20;

    for (var i = 0; i < list.length; i++) {
      var ach = list[i];
      var bgColor = ach.unlocked ? C.cardBg : C.cellEmpty;
      draw.drawShadowBox(ctx, itemX, y, itemW, itemH, C.radiusLg, bgColor);

      draw.drawText(ctx, ach.icon, itemX + 30, y + itemH / 2, 28, C.textMain, 'center');
      draw.drawText(ctx, ach.name, itemX + 60, y + 25, 16, C.textMain, 'left', true);
      draw.drawText(ctx, ach.desc, itemX + 60, y + 48, 12, C.textSub, 'left');

      if (ach.unlocked) {
        draw.drawText(ctx, '✓', itemX + itemW - 30, y + itemH / 2, 20, C.cellFilled, 'center', true);
      } else {
        draw.drawText(ctx, '?', itemX + itemW - 30, y + itemH / 2, 20, C.textSub, 'center', true);
      }

      y += itemH + 10;
    }

    drawBackButton('返回主页', y, 'goHome');
  }
};

var screenThemes = {
  draw: function() {
    var base = drawScreenBase('主题皮肤', '通关解锁更多主题');
    var ctx = base.ctx;
    var W = base.W;
    var y = base.y + 30;

    G.screenButtons = [];
    var themeNames = Object.keys(G.THEMES);
    var itemH = 80;
    var itemW = W - 40;
    var itemX = 20;

    for (var i = 0; i < themeNames.length; i++) {
      var tName = themeNames[i];
      var theme = G.THEMES[tName];
      var unlocked = G.playerStats.unlockedThemes.indexOf(tName) !== -1;
      var isCurrent = G.currentTheme === tName;
      var bgColor = unlocked ? theme.cardBg : C.cellEmpty;

      draw.drawShadowBox(ctx, itemX, y, itemW, itemH, C.radiusLg, bgColor);

      draw.drawRoundRect(ctx, itemX + 10, y + 10, 30, itemH - 20, 5, theme.bgColor);
      draw.drawRoundRect(ctx, itemX + 45, y + 10, 30, itemH - 20, 5, theme.cellFilled);
      draw.drawRoundRect(ctx, itemX + 80, y + 10, 30, itemH - 20, 5, theme.cellNumber);
      draw.drawRoundRect(ctx, itemX + 115, y + 10, 30, itemH - 20, 5, theme.accentColor);

      draw.drawText(ctx, theme.name, itemX + 160, y + 25, 16, C.textMain, 'left', true);

      if (isCurrent) {
        draw.drawText(ctx, '✓ 使用中', itemX + 160, y + 50, 12, C.cellFilled, 'left');
      } else if (unlocked) {
        draw.drawText(ctx, '点击切换', itemX + 160, y + 50, 12, C.textSub, 'left');
        G.screenButtons.push({ x: itemX, y: y, w: itemW, h: itemH, action: 'theme_' + tName });
      } else {
        var unlockCond = '';
        if (tName === 'spring') unlockCond = '通关10关解锁';
        else if (tName === 'ocean') unlockCond = '获得30颗星解锁';
        else if (tName === 'lava') unlockCond = '无尽模式得分50解锁';
        draw.drawText(ctx, '🔒 ' + unlockCond, itemX + 160, y + 50, 12, C.textSub, 'left');
      }

      y += itemH + 10;
    }

    drawBackButton('返回主页', y, 'goHome');
  }
};

var screenLeaderboard = {
  draw: function() {
    var base = drawScreenBase('好友排行榜', '与好友比拼通关数');
    var ctx = base.ctx;
    var W = base.W;
    var y = base.y + 30;

    G.screenButtons = [];

    if (!G._leaderboardData) {
      draw.drawText(ctx, '加载中...', W / 2, y + 40, 16, C.textSub, 'center');
      drawBackButton('返回主页', y + 80, 'goHome');

      if (!G._leaderboardLoading) {
        G._leaderboardLoading = true;
        leaderboard.getFriendRanking(function(res) {
          G._leaderboardLoading = false;
          if (res.ok) {
            G._leaderboardData = res.list;
          } else {
            G._leaderboardData = [];
            G._leaderboardError = res.reason;
          }
          G.markDirty();
        });
      }
      return;
    }

    if (G._leaderboardData.length > 0) {
      var itemH = 60;
      var itemW = W - 40;
      var itemX = 20;

      for (var i = 0; i < G._leaderboardData.length; i++) {
        var item = G._leaderboardData[i];
        draw.drawShadowBox(ctx, itemX, y, itemW, itemH, C.radiusLg, C.cardBg);
        draw.drawText(ctx, '#' + (i + 1), itemX + 25, y + itemH / 2, 18, i < 3 ? C.accentColor : C.textSub, 'center', true);
        draw.drawText(ctx, item.nickname, itemX + 60, y + itemH / 2, 14, C.textMain, 'left', true);
        draw.drawText(ctx, item.score + '关', itemX + itemW - 20, y + itemH / 2, 14, C.cellFilled, 'right', true);
        y += itemH + 8;
      }
    } else {
      draw.drawText(ctx, '暂无排行榜数据', W / 2, y + 40, 16, C.textSub, 'center');
      if (G._leaderboardError === 'not_supported') {
        draw.drawText(ctx, '当前环境不支持好友排行榜', W / 2, y + 70, 12, C.textSub, 'center');
      } else {
        draw.drawText(ctx, '需要开通云开发或好友数据', W / 2, y + 70, 12, C.textSub, 'center');
      }
      y += 100;
    }

    drawBackButton('刷新', y, 'refreshLeaderboard');
    drawBackButton('返回主页', y + 80, 'goHome');
  }
};

var screenEditor = {
  draw: function() {
    var base = drawScreenBase('关卡编辑器', '设计你的专属关卡');
    var ctx = base.ctx;
    var W = base.W;
    var H = base.H;
    var y = base.y + 20;

    G.screenButtons = [];

    var toolBarH = 50;
    var tools = editor.TOOLS;
    var toolBtnW = (W - 40 - (tools.length - 1) * 5) / tools.length;
    for (var i = 0; i < tools.length; i++) {
      var tx = 20 + i * (toolBtnW + 5);
      var isActive = G.editorTool === tools[i].id;
      draw.drawRoundRect(ctx, tx, y, toolBtnW, toolBarH, 8, isActive ? C.cellNumber : C.cardBg);
      var label = tools[i].name;
      if (tools[i].id === 'number' && isActive) {
        label = '数' + (G.editorValue - 10);
      }
      if (tools[i].id === 'mirror' && isActive) {
        label = G.editorValue === -11 ? '镜\\' : '镜/';
      }
      draw.drawText(ctx, label, tx + toolBtnW / 2, y + toolBarH / 2, 10, isActive ? '#ffffff' : C.textMain, 'center', true);
      G.screenButtons.push({ x: tx, y: y, w: toolBtnW, h: toolBarH, action: 'tool_' + tools[i].id });
    }
    y += toolBarH + 15;

    var gridSize = 35;
    var gridW = G.COLS * gridSize;
    var gridH = G.ROWS * gridSize;
    var gridX = (W - gridW) / 2;
    var gridY = y;

    draw.drawShadowBox(ctx, gridX - 5, gridY - 5, gridW + 10, gridH + 10, C.radiusLg, C.cardBg);

    G.editorCellRects = [];
    for (var r = 0; r < G.ROWS; r++) {
      for (var c = 0; c < G.COLS; c++) {
        var cx_c = gridX + c * gridSize;
        var cy_c = gridY + r * gridSize;
        var val = G.editorGrid[r][c];
        var cellColor = C.cellEmpty;
        var cellText = '';

        if (val === 0) {
          cellColor = C.cellEmpty;
        } else if (val === -1) {
          cellColor = C.bgColor;
        } else if (val === -2 || val === -3 || val === -4) {
          cellColor = C.iceHp1;
          cellText = '🧊';
        } else if (val === -5) {
          cellColor = '#9c7fb5';
          cellText = '🌀';
        } else if (val === -6 || val === -11) {
          cellColor = '#7a8b98';
          cellText = val === -6 ? '/' : '\\';
        } else if (val === -7) {
          cellColor = '#603030';
          cellText = '💣';
        } else if (val === -8) {
          cellColor = '#ffd700';
          cellText = '⭐';
        } else if (val === -9) {
          cellColor = '#d8dce0';
          cellText = '🚫';
        } else if (val >= 10 && val < 20) {
          cellColor = C.cellNumber;
          cellText = '' + (val - 10);
        }

        draw.drawRoundRect(ctx, cx_c + 2, cy_c + 2, gridSize - 4, gridSize - 4, 5, cellColor);

        if (cellText) {
          draw.drawText(ctx, cellText, cx_c + gridSize / 2, cy_c + gridSize / 2, 14, '#ffffff', 'center', true);
        }

        G.editorCellRects.push({ r: r, c: c, x: cx_c, y: cy_c, w: gridSize, h: gridSize });
      }
    }

    y = gridY + gridH + 20;

    var btnW = (W - 50) / 3;
    var btnH = 44;
    var btns = [
      { label: '▶ 测试', x: 20, action: 'editor_test' },
      { label: '📤 分享', x: 20 + btnW + 5, action: 'editor_share' },
      { label: '📥 导入', x: 20 + (btnW + 5) * 2, action: 'editor_import' }
    ];
    for (var bi = 0; bi < btns.length; bi++) {
      var b = btns[bi];
      draw.drawRoundRect(ctx, b.x, y, btnW, btnH, 20, C.cellNumber);
      draw.drawText(ctx, b.label, b.x + btnW / 2, y + btnH / 2, 14, '#ffffff', 'center', true);
      G.screenButtons.push({ x: b.x, y: y, w: btnW, h: btnH, action: b.action });
    }

    drawBackButton('返回主页', y + btnH + 10, 'goHome');
  }
};

var screenComingSoon = {
  draw: function() {
    var ctx = G.ctx;
    var W = G.W;
    var H = G.H;

    ctx.fillStyle = C.bgColor;
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2;
    var y = H / 2 - 80;

    draw.drawText(ctx, 'Coming Soon...', cx, y, 28, C.cellNumber, 'center', true);
    y += 50;
    draw.drawText(ctx, '更多进阶机制正在紧锣密鼓地制作中！', cx, y, 15, C.textSub, 'center');

    y += 50;
    G.screenButtons = [];
    var btnW = 160;
    var btnX = cx - btnW / 2;
    var btnH = 50;
    draw.drawRoundRect(ctx, btnX, y, btnW, btnH, 25, C.cellNumber);
    draw.drawText(ctx, '返回', cx, y + btnH / 2, 16, '#ffffff', 'center', true);
    G.screenButtons.push({ x: btnX, y: y, w: btnW, h: btnH, action: 'goAdvModes' });
  }
};

module.exports = {
  screenHome: screenHome,
  screenAdvModes: screenAdvModes,
  screenIceMenu: screenIceMenu,
  screenAchievements: screenAchievements,
  screenThemes: screenThemes,
  screenLeaderboard: screenLeaderboard,
  screenEditor: screenEditor,
  screenComingSoon: screenComingSoon
};
