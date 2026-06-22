var G = GameGlobal;
var C = G.CONFIG;
var level = require('./level.js');

function initApp() {
  var savedStats = G.storage.get();
  if (savedStats) {
    G.playerStats = savedStats;
  }
  G.currentScreen = 'home';
}

function clearData() {
  wx.showModal({
    title: '⚠️ 确定要清除所有游戏进度吗？',
    content: '清除后您的通关记录将归零，并需要重新完成教学关卡。',
    success: function(res) {
      if (res.confirm) {
        G.playerStats = {
          tutorialCleared: false,
          normalClearedCount: 0,
          advTutorialCleared: false,
          advClearedCount: 0,
          lastDate: new Date().toDateString()
        };
        G.storage.save(G.playerStats);
      }
    }
  });
}

function goHome() {
  if (G.currentScreen === 'game') {
    if (G.historyStack.length > 0 || G.showNextBtn) {
      wx.showModal({
        title: '返回主页',
        content: '您的当前关卡进度将无法保存。',
        success: function(res) {
          if (res.confirm) {
            G.currentScreen = 'home';
          }
        }
      });
      return;
    }
  }
  G.currentScreen = 'home';
}

function startGame(mode) {
  G.currentMode = mode;
  G.levelIndex = 0;
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

  if (G.currentMode === 'tutorial') {
    var tData = G.tutorials[G.levelIndex];
    G.currentSolution = JSON.parse(JSON.stringify(tData.solution));
    level.loadGridData(tData.matrix);
  } else if (G.currentMode === 'adv-tutorial') {
    var tData = G.advTutorials[G.levelIndex];
    G.currentSolution = JSON.parse(JSON.stringify(tData.solution));
    level.loadGridData(tData.matrix);
  } else {
    level.generateAndCropLevel();
  }
}

function nextLevel() {
  if (G.currentMode === 'tutorial') {
    G.levelIndex++;
    if (G.levelIndex >= G.tutorials.length) {
      G.playerStats.tutorialCleared = true;
      G.storage.save(G.playerStats);
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
      G.storage.save(G.playerStats);
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
  } else {
    if (G.currentMode === 'normal') G.playerStats.normalClearedCount++;
    if (G.currentMode === 'advanced') G.playerStats.advClearedCount++;
    G.storage.save(G.playerStats);
  }
  loadLevel();
}

function resetCurrentLevel() {
  if (G.isAnimating) return;
  G.gridData = [];
  G.initialGridData.forEach(function(initRow) {
    G.gridData.push(JSON.parse(JSON.stringify(initRow)));
  });
  G.selectedCell = null;
  G.historyStack = [];
  G.messageText = '';
  G.showNextBtn = false;
  G.isHintVisible = false;
}

function saveHistory() {
  G.historyStack.push({
    grid: JSON.parse(JSON.stringify(G.gridData)),
    selectedCell: G.selectedCell ? { r: G.selectedCell.r, c: G.selectedCell.c } : null
  });
}

function undoMove() {
  if (G.isAnimating || G.historyStack.length === 0) return;
  var lastState = G.historyStack.pop();
  G.gridData = lastState.grid;
  G.selectedCell = lastState.selectedCell;
  G.messageText = '';
}

function selectCell(r, c) {
  if (G.isAnimating || G.gridData[r][c].used) return;
  G.selectedCell = { r: r, c: c };
}

function toggleHint() {
  G.isHintVisible = !G.isHintVisible;
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
    if (targetCell.type === 'empty' || targetCell.type === 'ice') return true;
  }
}

function checkGameState() {
  var hasEmpty = false, hasUnusedNumbers = false;
  for (var r = 0; r < G.ROWS; r++) {
    for (var c = 0; c < G.COLS; c++) {
      if (G.gridData[r][c].type === 'empty' || G.gridData[r][c].type === 'ice') hasEmpty = true;
      if (G.gridData[r][c].type === 'number' && !G.gridData[r][c].used) hasUnusedNumbers = true;
    }
  }

  if (!hasEmpty) {
    G.messageText = '顺利通关！';
    G.messageColor = C.cellFilled;
    G.showNextBtn = true;
    if (G.isHintVisible) toggleHint();
  } else if (!hasUnusedNumbers) {
    G.messageText = '陷入死局，请重新开始';
    G.messageColor = C.accentColor;
  }
}

function move(dr, dc) {
  if (!G.selectedCell || G.isAnimating) return;

  G.isAnimating = true;
  saveHistory();

  var r = G.selectedCell.r, c = G.selectedCell.c;
  var cell = G.gridData[r][c];
  var targetCount = cell.value;
  var filledCount = 0;
  var currR = r, currC = c;

  cell.used = true;
  G.selectedCell = null;

  doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount);
}

function doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount) {
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
  if (targetCell.type === 'void') {
    G.isAnimating = false;
    checkGameState();
    return;
  }

  if (targetCell.type === 'filled' || targetCell.type === 'number') {
    doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount);
    return;
  }

  if (targetCell.type === 'empty') {
    targetCell.type = 'filled';
    targetCell.animState = 'pop';
    filledCount++;
    setTimeout(function() {
      if (targetCell.animState === 'pop') targetCell.animState = null;
      doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount);
    }, C.animSpeed);
    return;
  }

  if (targetCell.type === 'ice') {
    targetCell.hp--;
    targetCell.animState = 'hit';
    filledCount++;

    setTimeout(function() {
      targetCell.animState = null;
      if (targetCell.hp <= 0) {
        targetCell.type = 'empty';
        delete targetCell.hp;
        doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount);
      } else {
        doMoveAnimation(dr, dc, currR, currC, targetCount, filledCount);
      }
    }, C.animSpeed + 80);
    return;
  }

  G.isAnimating = false;
  checkGameState();
}

module.exports = {
  initApp: initApp,
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
  hasValidMove: hasValidMove,
  checkGameState: checkGameState,
  move: move
};
