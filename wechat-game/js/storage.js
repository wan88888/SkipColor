var G = GameGlobal;

G.storage = {
  get: function() {
    var data = wx.getStorageSync('jumpColorStats');
    if (data) {
      if (data.lastDate !== new Date().toDateString()) {
        data.normalClearedCount = 0;
        data.advClearedCount = 0;
        data.lastDate = new Date().toDateString();
      }
      if (typeof data.advClearedCount === 'undefined') data.advClearedCount = 0;
      return data;
    }
    return null;
  },
  save: function(stats) {
    wx.setStorageSync('jumpColorStats', stats);
  },
  clear: function() {
    wx.removeStorageSync('jumpColorStats');
  }
};

module.exports = G.storage;
