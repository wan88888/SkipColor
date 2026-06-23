var G = GameGlobal;

G.canvas = wx.createCanvas();
G.ctx = G.canvas.getContext('2d');

G.W = G.canvas.width;
G.H = G.canvas.height;

(function initSystemInfo() {
  try {
    var info = wx.getSystemInfoSync();
    G.pixelRatio = info.pixelRatio || 1;
    G.screenWidth = info.screenWidth;
    G.screenHeight = info.screenHeight;
    G.windowWidth = info.windowWidth;
    G.windowHeight = info.windowHeight;
    G.touchScaleX = G.W / info.windowWidth;
    G.touchScaleY = G.H / info.windowHeight;
  } catch (e) {
    G.pixelRatio = 1;
    G.touchScaleX = 1;
    G.touchScaleY = 1;
  }
})();

G.THEMES = {
  default: {
    name: '默认',
    bgColor: '#f2f3f5', cardBg: '#ffffff', textMain: '#4a4f56', textSub: '#848a93',
    cellEmpty: '#e4e7eb', cellFilled: '#9cb1a5', cellNumber: '#7a8b98',
    accentColor: '#d19a8b', iceHp1: '#abc4d9', iceHp2: '#7da0c1', iceHp3: '#5b84a9',
    btnDisabled: '#d8dce0', btnDisabledText: '#a8aeb4',
    diffEasy: '#5bb89c', diffMedium: '#e0a04c', diffHard: '#d4604e'
  },
  spring: {
    name: '春日',
    bgColor: '#fff5f7', cardBg: '#ffffff', textMain: '#5a4a52', textSub: '#a89098',
    cellEmpty: '#f4d7e0', cellFilled: '#e8809a', cellNumber: '#c96080',
    accentColor: '#f0a050', iceHp1: '#fcd5e0', iceHp2: '#f8a0c0', iceHp3: '#e060a0',
    btnDisabled: '#e8d0d8', btnDisabledText: '#c0a0a8',
    diffEasy: '#5bb89c', diffMedium: '#e0a04c', diffHard: '#d4604e'
  },
  ocean: {
    name: '深海',
    bgColor: '#0a1929', cardBg: '#1a2f4a', textMain: '#e0e8f0', textSub: '#8090a8',
    cellEmpty: '#2a4060', cellFilled: '#4a8fb5', cellNumber: '#3a6f95',
    accentColor: '#f0a040', iceHp1: '#5a90b5', iceHp2: '#3a7095', iceHp3: '#1a5075',
    btnDisabled: '#2a3040', btnDisabledText: '#506070',
    diffEasy: '#5bb89c', diffMedium: '#e0a04c', diffHard: '#d4604e'
  },
  lava: {
    name: '熔岩',
    bgColor: '#1a0a0a', cardBg: '#2a1a1a', textMain: '#f0e0d0', textSub: '#a08070',
    cellEmpty: '#3a2020', cellFilled: '#d04020', cellNumber: '#a03020',
    accentColor: '#ffc040', iceHp1: '#804030', iceHp2: '#a05030', iceHp3: '#c06030',
    btnDisabled: '#3a2020', btnDisabledText: '#604040',
    diffEasy: '#5bb89c', diffMedium: '#e0a04c', diffHard: '#d4604e'
  }
};

G.LAYOUT = {
  gap: 4,
  radiusLg: 16,
  radiusMd: 10,
  animSpeed: 120
};

G.currentTheme = 'default';
G.CONFIG = {};
for (var _tk in G.THEMES.default) {
  G.CONFIG[_tk] = G.THEMES.default[_tk];
}
for (var _lk in G.LAYOUT) {
  G.CONFIG[_lk] = G.LAYOUT[_lk];
}

G.playerStats = {
  tutorialCleared: false,
  normalClearedCount: 0,
  advTutorialCleared: false,
  advClearedCount: 0,
  lastDate: new Date().toDateString(),
  totalStars: 0,
  totalIceBroken: 0,
  perfectStreak: 0,
  endlessHighScore: 0,
  dailyClearedCount: 0,
  unlockedThemes: ['default'],
  achievements: {}
};

G.settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  particleEnabled: true
};

G.tutorials = [
  { title: '教学 1/3', text: '点击数字块【2】，根据下方亮起的方向进行填色。', matrix: [[0,12,1,1,0]], solution: [{r:0, c:1, val:2, dir:'0,1'}] },
  { title: '教学 2/3', text: '光束会自动跳过数字块和已填满区域。先向下填【1】，再向右填【2】。', matrix: [[0,12,11,1,1],[0,0,1,0,0]], solution: [{r:0, c:2, val:1, dir:'1,0'}, {r:0, c:1, val:2, dir:'0,1'}] },
  { title: '教学 3/3', text: '十字交叉时，顺序决定成败。如果陷入死局，撤销或重开即可。', matrix: [[0,11,0], [12,1,1], [0,1,0]], solution: [{r:1, c:0, val:2, dir:'0,1'}, {r:0, c:1, val:1, dir:'1,0'}] }
];

