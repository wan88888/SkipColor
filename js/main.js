var G = GameGlobal;
var screens = require('./screens.js');
var renderer = require('./renderer.js');
var game = require('./game.js');

function hitTest(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function handleMenuTouch(tx, ty, handler) {
  for (var i = 0; i < G.screenButtons.length; i++) {
    var btn = G.screenButtons[i];
    if (hitTest(tx, ty, btn)) {
      handler(btn.action);
      return true;
    }
  }
  return false;
}

function handleTouchStart(e) {
  var touch = e.touches[0];
  var tx = touch.clientX * G.touchScaleX;
  var ty = touch.clientY * G.touchScaleY;

  if (G.currentScreen === 'home') {
    handleMenuTouch(tx, ty, handleHomeAction);
  } else if (G.currentScreen === 'adv-modes') {
    handleMenuTouch(tx, ty, handleAdvModesAction);
  } else if (G.currentScreen === 'adv-ice-menu') {
    handleMenuTouch(tx, ty, handleIceMenuAction);
  } else if (G.currentScreen === 'coming-soon') {
    handleMenuTouch(tx, ty, handleComingSoonAction);
  } else if (G.currentScreen === 'game') {
    handleGameTouch(tx, ty);
  }
}

function handleGameTouch(tx, ty) {
  if (G.btnRects.homeBtn && hitTest(tx, ty, G.btnRects.homeBtn)) {
    game.goHome();
    return;
  }

  if (G.btnRects.nextBtn && hitTest(tx, ty, G.btnRects.nextBtn)) {
    game.nextLevel();
    return;
  }

  for (var key in G.btnRects) {
    if (key.indexOf('dir_') === 0 && G.btnRects[key].action) {
      if (hitTest(tx, ty, G.btnRects[key])) {
        G.btnRects[key].action();
        return;
      }
    }
  }

  for (var key in G.btnRects) {
    if (key.indexOf('sys_') === 0 && G.btnRects[key].action) {
      if (hitTest(tx, ty, G.btnRects[key])) {
        G.btnRects[key].action();
        return;
      }
    }
  }

  if (G.btnRects.cellRects) {
    for (var i = 0; i < G.btnRects.cellRects.length; i++) {
      var cr = G.btnRects.cellRects[i];
      if (hitTest(tx, ty, cr.rect)) {
        var cellData = G.gridData[cr.r][cr.c];
        if (cellData.type === 'number' && !cellData.used && !G.isAnimating) {
          game.selectCell(cr.r, cr.c);
        }
        return;
      }
    }
  }
}

function handleHomeAction(action) {
  switch (action) {
    case 'startTutorial': game.startGame('tutorial'); break;
    case 'startNormal': game.startGame('normal'); break;
    case 'goAdvModes': G.currentScreen = 'adv-modes'; G.markDirty(); break;
    case 'clearData': game.clearData(); break;
    case 'toggleSound': game.toggleSound(); break;
  }
}

function handleAdvModesAction(action) {
  switch (action) {
    case 'goIceMenu': G.currentScreen = 'adv-ice-menu'; G.markDirty(); break;
    case 'goComingSoon': G.currentScreen = 'coming-soon'; G.markDirty(); break;
    case 'goHome': G.currentScreen = 'home'; G.markDirty(); break;
  }
}

function handleIceMenuAction(action) {
  switch (action) {
    case 'startAdvTutorial': game.startGame('adv-tutorial'); break;
    case 'startAdvanced': game.startGame('advanced'); break;
    case 'goAdvModes': G.currentScreen = 'adv-modes'; G.markDirty(); break;
  }
}

function handleComingSoonAction(action) {
  switch (action) {
    case 'goAdvModes': G.currentScreen = 'adv-modes'; G.markDirty(); break;
  }
}

function render() {
  G.btnRects = {};

  switch (G.currentScreen) {
    case 'home':
      screens.screenHome.draw();
      break;
    case 'adv-modes':
      screens.screenAdvModes.draw();
      break;
    case 'adv-ice-menu':
      screens.screenIceMenu.draw();
      break;
    case 'coming-soon':
      screens.screenComingSoon.draw();
      break;
    case 'game':
      renderer.drawGameScreen();
      break;
  }
}

function gameLoop() {
  if (G.needsRedraw) {
    render();
    G.needsRedraw = false;
  }
  requestAnimationFrame(gameLoop);
}

function start() {
  wx.onTouchStart(handleTouchStart);

  wx.onShareAppMessage(function() {
    var total = G.playerStats.normalClearedCount + G.playerStats.advClearedCount;
    return {
      title: '我在「跳跃填色」今天已通关 ' + total + ' 关，快来挑战吧！',
      imageUrl: ''
    };
  });

  game.initApp();
  gameLoop();
}

module.exports = {
  start: start
};
