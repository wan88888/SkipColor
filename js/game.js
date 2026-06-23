var G = GameGlobal;
var C = G.CONFIG;
var level = require('./level.js');
var audio = require('./audio.js');
var particles = require('./particles.js');
var achievements = require('./achievements.js');
var rating = require('./rating.js');
var hint = require('./hint.js');
var daily = require('./daily.js');
var endless = require('./endless.js');
var adaptive = require('./adaptive.js');
var leaderboard = require('./leaderboard.js');

function initApp() {
  var savedStats = G.storage.get();
  if (savedStats) {
    for (var k in savedStats) {
      G.playerStats[k] = savedStats[k];
    }
  }
  var savedSettings = G.storage.getSettings();
  if (savedSettings) {
    for (var k2 in savedSettings) {
      G.settings[k2] = savedSettings[k2];
    }
  }
  applyAudioSettings();

  var savedTheme = G.storage.getTheme();
  if (savedTheme && G.THEMES[savedTheme] && G.playerStats.unlockedThemes.indexOf(savedTheme) !== -1) {
    G.currentTheme = savedTheme;
  }
  G.applyTheme(G.currentTheme);

  var today = new Date().toDateString();
  if (G.playerStats.lastDate !== today) {
    G.playerStats.lastDate = today;
    G.playerStats.normalClearedCount = 0;
    G.playerStats.advClearedCount = 0;
    G.storage.saveStats(G.playerStats);
  }

  G.currentScreen = 'home';
  G.markDirty();
}

function applyAudioSettings() {
  audio.setEnabled(G.settings.soundEnabled);
}

function clearData() {
  wx.showModal({
    title: '⚠️ 确定要清除所有游戏进度吗？',
    content: '清除后您的通关记录、成就、星级将归零，并需要重新完成教学关卡。',
    success: function(res) {
      if (res.confirm) {
        G.playerStats = {
          tutorialCleared: false,
          normalClearedCount: 0,
          advTutorialCleared: false,
          advClearedCount: 0,
          lastDate: new Date().toDateString(),
          totalStars: 0,
          totalIceBroken: 0,
          perfectStreak: 0,
          endlessHighScore: 0,
          dailyClearedCount: 0,
          unlockedThemes: ['default'],
          achievements: {}
        };
        G.storage.saveStats(G.playerStats);
        G.currentTheme = 'default';
        G.storage.saveTheme('default');
        G.applyTheme('default');
        G.markDirty();
      }
    }
  });
}

function goHome() {
  if (G.currentScreen !== 'game' && G.currentScreen !== 'editor') {
    G.currentScreen = 'home';
    G.markDirty();
    return;
  }

  if (G.isAnimating) {
    wx.showModal({
      title: '动画进行中',
      content: '请等待当前操作完成后再返回主页。',
      showCancel: false
    });
    return;
  }

  if (G.currentMode === 'endless') {
    endless.stopTimer();
  }

  if (G.historyStack.length > 0 || G.showNextBtn) {
    wx.showModal({
      title: '返回主页',
      content: '您的当前关卡进度将无法保存。',
      success: function(res) {
        if (res.confirm) {
          G.currentScreen = 'home';
          G.markDirty();
        }
      }
    });
    return;
  }

  G.currentScreen = 'home';
  G.markDirty();
}

function startGame(mode) {
  G.currentMode = mode;
  G.levelIndex = 0;
  G.moveCount = 0;
  G.undoCount = 0;
  G.hintLevel = 0;
  hint.resetHintLevel();

  if (mode === 'normal') {
    G.currentLevelNum = G.playerStats.normalClearedCount + 1;
  } else if (mode === 'advanced') {
    G.currentLevelNum = G.playerStats.advClearedCount + 1;
  } else if (mode === 'daily') {
    daily.generateDailyPuzzle();
    G.currentSolution = [];
    G.isAnimating = false;
    G.showNextBtn = false;
    G.messageText = '';
    G.historyStack = [];
    G.selectedCell = null;
    G.isHintVisible = false;
    G.hintLevel = 0;
    hint.resetHintLevel();
    G.currentScreen = 'game';
    G.levelStartTime = Date.now();
    G.markDirty();
    return;
  } else if (mode === 'endless') {
    endless.start();
    G.currentScreen = 'game';
    G.markDirty();
    return;
  } else {
    G.currentLevelNum = 0;
  }
  G.currentScreen = 'game';
  loadLevel();
}

