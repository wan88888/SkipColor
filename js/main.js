var G = GameGlobal;
var screens = require('./screens.js');
var renderer = require('./renderer.js');
var game = require('./game.js');
var editor = require('./editor.js');
var achievements = require('./achievements.js');
var levelpack = require('./levelpack.js');
var scroll = require('./scroll.js');
var C = G.CONFIG;

function resetScreenScroll(screen) {
  scroll.reset(screen);
}

function handleScrollableTouchStart(tx, ty, screen, handler) {
  G._scrollTouch = { startX: tx, startY: ty, lastY: ty, moved: false, screen: screen };
  G._pendingMenuAction = null;
  for (var i = 0; i < G.screenButtons.length; i++) {
    var btn = scroll.adjustButtonY(screen, G.screenButtons[i]);
    if (hitTest(tx, ty, btn)) {
      G._pendingMenuAction = btn.action;
      return;
    }
  }
}

function handleScrollableTouchMove(ty) {
  if (!G._scrollTouch) return;
  if (!G._scrollTouch.moved && Math.abs(G._scrollTouch.startY - ty) > 8) {
    G._scrollTouch.moved = true;
    G._pendingMenuAction = null;
  }
  if (G._scrollTouch.moved) {
    var dy = G._scrollTouch.lastY - ty;
    scroll.applyScroll(G._scrollTouch.screen, dy);
    G._scrollTouch.lastY = ty;
  }
}

function handleScrollableTouchEnd(handler) {
  if (G._scrollTouch && !G._scrollTouch.moved && G._pendingMenuAction) {
    handler(G._pendingMenuAction);
  }
  G._scrollTouch = null;
  G._pendingMenuAction = null;
}

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

  if (G.currentScreen === 'game') {
    handleGameTouch(tx, ty);
    return;
  }

  if (G.currentScreen === 'home') {
    handleScrollableTouchStart(tx, ty, 'home', handleHomeAction);
  } else if (G.currentScreen === 'achievements') {
    handleScrollableTouchStart(tx, ty, 'achievements', handleAchievementsAction);
  } else if (G.currentScreen === 'adv-modes') {
    handleMenuTouch(tx, ty, handleAdvModesAction);
  } else if (G.currentScreen === 'adv-ice-menu') {
    handleMenuTouch(tx, ty, handleIceMenuAction);
  } else if (G.currentScreen === 'themes') {
    handleMenuTouch(tx, ty, handleThemesAction);
  } else if (G.currentScreen === 'leaderboard') {
    handleMenuTouch(tx, ty, handleLeaderboardAction);
  } else if (G.currentScreen === 'editor') {
    handleEditorTouch(tx, ty);
  } else if (G.currentScreen === 'coming-soon') {
    handleMenuTouch(tx, ty, handleComingSoonAction);
  }
}

function handleTouchMove(e) {
  if (!G._scrollTouch) return;
  var touch = e.touches[0];
  var ty = touch.clientY * G.touchScaleY;
  handleScrollableTouchMove(ty);
}

function handleTouchEnd(e) {
  if (G.currentScreen === 'home' && G._scrollTouch) {
    handleScrollableTouchEnd(handleHomeAction);
  } else if (G.currentScreen === 'achievements' && G._scrollTouch) {
    handleScrollableTouchEnd(handleAchievementsAction);
  }
}

function handleEditorTouch(tx, ty) {
  for (var i = 0; i < G.screenButtons.length; i++) {
    var btn = G.screenButtons[i];
    if (hitTest(tx, ty, btn)) {
      handleEditorAction(btn.action);
      return;
    }
  }

  if (G.editorCellRects) {
    for (var j = 0; j < G.editorCellRects.length; j++) {
      var cr = G.editorCellRects[j];
      if (hitTest(tx, ty, cr)) {
        editor.setCell(cr.r, cr.c);
        return;
      }
    }
  }
}