G.advTutorials = [
  { title: '冰块教学 1/2', text: '冰块会阻挡光束！点击【4】向右：先填满第1格(耗1)，遇到冰块破冰(耗2)，最后剩1点正好填满刚融化的冰块位！', matrix: [[0, 14, 1, -2, 0]], solution: [{r:0, c:1, val:4, dir:'0,1'}] },
  { title: '冰块教学 2/2', text: '【交叉消除】点击下方【1】向上削弱冰块，再用左侧【3】向右彻底击碎并完成最后两格的填色！', matrix: [[13, 1, -2, 0], [0, 0, 11, 0]], solution: [{r:1, c:2, val:1, dir:'-1,0'}, {r:0, c:0, val:3, dir:'0,1'}] }
];

G.dirMapText = { '-1,0': '上 ↑', '1,0': '下 ↓', '0,-1': '左 ←', '0,1': '右 →' };

G.currentScreen = 'home';
G.gridData = [];
G.initialGridData = [];
G.currentSolution = [];
G.selectedCell = null;
G.isHintVisible = false;
G.historyStack = [];
G.ROWS = 0;
G.COLS = 0;
G.currentMode = '';
G.levelIndex = 0;
G.currentLevelNum = 0;
G.isAnimating = false;
G.gameBoardOffsetX = 0;
G.gameBoardOffsetY = 0;
G.messageText = '';
G.messageColor = G.CONFIG.cellFilled;
G.showNextBtn = false;
G.nextBtnRect = null;
G.btnRects = {};
G.screenButtons = [];
G.difficulty = '';
G.difficultyColor = G.CONFIG.diffEasy;

G.moveCount = 0;
G.undoCount = 0;
G.levelStartTime = 0;
G.levelStars = 0;
G.hintLevel = 0;
G.stars = [];
G.protectedCells = [];
G.requiredPath = [];
G.stepLimit = 0;
G.dailySeed = 0;
G.endlessScore = 0;
G.endlessTime = 0;
G.editorGrid = [];
G.editorTool = 'number';
G.editorValue = 1;
G.adaptiveFailCount = 0;
G.adaptiveDifficultyBias = 0;
G.advModePreference = null;

G.particles = [];
G.celebrating = false;
G.celebrationTimer = 0;

G.needsRedraw = true;
G.markDirty = function() { G.needsRedraw = true; };

G.cloneGrid = function(grid) {
  var result = [];
  for (var r = 0; r < grid.length; r++) {
    var row = grid[r];
    var newRow = [];
    for (var c = 0; c < row.length; c++) {
      var cell = row[c];
      newRow.push({
        type: cell.type,
        value: cell.value,
        used: cell.used,
        r: cell.r,
        c: cell.c,
        hp: cell.hp,
        seq: cell.seq,
        animState: cell.animState,
        color: cell.color,
        portalId: cell.portalId,
        mirrorDir: cell.mirrorDir,
        bombRadius: cell.bombRadius,
        timer: cell.timer,
        locked: cell.locked,
        chainId: cell.chainId,
        isStar: cell.isStar,
        isProtected: cell.isProtected,
        isRequired: cell.isRequired
      });
    }
    result.push(newRow);
  }
  return result;
};

G.applyTheme = function(themeName) {
  if (G.THEMES[themeName]) {
    G.currentTheme = themeName;
    var theme = G.THEMES[themeName];
    for (var k in theme) {
      G.CONFIG[k] = theme[k];
    }
    for (var lk in G.LAYOUT) {
      G.CONFIG[lk] = G.LAYOUT[lk];
    }
    G.markDirty();
  }
};

G.calcCellSize = function() {
  var maxBoardW = Math.min(G.W - 30, 350);
  var maxBoardH = Math.min(G.H * 0.45, 350);
  var cellW = Math.floor((maxBoardW - G.CONFIG.gap * (G.COLS + 1)) / G.COLS);
  var cellH = Math.floor((maxBoardH - G.CONFIG.gap * (G.ROWS + 1)) / G.ROWS);
  return Math.min(cellW, cellH, 40);
};

G.getCellCenter = function(r, c) {
  var cs = G.calcCellSize();
  var gap = G.CONFIG.gap;
  var x = G.gameBoardOffsetX + gap + c * (cs + gap) + cs / 2;
  var y = G.gameBoardOffsetY + gap + r * (cs + gap) + cs / 2;
  return { x: x, y: y, cs: cs };
};
