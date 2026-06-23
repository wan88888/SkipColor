var G = GameGlobal;

var KV_KEY = 'skipcolor_stats';

function init() {
  try {
    if (typeof wx.setUserCloudStorage === 'function') {
      wx.setUserCloudStorage({
        KVDataList: [{
          key: KV_KEY,
          value: JSON.stringify({
            normalCleared: G.playerStats.lifetimeNormalCleared,
            advCleared: G.playerStats.lifetimeAdvCleared,
            totalStars: G.playerStats.totalStars,
            endlessHigh: G.playerStats.endlessHighScore
          })
        }]
      });
    }
  } catch (e) {}
}

function getFriendRanking(callback) {
  try {
    if (typeof wx.getFriendCloudStorage !== 'function') {
      callback({ ok: false, reason: 'not_supported' });
      return;
    }
    wx.getFriendCloudStorage({
      keyList: [KV_KEY],
      success: function(res) {
        var list = [];
        if (res && res.data) {
          for (var i = 0; i < res.data.length; i++) {
            var item = res.data[i];
            var score = 0;
            try {
              var kv = item.KVDataList;
              for (var j = 0; j < kv.length; j++) {
                if (kv[j].key === KV_KEY) {
                  var v = JSON.parse(kv[j].value);
                  score = v.normalCleared + v.advCleared;
                }
              }
            } catch (e) {}
            list.push({
              nickname: item.nickname,
              avatarUrl: item.avatarUrl,
              score: score
            });
          }
        }
        list.sort(function(a, b) { return b.score - a.score; });
        callback({ ok: true, list: list });
      },
      fail: function() {
        callback({ ok: false, reason: 'fail' });
      }
    });
  } catch (e) {
    callback({ ok: false, reason: 'exception' });
  }
}

function getUserRanking(callback) {
  try {
    if (typeof wx.getUserCloudStorage !== 'function') {
      callback({ ok: false });
      return;
    }
    wx.getUserCloudStorage({
      keyList: [KV_KEY],
      success: function(res) {
        var score = 0;
        if (res && res.KVDataList) {
          for (var i = 0; i < res.KVDataList.length; i++) {
            if (res.KVDataList[i].key === KV_KEY) {
              try {
                var v = JSON.parse(res.KVDataList[i].value);
                score = v.normalCleared + v.advCleared;
              } catch (e) {}
            }
          }
        }
        callback({ ok: true, score: score });
      },
      fail: function() { callback({ ok: false }); }
    });
  } catch (e) {
    callback({ ok: false });
  }
}

module.exports = {
  init: init,
  getFriendRanking: getFriendRanking,
  getUserRanking: getUserRanking,
  KV_KEY: KV_KEY
};
