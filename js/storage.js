var G = GameGlobal;

var STORAGE_KEY = 'jumpColorStats';
var SETTINGS_KEY = 'jumpColorSettings';
var THEME_KEY = 'jumpColorTheme';

function safeSetStorage(key, data) {
  try {
    wx.setStorageSync(key, data);
    return true;
  } catch (e) {
    wx.showToast({
      title: '存档保存失败，请检查存储空间',
      icon: 'none',
      duration: 2500
    });
    return false;
  }
}

G.storage = {
  get: function() {
    var data;
    try {
      data = wx.getStorageSync(STORAGE_KEY);
    } catch (e) {
      return null;
    }
    if (data) {
      if (typeof data.lifetimeNormalCleared === 'undefined') {
        data.lifetimeNormalCleared = data.normalClearedCount || 0;
        data.lifetimeAdvCleared = data.advClearedCount || 0;
      }
      if (typeof data.todayNormalCleared === 'undefined') {
        data.todayNormalCleared = data.normalClearedCount || 0;
        data.todayAdvCleared = data.advClearedCount || 0;
      }
      if (data.lastDate !== new Date().toDateString()) {
        data.todayNormalCleared = 0;
        data.todayAdvCleared = 0;
        data.lastDate = new Date().toDateString();
      }
      if (typeof data.totalStars === 'undefined') data.totalStars = 0;
      if (typeof data.totalIceBroken === 'undefined') data.totalIceBroken = 0;
      if (typeof data.perfectStreak === 'undefined') data.perfectStreak = 0;
      if (typeof data.endlessHighScore === 'undefined') data.endlessHighScore = 0;
      if (typeof data.dailyClearedCount === 'undefined') data.dailyClearedCount = 0;
      if (typeof data.unlockedThemes === 'undefined') data.unlockedThemes = ['default'];
      if (typeof data.achievements === 'undefined') data.achievements = {};
      if (typeof data.lastDailyDate === 'undefined') data.lastDailyDate = '';
      if (typeof data.mechTutorialCleared === 'undefined') {
        data.mechTutorialCleared = { portal: false, mirror: false, bomb: false, star: false };
      }
      return data;
    }
    return null;
  },

  save: function(stats) {
    return safeSetStorage(STORAGE_KEY, stats);
  },

  saveStats: function(stats) {
    return safeSetStorage(STORAGE_KEY, stats);
  },

  clear: function() {
    try {
      wx.removeStorageSync(STORAGE_KEY);
      wx.removeStorageSync(SETTINGS_KEY);
      wx.removeStorageSync(THEME_KEY);
    } catch (e) {
      wx.showToast({ title: '清除存档失败', icon: 'none' });
    }
  },

  getSettings: function() {
    try {
      var data = wx.getStorageSync(SETTINGS_KEY);
      if (data) {
        if (typeof data.soundEnabled === 'undefined') data.soundEnabled = false;
        if (typeof data.vibrationEnabled === 'undefined') data.vibrationEnabled = true;
        if (typeof data.particleEnabled === 'undefined') data.particleEnabled = true;
        return data;
      }
    } catch (e) {}
    return { soundEnabled: false, vibrationEnabled: true, particleEnabled: true };
  },

  saveSettings: function(settings) {
    return safeSetStorage(SETTINGS_KEY, settings);
  },

  getTheme: function() {
    try {
      return wx.getStorageSync(THEME_KEY) || 'default';
    } catch (e) {
      return 'default';
    }
  },

  saveTheme: function(themeName) {
    return safeSetStorage(THEME_KEY, themeName);
  },

  unlockTheme: function(themeName) {
    if (G.playerStats.unlockedThemes.indexOf(themeName) === -1) {
      G.playerStats.unlockedThemes.push(themeName);
      this.saveStats(G.playerStats);
    }
  }
};

module.exports = G.storage;
