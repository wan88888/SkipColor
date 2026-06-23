var G = GameGlobal;
var daily = require('./daily.js');

function buildQuery(params) {
  var parts = [];
  for (var k in params) {
    if (!params.hasOwnProperty(k)) continue;
    var val = params[k];
    if (val == null || val === '') continue;
    parts.push(k + '=' + encodeURIComponent(String(val)));
  }
  return parts.join('&');
}

function getCurrentShareQuery() {
  if (G.currentScreen === 'game' && G.clearSummary) {
    var q = {
      mode: G.currentMode,
      level: G.currentLevelNum
    };
    if (G.currentMode === 'daily') q.seed = G.dailySeed;
    if (G.currentMode === 'advanced' && G.advMechanic) q.mech = G.advMechanic;
    if (G.clearSummary.moveCount) q.moves = G.clearSummary.moveCount;
    return buildQuery(q);
  }

  if (G.currentScreen === 'game' && G.currentMode) {
    var q2 = {
      mode: G.currentMode,
      level: G.currentLevelNum
    };
    if (G.currentMode === 'daily') q2.seed = G.dailySeed;
    if (G.currentMode === 'advanced' && G.advMechanic) q2.mech = G.advMechanic;
    return buildQuery(q2);
  }

  return buildQuery({
    mode: 'normal',
    level: Math.max(1, G.playerStats.lifetimeNormalCleared + 1)
  });
}

function getClearShareTitle() {
  if (!G.clearSummary) return '';
  var rating = require('./rating.js');
  var starText = rating.showStars(G.clearSummary.stars);
  var levelLabel = G.currentLevelNum > 0 ? '第' + G.currentLevelNum + '关' : '一关';
  return '我在「跳跃填色」' + levelLabel + '获得 ' + starText + '（' + G.clearSummary.moveCount + '步），来挑战吧！';
}

function applyLaunchQuery(query) {
  if (!query || !query.mode) return false;

  var game = require('./game.js');
  var mode = query.mode;

  if (mode === 'daily') {
    var seed = query.seed ? parseInt(query.seed, 10) : daily.getDailySeed();
    if (!seed || isNaN(seed)) return false;
    wx.showToast({ title: '好友分享每日挑战', icon: 'none', duration: 2000 });
    game.startDailyChallenge(seed);
    return true;
  }

  if (mode === 'normal') {
    var level = parseInt(query.level, 10);
    if (!level || level < 1) return false;
    if (!G.playerStats.tutorialCleared) {
      wx.showToast({ title: '请先完成基础教学', icon: 'none' });
      return false;
    }
    wx.showToast({ title: '挑战第 ' + level + ' 关', icon: 'none', duration: 2000 });
    game.startLevelChallenge('normal', level);
    return true;
  }

  if (mode === 'advanced') {
    var mech = query.mech || 'portal';
    var advLevel = parseInt(query.level, 10) || 1;
    if (!G.playerStats.mechTutorialCleared || !G.playerStats.mechTutorialCleared[mech]) {
      wx.showToast({ title: '该机制需先完成教学', icon: 'none' });
      return false;
    }
    wx.showToast({ title: '挑战' + require('./levelpack.js').getMechLabel(mech), icon: 'none', duration: 2000 });
    game.startLevelChallenge('advanced', advLevel, mech);
    return true;
  }

  return false;
}

function captureLaunchQuery() {
  try {
    var launch = wx.getLaunchOptionsSync();
    if (launch && launch.query && launch.query.mode) {
      G._deferredLaunchQuery = launch.query;
    }
  } catch (e) {}
}

function runDeferredLaunchQuery() {
  if (!G._deferredLaunchQuery) return;
  var query = G._deferredLaunchQuery;
  G._deferredLaunchQuery = null;
  applyLaunchQuery(query);
}

module.exports = {
  buildQuery: buildQuery,
  getCurrentShareQuery: getCurrentShareQuery,
  getClearShareTitle: getClearShareTitle,
  applyLaunchQuery: applyLaunchQuery,
  captureLaunchQuery: captureLaunchQuery,
  runDeferredLaunchQuery: runDeferredLaunchQuery
};
