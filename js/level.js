var G = GameGlobal;
var C = G.CONFIG;

function makeCell(val, r, c) {
  var cellObj = { type: 'void', value: 0, used: false, r: r, c: c, animState: null };
  if (val === 1) {
    cellObj.type = 'empty';
  } else if (val === -1) {
    cellObj.type = 'void';
  } else if (val === -2) {
    cellObj.type = 'ice'; cellObj.hp = 1;
  } else if (val === -3) {
    cellObj.type = 'ice'; cellObj.hp = 2;
  } else if (val === -4) {
    cellObj.type = 'ice'; cellObj.hp = 3;
  } else if (val === -5) {
    cellObj.type = 'portal'; cellObj.portalId = 0;
  } else if (val === -6) {
    cellObj.type = 'mirror'; cellObj.mirrorDir = '/';
  } else if (val === -11) {
    cellObj.type = 'mirror'; cellObj.mirrorDir = '\\';
  } else if (val === -7) {
    cellObj.type = 'bomb'; cellObj.bombRadius = 1;
  } else if (val === -8) {
    cellObj.type = 'empty'; cellObj.isStar = true;
  } else if (val === -9) {
    cellObj.type = 'empty'; cellObj.isProtected = true;
  } else if (val === -10) {
    cellObj.type = 'ice'; cellObj.hp = 1; cellObj.timer = 3;
  } else if (val >= 10 && val < 20) {
    cellObj.type = 'number'; cellObj.value = val - 10;
  } else if (val >= 20 && val < 30) {
    cellObj.type = 'number'; cellObj.value = val - 20; cellObj.color = 'red';
  } else if (val >= 30 && val < 40) {
    cellObj.type = 'number'; cellObj.value = val - 30; cellObj.color = 'blue';
  } else if (val >= 40 && val < 50) {
    cellObj.type = 'number'; cellObj.value = val - 40; cellObj.chainId = 1;
  } else if (val >= 50 && val < 60) {
    cellObj.type = 'number'; cellObj.value = -(val - 50); cellObj.isNegative = true;
  }
  return cellObj;
}

function attachSeqNumbers(cells, solution) {
  for (var r = 0; r < cells.length; r++) {
    for (var c = 0; c < cells[r].length; c++) {
      var cellObj = cells[r][c];
      cellObj.seq = 0;
      for (var si = 0; si < solution.length; si++) {
        if (solution[si].r === r && solution[si].c === c) {
          cellObj.seq = si + 1;
          break;
        }
      }
    }
  }
}

function loadGridData(matrix) {
  G.ROWS = matrix.length;
  G.COLS = matrix[0].length;

  var grid = [];
  for (var r = 0; r < G.ROWS; r++) {
    var row = [];
    for (var c = 0; c < G.COLS; c++) {
      row.push(makeCell(matrix[r][c], r, c));
    }
    grid.push(row);
  }
  attachSeqNumbers(grid, G.currentSolution);

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
    grid[portalCells[pi+1].r][portalCells[pi+1].c].portalId = pid;
  }

  G.gridData = grid;
  G.initialGridData = G.cloneGrid(grid);
  G.selectedCell = null;
  G.historyStack = [];
  G.stars = [];
  G.protectedCells = [];
  G.requiredPath = [];
  G.markDirty();
}

function loadFromMatrix(matrix) {
  G.currentSolution = [];
  loadGridData(matrix);
}

