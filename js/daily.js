var G = GameGlobal;
var level = require('./level.js');

function seededRandom(seed) {
  var value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function getDailySeed() {
  var d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function generateDailyPuzzleFromSeed(seed) {
  G.dailySeed = seed;
  var rng = seededRandom(seed);
  var difficulty = 1 + Math.floor(rng() * 4);
  var origRandom = Math.random;
  Math.random = rng;
  level.generateRandom(difficulty);
  Math.random = origRandom;
  return { seed: seed, title: '每日挑战 #' + seed };
}

function generateDailyPuzzle() {
  return generateDailyPuzzleFromSeed(getDailySeed());
}

function isDailyClearedToday() {
  var today = new Date().toDateString();
  return G.playerStats.lastDailyDate === today;
}

function markDailyCleared() {
  G.playerStats.lastDailyDate = new Date().toDateString();
  G.playerStats.dailyClearedCount++;
  if (G.storage) G.storage.saveStats(G.playerStats);
}

module.exports = {
  getDailySeed: getDailySeed,
  generateDailyPuzzle: generateDailyPuzzle,
  generateDailyPuzzleFromSeed: generateDailyPuzzleFromSeed,
  isDailyClearedToday: isDailyClearedToday,
  markDailyCleared: markDailyCleared
};