function loadLevel() {
  G.isHintVisible = false;
  G.historyStack = [];
  G.isAnimating = false;
  G.showNextBtn = false;
  G.messageText = '';
  G.difficulty = '';
  G.moveCount = 0;
  G.undoCount = 0;
  G.hintLevel = 0;
  hint.resetHintLevel();
  G.levelStartTime = Date.now();

  if (G.currentMode === 'tutorial') {
    var tData = G.tutorials[G.levelIndex];
    G.currentSolution = tData.solution.map(function(s) {
      return { r: s.r, c: s.c, val: s.val, dir: s.dir };
    });
    level.loadGridData(tData.matrix);
  } else if (G.currentMode === 'adv-tutorial') {
    var tData2 = G.advTutorials[G.levelIndex];
    G.currentSolution = tData2.solution.map(function(s) {
      return { r: s.r, c: s.c, val: s.val, dir: s.dir };
    });
    level.loadGridData(tData2.matrix);
  } else {
    if (G.currentMode === 'normal') {
      G.currentLevelNum = G.playerStats.normalClearedCount + 1;
    } else if (G.currentMode === 'advanced') {
      G.currentLevelNum = G.playerStats.advClearedCount + 1;
    }
    var baseDiff = G.currentMode === 'advanced' ? 3 : 2;
    var adjDiff = adaptive.getAdjustedDifficulty(baseDiff);
    level.generateRandom(adjDiff);
  }
  G.markDirty();
}

function nextLevel() {
  if (G.isAnimating) return;
  G.showNextBtn = false;
  G.isAnimating = true;
  G.markDirty();

  if (G.currentMode === 'tutorial') {
    G.levelIndex++;
    if (G.levelIndex >= G.tutorials.length) {
      G.playerStats.tutorialCleared = true;
      G.storage.saveStats(G.playerStats);
      audio.vibrateMedium();
      wx.showModal({
        title: '🎉 恭喜完成基础教学！',
        content: '已解锁普通关卡！',
        showCancel: false,
        success: function() {
          G.currentMode = 'normal';
          G.levelIndex = 0;
          loadLevel();
        }
      });
      return;
    }
  } else if (G.currentMode === 'adv-tutorial') {
    G.levelIndex++;
    if (G.levelIndex >= G.advTutorials.length) {
      G.playerStats.advTutorialCleared = true;
      G.storage.saveStats(G.playerStats);
      audio.vibrateMedium();
      wx.showModal({
        title: '🧊 恭喜完成冰块教学！',
        content: '已解锁正式关卡！',
        showCancel: false,
        success: function() {
          G.currentMode = 'advanced';
          G.levelIndex = 0;
          loadLevel();
        }
      });
      return;
    }
  } else if (G.currentMode === 'endless') {
    endless.onClear();
    return;
  } else if (G.currentMode === 'daily') {
    daily.markDailyCleared();
    achievements.check({ clearTime: Date.now() - G.levelStartTime });
    G.isAnimating = false;
    wx.showModal({
      title: '🎉 每日挑战完成！',
      content: '明天再来挑战新的关卡吧！',
      showCancel: false,
      success: function() {
        G.currentScreen = 'home';
        G.markDirty();
      }
    });
    return;
  } else if (G.currentMode === 'editor-test') {
    G.currentMode = 'editor';
    G.currentScreen = 'editor';
    G.isAnimating = false;
    G.markDirty();
    return;
  } else {
    var clearTime = Date.now() - G.levelStartTime;
    var stars = rating.calculateStars(
      G.currentMode,
      G.moveCount,
      rating.getOptimalMoves(G.currentSolution),
      G.undoCount,
      G.hintLevel
    );
    G.levelStars = stars;
    G.playerStats.totalStars += stars;

    if (G.undoCount === 0 && G.hintLevel === 0 && stars === 3) {
      G.playerStats.perfectStreak++;
    } else {
      G.playerStats.perfectStreak = 0;
    }

    if (G.currentMode === 'normal') G.playerStats.normalClearedCount++;
    if (G.currentMode === 'advanced') G.playerStats.advClearedCount++;

    adaptive.recordResult(true);
    achievements.check({ clearTime: clearTime });
    G.storage.saveStats(G.playerStats);
    leaderboard.init();
    if (G.checkThemeUnlocks) G.checkThemeUnlocks();

    var starText = rating.showStars(stars);
    wx.showToast({ title: starText, icon: 'none', duration: 1500 });
  }
  loadLevel();
}

