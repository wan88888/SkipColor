var G = GameGlobal;

function calculateStars(mode, moveCount, optimalMoves, undoCount, hintLevel) {
  var stars = 1;
  if (moveCount <= optimalMoves + 2 && undoCount === 0) stars = 2;
  if (moveCount === optimalMoves && undoCount === 0 && hintLevel === 0) stars = 3;
  return stars;
}

function getOptimalMoves(solution) {
  return solution ? solution.length : 0;
}

function showStars(stars) {
  var text = '';
  for (var i = 0; i < 3; i++) {
    text += i < stars ? '⭐' : '☆';
  }
  return text;
}

module.exports = {
  calculateStars: calculateStars,
  getOptimalMoves: getOptimalMoves,
  showStars: showStars
};
