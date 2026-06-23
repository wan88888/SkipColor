var G = GameGlobal;

var STORAGE_KEY = 'jumpColorStats';
var SETTINGS_KEY = 'jumpColorSettings';
var THEME_KEY = 'jumpColorTheme';

G.storage = {
  get: function() {
    var data = wx.getStorageSync(STORAGE_KEY);
    if (data) {
      if (data.lastDate !== new Date().toDateString()) {
        data.normalClearedCount = 0;
        data.advClearedCount = 0;
        data.lastDate = new Date().toDateString();
      }
      if (typeof data.advClearedCount === 'undefined') data.advClearedCount = 0;
      if (typeof data.totalStars === 'undefined') data.totalStars = 0;
      if (typeof data.totalIceBroken === 'undefined') data.totalIceBroken = 0;
      if (typeof data.perfectStreak === 'undefined') data.perfectStreak = 0;
      if (typeof data.endlessHighScore === 'undefined') data.endlessHighScore = 0;
      if (typeof data.dailyClearedCount === 'undefined') data.dailyClearedCount = 0;
      if (typeof data.unlockedThemes === 'undefined') data.unlockedThemes = ['default'];
      if (typeof data.achievements === 'undefined') data.achievements = {};
      if (typeof data.lastDailyDate === 'undefined') data.lastDailyDate = '';
      return data;
    }
    return null;
  },

  save: function(stats) {
    wx.setStorageSync(STORAGE_KEY, stats);
    this.syncToCloud(stats);
  },

  saveStats: function(stats) {
    wx.setStorageSync(STORAGE_KEY, stats);
    this.syncToCloud(stats);
  },

  clear: function() {
    wx.removeStorageSync(STORAGE_KEY);
    wx.removeStorageSync(THEME_KEY);
    this.removeFromCloud();
  },

  getSettings: function() {
    var data = wx.getStorageSync(SETTINGS_KEY);
    if (data) {
      if (typeof data.soundEnabled === 'undefined') data.soundEnabled = true;
      if (typeof data.vibrationEnabled === 'undefined') data.vibrationEnabled = true;
      if (typeof data.particleEnabled === 'undefined') data.particleEnabled = true;
      return data;
    }
    return { soundEnabled: true, vibrationEnabled: true, particleEnabled: true };
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
  },

  syncToCloud: function(stats) {
    if (typeof wx.cloud === 'undefined' || !wx.cloud) return;
    try {
      if (typeof wx.cloud.init === 'function' && !G._cloudInited) {
        wx.cloud.init({ traceUser: true });
        G._cloudInited = true;
      }
      if (wx.cloud.database) {
        var db = wx.cloud.database();
        db.collection('user_stats').where({ _openid: '{openid}' }).get({
          success: function(res) {
            if (res.data && res.data.length > 0) {
              db.collection('user_stats').doc(res.data[0]._id).update({ data: stats });
            } else {
              db.collection('user_stats').add({ data: stats });
            }
          }
        });
      }
    } catch (e) {}
  },

  removeFromCloud: function() {
    if (typeof wx.cloud === 'undefined' || !wx.cloud) return;
    try {
      if (wx.cloud.database) {
        var db = wx.cloud.database();
        db.collection('user_stats').where({ _openid: '{openid}' }).remove();
      }
    } catch (e) {}
  },

  pullFromCloud: function(callback) {
    if (typeof wx.cloud === 'undefined' || !wx.cloud) {
      if (callback) callback(null);
      return;
    }
    try {
      if (typeof wx.cloud.init === 'function' && !G._cloudInited) {
        wx.cloud.init({ traceUser: true });
        G._cloudInited = true;
      }
      if (wx.cloud.database) {
        var db = wx.cloud.database();
        db.collection('user_stats').where({ _openid: '{openid}' }).get({
          success: function(res) {
            if (res.data && res.data.length > 0) {
              if (callback) callback(res.data[0]);
            } else {
              if (callback) callback(null);
            }
          },
          fail: function() {
            if (callback) callback(null);
          }
        });
      } else {
        if (callback) callback(null);
      }
    } catch (e) {
      if (callback) callback(null);
    }
  }
};

module.exports = G.storage;
