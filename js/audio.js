var G = GameGlobal;

G.audio = {
  _enabled: true,
  _contexts: {},

  _getCtx: function(name) {
    if (!this._contexts[name]) {
      try {
        var ctx = wx.createInnerAudioContext();
        ctx.src = 'audio/' + name + '.mp3';
        ctx.volume = 0.5;
        this._contexts[name] = ctx;
      } catch (e) {
        this._contexts[name] = null;
      }
    }
    return this._contexts[name];
  },

  play: function(name) {
    if (!this._enabled) return;
    var ctx = this._getCtx(name);
    if (ctx) {
      try {
        ctx.stop();
        ctx.seek(0);
        ctx.play();
      } catch (e) {}
    }
  },

  vibrateShort: function() {
    if (!G.settings.vibrationEnabled) return;
    try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
  },

  vibrateMedium: function() {
    if (!G.settings.vibrationEnabled) return;
    try { wx.vibrateShort({ type: 'medium' }); } catch (e) {}
  },

  vibrateLong: function() {
    if (!G.settings.vibrationEnabled) return;
    try { wx.vibrateLong(); } catch (e) {}
  },

  setEnabled: function(enabled) {
    this._enabled = enabled;
    if (!enabled) {
      for (var k in this._contexts) {
        if (this._contexts[k]) {
          try { this._contexts[k].stop(); } catch (e) {}
        }
      }
    }
  },

  isEnabled: function() {
    return this._enabled;
  },

  destroy: function() {
    for (var k in this._contexts) {
      if (this._contexts[k]) {
        try { this._contexts[k].destroy(); } catch (e) {}
      }
    }
    this._contexts = {};
  }
};

module.exports = G.audio;
