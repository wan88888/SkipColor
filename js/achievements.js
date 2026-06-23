var G = GameGlobal;

var ACHIEVEMENTS = {
  firstClear: { name: '初出茅庐', desc: '完成第一关', icon: '🎯' },
  ice100: { name: '冰封王座', desc: '累计破除100个冰块', icon: '🧊' },
  speed10: { name: '神速', desc: '10秒内通关任意关卡', icon: '⚡' },
  perfect5: { name: '完美主义者', desc: '连续5关无撤销通关', icon: '💎' },
  master50: { name: '色彩大师', desc: '通关50关普通模式', icon: '🎨' },
  star50: { name: '星之收集者', desc: '累计获得50颗星', icon: '⭐' },
  endless100: { name: '无尽行者', desc: '无尽模式得分100', icon: '♾️' },
  daily7: { name: '每日坚持', desc: '完成7次每日挑战', icon: '📅' },
  allThemes: { name: '色彩收藏家', desc: '解锁所有主题', icon: '🌈' }
};

function unlock(id) {
  if (G.playerStats.achievements[id]) return;
  G.playerStats.achievements[id] = true;
  var ach = ACHIEVEMENTS[id];
  if (ach) {
    wx.showToast({ title: ach.icon + ' ' + ach.name, icon: 'none', duration: 2000 });
    if (G.settings.vibrationEnabled) {
      try { wx.vibrateShort({ type: 'medium' }); } catch (e) {}
    }
  }
  if (G.storage) G.storage.saveStats(G.playerStats);
}

function check(context) {
  var s = G.playerStats;
  if (s.lifetimeNormalCleared + s.lifetimeAdvCleared > 0) unlock('firstClear');
  if (s.totalIceBroken >= 100) unlock('ice100');
  if (context.clearTime && context.clearTime < 10000) unlock('speed10');
  if (s.perfectStreak >= 5) unlock('perfect5');
  if (s.lifetimeNormalCleared >= 50) unlock('master50');
  if (s.totalStars >= 50) unlock('star50');
  if (s.endlessHighScore >= 100) unlock('endless100');
  if (s.dailyClearedCount >= 7) unlock('daily7');
  if (s.unlockedThemes.length >= Object.keys(G.THEMES).length) unlock('allThemes');
}

function getList() {
  var list = [];
  for (var id in ACHIEVEMENTS) {
    list.push({
      id: id,
      name: ACHIEVEMENTS[id].name,
      desc: ACHIEVEMENTS[id].desc,
      icon: ACHIEVEMENTS[id].icon,
      unlocked: !!G.playerStats.achievements[id]
    });
  }
  return list;
}

function getProgress() {
  var total = Object.keys(ACHIEVEMENTS).length;
  var unlocked = 0;
  for (var id in G.playerStats.achievements) {
    if (G.playerStats.achievements[id]) unlocked++;
  }
  return { unlocked: unlocked, total: total };
}

module.exports = {
  ACHIEVEMENTS: ACHIEVEMENTS,
  unlock: unlock,
  check: check,
  getList: getList,
  getProgress: getProgress
};
