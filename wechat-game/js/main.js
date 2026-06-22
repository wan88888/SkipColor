var G = GameGlobal;
var screens = require('./screens.js');
var renderer = require('./renderer.js');
var game = require('./game.js');

function hitTest(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function handleTouchStart(e) {
  var touch = e.touches[0];
  var tx = touch.clientX;
  var ty = touch.clientY;

  if (G.currentScreen === 'home') {
    for (var i = 0; i < G.screenButtons.length; i++) {
      var btn = G.screenButtons[i];
      if (hitTest(tx, ty, btn)) {
        handleHomeAction(btn.action);
        return;
      }
    }
  } else if (G.currentScreen === 'adv-modes') {
    for (var i = 0; i < G.screenButtons.length; i++) {
      var btn = G.screenButtons[i];
      if (hitTest(tx, ty, btn)) {
        handleAdvModesAction(btn.action);
        return;
      }
    }
  } else if (G.currentScreen === 'adv-ice-menu') {
    for (var i = 0; i < G.screenButtons.length; i++) {
      var btn = G.screenButtons[i];
      if (hitTest(tx, ty, btn)) {
        handleIceMenuAction(btn.action);
        return;
      }
    }
  } else if (G.currentScreen === 'coming-soon') {
    for (var i = 0; i < G.screenButtons.length; i++) {
      var btn = G.screenButtons[i];
      if (hitTest(tx, ty, btn)) {
        handleComingSoonAction(btn.action);
        return;
      }
    }
  } else if (G.currentScreen === 'game') {
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
}

function handleHomeAction(action) {
  switch (action) {
    case 'startTutorial': game.startGame('tutorial'); break;
    case 'startNormal': game.startGame('normal'); break;
    case 'goAdvModes': G.currentScreen = 'adv-modes'; break;
    case 'clearData': game.clearData(); break;
  }
}

function handleAdvModesAction(action) {
  switch (action) {
    case 'goIceMenu': G.currentScreen = 'adv-ice-menu'; break;
    case 'goComingSoon': G.currentScreen = 'coming-soon'; break;
    case 'goHome': G.currentScreen = 'home'; break;
  }
}

function handleIceMenuAction(action) {
  switch (action) {
    case 'startAdvTutorial': game.startGame('adv-tutorial'); break;
    case 'startAdvanced': game.startGame('advanced'); break;
    case 'goAdvModes': G.currentScreen = 'adv-modes'; break;
  }
}

function handleComingSoonAction(action) {
  switch (action) {
    case 'goAdvModes': G.currentScreen = 'adv-modes'; break;
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
  render();
  requestAnimationFrame(gameLoop);
}

function start() {
  wx.onTouchStart(handleTouchStart);
  game.initApp();
  gameLoop();
}

module.exports = {
  start: start
};
