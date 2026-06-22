var G = GameGlobal;
var draw = require('./draw.js');
var C = G.CONFIG;

var screenHome = {
  draw: function() {
    var ctx = G.ctx;
    var W = G.W;
    var H = G.H;

    ctx.fillStyle = C.bgColor;
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2;
    var y = 60;

    draw.drawText(ctx, '跳跃填色', cx, y, 36, C.textMain, 'center', true);
    y += 50;

    var totalDaily = G.playerStats.normalClearedCount + G.playerStats.advClearedCount;
    draw.drawText(ctx, '您今天已经完成 ' + totalDaily + ' 关！', cx, y, 15, C.textSub, 'center');
    y += 60;

    G.screenButtons = [];
    var btnW = W - 40;
    var btnH = 60;
    var btnX = 20;

    var items = [
      { label: '📖 基础教学', sub: '▶', action: 'startTutorial' },
      { label: '🎮 普通关卡', sub: G.playerStats.tutorialCleared ? '▶' : '🔒 需通关教学', action: G.playerStats.tutorialCleared ? 'startNormal' : null },
      { label: '🔥 进阶关卡', sub: G.playerStats.normalClearedCount > 0 ? '▶' : '🔒 需通关普通', action: G.playerStats.normalClearedCount > 0 ? 'goAdvModes' : null }
    ];

    for (var i = 0; i < items.length; i++) {
      draw.drawShadowBox(ctx, btnX, y, btnW, btnH, C.radiusLg, C.cardBg);
      draw.drawText(ctx, items[i].label, btnX + 20, y + btnH / 2, 18, C.textMain, 'left', true);
      draw.drawText(ctx, items[i].sub, btnX + btnW - 30, y + btnH / 2, 16, C.textSub, 'right');

      if (items[i].action) {
        G.screenButtons.push({ x: btnX, y: y, w: btnW, h: btnH, action: items[i].action });
      }
      y += btnH + 15;
    }

    y += 20;
    var clearBtnW = draw.measureText(ctx, '清除游戏进度', 13) + 20;
    G.screenButtons.push({ x: cx - clearBtnW / 2, y: y, w: clearBtnW, h: 30, action: 'clearData' });
    draw.drawText(ctx, '清除游戏进度', cx, y + 15, 13, C.textSub, 'center');
  }
};

var screenAdvModes = {
  draw: function() {
    var ctx = G.ctx;
    var W = G.W;
    var H = G.H;

    ctx.fillStyle = C.bgColor;
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2;
    var y = 60;

    draw.drawText(ctx, '进阶模式', cx, y, 28, C.textMain, 'center', true);
    y += 40;
    draw.drawText(ctx, '选择您要挑战的特殊机制', cx, y, 15, C.textSub, 'center');
    y += 50;

    G.screenButtons = [];
    var btnW = W - 40;
    var btnH = 60;
    var btnX = 20;

    var items = [
      { label: '🧊 冰块融化', sub: '▶', action: 'goIceMenu' },
      { label: '✨ 更多关卡', sub: '▶', action: 'goComingSoon' }
    ];

    for (var i = 0; i < items.length; i++) {
      draw.drawShadowBox(ctx, btnX, y, btnW, btnH, C.radiusLg, C.cardBg);
      draw.drawText(ctx, items[i].label, btnX + 20, y + btnH / 2, 18, C.textMain, 'left', true);
      draw.drawText(ctx, items[i].sub, btnX + btnW - 30, y + btnH / 2, 16, C.textSub, 'right');
      G.screenButtons.push({ x: btnX, y: y, w: btnW, h: btnH, action: items[i].action });
      y += btnH + 15;
    }

    y += 20;
    draw.drawShadowBox(ctx, btnX, y, btnW, btnH, C.radiusLg, C.cellEmpty);
    draw.drawText(ctx, '返回主页', btnX + btnW / 2, y + btnH / 2, 18, C.textMain, 'center', true);
    G.screenButtons.push({ x: btnX, y: y, w: btnW, h: btnH, action: 'goHome' });
  }
};

var screenIceMenu = {
  draw: function() {
    var ctx = G.ctx;
    var W = G.W;
    var H = G.H;

    ctx.fillStyle = C.bgColor;
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2;
    var y = 60;

    draw.drawText(ctx, '冰块融化', cx, y, 28, C.textMain, 'center', true);
    y += 40;
    draw.drawText(ctx, '需要多重交叉配合才能击碎的冰块', cx, y, 15, C.textSub, 'center');
    y += 50;

    G.screenButtons = [];
    var btnW = W - 40;
    var btnH = 60;
    var btnX = 20;

    var items = [
      { label: '📖 冰块教学', sub: '▶', action: 'startAdvTutorial' },
      { label: '🎮 正式关卡', sub: G.playerStats.advTutorialCleared ? '▶' : '🔒 需通关教学', action: G.playerStats.advTutorialCleared ? 'startAdvanced' : null }
    ];

    for (var i = 0; i < items.length; i++) {
      draw.drawShadowBox(ctx, btnX, y, btnW, btnH, C.radiusLg, C.cardBg);
      draw.drawText(ctx, items[i].label, btnX + 20, y + btnH / 2, 18, C.textMain, 'left', true);
      draw.drawText(ctx, items[i].sub, btnX + btnW - 30, y + btnH / 2, 16, C.textSub, 'right');
      if (items[i].action) {
        G.screenButtons.push({ x: btnX, y: y, w: btnW, h: btnH, action: items[i].action });
      }
      y += btnH + 15;
    }

    y += 20;
    draw.drawShadowBox(ctx, btnX, y, btnW, btnH, C.radiusLg, C.cellEmpty);
    draw.drawText(ctx, '返回机制列表', btnX + btnW / 2, y + btnH / 2, 18, C.textMain, 'center', true);
    G.screenButtons.push({ x: btnX, y: y, w: btnW, h: btnH, action: 'goAdvModes' });
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
  screenComingSoon: screenComingSoon
};