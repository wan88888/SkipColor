var G = GameGlobal;
var draw = require('./draw.js');
var game = require('./game.js');
var particles = require('./particles.js');
var endless = require('./endless.js');
var levelpack = require('./levelpack.js');
var rating = require('./rating.js');
var C = G.CONFIG;

function calcCellSize() {
  return G.calcCellSize();
}

function getBoardPixelSize() {
  var cs = calcCellSize();
  return {
    w: cs * G.COLS + C.gap * (G.COLS + 1),
    h: cs * G.ROWS + C.gap * (G.ROWS + 1),
    cs: cs
  };
}

function getCellRect(r, c) {
  var bs = getBoardPixelSize();
  var ox = G.gameBoardOffsetX;
  var oy = G.gameBoardOffsetY;
  var cs = bs.cs;
  return {
    x: ox + C.gap + c * (cs + C.gap),
    y: oy + C.gap + r * (cs + C.gap),
    w: cs,
    h: cs
  };
}

function drawGameScreen() {
  var ctx = G.ctx;
  var W = G.W;
  var H = G.H;

  var bottomPad = (G.layoutPad && G.layoutPad.bottom) || 16;
  var topPad = (G.layoutPad && G.layoutPad.top) || 20;

  ctx.fillStyle = C.bgColor;
  ctx.fillRect(0, 0, W, H);

  var y = topPad;
  var cx = W / 2;

  var homeBtnX = 15;
  var homeBtnY = y;
  var homeBtnR = 18;
  draw.drawCircle(ctx, homeBtnX + homeBtnR, homeBtnY + homeBtnR, homeBtnR, C.cellEmpty);
  draw.drawText(ctx, '🏠', homeBtnX + homeBtnR, homeBtnY + homeBtnR, 20, C.textMain, 'center');
  G.btnRects.homeBtn = { x: homeBtnX, y: homeBtnY, w: homeBtnR * 2, h: homeBtnR * 2 };

  var titleText = '';
  if (G.currentMode === 'tutorial') {
    var tIdx = Math.min(G.levelIndex, G.tutorials.length - 1);
    titleText = G.tutorials[tIdx].title;
  } else if (G.currentMode === 'adv-tutorial') {
    var atIdx = Math.min(G.levelIndex, G.advTutorials.length - 1);
    titleText = G.advTutorials[atIdx].title;
  } else if (G.currentMode === 'mech-tutorial') {
    var mechData = levelpack.getMechTutorial(G.advMechanic, G.levelIndex);
    titleText = mechData ? mechData.title : '机制教学';
  } else if (G.currentMode === 'advanced') {
    titleText = '正式关卡';
  } else if (G.currentMode === 'daily') {
    titleText = G.dailyPracticeMode ? '每日挑战 · 练习' : '每日挑战';
  } else if (G.currentMode === 'endless') {
    titleText = '无尽模式';
  } else if (G.currentMode === 'editor-test') {
    titleText = '编辑器测试';
  } else {
    titleText = '普通关卡';
  }
  draw.drawText(ctx, titleText, cx, y + homeBtnR, 18, C.textMain, 'center', true);

  if (G.currentMode === 'endless') {
    var timeText = '⏱ ' + endless.getTimeDisplay();
    var timeW = draw.measureText(ctx, timeText, 12) + 14;
    var timeH = 20;
    var timeX = cx + draw.measureText(ctx, titleText, 18) / 2 + 10;
    var timeY = y + homeBtnR - timeH / 2;
    draw.drawRoundRect(ctx, timeX, timeY, timeW, timeH, 8, C.accentColor);
    draw.drawText(ctx, timeText, timeX + timeW / 2, timeY + timeH / 2, 12, '#ffffff', 'center', true);
  } else if (G.difficulty) {
    var badgeW = draw.measureText(ctx, G.difficulty, 11) + 16;
    var badgeH = 22;
    var badgeX = cx + draw.measureText(ctx, titleText, 18) / 2 + 10;
    var badgeY = y + homeBtnR - badgeH / 2;
    draw.drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8, G.difficultyColor);
    draw.drawText(ctx, G.difficulty, badgeX + badgeW / 2, badgeY + badgeH / 2, 11, '#ffffff', 'center', true);
  }

  if (G.currentLevelNum > 0) {
    var levelText = '第 ' + G.currentLevelNum + ' 关';
    var levelW = draw.measureText(ctx, levelText, 11) + 14;
    var levelH = 20;
    var levelX = cx - draw.measureText(ctx, titleText, 18) / 2 - levelW - 10;
    var levelY = y + homeBtnR - levelH / 2;
    draw.drawRoundRect(ctx, levelX, levelY, levelW, levelH, 8, C.cellNumber);
    draw.drawText(ctx, levelText, levelX + levelW / 2, levelY + levelH / 2, 11, '#ffffff', 'center', true);
  }

  if (G.stars && G.stars.length > 0) {
    var collectedCount = 0;
    for (var si = 0; si < G.stars.length; si++) {
      if (G.stars[si].collected) collectedCount++;
    }
    var starText = '⭐ ' + collectedCount + '/' + G.stars.length;
    draw.drawText(ctx, starText, cx, y + homeBtnR + 20, 12, '#ffd700', 'center', true);
  }

  y += homeBtnR * 2 + 10;

  if (G.currentMode === 'tutorial' || G.currentMode === 'adv-tutorial' || G.currentMode === 'mech-tutorial') {
    var tData = null;
    if (G.currentMode === 'tutorial' && G.levelIndex < G.tutorials.length) {
      tData = G.tutorials[G.levelIndex];
    } else if (G.currentMode === 'adv-tutorial' && G.levelIndex < G.advTutorials.length) {
      tData = G.advTutorials[G.levelIndex];
    } else if (G.currentMode === 'mech-tutorial') {
      tData = levelpack.getMechTutorial(G.advMechanic, G.levelIndex);
    }
    if (tData) {
      var lines = draw.wrapText(ctx, tData.text, W - 40, 18, 14);
      for (var li = 0; li < lines.length; li++) {
        draw.drawText(ctx, lines[li], cx, y, 14, C.textSub, 'center');
        y += 20;
      }
      y += 5;
    }
  }

  if (G.ROWS > 0 && G.COLS > 0) {
    var bs = getBoardPixelSize();
    G.gameBoardOffsetX = Math.floor((W - bs.w) / 2);
    G.gameBoardOffsetY = y;

    draw.drawShadowBox(ctx, G.gameBoardOffsetX - 5, G.gameBoardOffsetY - 5, bs.w + 10, bs.h + 10, C.radiusLg, C.cardBg);

    var cs = bs.cs;
    var cellRects = [];

    for (var r = 0; r < G.ROWS; r++) {
      for (var c = 0; c < G.COLS; c++) {
        var cellData = G.gridData[r][c];
        var cx_c = G.gameBoardOffsetX + C.gap + c * (cs + C.gap) + cs / 2;
        var cy_c = G.gameBoardOffsetY + C.gap + r * (cs + C.gap) + cs / 2;
        var rect = getCellRect(r, c);

        if (cellData.type === 'void') {
          // skip
        } else if (cellData.type === 'empty') {
          draw.drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, C.cellEmpty);
          if (cellData.isStar) {
            draw.drawText(ctx, '⭐', cx_c, cy_c, 16, '#ffd700', 'center');
          }
        } else if (cellData.type === 'filled') {
          var scale = cellData.animState === 'pop' ? 0.95 : 1;
          var fw = rect.w * scale, fh = rect.h * scale;
          var fx = rect.x + (rect.w - fw) / 2;
          var fy = rect.y + (rect.h - fh) / 2;
          draw.drawRoundRect(ctx, fx, fy, fw, fh, 10, C.cellFilled);
        } else if (cellData.type === 'number') {
          if (cellData.used) {
            ctx.globalAlpha = 0.3;
          }
          var numColor = C.cellNumber;

          if (G.selectedCell && G.selectedCell.r === r && G.selectedCell.c === c) {
            draw.drawRoundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10, numColor);
            ctx.globalAlpha = 0.5;
            draw.drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, C.textMain);
            ctx.globalAlpha = 1;
          } else {
            draw.drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, numColor);
          }
          draw.drawText(ctx, '' + cellData.value, cx_c, cy_c, 20, '#ffffff', 'center', true);
          ctx.globalAlpha = 1;

          if (G.isHintVisible && cellData.seq) {
            var badgeR = 9;
            draw.drawCircle(ctx, rect.x + rect.w - badgeR + 2, rect.y - badgeR + 2, badgeR, C.accentColor);
            draw.drawText(ctx, '' + cellData.seq, rect.x + rect.w - badgeR + 2, rect.y - badgeR + 2, 11, '#ffffff', 'center', true);
          }
        } else if (cellData.type === 'ice') {
          var iceColor = C.iceHp1;
          if (cellData.hp >= 2) iceColor = C.iceHp2;
          if (cellData.hp >= 3) iceColor = C.iceHp3;

          if (cellData.animState === 'hit') {
            var shake = 3;
            var sx = rect.x + (Math.random() - 0.5) * shake * 2;
            var sy = rect.y + (Math.random() - 0.5) * shake * 2;
            draw.drawRoundRect(ctx, sx, sy, rect.w, rect.h, 10, iceColor);
          } else {
            draw.drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, iceColor);
          }
          draw.drawText(ctx, '' + cellData.hp, cx_c, cy_c, 20, '#ffffff', 'center', true);
        } else if (cellData.type === 'portal') {
          draw.drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, C.cardBg);
          ctx.strokeStyle = C.accentColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx_c, cy_c, rect.w / 3, 0, Math.PI * 2);
          ctx.stroke();
          draw.drawText(ctx, '🌀', cx_c, cy_c, 16, C.accentColor, 'center');
        } else if (cellData.type === 'mirror') {
          draw.drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, C.cardBg);
          ctx.strokeStyle = C.textSub;
          ctx.lineWidth = 3;
          ctx.beginPath();
          if (cellData.mirrorDir === '/') {
            ctx.moveTo(rect.x + 4, rect.y + rect.h - 4);
            ctx.lineTo(rect.x + rect.w - 4, rect.y + 4);
          } else {
            ctx.moveTo(rect.x + 4, rect.y + 4);
            ctx.lineTo(rect.x + rect.w - 4, rect.y + rect.h - 4);
          }
          ctx.stroke();
        } else if (cellData.type === 'bomb') {
          draw.drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, '#603030');
          draw.drawText(ctx, '💣', cx_c, cy_c, 16, '#ffffff', 'center');
        }

        if (cellData.type !== 'void') {
          cellRects.push({ r: r, c: c, rect: rect });
        }
      }
    }

    G.btnRects.cellRects = cellRects;

    y = G.gameBoardOffsetY + bs.h + 15;
  }

  var dirSize = 50;
  var dirGap = 10;
  var dirCenterX = cx;
  var dirCenterY = y + dirSize + dirGap / 2;

  var dirs = [
    { label: '↑', dr: -1, dc: 0 },
    { label: '←', dr: 0, dc: -1 },
    { label: '↓', dr: 1, dc: 0 },
    { label: '→', dr: 0, dc: 1 }
  ];

  var dirPositions = [
    { x: dirCenterX, y: dirCenterY - dirSize - dirGap },
    { x: dirCenterX - dirSize - dirGap, y: dirCenterY },
    { x: dirCenterX, y: dirCenterY + dirSize + dirGap },
    { x: dirCenterX + dirSize + dirGap, y: dirCenterY }
  ];

  for (var di = 0; di < dirs.length; di++) {
    var d = dirs[di];
    var dp = dirPositions[di];
    var disabled = G.isAnimating || !game.hasValidMove(d.dr, d.dc);
    var color = disabled ? C.btnDisabled : C.cardBg;
    var textColor = disabled ? C.btnDisabledText : C.textMain;
    draw.drawCircle(ctx, dp.x + dirSize / 2, dp.y + dirSize / 2, dirSize / 2, color);
    draw.drawText(ctx, d.label, dp.x + dirSize / 2, dp.y + dirSize / 2, 20, textColor, 'center');
    if (!disabled) {
      G.btnRects['dir_' + di] = {
        x: dp.x, y: dp.y, w: dirSize, h: dirSize,
        action: (function(dr, dc) { return function() { game.move(dr, dc); }; })(d.dr, d.dc)
      };
    }
  }

  y = dirCenterY + dirSize + dirGap + 20;

  var sysBtnW = (W - 50) / 3;
  var sysBtnH = 44;
  var sysBtnY = y;
  var sysBtnGap = 10;

  var sysBtns = [
    { label: '🔄 重开', x: 15, action: function() { game.resetCurrentLevel(); }, disabled: G.isAnimating },
    { label: '↩️ 撤销', x: 15 + sysBtnW + sysBtnGap, action: function() { game.undoMove(); }, disabled: G.isAnimating || G.historyStack.length === 0 },
    { label: G.isHintVisible ? '隐藏' : '💡 提示', x: 15 + (sysBtnW + sysBtnGap) * 2, action: function() { game.toggleHint(); }, disabled: false }
  ];

  for (var si = 0; si < sysBtns.length; si++) {
    var sb = sysBtns[si];
    var sColor = sb.disabled ? C.btnDisabled : (si === 2 ? (G.isHintVisible ? C.accentColor : C.cellNumber) : C.cellEmpty);
    var sTextColor = sb.disabled ? C.btnDisabledText : (si === 2 ? '#ffffff' : C.textMain);
    draw.drawRoundRect(ctx, sb.x, sysBtnY, sysBtnW, sysBtnH, 20, sColor);
    draw.drawText(ctx, sb.label, sb.x + sysBtnW / 2, sysBtnY + sysBtnH / 2, 14, sTextColor, 'center', true);
    if (!sb.disabled) {
      G.btnRects['sys_' + si] = { x: sb.x, y: sysBtnY, w: sysBtnW, h: sysBtnH, action: sb.action };
    }
  }

  y = sysBtnY + sysBtnH + 20;

  if (G.moveCount > 0) {
    var moveText = '步数: ' + G.moveCount;
    if (G.undoCount > 0) moveText += '  撤销: ' + G.undoCount;
    draw.drawText(ctx, moveText, cx, y, 12, C.textSub, 'center');
    y += 18;
  }

  if (G.messageText) {
    draw.drawText(ctx, G.messageText, cx, y, 18, G.messageColor, 'center', true);
    y += 30;
  }

  if (G.showNextBtn) {
    var nextBtnW = W - 40;
    var nextBtnH = 50;
    var nextBtnX = 20;
    var nextBtnY = y;
    draw.drawRoundRect(ctx, nextBtnX, nextBtnY, nextBtnW, nextBtnH, 25, C.cellFilled);
    var nextLabel = G.currentMode === 'endless' ? '继续' : (G.currentMode === 'daily' ? '完成' : (G.currentMode === 'editor-test' ? '返回编辑器' : '进入下一关'));
    draw.drawText(ctx, nextLabel, nextBtnX + nextBtnW / 2, nextBtnY + nextBtnH / 2, 16, '#ffffff', 'center', true);
    G.nextBtnRect = { x: nextBtnX, y: nextBtnY, w: nextBtnW, h: nextBtnH };
    G.btnRects.nextBtn = G.nextBtnRect;
  } else {
    G.nextBtnRect = null;
  }

  if (G.isHintVisible) {
    y = (G.nextBtnRect ? G.nextBtnRect.y + G.nextBtnRect.h + 15 : y) + 5;
    var hintW = W - 40;
    var hintX = 20;
    draw.drawShadowBox(ctx, hintX, y, hintW, G.currentSolution.length * 36 + 20, C.radiusMd, C.cardBg);

    for (var hi = 0; hi < G.currentSolution.length; hi++) {
      var step = G.currentSolution[hi];
      var hy = y + 15 + hi * 36;
      draw.drawCircle(ctx, hintX + 20, hy + 10, 10, C.accentColor);
      draw.drawText(ctx, '' + (hi + 1), hintX + 20, hy + 10, 11, '#ffffff', 'center', true);
      draw.drawText(ctx, '数字 ' + step.val + '  →  ' + G.dirMapText[step.dir], hintX + 50, hy + 10, 13, C.textMain, 'left');
    }
  }

  particles.update();
  particles.render(ctx);

  if (G.clearSummary) {
    drawClearSummary(ctx, W, H);
  }
}

