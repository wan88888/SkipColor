var G = GameGlobal;
var draw = require('./draw.js');
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
    draw.drawText(ctx, '您今天已经完成 ' + totalDaily + ' 关！', cx, y, 15, C.textSub, 'center');
    y += 60;

    var items = [
      { label: '📖 基础教学', sub: '▶', action: 'startTutorial' },
      { label: '🎮 普通关卡', sub: G.playerStats.tutorialCleared ? '▶' : '🔒 需通关教学', action: G.playerStats.tutorialCleared ? 'startNormal' : null, disabled: !G.playerStats.tutorialCleared },
      { label: '🔥 进阶关卡', sub: G.playerStats.normalClearedCount > 0 ? '▶' : '🔒 需通关普通', action: G.playerStats.normalClearedCount > 0 ? 'goAdvModes' : null, disabled: G.playerStats.normalClearedCount === 0 }
    ];
    y = drawButtonList(items, y);

    y += 10;
    var soundLabel = G.settings.soundEnabled ? '🔊 音效已开' : '🔇 音效已关';
    var soundBtnW = draw.measureText(ctx, soundLabel, 13) + 30;
    G.screenButtons.push({ x: cx - soundBtnW / 2, y: y, w: soundBtnW, h: 30, action: 'toggleSound' });
    draw.drawText(ctx, soundLabel, cx, y + 15, 13, C.textSub, 'center');

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
      { label: '✨ 更多关卡', sub: '▶', action: 'goComingSoon' }
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
      { label: '🎮 正式关卡', sub: G.playerStats.advTutorialCleared ? '▶' : '🔒 需通关教学', action: G.playerStats.advTutorialCleared ? 'startAdvanced' : null, disabled: !G.playerStats.advTutorialCleared }
    ];
    y = drawButtonList(items, y);

    drawBackButton('返回机制列表', y, 'goAdvModes');
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
