#!/usr/bin/env node
'use strict';

global.GameGlobal = {
  CONFIG: {},
  cloneGrid: function(grid) {
    return grid.map(function(row) {
      return row.map(function(cell) {
        var copy = {};
        for (var key in cell) copy[key] = cell[key];
        return copy;
      });
    });
  }
};

var level = require('../js/level.js');
var beam = require('../js/beam.js');
var levelpack = require('../js/levelpack.js');

function padMatrix(matrix) {
  var maxCols = 0;
  for (var i = 0; i < matrix.length; i++) {
    if (matrix[i].length > maxCols) maxCols = matrix[i].length;
  }
  return matrix.map(function(row) {
    var padded = row.slice();
    while (padded.length < maxCols) padded.push(0);
    return padded;
  });
}

function matrixToGrid(matrix) {
  var padded = padMatrix(matrix);
  var grid = padded.map(function(row, r) {
    return row.map(function(val, c) {
      return level.makeCell(val, r, c);
    });
  });

  var portalCells = [];
  for (var pr = 0; pr < grid.length; pr++) {
    for (var pc = 0; pc < grid[pr].length; pc++) {
      if (grid[pr][pc].type === 'portal') {
        portalCells.push({ r: pr, c: pc });
      }
    }
  }
  for (var pi = 0; pi + 1 < portalCells.length; pi += 2) {
    var pid = pi / 2;
    grid[portalCells[pi].r][portalCells[pi].c].portalId = pid;
    grid[portalCells[pi + 1].r][portalCells[pi + 1].c].portalId = pid;
  }

  return grid;
}

function validateLevel(name, levelData) {
  var grid = matrixToGrid(levelData.matrix);
  var ok = beam.validateSolutionOnGrid(grid, levelData.solution, GameGlobal.cloneGrid);
  if (!ok) console.error('FAIL', name);
  return ok;
}

function validateGenerator(seed) {
  var G = GameGlobal;
  Math.random = (function(s) {
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  })(seed);

  G.currentMode = 'normal';
  G.advModePreference = null;
  G.markDirty = function() {};
  return level.buildRandomLevel(3, true);
}

var failed = 0;
var total = 0;

levelpack.NORMAL_LEVELS.forEach(function(levelData, index) {
  total++;
  if (!validateLevel('normal-' + (index + 1), levelData)) failed++;
});

Object.keys(levelpack.MECH_TUTORIALS).forEach(function(mech) {
  levelpack.MECH_TUTORIALS[mech].forEach(function(levelData, index) {
    total++;
    if (!validateLevel(mech + '-' + (index + 1), levelData)) failed++;
  });
});

for (var seed = 1; seed <= 10; seed++) {
  total++;
  if (!validateGenerator(1000 + seed * 37)) {
    console.error('FAIL generator seed', seed);
    failed++;
  }
}

console.log('Validated', total - failed, '/', total);
process.exit(failed > 0 ? 1 : 0);
