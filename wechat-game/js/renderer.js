var G = GameGlobal;
var draw = require('./draw.js');
var game = require('./game.js');
var C = G.CONFIG;

function calcCellSize() {
  var maxBoardW = Math.min(G.W - 30, 350);
  var maxBoardH = Math.min(G.H * 0.45, 350);
  var cellW = Math.floor((maxBoardW - C.gap * (G.COLS + 1)) / G.COLS);
  var cellH = Math.floor((maxBoardH - C.gap * (G.ROWS + 1)) / G.ROWS);
  return Math.min(cellW, cellH, 40);
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

  ctx.fillStyle = C.bgColor;
  ctx.fillRect(0, 0, W, H);

  var y = 20;
  var cx = W / 2;

  var homeBtnX = 15;
  var homeBtnY = y;
  var homeBtnR = 18;
  draw.drawCircle(ctx, homeBtnX + homeBtnR, homeBtnY + homeBtnR, homeBtnR, C.cellEmpty);
  draw.drawText(ctx, '🏠', homeBtnX + homeBtnR, homeBtnY + homeBtnR, 20, C.textMain, 'center');
  G.btnRects.homeBtn = { x: homeBtnX, y: homeBtnY, w: homeBtnR * 2, h: homeBtnR * 2 };

  var titleText = G.currentMode === 'tutorial' ? G.tutorials[G.levelIndex].title :
    (G.currentMode === 'adv-tutorial' ? G.advTutorials[G.levelIndex].title :
      (G.currentMode === 'advanced' ? '正式关卡' : '普通关卡'));
  draw.drawText(ctx, titleText, cx, y + homeBtnR, 18, C.textMain, 'center', true);

  if (G.difficulty) {
    var badgeW = draw.measureText(ctx, G.difficulty, 11) + 16;
    var badgeH = 22;
    var badgeX = cx + draw.measureText(ctx, titleText, 18) / 2 + 10;
    var badgeY = y + homeBtnR - badgeH / 2;
    draw.drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8, G.difficultyColor);
    draw.drawText(ctx, G.difficulty, badgeX + badgeW / 2, badgeY + badgeH / 2, 11, '#ffffff', 'center', true);
  }

  y += homeBtnR * 2 + 10;

  if (G.currentMode === 'tutorial' || G.currentMode === 'adv-tutorial') {
    var tData = G.currentMode === 'tutorial' ? G.tutorials[G.levelIndex] : G.advTutorials[G.levelIndex];
    var lines = draw.wrapText(ctx, tData.text, W - 40, 18, 14);
    for (var li = 0; li < lines.length; li++) {
      draw.drawText(ctx, lines[li], cx, y, 14, C.textSub, 'center');
      y += 20;
    }
    y += 5;
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
          if (G.selectedCell && G.selectedCell.r === r && G.selectedCell.c === c) {
            draw.drawRoundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10, C.cellNumber);
            ctx.globalAlpha = 0.5;
            draw.drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, C.textMain);
            ctx.globalAlpha = 1;
          } else {
            draw.drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, C.cellNumber);
          }
          draw.drawText(ctx, '' + cellData.value, cx_c, cy_c, 20, C.cellNumberText, 'center', true);
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
    draw.drawText(ctx, '进入下一关', nextBtnX + nextBtnW / 2, nextBtnY + nextBtnH / 2, 16, '#ffffff', 'center', true);
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
}

module.exports = {
  drawGameScreen: drawGameScreen
};
