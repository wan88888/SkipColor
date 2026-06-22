var G = GameGlobal;

G.canvas = wx.createCanvas();
G.ctx = G.canvas.getContext('2d');

G.W = G.canvas.width;
G.H = G.canvas.height;

G.CONFIG = {
  bgColor: '#f2f3f5',
  cardBg: '#ffffff',
  textMain: '#4a4f56',
  textSub: '#848a93',
  cellEmpty: '#e4e7eb',
  cellFilled: '#9cb1a5',
  cellNumber: '#7a8b98',
  cellNumberText: '#ffffff',
  accentColor: '#d19a8b',
  btnDisabled: '#dcdfe6',
  btnDisabledText: '#a8abb2',
  radiusLg: 20,
  radiusMd: 12,
  diffEasy: '#9cb1a5',
  diffMedium: '#dcb582',
  diffHard: '#d19a8b',
  gap: 6,
  cellSize: 0,
  maxWidth: 500,
  iceHp1: '#abc4d9',
  iceHp2: '#7da0c1',
  iceHp3: '#5b84a9',
  animSpeed: 180
};

G.playerStats = {
  tutorialCleared: false,
  normalClearedCount: 0,
  advTutorialCleared: false,
  advClearedCount: 0,
  lastDate: new Date().toDateString()
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