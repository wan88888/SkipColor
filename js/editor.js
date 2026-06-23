var G = GameGlobal;
var level = require('./level.js');

var TOOLS = [
  { id: 'empty', name: '空格', value: 0 },
  { id: 'void', name: '空洞', value: -1 },
  { id: 'ice1', name: '冰块1', value: -2 },
  { id: 'ice2', name: '冰块2', value: -3 },
  { id: 'ice3', name: '冰块3', value: -4 },
  { id: 'number', name: '数字', value: 11 },
  { id: 'portal', name: '传送门', value: -5 },
  { id: 'mirror', name: '镜子', value: -6 },
  { id: 'bomb', name: '炸弹', value: -7 },
  { id: 'star', name: '星星', value: -8 }
];

function init(rows, cols) {
  G.editorGrid = [];
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) {
      row.push(0);
    }
    G.editorGrid.push(row);
  }
  G.editorTool = 'empty';
  G.editorValue = 0;
  G.currentMode = 'editor';
  G.currentScreen = 'editor';
  G.ROWS = rows;
  G.COLS = cols;
  G.markDirty();
}

function setCell(r, c) {
  if (r < 0 || r >= G.editorGrid.length) return;
  if (c < 0 || c >= G.editorGrid[0].length) return;
  G.editorGrid[r][c] = G.editorValue;
  G.markDirty();
}

function setTool(toolId) {
  if (toolId === 'number') {
    var curNum = G.editorValue >= 10 && G.editorValue < 20 ? G.editorValue - 10 : 1;
    if (G.editorTool === 'number') {
      curNum = curNum % 5 + 1;
    }
    G.editorValue = 10 + curNum;
    G.editorTool = 'number';
    G.markDirty();
    return;
  }
  if (toolId === 'mirror') {
    if (G.editorTool === 'mirror') {
      G.editorValue = G.editorValue === -6 ? -11 : -6;
    } else {
      G.editorValue = -6;
    }
    G.editorTool = 'mirror';
    G.markDirty();
    return;
  }
  for (var i = 0; i < TOOLS.length; i++) {
    if (TOOLS[i].id === toolId) {
      G.editorTool = toolId;
      G.editorValue = TOOLS[i].value;
      G.markDirty();
      return;
    }
  }
}

function playTest() {
  level.loadFromMatrix(G.editorGrid);
  G.currentMode = 'editor-test';
  G.currentScreen = 'game';
  G.moveCount = 0;
  G.undoCount = 0;
  G.historyStack = [];
  G.isAnimating = false;
  G.showNextBtn = false;
  G.messageText = '';
  G.selectedCell = null;
  G.isHintVisible = false;
  G.hintLevel = 0;
  G.levelStartTime = Date.now();
  G.markDirty();
}

function encodeShare() {
  var data = {
    g: G.editorGrid,
    v: 1
  };
  return JSON.stringify(data);
}

function decodeShare(code) {
  try {
    var data = JSON.parse(code);
    if (data.g && data.g.length > 0) {
      G.editorGrid = data.g;
      G.ROWS = data.g.length;
      G.COLS = data.g[0].length;
      G.markDirty();
      return true;
    }
  } catch (e) {}
  return false;
}

function shareLevel() {
  var code = encodeShare();
  wx.setClipboardData({
    data: code,
    success: function() {
      wx.showModal({
        title: '关卡已复制',
        content: '关卡码已复制到剪贴板，粘贴给好友即可分享！',
        showCancel: false
      });
    }
  });
}

function importLevel() {
  wx.getClipboardData({
    success: function(res) {
      if (decodeShare(res.data)) {
        wx.showToast({ title: '导入成功', icon: 'success' });
      } else {
        wx.showToast({ title: '关卡码无效', icon: 'none' });
      }
    }
  });
}

module.exports = {
  TOOLS: TOOLS,
  init: init,
  setCell: setCell,
  setTool: setTool,
  playTest: playTest,
  shareLevel: shareLevel,
  importLevel: importLevel,
  encodeShare: encodeShare,
  decodeShare: decodeShare
};