function drawClearSummary(ctx, W, H) {
  var s = G.clearSummary;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);

  var panelW = W - 50;
  var panelH = 320;
  var panelX = 25;
  var panelY = (H - panelH) / 2;
  draw.drawShadowBox(ctx, panelX, panelY, panelW, panelH, C.radiusLg, C.cardBg);

  var cx = W / 2;
  var y = panelY + 36;
  draw.drawText(ctx, '🎉 通关！', cx, y, 24, C.textMain, 'center', true);
  y += 40;

  var starText = rating.showStars(s.stars);
  draw.drawText(ctx, starText, cx, y, 28, '#ffd700', 'center', true);
  y += 36;

  var timeSec = Math.max(1, Math.round(s.clearTime / 1000));
  draw.drawText(ctx, '步数 ' + s.moveCount + ' / 最优 ' + s.optimalMoves, cx, y, 14, C.textSub, 'center');
  y += 22;
  draw.drawText(ctx, '用时 ' + timeSec + ' 秒', cx, y, 14, C.textSub, 'center');
  if (s.undoCount > 0) {
    y += 22;
    draw.drawText(ctx, '撤销 ' + s.undoCount + ' 次', cx, y, 13, C.textSub, 'center');
  }

  y = panelY + panelH - 130;
  var btnW = panelW - 40;
  var btnH = 44;
  var btnX = panelX + 20;
  var nextLabel = G.currentMode === 'daily' ? '完成' : '下一关';

  draw.drawRoundRect(ctx, btnX, y, btnW, btnH, 22, C.cellFilled);
  draw.drawText(ctx, nextLabel, btnX + btnW / 2, y + btnH / 2, 16, '#ffffff', 'center', true);
  G.btnRects.summaryNext = { x: btnX, y: y, w: btnW, h: btnH };

  y += btnH + 10;
  var halfW = (btnW - 10) / 2;
  draw.drawRoundRect(ctx, btnX, y, halfW, btnH, 22, C.cellNumber);
  draw.drawText(ctx, '📤 分享', btnX + halfW / 2, y + btnH / 2, 14, '#ffffff', 'center', true);
  G.btnRects.summaryShare = { x: btnX, y: y, w: halfW, h: btnH };

  var homeX = btnX + halfW + 10;
  draw.drawRoundRect(ctx, homeX, y, halfW, btnH, 22, C.cellEmpty);
  draw.drawText(ctx, '🏠 主页', homeX + halfW / 2, y + btnH / 2, 14, C.textMain, 'center', true);
  G.btnRects.summaryHome = { x: homeX, y: y, w: halfW, h: btnH };
}

module.exports = {
  drawGameScreen: drawGameScreen
};