function resetCurrentLevel() {
  if (G.isAnimating) return;
  G.gridData = G.cloneGrid(G.initialGridData);
  G.selectedCell = null;
  G.historyStack = [];
  G.moveCount = 0;
  G.undoCount = 0;
  G.messageText = '';
  G.showNextBtn = false;
  G.isHintVisible = false;
  G.hintLevel = 0;
  hint.resetHintLevel();
  audio.vibrateShort();
  G.markDirty();
}

function saveHistory() {
  G.historyStack.push({
    grid: G.cloneGrid(G.gridData),
    selectedCell: G.selectedCell ? { r: G.selectedCell.r, c: G.selectedCell.c } : null
  });
}

function undoMove() {
  if (G.isAnimating || G.historyStack.length === 0) return;
  var lastState = G.historyStack.pop();
  G.gridData = lastState.grid;
  G.selectedCell = lastState.selectedCell;
  G.messageText = '';
  G.undoCount++;
  audio.vibrateShort();
  G.markDirty();
}

function selectCell(r, c) {
  if (G.isAnimating || G.gridData[r][c].used) return;
  G.selectedCell = { r: r, c: c };
  audio.vibrateShort();
  G.markDirty();
}

function toggleHint() {
  if (G.isHintVisible) {
    G.isHintVisible = false;
  } else {
    hint.showHint();
    G.isHintVisible = true;
  }
  G.markDirty();
}

function toggleSound() {
  G.settings.soundEnabled = !G.settings.soundEnabled;
  G.storage.saveSettings(G.settings);
  applyAudioSettings();
  G.markDirty();
}

function toggleVibration() {
  G.settings.vibrationEnabled = !G.settings.vibrationEnabled;
  G.storage.saveSettings(G.settings);
  G.markDirty();
}

function toggleParticle() {
  G.settings.particleEnabled = !G.settings.particleEnabled;
  G.storage.saveSettings(G.settings);
  G.markDirty();
}

function hasValidMove(dr, dc) {
  if (!G.selectedCell) return false;
  var currR = G.selectedCell.r, currC = G.selectedCell.c;
  while (true) {
    currR += dr;
    currC += dc;
    if (currR < 0 || currR >= G.ROWS || currC < 0 || currC >= G.COLS) return false;
    var targetCell = G.gridData[currR][currC];
    if (targetCell.type === 'void') return false;
    if (targetCell.type === 'empty' || targetCell.type === 'ice' ||
        targetCell.type === 'portal' || targetCell.type === 'mirror' ||
        targetCell.type === 'bomb') return true;
  }
}

function anyValidMoveExists() {
  for (var r = 0; r < G.ROWS; r++) {
    for (var c = 0; c < G.COLS; c++) {
      var cell = G.gridData[r][c];
      if (cell.type === 'number' && !cell.used) {
        var origSelected = G.selectedCell;
        G.selectedCell = { r: r, c: c };
        var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        var found = false;
        for (var di = 0; di < dirs.length; di++) {
          if (hasValidMove(dirs[di][0], dirs[di][1])) {
            found = true;
            break;
          }
        }
        G.selectedCell = origSelected;
        if (found) return true;
      }
    }
  }
  return false;
}

