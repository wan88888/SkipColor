var G = GameGlobal;

function recordResult(cleared) {
  if (cleared) {
    G.adaptiveFailCount = Math.max(0, G.adaptiveFailCount - 1);
    if (G.adaptiveFailCount === 0) {
      G.adaptiveDifficultyBias = Math.min(2, G.adaptiveDifficultyBias + 0.5);
    }
  } else {
    G.adaptiveFailCount++;
    if (G.adaptiveFailCount >= 3) {
      G.adaptiveDifficultyBias = Math.max(-2, G.adaptiveDifficultyBias - 1);
      G.adaptiveFailCount = 0;
    }
  }
}

function getAdjustedDifficulty(baseDifficulty) {
  var adjusted = baseDifficulty + G.adaptiveDifficultyBias;
  return Math.max(1, Math.min(5, adjusted));
}

function getSpeedFactor() {
  if (!G.levelStartTime) return 0;
  var elapsed = Date.now() - G.levelStartTime;
  if (elapsed < 15000) return 1;
  if (elapsed > 60000) return -1;
  return 0;
}

function shouldIncreaseDifficulty() {
  return G.adaptiveFailCount === 0 && getSpeedFactor() > 0;
}

module.exports = {
  recordResult: recordResult,
  getAdjustedDifficulty: getAdjustedDifficulty,
  getSpeedFactor: getSpeedFactor,
  shouldIncreaseDifficulty: shouldIncreaseDifficulty
};
