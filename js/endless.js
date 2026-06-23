var G = GameGlobal;
var level = require('./level.js');
var adaptive = require('./adaptive.js');

var TIME_LIMIT = 180;
var timerInterval = null;

function start() {
  G.currentMode = 'endless';
  G.endlessScore = 0;
  G.endlessTime = TIME_LIMIT;
  G.currentLevelNum = 1;
  generateNext();
  startTimer();
}

function generateNext() {
  var baseDifficulty = Math.min(5, 1 + Math.floor(G.endlessScore / 5));
  var difficulty = adaptive.getAdjustedDifficulty(baseDifficulty);
  level.generateRandom(difficulty);
  G.currentSolution = G.currentSolution || [];
  G.moveCount = 0;
  G.undoCount = 0;
  G.historyStack = [];
  G.isAnimating = false;
  G.showNextBtn = false;
  G.messageText = '';
  G.selectedCell = null;
  G.levelStartTime = Date.now();
  G.markDirty();
}

function onClear() {
  G.endlessScore++;
  G.currentLevelNum = G.endlessScore + 1;
  if (G.endlessScore > G.playerStats.endlessHighScore) {
    G.playerStats.endlessHighScore = G.endlessScore;
    if (G.storage) G.storage.saveStats(G.playerStats);
  }
  if (G.checkThemeUnlocks) G.checkThemeUnlocks();
  G.isAnimating = true;
  setTimeout(function() {
    generateNext();
  }, 1500);
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(function() {
    if (G.currentMode !== 'endless') {
      stopTimer();
      return;
    }
    G.endlessTime--;
    G.markDirty();
    if (G.endlessTime <= 0) {
      endGame();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function endGame() {
  stopTimer();
  G.isAnimating = false;
  G.showNextBtn = false;
  wx.showModal({
    title: '时间到！',
    content: '本次得分：' + G.endlessScore + '\n最高记录：' + G.playerStats.endlessHighScore,
    showCancel: false,
    success: function() {
      G.currentScreen = 'home';
      G.markDirty();
    }
  });
}

function getTimeDisplay() {
  var m = Math.floor(G.endlessTime / 60);
  var s = G.endlessTime % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

module.exports = {
  start: start,
  onClear: onClear,
  stopTimer: stopTimer,
  getTimeDisplay: getTimeDisplay,
  TIME_LIMIT: TIME_LIMIT
};