function checkGameState() {
  var hasEmpty = false, hasUnusedNumbers = false;
  for (var r = 0; r < G.ROWS; r++) {
    for (var c = 0; c < G.COLS; c++) {
      var cell = G.gridData[r][c];
      if (cell.type === 'empty' || cell.type === 'ice') hasEmpty = true;
      if (cell.type === 'number' && !cell.used) hasUnusedNumbers = true;
    }
  }

  if (!hasEmpty) {
    G.messageText = '顺利通关！';
    G.messageColor = C.cellFilled;
    G.showNextBtn = true;
    if (G.isHintVisible) toggleHint();
    audio.play('win');
    audio.vibrateLong();
    particles.spawnCelebration();
    if (G.currentMode === 'endless') {
      G.isAnimating = true;
      setTimeout(function() {
        if (G.showNextBtn) {
          G.isAnimating = false;
          nextLevel();
        }
      }, 1500);
    }
  } else if (!hasUnusedNumbers) {
    G.messageText = '陷入死局，请重新开始';
    G.messageColor = C.accentColor;
    audio.vibrateLong();
    adaptive.recordResult(false);
  } else if (!anyValidMoveExists()) {
    G.messageText = '陷入死局，请重新开始';
    G.messageColor = C.accentColor;
    audio.vibrateLong();
    adaptive.recordResult(false);
  }
  G.markDirty();
}

function move(dr, dc) {
  if (!G.selectedCell || G.isAnimating) return;

  G.isAnimating = true;
  saveHistory();
  G.moveCount++;

  var r = G.selectedCell.r, c = G.selectedCell.c;
  var cell = G.gridData[r][c];
  var targetCount = cell.value;
  var filledCount = 0;
  var currR = r, currC = c;

  cell.used = true;
  G.selectedCell = null;
  audio.play('move');
  audio.vibrateShort();
  G.markDirty();

  doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount, dr, dc, 0);
}

function doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount, origDr, origDc, depth) {
  if (depth > 200) {
    G.isAnimating = false;
    checkGameState();
    return;
  }

  if (filledCount >= targetCount) {
    G.isAnimating = false;
    checkGameState();
    return;
  }

  currR += dr;
  currC += dc;

  if (currR < 0 || currR >= G.ROWS || currC < 0 || currC >= G.COLS) {
    G.isAnimating = false;
    checkGameState();
    return;
  }

  var targetCell = G.gridData[currR][currC];
  if (targetCell.type === 'void' || targetCell.type === 'filled' || targetCell.type === 'number') {
    doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount, origDr, origDc, depth + 1);
    return;
  }

  if (targetCell.type === 'portal') {
    var portalId = targetCell.portalId;
    var otherPortal = findOtherPortal(portalId, currR, currC);
    if (otherPortal) {
      var startPos = G.getCellCenter(currR, currC);
      var endPos = G.getCellCenter(otherPortal.r, otherPortal.c);
      particles.spawnBeamParticles(
        startPos.x, startPos.y,
        endPos.x, endPos.y,
        C.accentColor
      );
      doMoveAnimation(origDr, origDc, otherPortal.r, otherPortal.c, targetCount, filledCount, origDr, origDc, depth + 1);
      return;
    }
    G.isAnimating = false;
    checkGameState();
    return;
  }

  if (targetCell.type === 'mirror') {
    var newDr = dc, newDc = dr;
    if (targetCell.mirrorDir === '/') {
      newDr = -dc; newDc = -dr;
    }
    doMoveAnimation(newDr, newDc, currR, currC, targetCount, filledCount, newDr, newDc, depth + 1);
    return;
  }

  if (targetCell.type === 'bomb') {
    explodeBomb(currR, currC, targetCell.bombRadius || 1);
    filledCount++;
    G.markDirty();
    setTimeout(function() {
      doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount, origDr, origDc, depth + 1);
    }, C.animSpeed + 50);
    return;
  }

  if (targetCell.type === 'empty') {
    targetCell.type = 'filled';
    targetCell.animState = 'pop';
    if (targetCell.isStar) {
      collectStar(currR, currC);
    }
    filledCount++;
    var fillPos = G.getCellCenter(currR, currC);
    particles.spawnFillBurst(
      fillPos.x, fillPos.y,
      C.cellFilled
    );
    G.markDirty();
    setTimeout(function() {
      if (targetCell.animState === 'pop') targetCell.animState = null;
      G.markDirty();
      doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount, origDr, origDc, depth + 1);
    }, C.animSpeed);
    return;
  }

  if (targetCell.type === 'ice') {
    targetCell.hp--;
    targetCell.animState = 'hit';
    filledCount++;
    G.playerStats.totalIceBroken++;
    audio.play('ice');
    audio.vibrateMedium();
    var icePos = G.getCellCenter(currR, currC);
    particles.spawnIceBreak(icePos.x, icePos.y);
    G.markDirty();
    setTimeout(function() {
      targetCell.animState = null;
      if (targetCell.hp <= 0) {
        targetCell.type = 'empty';
        delete targetCell.hp;
      }
      G.markDirty();
      doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount, origDr, origDc, depth + 1);
    }, C.animSpeed + 80);
    return;
  }

  G.isAnimating = false;
  checkGameState();
}

