var G = GameGlobal;
var C = G.CONFIG;
var level = require('./level.js');
var beam = require('./beam.js');
var levelpack = require('./levelpack.js');
var audio = require('./audio.js');
var particles = require('./particles.js');
var achievements = require('./achievements.js');
var rating = require('./rating.js');
var hint = require('./hint.js');
var daily = require('./daily.js');
var endless = require('./endless.js');
var adaptive = require('./adaptive.js');
var leaderboard = require('./leaderboard.js');
var share = require('./share.js');

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
    G.playerStats.todayNormalCleared = 0;
    G.playerStats.todayAdvCleared = 0;
    G.storage.saveStats(G.playerStats);
  }

  G.currentScreen = 'home';
  G.markDirty();
  share.captureLaunchQuery();
}

function refreshDailyStatsIfNeeded() {
  var today = new Date().toDateString();
  if (G.playerStats.lastDate !== today) {
    G.playerStats.lastDate = today;
    G.playerStats.todayNormalCleared = 0;
    G.playerStats.todayAdvCleared = 0;
    G.storage.saveStats(G.playerStats);
    G.markDirty();
  }
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
          lifetimeNormalCleared: 0,
          lifetimeAdvCleared: 0,
          todayNormalCleared: 0,
          todayAdvCleared: 0,
          advTutorialCleared: false,
          lastDate: new Date().toDateString(),
          totalStars: 0,
          totalIceBroken: 0,
          perfectStreak: 0,
          endlessHighScore: 0,
          dailyClearedCount: 0,
          unlockedThemes: ['default'],
          achievements: {},
          mechTutorialCleared: { portal: false, mirror: false, bomb: false, star: false }
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

  if (G.historyStack.length > 0 || G.showNextBtn || G.clearSummary) {
    wx.showModal({
      title: '返回主页',
      content: '您的当前关卡进度将无法保存。',
      success: function(res) {
        if (res.confirm) {
          G.clearSummary = null;
          G.currentScreen = 'home';
          G.markDirty();
        }
      }
    });
    return;
  }

  G.clearSummary = null;
  G.currentScreen = 'home';
  G.markDirty();
}

function startDailyChallenge(seed) {
  G.currentMode = 'daily';
  G.challengeLevelNum = null;
  G.dailyPracticeMode = daily.isDailyClearedToday();
  daily.generateDailyPuzzleFromSeed(seed);
  G.clearSummary = null;
  G.currentSolution = G.currentSolution || [];
  G.isAnimating = false;
  G.showNextBtn = false;
  G.messageText = '';
  G.historyStack = [];
  G.selectedCell = null;
  G.isHintVisible = false;
  G.hintLevel = 0;
  hint.resetHintLevel();
  G.moveCount = 0;
  G.undoCount = 0;
  G.levelStartTime = Date.now();
  G.currentScreen = 'game';
  G.markDirty();
}

function startLevelChallenge(mode, levelNum, mech) {
  G.challengeLevelNum = levelNum;
  G.dailyPracticeMode = false;
  G.moveCount = 0;
  G.undoCount = 0;
  G.hintLevel = 0;
  hint.resetHintLevel();

  if (mode === 'normal') {
    G.currentMode = 'normal';
    G.currentLevelNum = levelNum;
    G.currentScreen = 'game';
    loadLevel();
    return;
  }

  if (mode === 'advanced') {
    G.advMechanic = mech || 'portal';
    G.advModePreference = G.advMechanic;
    G.requireStars = G.advMechanic === 'star';
    G.currentMode = 'advanced';
    G.currentLevelNum = levelNum;
    G.currentScreen = 'game';
    loadLevel();
  }
}