function generateRandom(difficulty) {
  var SIM_SIZE = 8;
  var simGrid = [];
  for (var i = 0; i < SIM_SIZE; i++) {
    simGrid[i] = [];
    for (var j = 0; j < SIM_SIZE; j++) {
      simGrid[i][j] = 0;
    }
  }

  var generatedSteps = [];
  var targetBlocks = Math.floor(Math.random() * 3) + 3 + difficulty;
  var totalOverlapEvents = 0;

  for (var b = 0; b < targetBlocks; b++) {
    var possibleMoves = [];
    for (var r = 0; r < SIM_SIZE; r++) {
      for (var c = 0; c < SIM_SIZE; c++) {
        if (simGrid[r][c] !== 0) continue;
        var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (var di = 0; di < dirs.length; di++) {
          var dir = dirs[di];
          for (var L = 1; L <= 5; L++) {
            var currR = r, currC = c, foundVoids = [], jumpedCount = 0, valid = true;
            while (foundVoids.length < L) {
              currR += dir[0];
              currC += dir[1];
              if (currR < 0 || currR >= SIM_SIZE || currC < 0 || currC >= SIM_SIZE) { valid = false; break; }
              if (simGrid[currR][currC] === 0) {
                foundVoids.push({ r: currR, c: currC });
              } else {
                jumpedCount++;
              }
            }
            if (valid && foundVoids.length === L) {
              var isConnected = (b === 0);
              if (!isConnected) {
                if (jumpedCount > 0) {
                  isConnected = true;
                } else {
                  var adj = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                  for (var ai = 0; ai < adj.length; ai++) {
                    var ar = r + adj[ai][0];
                    var ac = c + adj[ai][1];
                    if (ar >= 0 && ar < SIM_SIZE && ac >= 0 && ac < SIM_SIZE && simGrid[ar][ac] !== 0) {
                      isConnected = true;
                      break;
                    }
                  }
                }
              }
              if (isConnected) {
                possibleMoves.push({ start: { r: r, c: c }, dir: dir, L: L, foundVoids: foundVoids, jumpedCount: jumpedCount });
              }
            }
          }
        }
      }
    }
    if (possibleMoves.length === 0) break;

    possibleMoves.sort(function(a, b) { return b.jumpedCount - a.jumpedCount; });
    var maxJumps = possibleMoves[0].jumpedCount;
    var topMoves = [];
    for (var mi = 0; mi < possibleMoves.length; mi++) {
      if (possibleMoves[mi].jumpedCount >= Math.max(0, maxJumps - 1)) {
        topMoves.push(possibleMoves[mi]);
      }
    }
    var chosenMove = topMoves[Math.floor(Math.random() * topMoves.length)];

    if (chosenMove.jumpedCount > 0) totalOverlapEvents += 1;

    simGrid[chosenMove.start.r][chosenMove.start.c] = 10 + chosenMove.L;
    for (var vi = 0; vi < chosenMove.foundVoids.length; vi++) {
      var v = chosenMove.foundVoids[vi];
      simGrid[v.r][v.c] = 1;
    }

    generatedSteps.push({ r: chosenMove.start.r, c: chosenMove.start.c, val: chosenMove.L, dir: chosenMove.dir[0] + ',' + chosenMove.dir[1], foundVoids: chosenMove.foundVoids });
  }

  var diffScore = (generatedSteps.length * 1.5) + (totalOverlapEvents * 3.0);
  if (diffScore <= 13) {
    G.difficulty = 'EASY';
    G.difficultyColor = C.diffEasy;
  } else if (diffScore <= 20) {
    G.difficulty = 'MEDIUM';
    G.difficultyColor = C.diffMedium;
  } else {
    G.difficulty = 'HARD';
    G.difficultyColor = C.diffHard;
  }

  var minR = SIM_SIZE, maxR = -1, minC = SIM_SIZE, maxC = -1;
  for (var r = 0; r < SIM_SIZE; r++) {
    for (var c = 0; c < SIM_SIZE; c++) {
      if (simGrid[r][c] !== 0) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  var croppedGrid = [];
  for (var r = minR; r <= maxR; r++) {
    var row = [];
    for (var c = minC; c <= maxC; c++) {
      row.push(simGrid[r][c]);
    }
    croppedGrid.push(row);
  }

  for (var si = 0; si < generatedSteps.length; si++) {
    var s = generatedSteps[si];
    s.r -= minR;
    s.c -= minC;
    if (s.foundVoids) {
      for (var vi2 = 0; vi2 < s.foundVoids.length; vi2++) {
        s.foundVoids[vi2].r -= minR;
        s.foundVoids[vi2].c -= minC;
      }
    }
  }
  G.currentSolution = generatedSteps;

  loadGridData(croppedGrid);
  var useIce = (G.currentMode === 'advanced' || G.currentMode === 'endless');
  if (useIce && difficulty >= 2) applyIceObstacles();
  applySpecialObstacles(difficulty);
}

function generateAndCropLevel() {
  generateRandom(1);
}

function applySpecialObstacles(difficulty) {
  var pref = G.advModePreference;
  var forcePortal = pref === 'portal';
  var forceMirror = pref === 'mirror';
  var forceBomb = pref === 'bomb';
  var forceStar = pref === 'star';

  if ((forcePortal || (difficulty >= 3 && Math.random() < 0.4)) && !forceStar) {
    var portalCount = Math.floor(Math.random() * 2) + 1;
    var empties = [];
    for (var r = 0; r < G.ROWS; r++) {
      for (var c = 0; c < G.COLS; c++) {
        if (G.gridData[r][c].type === 'empty' && !G.gridData[r][c].isStar) {
          empties.push({ r: r, c: c });
        }
      }
    }
    if (empties.length >= 4) {
      empties.sort(function() { return Math.random() - 0.5; });
      var maxPairs = Math.floor((empties.length - 2) / 2);
      var pairsToMake = Math.min(portalCount, maxPairs);
      for (var i = 0; i < pairsToMake * 2; i += 2) {
        G.gridData[empties[i].r][empties[i].c].type = 'portal';
        G.gridData[empties[i].r][empties[i].c].portalId = i / 2;
        G.gridData[empties[i+1].r][empties[i+1].c].type = 'portal';
        G.gridData[empties[i+1].r][empties[i+1].c].portalId = i / 2;
      }
      G.initialGridData = G.cloneGrid(G.gridData);
    }
  }

  if ((forceStar || (difficulty >= 2 && Math.random() < 0.3)) && !forcePortal && !forceMirror && !forceBomb) {
    var starCount = Math.floor(Math.random() * 2) + 1;
    var empties2 = [];
    for (var r = 0; r < G.ROWS; r++) {
      for (var c = 0; c < G.COLS; c++) {
        if (G.gridData[r][c].type === 'empty' && !G.gridData[r][c].isStar) {
          empties2.push({ r: r, c: c });
        }
      }
    }
    empties2.sort(function() { return Math.random() - 0.5; });
    for (var i = 0; i < Math.min(starCount, empties2.length); i++) {
      G.gridData[empties2[i].r][empties2[i].c].isStar = true;
      G.stars.push({ r: empties2[i].r, c: empties2[i].c, collected: false });
    }
    G.initialGridData = G.cloneGrid(G.gridData);
  }

  if ((forceBomb || (difficulty >= 3 && Math.random() < 0.25)) && !forceStar && !forcePortal) {
    var empties3 = [];
    for (var r = 0; r < G.ROWS; r++) {
      for (var c = 0; c < G.COLS; c++) {
        if (G.gridData[r][c].type === 'empty' && !G.gridData[r][c].isStar) {
          empties3.push({ r: r, c: c });
        }
      }
    }
    if (empties3.length > 3) {
      empties3.sort(function() { return Math.random() - 0.5; });
      var bombCell = empties3[0];
      G.gridData[bombCell.r][bombCell.c].type = 'bomb';
      G.gridData[bombCell.r][bombCell.c].bombRadius = 1;
      G.initialGridData = G.cloneGrid(G.gridData);
    }
  }

  if ((forceMirror || (difficulty >= 4 && Math.random() < 0.2)) && !forceStar && !forceBomb) {
    var empties4 = [];
    for (var r = 0; r < G.ROWS; r++) {
      for (var c = 0; c < G.COLS; c++) {
        if (G.gridData[r][c].type === 'empty' && !G.gridData[r][c].isStar) {
          empties4.push({ r: r, c: c });
        }
      }
    }
    if (empties4.length > 2) {
      empties4.sort(function() { return Math.random() - 0.5; });
      var mCell = empties4[0];
      G.gridData[mCell.r][mCell.c].type = 'mirror';
      G.gridData[mCell.r][mCell.c].mirrorDir = Math.random() < 0.5 ? '/' : '\\';
      G.initialGridData = G.cloneGrid(G.gridData);
    }
  }

  G.advModePreference = null;
  G.markDirty();
}

function getAttackerCandidates(targetR, targetC) {
  var candidates = [];
  var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (var di = 0; di < dirs.length; di++) {
    var dr = dirs[di][0], dc = dirs[di][1];
    var r = targetR + dr, c = targetC + dc;
    while (r >= 0 && r < G.ROWS && c >= 0 && c < G.COLS) {
      var cell = G.gridData[r][c];
      if (cell.type === 'empty' || cell.type === 'ice' || cell.type === 'portal' || cell.type === 'mirror' || cell.type === 'bomb') break;
      if (cell.type === 'void') {
        candidates.push({ r: r, c: c, dir: (-dr) + ',' + (-dc) });
        break;
      }
      r += dr; c += dc;
    }
  }
  return candidates;
}

function applyIceObstacles() {
  var maxIce = Math.floor(Math.random() * 3) + 2;
  var iceAdded = 0;
  var shuffledSteps = G.currentSolution.slice().sort(function() { return Math.random() - 0.5; });
  var extraSteps = [];

  for (var si = 0; si < shuffledSteps.length; si++) {
    var step = shuffledSteps[si];
    if (iceAdded >= maxIce) break;
    if (step.foundVoids && step.foundVoids.length > 0) {
      var target = step.foundVoids[Math.floor(Math.random() * step.foundVoids.length)];
      var cell = G.gridData[target.r][target.c];

      if (cell.type === 'empty') {
        var candidates = getAttackerCandidates(target.r, target.c);
        var isMulti = candidates.length > 0 && Math.random() > 0.3;

        if (isMulti) {
          candidates.sort(function() { return Math.random() - 0.5; });
          var isTriple = candidates.length >= 2 && Math.random() > 0.4;

          if (isTriple) {
            var a1 = candidates[0], a2 = candidates[1];
            G.gridData[a1.r][a1.c] = makeCell(11, a1.r, a1.c);
            G.gridData[a2.r][a2.c] = makeCell(11, a2.r, a2.c);
            cell.type = 'ice';
            cell.hp = 3;

            var sourceCell = G.gridData[step.r][step.c];
            sourceCell.value += 1;
            step.val += 1;

            extraSteps.push({ r: a1.r, c: a1.c, val: 1, dir: a1.dir });
            extraSteps.push({ r: a2.r, c: a2.c, val: 1, dir: a2.dir });
          } else {
            var a1 = candidates[0];
            var aVal = Math.floor(Math.random() * 2) + 1;
            G.gridData[a1.r][a1.c] = makeCell(10 + aVal, a1.r, a1.c);
            cell.type = 'ice';
            cell.hp = aVal + 1;

            var sourceCell = G.gridData[step.r][step.c];
            sourceCell.value += 1;
            step.val += 1;

            extraSteps.push({ r: a1.r, c: a1.c, val: aVal, dir: a1.dir });
          }
        } else {
          var hp = Math.floor(Math.random() * 3) + 1;
          cell.type = 'ice';
          cell.hp = hp;

          var sourceCell = G.gridData[step.r][step.c];
          sourceCell.value += hp;
          step.val += hp;
        }
        iceAdded++;
      }
    }
  }

  G.currentSolution = extraSteps.concat(G.currentSolution);

  attachSeqNumbers(G.gridData, G.currentSolution);
  G.initialGridData = G.cloneGrid(G.gridData);
  G.markDirty();
}

module.exports = {
  loadGridData: loadGridData,
  loadFromMatrix: loadFromMatrix,
  generateAndCropLevel: generateAndCropLevel,
  generateRandom: generateRandom,
  getAttackerCandidates: getAttackerCandidates,
  applyIceObstacles: applyIceObstacles,
  applySpecialObstacles: applySpecialObstacles,
  makeCell: makeCell
};
