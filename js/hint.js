var G = GameGlobal;

function getHint() {
  if (!G.currentSolution || G.currentSolution.length === 0) return null;

  var usedSteps = G.historyStack.length;
  if (usedSteps >= G.currentSolution.length) return null;

  G.hintLevel = Math.min(G.hintLevel + 1, 3);
  var nextStep = G.currentSolution[usedSteps];

  if (G.hintLevel === 1) {
    return { type: 'dir', text: '提示(L1): 下一步方向是 ' + G.dirMapText[nextStep.dir], cell: null };
  } else if (G.hintLevel === 2) {
    return { type: 'cell', text: '提示(L2): 点击第' + (nextStep.r + 1) + '行第' + (nextStep.c + 1) + '列的数字，方向 ' + G.dirMapText[nextStep.dir], cell: nextStep };
  } else {
    return { type: 'full', text: '提示(L3): 完整解法已显示', cell: nextStep, full: true };
  }
}

function resetHintLevel() {
  G.hintLevel = 0;
}

function showHint() {
  var hint = getHint();
  if (!hint) {
    G.messageText = '暂无提示';
    G.messageColor = G.CONFIG.accentColor;
    G.markDirty();
    return;
  }

  G.messageText = hint.text;
  G.messageColor = G.CONFIG.accentColor;
  G.markDirty();

  if (G.audio) G.audio.play('hint');

  setTimeout(function() {
    if (G.messageText === hint.text) {
      G.messageText = '';
      G.markDirty();
    }
  }, 3000);
}

module.exports = {
  getHint: getHint,
  resetHintLevel: resetHintLevel,
  showHint: showHint
};