function startGame(mode) {
  G.challengeLevelNum = null;
  G.dailyPracticeMode = false;
  G.currentMode = mode;
  G.levelIndex = 0;
  G.moveCount = 0;
  G.undoCount = 0;
  G.hintLevel = 0;
  hint.resetHintLevel();

  if (mode === 'normal') {
    G.currentLevelNum = G.playerStats.lifetimeNormalCleared + 1;
  } else if (mode === 'advanced') {
    G.currentLevelNum = G.playerStats.lifetimeAdvCleared + 1;
  } else if (mode === 'daily') {
    G.dailyPracticeMode = daily.isDailyClearedToday();
    daily.generateDailyPuzzle();
    if (G.dailyPracticeMode) {
      wx.showToast({ title: '今日已完成，练习模式', icon: 'none', duration: 2000 });
    }
    G.clearSummary = null;
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

function startMechTutorial(mech) {
  G.advMechanic = mech;
  G.currentMode = 'mech-tutorial';
  G.levelIndex = 0;
  G.currentLevelNum = 0;
  G.currentScreen = 'game';
  loadLevel();
}

function startAdvancedMode(mech) {
  G.advMechanic = mech;
  G.advModePreference = mech;
  G.requireStars = mech === 'star';
  startGame('advanced');
}

function loadLevel() {
  G.isHintVisible = false;
  G.historyStack = [];
  G.isAnimating = false;
  G.showNextBtn = false;
  G.clearSummary = null;
  G.messageText = '';
  G.difficulty = '';
  G.requireStars = false;
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
  } else if (G.currentMode === 'mech-tutorial') {
    var mechData = levelpack.getMechTutorial(G.advMechanic, G.levelIndex);
    if (mechData) {
      level.loadFixedLevel(mechData);
    }
  } else {
    if (G.currentMode === 'normal') {
      var normalLevel = G.challengeLevelNum || (G.playerStats.lifetimeNormalCleared + 1);
      G.currentLevelNum = normalLevel;
      var packIndex = Math.min(Math.max(normalLevel - 1, 0), levelpack.NORMAL_LEVEL_COUNT - 1);
      var fixedNormal = levelpack.getNormalLevel(packIndex);
      if (fixedNormal && normalLevel <= levelpack.NORMAL_LEVEL_COUNT) {
        level.loadFixedLevel(fixedNormal);
        G.challengeLevelNum = null;
        G.markDirty();
        return;
      }
      G.challengeLevelNum = null;
    } else if (G.currentMode === 'advanced') {
      var advLevel = G.challengeLevelNum || (G.playerStats.lifetimeAdvCleared + 1);
      G.currentLevelNum = advLevel;
      G.advModePreference = G.advMechanic;
      G.requireStars = G.advMechanic === 'star';
      G.challengeLevelNum = null;
    }
    var baseDiff = G.currentMode === 'advanced' ? 3 : 2;
    var adjDiff = adaptive.getAdjustedDifficulty(baseDiff);
    level.generateRandom(adjDiff);
  }
  G.markDirty();
}

function shouldShowClearSummary() {
  return G.currentMode === 'normal' || G.currentMode === 'advanced' || G.currentMode === 'daily';
}

function allStarsCollected() {
  if (!G.requireStars || !G.stars || G.stars.length === 0) return true;
  for (var i = 0; i < G.stars.length; i++) {
    if (!G.stars[i].collected) return false;
  }
  return true;
}

function prepareShareFromSummary() {
  if (!G.clearSummary) return;
  G._pendingShare = true;
  G._shareTitle = share.getClearShareTitle();
  if (typeof wx.showShareMenu === 'function') {
    wx.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage'] });
  }
  wx.showToast({ title: '请点击右上角 ··· 分享', icon: 'none', duration: 2000 });
}

function nextLevel() {
  if (G.isAnimating) return;
  G.showNextBtn = false;
  var summarySnapshot = G.clearSummary;
  G.clearSummary = null;
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
  } else if (G.currentMode === 'mech-tutorial') {
    G.levelIndex++;
    var mechCount = levelpack.getMechTutorialCount(G.advMechanic);
    if (G.levelIndex >= mechCount) {
      if (!G.playerStats.mechTutorialCleared) G.playerStats.mechTutorialCleared = {};
      G.playerStats.mechTutorialCleared[G.advMechanic] = true;
      G.storage.saveStats(G.playerStats);
      audio.vibrateMedium();
      var mechLabel = levelpack.getMechLabel(G.advMechanic);
      wx.showModal({
        title: '🎉 ' + mechLabel + '教学完成！',
        content: '已解锁该机制的正式关卡！',
        showCancel: false,
        success: function() {
          G.advModePreference = G.advMechanic;
          G.requireStars = G.advMechanic === 'star';
          G.currentMode = 'advanced';
          G.levelIndex = 0;
          G.isAnimating = false;
          loadLevel();
        }
      });
      return;
    }
  } else if (G.currentMode === 'endless') {
    endless.onClear();
    return;
  } else if (G.currentMode === 'daily') {
    if (!G.dailyPracticeMode) {
      daily.markDailyCleared();
      achievements.check({ clearTime: summarySnapshot ? summarySnapshot.clearTime : Date.now() - G.levelStartTime });
    } else {
      wx.showToast({ title: '练习模式，成绩未计入', icon: 'none', duration: 2000 });
    }
    G.isAnimating = false;
    G.currentScreen = 'home';
    G.markDirty();
    return;
  } else if (G.currentMode === 'editor-test') {
    G.currentMode = 'editor';
    G.currentScreen = 'editor';
    G.isAnimating = false;
    G.markDirty();
    return;
  } else {
    var clearTime = summarySnapshot ? summarySnapshot.clearTime : Date.now() - G.levelStartTime;
    var stars = summarySnapshot ? summarySnapshot.stars : rating.calculateStars(
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

    if (G.currentMode === 'normal') {
      G.playerStats.lifetimeNormalCleared++;
      G.playerStats.todayNormalCleared++;
    }
    if (G.currentMode === 'advanced') {
      G.playerStats.lifetimeAdvCleared++;
      G.playerStats.todayAdvCleared++;
    }

    adaptive.recordResult(true);
    achievements.check({ clearTime: clearTime });
    G.storage.saveStats(G.playerStats);
    leaderboard.init();
    if (G.checkThemeUnlocks) G.checkThemeUnlocks();
  }
  G.isAnimating = false;
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
    if (!allStarsCollected()) {
      G.messageText = '还有星星未收集！';
      G.messageColor = C.accentColor;
      audio.vibrateLong();
      G.markDirty();
      return;
    }

    G.messageText = '顺利通关！';
    G.messageColor = C.cellFilled;
    if (G.isHintVisible) toggleHint();
    audio.play('win');
    audio.vibrateLong();
    particles.spawnCelebration();

    if (shouldShowClearSummary()) {
      G.clearSummary = {
        stars: rating.calculateStars(
          G.currentMode,
          G.moveCount,
          rating.getOptimalMoves(G.currentSolution),
          G.undoCount,
          G.hintLevel
        ),
        moveCount: G.moveCount,
        optimalMoves: rating.getOptimalMoves(G.currentSolution),
        clearTime: Date.now() - G.levelStartTime,
        undoCount: G.undoCount
      };
    } else {
      G.showNextBtn = true;
    }

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

  cell.used = true;
  G.selectedCell = null;
  audio.play('move');
  audio.vibrateShort();
  G.markDirty();

  G.beamState = {
    dr: dr,
    dc: dc,
    currR: r,
    currC: c,
    targetCount: targetCount,
    filledCount: 0,
    origDr: dr,
    origDc: dc,
    depth: 0
  };
  processBeamAnimation();
}

function finishBeamAnimation() {
  G.isAnimating = false;
  G.beamState = null;
  checkGameState();
}

function processBeamAnimation() {
  var s = G.beamState;
  if (!s) return;

  while (s.filledCount < s.targetCount && s.depth < 200) {
    s.depth++;
    s.currR += s.dr;
    s.currC += s.dc;

    if (s.currR < 0 || s.currR >= G.ROWS || s.currC < 0 || s.currC >= G.COLS) {
      finishBeamAnimation();
      return;
    }

    var targetCell = G.gridData[s.currR][s.currC];
    if (targetCell.type === 'void' || targetCell.type === 'filled' || targetCell.type === 'number') {
      continue;
    }

    if (targetCell.type === 'portal') {
      var otherPortal = beam.findOtherPortal(
        G.gridData, targetCell.portalId, s.currR, s.currC, G.ROWS, G.COLS
      );
      if (!otherPortal) {
        finishBeamAnimation();
        return;
      }
      var startPos = G.getCellCenter(s.currR, s.currC);
      var endPos = G.getCellCenter(otherPortal.r, otherPortal.c);
      particles.spawnBeamParticles(startPos.x, startPos.y, endPos.x, endPos.y, C.accentColor);
      s.currR = otherPortal.r;
      s.currC = otherPortal.c;
      s.dr = s.origDr;
      s.dc = s.origDc;
      continue;
    }

    if (targetCell.type === 'mirror') {
      var reflected = beam.reflectDirection(s.dr, s.dc, targetCell.mirrorDir);
      s.dr = reflected[0];
      s.dc = reflected[1];
      s.origDr = s.dr;
      s.origDc = s.dc;
      continue;
    }

    if (targetCell.type === 'bomb') {
      explodeBomb(s.currR, s.currC, targetCell.bombRadius || 1);
      s.filledCount++;
      G.markDirty();
      setTimeout(processBeamAnimation, C.animSpeed + 50);
      return;
    }

    if (targetCell.type === 'empty') {
      targetCell.type = 'filled';
      targetCell.animState = 'pop';
      if (targetCell.isStar) collectStar(s.currR, s.currC);
      s.filledCount++;
      var fillPos = G.getCellCenter(s.currR, s.currC);
      particles.spawnFillBurst(fillPos.x, fillPos.y, C.cellFilled);
      G.markDirty();
      setTimeout(function() {
        if (targetCell.animState === 'pop') targetCell.animState = null;
        G.markDirty();
        processBeamAnimation();
      }, C.animSpeed);
      return;
    }

    if (targetCell.type === 'ice') {
      targetCell.hp--;
      targetCell.animState = 'hit';
      s.filledCount++;
      G.playerStats.totalIceBroken++;
      audio.play('ice');
      audio.vibrateMedium();
      var icePos = G.getCellCenter(s.currR, s.currC);
      particles.spawnIceBreak(icePos.x, icePos.y);
      G.markDirty();
      setTimeout(function() {
        targetCell.animState = null;
        if (targetCell.hp <= 0) {
          targetCell.type = 'empty';
          delete targetCell.hp;
        }
        G.markDirty();
        processBeamAnimation();
      }, C.animSpeed + 80);
      return;
    }

    finishBeamAnimation();
    return;
  }

  finishBeamAnimation();
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
      } else if (cell.type === 'empty') {
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
  refreshDailyStatsIfNeeded: refreshDailyStatsIfNeeded,
  applyAudioSettings: applyAudioSettings,
  clearData: clearData,
  goHome: goHome,
  startGame: startGame,
  startDailyChallenge: startDailyChallenge,
  startLevelChallenge: startLevelChallenge,
  startMechTutorial: startMechTutorial,
  startAdvancedMode: startAdvancedMode,
  loadLevel: loadLevel,
  nextLevel: nextLevel,
  prepareShareFromSummary: prepareShareFromSummary,
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
