var G = GameGlobal;

var STORAGE_KEY = 'jumpColorStats';
var SETTINGS_KEY = 'jumpColorSettings';
var THEME_KEY = 'jumpColorTheme';

G.storage = {
  get: function() {
    var data = wx.getStorageSync(STORAGE_KEY);
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
    wx.setStorageSync(STORAGE_KEY, stats);
  },

  saveStats: function(stats) {
    wx.setStorageSync(STORAGE_KEY, stats);
  },

  clear: function() {
    wx.removeStorageSync(STORAGE_KEY);
    wx.removeStorageSync(SETTINGS_KEY);
    wx.removeStorageSync(THEME_KEY);
  },

  getSettings: function() {
    var data = wx.getStorageSync(SETTINGS_KEY);
    if (data) {
      if (typeof data.soundEnabled === 'undefined') data.soundEnabled = false;
      if (typeof data.vibrationEnabled === 'undefined') data.vibrationEnabled = true;
      if (typeof data.particleEnabled === 'undefined') data.particleEnabled = true;
      return data;
    }
    return { soundEnabled: false, vibrationEnabled: true, particleEnabled: true };
  },

  saveSettings: function(settings) {
    wx.setStorageSync(SETTINGS_KEY, settings);
  },

  getTheme: function() {
    return wx.getStorageSync(THEME_KEY) || 'default';
  },

  saveTheme: function(themeName) {
    wx.setStorageSync(THEME_KEY, themeName);
  },

  unlockTheme: function(themeName) {
    if (G.playerStats.unlockedThemes.indexOf(themeName) === -1) {
      G.playerStats.unlockedThemes.push(themeName);
      this.saveStats(G.playerStats);
    }
  }
};

module.exports = G.storage;