function handleGameTouch(tx, ty) {
  if (G.clearSummary && G.btnRects.summaryNext && hitTest(tx, ty, G.btnRects.summaryNext)) {
    game.nextLevel();
    return;
  }
  if (G.clearSummary && G.btnRects.summaryShare && hitTest(tx, ty, G.btnRects.summaryShare)) {
    game.prepareShareFromSummary();
    return;
  }
  if (G.clearSummary && G.btnRects.summaryHome && hitTest(tx, ty, G.btnRects.summaryHome)) {
    G.clearSummary = null;
    G.currentScreen = 'home';
    G.markDirty();
    return;
  }
  if (G.clearSummary) return;

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

  for (var key2 in G.btnRects) {
    if (key2.indexOf('sys_') === 0 && G.btnRects[key2].action) {
      if (hitTest(tx, ty, G.btnRects[key2])) {
        G.btnRects[key2].action();
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
    case 'startDaily': game.startGame('daily'); break;
    case 'startEndless': game.startGame('endless'); break;
    case 'goAchievements':
      resetScreenScroll('achievements');
      G.currentScreen = 'achievements';
      G.markDirty();
      break;
    case 'goThemes': G.currentScreen = 'themes'; G.markDirty(); break;
    case 'goLeaderboard': G.currentScreen = 'leaderboard'; G.markDirty(); break;
    case 'goEditor':
      editor.init(6, 7);
      break;
    case 'clearData': game.clearData(); break;
    case 'toggleSound': game.toggleSound(); break;
    case 'toggleVibration': game.toggleVibration(); break;
    case 'toggleParticle': game.toggleParticle(); break;
  }
}

function startAdvMechanic(mech) {
  if (!G.playerStats.mechTutorialCleared) G.playerStats.mechTutorialCleared = {};
  if (!G.playerStats.mechTutorialCleared[mech]) {
    game.startMechTutorial(mech);
  } else {
    game.startAdvancedMode(mech);
  }
}

function handleAdvModesAction(action) {
  switch (action) {
    case 'goIceMenu': G.currentScreen = 'adv-ice-menu'; G.markDirty(); break;
    case 'startPortalMode': startAdvMechanic('portal'); break;
    case 'startMirrorMode': startAdvMechanic('mirror'); break;
    case 'startBombMode': startAdvMechanic('bomb'); break;
    case 'startStarMode': startAdvMechanic('star'); break;
    case 'goHome':
      G.currentScreen = 'home';
      resetScreenScroll('home');
      G.markDirty();
      break;
  }
}

function handleIceMenuAction(action) {
  switch (action) {
    case 'startAdvTutorial': game.startGame('adv-tutorial'); break;
    case 'startAdvanced': game.startGame('advanced'); break;
    case 'goAdvModes': G.currentScreen = 'adv-modes'; G.markDirty(); break;
  }
}

function handleAchievementsAction(action) {
  switch (action) {
    case 'goHome':
      resetScreenScroll('home');
      G.currentScreen = 'home';
      G.markDirty();
      break;
  }
}

function handleThemesAction(action) {
  if (action === 'goHome') {
    G.currentScreen = 'home';
    G.markDirty();
    return;
  }

  if (action.indexOf('theme_') === 0) {
    var themeName = action.substring(6);
    if (G.playerStats.unlockedThemes.indexOf(themeName) !== -1) {
      G.applyTheme(themeName);
      G.storage.saveTheme(themeName);
    }
  }
}

function handleLeaderboardAction(action) {
  switch (action) {
    case 'goHome':
      G.currentScreen = 'home';
      G.markDirty();
      break;
    case 'refreshLeaderboard':
      G._leaderboardData = null;
      G._leaderboardLoading = false;
      G.markDirty();
      break;
  }
}

function handleEditorAction(action) {
  if (action === 'goHome') {
    G.currentScreen = 'home';
    G.markDirty();
    return;
  }

  if (action.indexOf('tool_') === 0) {
    var toolId = action.substring(5);
    editor.setTool(toolId);
    return;
  }

  switch (action) {
    case 'editor_test': editor.playTest(); break;
    case 'editor_share': editor.shareLevel(); break;
    case 'editor_import': editor.importLevel(); break;
  }
}

function handleComingSoonAction(action) {
  switch (action) {
    case 'goAdvModes': G.currentScreen = 'adv-modes'; G.markDirty(); break;
  }
}

function checkThemeUnlocks() {
  var s = G.playerStats;
  var totalCleared = s.lifetimeNormalCleared + s.lifetimeAdvCleared;
  var changed = false;

  if (totalCleared >= 10 && s.unlockedThemes.indexOf('spring') === -1) {
    s.unlockedThemes.push('spring');
    changed = true;
    wx.showToast({ title: '🎨 解锁主题：春日', icon: 'none' });
  }
  if (s.totalStars >= 30 && s.unlockedThemes.indexOf('ocean') === -1) {
    s.unlockedThemes.push('ocean');
    changed = true;
    wx.showToast({ title: '🎨 解锁主题：深海', icon: 'none' });
  }
  if (s.endlessHighScore >= 50 && s.unlockedThemes.indexOf('lava') === -1) {
    s.unlockedThemes.push('lava');
    changed = true;
    wx.showToast({ title: '🎨 解锁主题：熔岩', icon: 'none' });
  }

  if (changed) {
    G.storage.saveStats(G.playerStats);
  }

  achievements.check({});
}

G.checkThemeUnlocks = checkThemeUnlocks;

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
    case 'achievements':
      screens.screenAchievements.draw();
      break;
    case 'themes':
      screens.screenThemes.draw();
      break;
    case 'leaderboard':
      screens.screenLeaderboard.draw();
      break;
    case 'editor':
      screens.screenEditor.draw();
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
  wx.onTouchMove(handleTouchMove);
  wx.onTouchEnd(handleTouchEnd);

  wx.onShareAppMessage(function() {
    if (G._pendingShare && G._shareTitle) {
      G._pendingShare = false;
      return { title: G._shareTitle, imageUrl: '' };
    }
    var total = G.playerStats.lifetimeNormalCleared + G.playerStats.lifetimeAdvCleared;
    return {
      title: '我在「跳跃填色」已通关 ' + total + ' 关，获得 ' + G.playerStats.totalStars + ' 颗星，快来挑战吧！',
      imageUrl: ''
    };
  });

  game.initApp();
  gameLoop();
}

module.exports = {
  start: start
};