function findOtherPortal(portalId, excludeR, excludeC) {
  for (var r = 0; r < G.ROWS; r++) {
    for (var c = 0; c < G.COLS; c++) {
      if (r === excludeR && c === excludeC) continue;
      var cell = G.gridData[r][c];
      if (cell.type === 'portal' && cell.portalId === portalId) {
        return { r: r, c: c };
      }
    }
  }
  return null;
}

function explodeBomb(r, c, radius) {
  var popCells = [];
  for (var dr = -radius; dr <= radius; dr++) {
    for (var dc = -radius; dc <= radius; dc++) {
      var nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= G.ROWS || nc < 0 || nc >= G.COLS) continue;
      var cell = G.gridData[nr][nc];
      if (nr === r && nc === c) {
        cell.type = 'filled';
        cell.animState = 'pop';
        popCells.push(cell);
        continue;
      }
      if (cell.type === 'ice') {
        cell.type = 'empty';
        delete cell.hp;
        var bp = G.getCellCenter(nr, nc);
        particles.spawnIceBreak(bp.x, bp.y);
      } else if (cell.type === 'empty' && !cell.isProtected) {
        cell.type = 'filled';
        cell.animState = 'pop';
        popCells.push(cell);
      }
    }
  }
  audio.play('ice');
  audio.vibrateLong();
  setTimeout(function() {
    for (var i = 0; i < popCells.length; i++) {
      if (popCells[i].animState === 'pop') popCells[i].animState = null;
    }
    G.markDirty();
  }, C.animSpeed);
}

function collectStar(r, c) {
  for (var i = 0; i < G.stars.length; i++) {
    if (G.stars[i].r === r && G.stars[i].c === c) {
      G.stars[i].collected = true;
      break;
    }
  }
  var sp = G.getCellCenter(r, c);
  particles.spawnFillBurst(sp.x, sp.y, '#ffd700');
  audio.play('win');
}

module.exports = {
  initApp: initApp,
  applyAudioSettings: applyAudioSettings,
  clearData: clearData,
  goHome: goHome,
  startGame: startGame,
  loadLevel: loadLevel,
  nextLevel: nextLevel,
  resetCurrentLevel: resetCurrentLevel,
  saveHistory: saveHistory,
  undoMove: undoMove,
  selectCell: selectCell,
  toggleHint: toggleHint,
  toggleSound: toggleSound,
  toggleVibration: toggleVibration,
  toggleParticle: toggleParticle,
  hasValidMove: hasValidMove,
  checkGameState: checkGameState,
  move: move
};
